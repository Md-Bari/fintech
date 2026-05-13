<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function aiCenterInsights()
    {
        $fraudThreshold = 40.0;
        $fraudExpr = "(CASE WHEN loan_applications.fraud_score <= 1 THEN loan_applications.fraud_score * 100 ELSE loan_applications.fraud_score END)";

        $summary = DB::table('loan_applications')
            ->selectRaw('COUNT(*) as total_applications')
            ->selectRaw("SUM(CASE WHEN {$fraudExpr} >= ? THEN 1 ELSE 0 END) as fraud_applications", [$fraudThreshold])
            ->selectRaw("AVG(COALESCE({$fraudExpr}, 0)) as avg_fraud_score")
            ->first();

        $approvedHighFraud = DB::table('loan_applications')
            ->where('status', 'approved')
            ->whereRaw("{$fraudExpr} >= ?", [$fraudThreshold])
            ->count();

        $fraudRateByMfi = DB::table('loan_applications')
            ->join('mfi_institutions', 'loan_applications.mfi_id', '=', 'mfi_institutions.id')
            ->select('mfi_institutions.name as mfi_name')
            ->selectRaw('COUNT(*) as total_applications')
            ->selectRaw("SUM(CASE WHEN {$fraudExpr} >= ? THEN 1 ELSE 0 END) as fraud_applications", [$fraudThreshold])
            ->selectRaw("ROUND((SUM(CASE WHEN {$fraudExpr} >= {$fraudThreshold} THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as fraud_rate")
            ->groupBy('mfi_institutions.name')
            ->orderByDesc('fraud_rate')
            ->limit(12)
            ->get();

        $fraudTrendDaily = DB::table('loan_applications')
            ->selectRaw('DATE(created_at) as day')
            ->selectRaw("SUM(CASE WHEN {$fraudExpr} >= ? THEN 1 ELSE 0 END) as fraud_applications", [$fraudThreshold])
            ->selectRaw('COUNT(*) as total_applications')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupByRaw('DATE(created_at)')
            ->orderBy('day')
            ->get();

        $fraudByPurpose = DB::table('loan_applications')
            ->selectRaw("COALESCE(NULLIF(TRIM(purpose), ''), 'Unknown') as purpose")
            ->selectRaw('COUNT(*) as fraud_applications')
            ->whereRaw("{$fraudExpr} >= ?", [$fraudThreshold])
            ->groupByRaw("COALESCE(NULLIF(TRIM(purpose), ''), 'Unknown')")
            ->orderByDesc('fraud_applications')
            ->limit(10)
            ->get();

        $statusRisk = DB::table('loan_applications')
            ->select('status')
            ->selectRaw('COUNT(*) as count')
            ->selectRaw("ROUND(AVG(COALESCE({$fraudExpr}, 0)), 2) as avg_fraud_score")
            ->groupBy('status')
            ->orderByDesc('count')
            ->get();

        $paymentHealth = DB::table('transactions')
            ->join('mfi_institutions', 'transactions.mfi_id', '=', 'mfi_institutions.id')
            ->select('mfi_institutions.name as mfi_name')
            ->selectRaw('COUNT(*) as total_transactions')
            ->selectRaw("SUM(CASE WHEN transactions.status = 'failed' THEN 1 ELSE 0 END) as failed_transactions")
            ->selectRaw("SUM(CASE WHEN transactions.status = 'pending' THEN 1 ELSE 0 END) as pending_transactions")
            ->selectRaw("ROUND((SUM(CASE WHEN transactions.status = 'failed' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as failed_rate")
            ->groupBy('mfi_institutions.name')
            ->orderByDesc('failed_rate')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'threshold' => $fraudThreshold,
                'summary' => [
                    'total_applications' => (int) ($summary->total_applications ?? 0),
                    'fraud_applications' => (int) ($summary->fraud_applications ?? 0),
                    'avg_fraud_score' => round((float) ($summary->avg_fraud_score ?? 0), 2),
                    'approved_high_fraud' => (int) $approvedHighFraud,
                ],
                'fraud_rate_by_mfi' => $fraudRateByMfi,
                'daily_fraud_trend' => $fraudTrendDaily,
                'fraud_by_purpose' => $fraudByPurpose,
                'status_risk' => $statusRisk,
                'payment_anomaly_by_mfi' => $paymentHealth,
            ],
        ]);
    }

    public function dashboard()
    {
        $totalMfis = DB::table('mfi_institutions')->count();

        $activeMfis = DB::table('subscriptions')
            ->where('status', 'active')
            ->distinct('mfi_id')
            ->count('mfi_id');

        $totalUsers = DB::table('users')->count();

        $totalLoans = DB::table('loan_applications')->count();

        $totalRevenue = DB::table('transactions')
            ->where('status', 'success')
            ->sum('amount');

        $activeSubscriptions = DB::table('subscriptions')
            ->where('status', 'active')
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_mfis' => $totalMfis,
                'active_mfis' => $activeMfis,
                'total_users' => $totalUsers,
                'total_loans' => $totalLoans,
                'total_revenue' => $totalRevenue,
                'active_subscriptions' => $activeSubscriptions
            ]
        ]);
    }

    public function revenueReport(Request $request)
    {
        // optional filters
        $from = $request->query('from'); // YYYY-MM-DD
        $to = $request->query('to');

        // base query (ONLY SUCCESS PAYMENTS)
        $baseQuery = DB::table('transactions')
            ->where('status', 'success');

        if ($from && $to) {
            $baseQuery->whereBetween('created_at', [$from, $to]);
        }

        // 💰 total revenue
        $totalRevenue = (clone $baseQuery)->sum('amount');

        // 📅 today revenue
        $todayRevenue = DB::table('transactions')
            ->where('status', 'success')
            ->whereDate('created_at', today())
            ->sum('amount');

        // 📆 this month revenue
        $monthRevenue = DB::table('transactions')
            ->where('status', 'success')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        // 📊 last 7 days trend
        $trend = DB::table('transactions')
            ->selectRaw("DATE(created_at) as date, SUM(amount) as total")
            ->where('status', 'success')
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_revenue' => $totalRevenue,
                'today_revenue' => $todayRevenue,
                'monthly_revenue' => $monthRevenue,
                'trend_last_7_days' => $trend
            ]
        ]);
    }
}
