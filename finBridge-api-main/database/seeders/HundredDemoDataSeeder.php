<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class HundredDemoDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::disableQueryLog();
        $this->command?->info("Starting seeding of 100 records per table...");

        $now = now();
        $passwordHash = Hash::make('password');

        // 1. Ensure Platform Admin & Users (100 users)
        $this->command?->info("Seeding Users (100 records)...");
        $adminId = DB::table('users')->where('email', 'admin@finbridge.com')->value('id');
        if (!$adminId) {
            $adminId = (string) Str::uuid();
            DB::table('users')->insert([
                'id' => $adminId,
                'name' => 'Platform Admin',
                'email' => 'admin@finbridge.com',
                'phone' => '01700000000',
                'password' => $passwordHash,
                'role' => 'platform_admin',
                'status' => 'active',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $userIds = [];
        $mfiAdminUserIds = [];
        $userRows = [];

        for ($i = 1; $i <= 100; $i++) {
            $id = (string) Str::uuid();
            $userIds[] = $id;
            $role = ($i <= 20) ? 'mfi_admin' : 'entrepreneur';
            if ($role === 'mfi_admin') {
                $mfiAdminUserIds[] = $id;
            }

            $userRows[] = [
                'id' => $id,
                'name' => fake()->name(),
                'email' => "demo.user.{$i}." . Str::random(5) . "@finbridge-demo.com",
                'phone' => '017' . str_pad((string) rand(10000000, 99999999), 8, '0', STR_PAD_LEFT),
                'password' => $passwordHash,
                'role' => $role,
                'status' => 'active',
                'mfi_id' => null,
                'email_verified_at' => $now,
                'remember_token' => null,
                'created_at' => $now->subDays(rand(1, 180)),
                'updated_at' => $now,
            ];
        }
        DB::table('users')->insert($userRows);

        // 2. MFI Institutions (100 records)
        $this->command?->info("Seeding MFI Institutions (100 records)...");
        $mfiNames = [
            'Grameen Micro-Credit Initiative', 'BRAC Rural Development', 'ASA Bangladesh Financial',
            'BURO Bangladesh MFI', 'TMSS Rural Support', 'Padakhep Manabik Unnayan', 'Society for Social Service',
            'Sajida Foundation Finance', 'Jagorani Chakra Foundation', 'Wave Foundation MFI'
        ];

        $mfiIds = [];
        $mfiRows = [];
        for ($i = 1; $i <= 100; $i++) {
            $mfiId = (string) Str::uuid();
            $mfiIds[] = $mfiId;
            $baseName = $mfiNames[array_rand($mfiNames)];

            $mfiRows[] = [
                'id' => $mfiId,
                'name' => "{$baseName} Branch #{$i}",
                'email' => "contact.mfi{$i}." . Str::random(4) . "@finbridge-mfi.com",
                'phone' => '018' . str_pad((string) rand(10000000, 99999999), 8, '0', STR_PAD_LEFT),
                'owner_id' => $adminId,
                'status' => 'active',
                'created_at' => $now->subDays(rand(10, 200)),
                'updated_at' => $now,
            ];
        }
        DB::table('mfi_institutions')->insert($mfiRows);

        // Assign MFI IDs to some MFI Admin users
        foreach ($mfiAdminUserIds as $idx => $adminUserId) {
            if (isset($mfiIds[$idx])) {
                DB::table('users')->where('id', $adminUserId)->update(['mfi_id' => $mfiIds[$idx]]);
            }
        }

        // 3. Subscription Plans (100 records)
        $this->command?->info("Seeding Subscription Plans (100 records)...");
        $planIds = [];
        $planRows = [];
        $planTiers = ['Starter', 'Growth', 'Enterprise', 'Scale', 'Custom Pro'];
        for ($i = 1; $i <= 100; $i++) {
            $planId = (string) Str::uuid();
            $planIds[] = $planId;
            $tier = $planTiers[array_rand($planTiers)];

            $planRows[] = [
                'id' => $planId,
                'name' => "{$tier} Tier {$i}",
                'price_bdt' => rand(499, 15000),
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('subscription_plans')->insert($planRows);

        // 4. Subscriptions (100 records)
        $this->command?->info("Seeding Subscriptions (100 records)...");
        $subscriptionIds = [];
        $subscriptionRows = [];
        for ($i = 0; $i < 100; $i++) {
            $subId = (string) Str::uuid();
            $subscriptionIds[] = $subId;
            $mfiId = $mfiIds[$i % count($mfiIds)];
            $planId = $planIds[$i % count($planIds)];
            $startDate = Carbon::now()->subDays(rand(30, 365));

            $subscriptionRows[] = [
                'id' => $subId,
                'mfi_id' => $mfiId,
                'plan_id' => $planId,
                'start_date' => $startDate->toDateString(),
                'end_date' => $startDate->copy()->addYear()->toDateString(),
                'is_active' => true,
                'created_at' => $startDate,
                'updated_at' => $now,
            ];
        }
        DB::table('subscriptions')->insert($subscriptionRows);

        // 5. Transactions (100 records)
        $this->command?->info("Seeding Transactions (100 records)...");
        $transactionRows = [];
        $statuses = ['success', 'success', 'success', 'pending', 'failed'];
        for ($i = 0; $i < 100; $i++) {
            $transactionRows[] = [
                'id' => (string) Str::uuid(),
                'mfi_id' => $mfiIds[$i % count($mfiIds)],
                'subscription_id' => $subscriptionIds[$i % count($subscriptionIds)],
                'amount' => rand(1000, 25000),
                'currency' => 'BDT',
                'status' => $statuses[array_rand($statuses)],
                'payment_gateway' => 'sslcommerz',
                'gateway_transaction_id' => 'TXN-' . strtoupper(Str::random(10)),
                'created_at' => $now->subDays(rand(1, 120)),
                'updated_at' => $now,
            ];
        }
        DB::table('transactions')->insert($transactionRows);

        // 6. Loan Products (100 records)
        $this->command?->info("Seeding Loan Products (100 records)...");
        $productTitles = [
            'Agri Krishi Micro Loan', 'Women SME Growth Loan', 'Cottage Industry Express',
            'Poultry & Dairy Expansion', 'Handicrafts Enterprise Loan', 'Retail Shop Working Capital',
            'Solar & Green Technology Loan', 'Seasonal Crop Financing'
        ];

        $loanProductIds = [];
        $productRows = [];
        for ($i = 1; $i <= 100; $i++) {
            $productId = (string) Str::uuid();
            $loanProductIds[] = $productId;
            $title = $productTitles[array_rand($productTitles)];

            $productRows[] = [
                'id' => $productId,
                'mfi_id' => $mfiIds[$i % count($mfiIds)],
                'name' => "{$title} Option #{$i}",
                'max_amount' => rand(25000, 500000),
                'interest_rate' => rand(8, 18) + (rand(0, 99) / 100),
                'duration_months' => rand(6, 36),
                'status' => 'active',
                'created_at' => $now->subDays(rand(10, 150)),
                'updated_at' => $now,
            ];
        }
        DB::table('loan_products')->insert($productRows);

        // 7. Loan Applications (100 records)
        $this->command?->info("Seeding Loan Applications (100 records)...");
        $appStatuses = ['approved', 'pending', 'under_review', 'rejected'];
        $purposes = [
            'Expansion of grocery store inventory', 'Purchase of high-yield agricultural seeds and fertilizer',
            'Setting up automated poultry feeding system', 'Procurement of textile weaving machinery',
            'Working capital for seasonal vegetable trade', 'Installation of solar irrigation pump'
        ];

        $loanAppIds = [];
        $loanAppRows = [];
        for ($i = 0; $i < 100; $i++) {
            $appId = (string) Str::uuid();
            $loanAppIds[] = $appId;
            $status = $appStatuses[array_rand($appStatuses)];
            $isFraud = ($status === 'rejected') ? (rand(0, 1) === 1) : false;
            $fraudScore = $isFraud ? (rand(70, 99) + rand(0, 99) / 100) : (rand(5, 35) + rand(0, 99) / 100);

            $loanAppRows[] = [
                'id' => $appId,
                'user_id' => $userIds[$i % count($userIds)],
                'mfi_id' => $mfiIds[$i % count($mfiIds)],
                'loan_product_id' => $loanProductIds[$i % count($loanProductIds)],
                'amount' => rand(15000, 250000),
                'monthly_income' => rand(18000, 120000),
                'duration_months' => rand(6, 24),
                'purpose' => $purposes[array_rand($purposes)],
                'status' => $status,
                'is_fraud' => $isFraud,
                'fraud_score' => $fraudScore,
                'description' => "Detailed applicant background check completed for application #{$i}.",
                'applied_at' => $now->subDays(rand(1, 90)),
                'created_at' => $now->subDays(rand(1, 90)),
                'updated_at' => $now,
            ];
        }
        DB::table('loan_applications')->insert($loanAppRows);

        // 8. Application Documents (100 records)
        $this->command?->info("Seeding Application Documents (100 records)...");
        $docTypes = ['nid_front', 'nid_back', 'trade_license', 'bank_statement', 'income_certificate'];
        $docRows = [];
        for ($i = 0; $i < 100; $i++) {
            $docType = $docTypes[array_rand($docTypes)];
            $docRows[] = [
                'id' => (string) Str::uuid(),
                'loan_application_id' => $loanAppIds[$i],
                'type' => $docType,
                'file_path' => "documents/demo_{$docType}_" . ($i + 1) . ".pdf",
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('application_documents')->insert($docRows);

        // 9. Rejected Loan Applications (100 records)
        $this->command?->info("Seeding Rejected Loan Applications (100 records)...");
        $rejectedRows = [];
        for ($i = 0; $i < 100; $i++) {
            $fraudRate = rand(55, 98) + (rand(0, 99) / 100);
            $rejectedRows[] = [
                'id' => (string) Str::uuid(),
                'loan_application_id' => $loanAppIds[$i],
                'fraud_rate' => $fraudRate,
                'review_report' => "Automated Gemini Risk Assessment: Detected discrepancy in income statements and mismatched NID OCR data. Risk score rated at {$fraudRate}%.",
                'analysis_payload' => json_encode([
                    'income_verification' => 'failed',
                    'nid_ocr_match' => 'partial',
                    'credit_history_flags' => rand(1, 4),
                    'risk_level' => 'HIGH'
                ]),
                'review_source' => 'gemini',
                'created_at' => $now->subDays(rand(1, 60)),
                'updated_at' => $now,
            ];
        }
        DB::table('rejected_loan_application')->insert($rejectedRows);

        // 10. AI Center Reports (100 records)
        $this->command?->info("Seeding AI Center Reports (100 records)...");
        $reportTypes = ['Monthly Portfolio Audit', 'Fraud & Anomaly Report', 'MFI Credit Health Index', 'Borrower Demographics Risk'];
        $aiReportRows = [];
        for ($i = 1; $i <= 100; $i++) {
            $reportTitle = $reportTypes[array_rand($reportTypes)];
            $fromDate = $now->copy()->subMonths(rand(1, 12))->startOfMonth();
            $toDate = $fromDate->copy()->endOfMonth();

            $aiReportRows[] = [
                'id' => (string) Str::uuid(),
                'mfi_id' => $mfiIds[$i % count($mfiIds)],
                'generated_by' => $adminId,
                'period' => 'monthly',
                'from_date' => $fromDate->toDateString(),
                'to_date' => $toDate->toDateString(),
                'report_name' => "{$reportTitle} - " . $fromDate->format('M Y') . " (#{$i})",
                'summary' => json_encode([
                    'total_applications_reviewed' => rand(100, 5000),
                    'approval_rate_pct' => rand(65, 92),
                    'fraud_prevention_savings_bdt' => rand(100000, 5000000),
                    'average_credit_score' => rand(650, 820),
                ]),
                'payload' => json_encode([
                    'ai_model_version' => 'finbridge-gemini-v2.4',
                    'scanned_documents_count' => rand(500, 15000),
                    'high_risk_flagged' => rand(5, 50),
                    'recommendation' => 'Portfolio remains healthy with stable risk index.'
                ]),
                'created_at' => $now->subDays(rand(1, 180)),
                'updated_at' => $now,
            ];
        }
        DB::table('ai_center_reports')->insert($aiReportRows);

        // 11. NID Verifications (100 records)
        $this->command?->info("Seeding NID Verifications (100 records)...");
        $nidStatuses = ['verified', 'verified', 'verified', 'manual_review', 'failed'];
        $nidRows = [];
        for ($i = 0; $i < 100; $i++) {
            $status = $nidStatuses[array_rand($nidStatuses)];
            $simScore = ($status === 'verified') ? (rand(85, 99) + rand(0, 99) / 100) : (rand(40, 75) + rand(0, 99) / 100);
            $ocrConf = rand(88, 99) + rand(0, 99) / 100;
            $nidNum = '199' . rand(10000000, 99999999);

            $nidRows[] = [
                'id' => (string) Str::uuid(),
                'loan_application_id' => $loanAppIds[$i],
                'customer_unique_id' => 'CUST-' . str_pad((string) ($i + 1), 6, '0', STR_PAD_LEFT),
                'verification_status' => $status,
                'matched_reference' => ($status === 'verified'),
                'similarity_score' => $simScore,
                'nid_number' => $nidNum,
                'extracted_name' => fake()->name(),
                'ocr_confidence' => $ocrConf,
                'uploaded_image_url' => "https://storage.finbridge.com/nids/uploaded_{$i}.jpg",
                'reference_image_url' => "https://storage.finbridge.com/nids/ref_{$i}.jpg",
                'raw_text' => "Name: Sample Applicant\nNID: {$nidNum}\nDOB: 1992-05-14\nAddress: Dhaka, Bangladesh",
                'created_at' => $now->subDays(rand(1, 90)),
                'updated_at' => $now,
            ];
        }
        DB::table('nid_verifications')->insert($nidRows);

        // 12. MFI AI Rankings (100 records)
        $this->command?->info("Seeding MFI AI Rankings (100 records)...");
        $batchId = (string) Str::uuid();
        $mfiRankingRows = [];
        for ($i = 0; $i < 100; $i++) {
            $mfiId = $mfiIds[$i];
            $mfiName = DB::table('mfi_institutions')->where('id', $mfiId)->value('name') ?? "MFI #{$i}";
            $perfScore = rand(70, 99) + (rand(0, 99) / 100);

            $mfiRankingRows[] = [
                'id' => (string) Str::uuid(),
                'mfi_id' => $mfiId,
                'mfi_name' => $mfiName,
                'batch_id' => $batchId,
                'performance_score' => $perfScore,
                'rank_position' => $i + 1,
                'star_rating' => rand(3, 5),
                'recommended_account_count' => rand(50, 2000),
                'metrics' => json_encode([
                    'loan_recovery_rate_pct' => rand(92, 99),
                    'avg_processing_time_days' => rand(1, 4),
                    'customer_satisfaction_score' => rand(85, 98),
                ]),
                'ai_summary' => "AI Evaluation: Outstanding operational efficiency and low default probability for {$mfiName}.",
                'approval_status' => 'approved',
                'approved_by' => $adminId,
                'approved_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        DB::table('mfi_ai_rankings')->insert($mfiRankingRows);

        $this->command?->info("SUCCESS! Seeded 100 demo records for all 12 tables.");
    }
}
