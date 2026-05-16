<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class FinancialAssistantController extends Controller
{
    public function ask(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1200',
            'history' => 'nullable|array',
        ]);

        $packages = DB::table('loan_products')
            ->join('mfi_institutions', 'loan_products.mfi_id', '=', 'mfi_institutions.id')
            ->where('loan_products.status', 'active')
            ->select(
                'loan_products.id',
                'loan_products.name',
                'loan_products.min_amount',
                'loan_products.max_amount',
                'loan_products.interest_rate',
                'loan_products.duration_months',
                'mfi_institutions.name as mfi_name'
            )
            ->limit(50)
            ->get()
            ->map(fn ($x) => (array) $x)
            ->values()
            ->all();

        $url = env('FRAUD_API_CHAT_URL', 'http://loan-fraud-api:8000/chat/financial-assistant');
        try {
            $res = Http::timeout(20)->post($url, [
                'message' => (string) $request->input('message'),
                'history' => $request->input('history', []),
                'packages' => $packages,
            ]);

            if (!$res->ok()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Assistant unavailable right now',
                ], 503);
            }

            return response()->json([
                'success' => true,
                'message' => 'Assistant response',
                'data' => [
                    'reply' => (string) ($res->json('reply') ?? ''),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Assistant service failed',
            ], 503);
        }
    }
}

