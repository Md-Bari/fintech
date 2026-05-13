<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckSubscription
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // only apply to MFI admins
        if (!$user || $user->role !== 'mfi_admin') {
            return $next($request);
        }

        $mfiId = $user->mfi_id;
        if (!$mfiId) {
            $mfiId = DB::table('mfi_institutions')
                ->where('owner_id', $user->id)
                ->value('id');

            if ($mfiId) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'mfi_id' => $mfiId,
                        'updated_at' => now(),
                    ]);
            }
        }

        if (!$mfiId) {
            return response()->json([
                'success' => false,
                'message' => 'User not linked to MFI'
            ], 403);
        }

        $subscription = DB::table('subscriptions')
            ->join('subscription_plans', 'subscriptions.plan_id', '=', 'subscription_plans.id')
            ->where('subscriptions.mfi_id', $mfiId)
            ->whereIn('subscriptions.status', ['active', 'trial']) // ✅ allow trial
            ->where(function ($q) {
                $q->whereNull('subscriptions.end_date')
                    ->orWhere('subscriptions.end_date', '>', now());
            })
            ->orderByDesc('subscriptions.created_at')
            ->select(
                'subscriptions.status',
                'subscription_plans.name as plan_name'
            )
            ->first();

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription expired. Please upgrade.'
            ], 403);
        }

        // attach subscription to request (VERY USEFUL)
        $request->attributes->set('subscription', $subscription);

        return $next($request);
    }
}
