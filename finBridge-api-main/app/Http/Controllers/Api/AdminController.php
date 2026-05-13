<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function publicPlatformStats()
    {
        $activeEntrepreneurs = DB::table('users')
            ->where('role', 'entrepreneur')
            ->where('status', 'active')
            ->count();

        $verifiedMfis = DB::table('mfi_institutions')
            ->where('status', 'active')
            ->count();

        $approvedLoanVolume = DB::table('loan_applications')
            ->where('status', 'approved')
            ->sum('amount');

        $districtsCovered = 0;
        if (Schema::hasColumn('mfi_institutions', 'district')) {
            $districtsCovered = DB::table('mfi_institutions')
                ->where('status', 'active')
                ->whereNotNull('district')
                ->where('district', '!=', '')
                ->distinct()
                ->count('district');
        }

        return response()->json([
            'success' => true,
            'data' => [
                'active_entrepreneurs' => (int) $activeEntrepreneurs,
                'verified_mfis' => (int) $verifiedMfis,
                'approved_loan_volume' => (float) $approvedLoanVolume,
                'districts_covered' => (int) $districtsCovered,
            ],
        ]);
    }

    private function buildAiInsights(?Carbon $from = null, ?Carbon $to = null, ?string $mfiId = null): array
    {
        $fraudThreshold = 40.0;
        $fraudExpr = "(CASE WHEN loan_applications.fraud_score <= 1 THEN loan_applications.fraud_score * 100 ELSE loan_applications.fraud_score END)";

        $summaryQuery = DB::table('loan_applications');
        if ($mfiId) {
            $summaryQuery->where('loan_applications.mfi_id', $mfiId);
        }
        if ($from && $to) {
            $summaryQuery->whereBetween('loan_applications.created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
        }

        $summary = $summaryQuery
            ->selectRaw('COUNT(*) as total_applications')
            ->selectRaw("SUM(CASE WHEN {$fraudExpr} >= ? THEN 1 ELSE 0 END) as fraud_applications", [$fraudThreshold])
            ->selectRaw("AVG(COALESCE({$fraudExpr}, 0)) as avg_fraud_score")
            ->first();

        $approvedQuery = DB::table('loan_applications')
            ->where('status', 'approved')
            ->whereRaw("{$fraudExpr} >= ?", [$fraudThreshold]);
        if ($mfiId) {
            $approvedQuery->where('loan_applications.mfi_id', $mfiId);
        }
        if ($from && $to) {
            $approvedQuery->whereBetween('loan_applications.created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
        }
        $approvedHighFraud = $approvedQuery->count();

        $fraudRateByMfiQuery = DB::table('loan_applications')
            ->join('mfi_institutions', 'loan_applications.mfi_id', '=', 'mfi_institutions.id')
            ->select('mfi_institutions.name as mfi_name')
            ->selectRaw('COUNT(*) as total_applications')
            ->selectRaw("SUM(CASE WHEN {$fraudExpr} >= ? THEN 1 ELSE 0 END) as fraud_applications", [$fraudThreshold])
            ->selectRaw("ROUND((SUM(CASE WHEN {$fraudExpr} >= {$fraudThreshold} THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as fraud_rate")
            ->groupBy('mfi_institutions.name');
        if ($mfiId) {
            $fraudRateByMfiQuery->where('loan_applications.mfi_id', $mfiId);
        }
        if ($from && $to) {
            $fraudRateByMfiQuery->whereBetween('loan_applications.created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
        }
        $fraudRateByMfi = $fraudRateByMfiQuery
            ->orderByDesc('fraud_rate')
            ->limit(12)
            ->get();

        $fraudTrendQuery = DB::table('loan_applications')
            ->selectRaw('DATE(created_at) as day')
            ->selectRaw("SUM(CASE WHEN {$fraudExpr} >= ? THEN 1 ELSE 0 END) as fraud_applications", [$fraudThreshold])
            ->selectRaw('COUNT(*) as total_applications')
            ->groupByRaw('DATE(created_at)');
        if ($mfiId) {
            $fraudTrendQuery->where('loan_applications.mfi_id', $mfiId);
        }
        if ($from && $to) {
            $fraudTrendQuery->whereBetween('loan_applications.created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
        } else {
            $fraudTrendQuery->where('created_at', '>=', now()->subDays(30));
        }
        $fraudTrendDaily = $fraudTrendQuery->orderBy('day')->get();

        $fraudPurposeQuery = DB::table('loan_applications')
            ->selectRaw("COALESCE(NULLIF(TRIM(purpose), ''), 'Unknown') as purpose")
            ->selectRaw('COUNT(*) as fraud_applications')
            ->whereRaw("{$fraudExpr} >= ?", [$fraudThreshold])
            ->groupByRaw("COALESCE(NULLIF(TRIM(purpose), ''), 'Unknown')");
        if ($mfiId) {
            $fraudPurposeQuery->where('loan_applications.mfi_id', $mfiId);
        }
        if ($from && $to) {
            $fraudPurposeQuery->whereBetween('loan_applications.created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
        }
        $fraudByPurpose = $fraudPurposeQuery->orderByDesc('fraud_applications')->limit(10)->get();

        $statusQuery = DB::table('loan_applications')
            ->select('status')
            ->selectRaw('COUNT(*) as count')
            ->selectRaw("ROUND(AVG(COALESCE({$fraudExpr}, 0)), 2) as avg_fraud_score")
            ->groupBy('status');
        if ($mfiId) {
            $statusQuery->where('loan_applications.mfi_id', $mfiId);
        }
        if ($from && $to) {
            $statusQuery->whereBetween('loan_applications.created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
        }
        $statusRisk = $statusQuery->orderByDesc('count')->get();

        $paymentQuery = DB::table('transactions')
            ->join('mfi_institutions', 'transactions.mfi_id', '=', 'mfi_institutions.id')
            ->select('mfi_institutions.name as mfi_name')
            ->selectRaw('COUNT(*) as total_transactions')
            ->selectRaw("SUM(CASE WHEN transactions.status = 'failed' THEN 1 ELSE 0 END) as failed_transactions")
            ->selectRaw("SUM(CASE WHEN transactions.status = 'pending' THEN 1 ELSE 0 END) as pending_transactions")
            ->selectRaw("ROUND((SUM(CASE WHEN transactions.status = 'failed' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as failed_rate")
            ->groupBy('mfi_institutions.name');
        if ($mfiId) {
            $paymentQuery->where('transactions.mfi_id', $mfiId);
        }
        if ($from && $to) {
            $paymentQuery->whereBetween('transactions.created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()]);
        }
        $paymentHealth = $paymentQuery->orderByDesc('failed_rate')->limit(10)->get();

        return [
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
        ];
    }

    public function aiCenterInsights(Request $request)
    {
        $mfiId = $request->query('mfi_id');
        $from = $request->query('from') ? Carbon::parse((string) $request->query('from')) : null;
        $to = $request->query('to') ? Carbon::parse((string) $request->query('to')) : null;
        $payload = $this->buildAiInsights($from, $to, $mfiId ? (string) $mfiId : null);

        return response()->json([
            'success' => true,
            'data' => $payload,
        ]);
    }

    public function createAiCenterReport(Request $request)
    {
        $request->validate([
            'period' => 'required|in:daily,weekly,monthly',
            'mfi_id' => 'nullable|uuid',
        ]);

        $period = (string) $request->input('period');
        $mfiId = $request->input('mfi_id') ? (string) $request->input('mfi_id') : null;
        $today = Carbon::now();
        $from = match ($period) {
            'daily' => $today->copy()->startOfDay(),
            'weekly' => $today->copy()->subDays(6)->startOfDay(),
            default => $today->copy()->subDays(29)->startOfDay(),
        };
        $to = $today->copy()->endOfDay();

        $payload = $this->buildAiInsights($from, $to, $mfiId);
        $mfiName = 'All MFIs';
        if ($mfiId) {
            $mfiName = (string) (DB::table('mfi_institutions')->where('id', $mfiId)->value('name') ?? 'Selected MFI');
        }

        $reportId = (string) Str::uuid();
        DB::table('ai_center_reports')->insert([
            'id' => $reportId,
            'mfi_id' => $mfiId,
            'generated_by' => $request->user()?->id,
            'period' => $period,
            'from_date' => $from->toDateString(),
            'to_date' => $to->toDateString(),
            'report_name' => strtoupper($period) . " AI Report - {$mfiName}",
            'summary' => json_encode($payload['summary']),
            'payload' => json_encode($payload),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'AI report generated',
            'data' => [
                'id' => $reportId,
                'report_name' => strtoupper($period) . " AI Report - {$mfiName}",
                'period' => $period,
                'from_date' => $from->toDateString(),
                'to_date' => $to->toDateString(),
                'payload' => $payload,
            ],
        ]);
    }

    public function listAiCenterReports(Request $request)
    {
        $mfiId = $request->query('mfi_id');

        $query = DB::table('ai_center_reports')
            ->leftJoin('mfi_institutions', 'ai_center_reports.mfi_id', '=', 'mfi_institutions.id')
            ->select(
                'ai_center_reports.id',
                'ai_center_reports.report_name',
                'ai_center_reports.period',
                'ai_center_reports.from_date',
                'ai_center_reports.to_date',
                'ai_center_reports.summary',
                'ai_center_reports.created_at',
                'mfi_institutions.name as mfi_name'
            )
            ->orderByDesc('ai_center_reports.created_at');

        if ($mfiId) {
            $query->where('ai_center_reports.mfi_id', $mfiId);
        }

        $rows = $query->limit(200)->get()->map(function ($row) {
            $row->summary = is_string($row->summary) ? json_decode($row->summary, true) : $row->summary;
            return $row;
        });

        return response()->json([
            'success' => true,
            'data' => $rows,
        ]);
    }

    public function showAiCenterReport(string $id)
    {
        $row = DB::table('ai_center_reports')
            ->leftJoin('mfi_institutions', 'ai_center_reports.mfi_id', '=', 'mfi_institutions.id')
            ->where('ai_center_reports.id', $id)
            ->select(
                'ai_center_reports.id',
                'ai_center_reports.report_name',
                'ai_center_reports.period',
                'ai_center_reports.from_date',
                'ai_center_reports.to_date',
                'ai_center_reports.summary',
                'ai_center_reports.payload',
                'ai_center_reports.created_at',
                'mfi_institutions.name as mfi_name'
            )
            ->first();

        if (!$row) {
            return response()->json([
                'success' => false,
                'message' => 'Report not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                ... (array) $row,
                'summary' => is_string($row->summary) ? json_decode($row->summary, true) : $row->summary,
                'payload' => is_string($row->payload) ? json_decode($row->payload, true) : $row->payload,
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
