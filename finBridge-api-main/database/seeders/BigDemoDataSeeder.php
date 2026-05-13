<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BigDemoDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::disableQueryLog();

        $userCount = 200000;
        $loanCount = 1000000;
        $transactionCount = 100000;
        $userChunkSize = 5000;
        // PostgreSQL has a hard limit of 65535 bind parameters per statement.
        // loan_applications insert uses 15 columns, so keep chunk safely below 65535 / 15.
        $loanChunkSize = 3000;

        $passwordHash = Hash::make('password');
        $now = now();
        $startUserIndex = $this->resolveDemoUserStartIndex();

        $this->command?->info('Preparing MFI and loan product references...');
        [$mfiIds, $productMap] = $this->resolveOrCreateLoanRefs();
        $subscriptionMap = $this->resolveOrCreateSubscriptions($mfiIds);

        $this->command?->info("Creating users from demo index {$startUserIndex}...");

        $userIds = [];
        for ($i = 0; $i < $userCount; $i += $userChunkSize) {
            $users = [];

            for ($j = 0; $j < $userChunkSize && ($i + $j) < $userCount; $j++) {
                $id = (string) Str::uuid();
                $seq = $startUserIndex + $i + $j + 1;
                $userIds[] = $id;

                $users[] = [
                    'id' => $id,
                    'name' => fake()->name(),
                    'email' => "user{$seq}@demo.com",
                    'password' => $passwordHash,
                    'phone' => '01' . str_pad((string) fake()->numberBetween(300000000, 999999999), 9, '0', STR_PAD_LEFT),
                    'role' => 'entrepreneur',
                    'status' => 'active',
                    'mfi_id' => null,
                    'email_verified_at' => $now,
                    'remember_token' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DB::table('users')->insert($users);
            $this->command?->info('Inserted users: ' . min($i + $userChunkSize, $userCount));
        }

        $this->command?->info('Creating loan applications...');

        $statuses = [
            'pending',
            'approved',
            'rejected',
            'under_review',
            'fraud_rejected',
        ];

        $fraudDescriptions = $this->buildReasonPool(1000, true);
        $normalDescriptions = $this->buildReasonPool(1000, false);

        $loanPurposes = [
            'Business',
            'Education',
            'Medical',
            'Agriculture',
            'Personal',
            'Emergency',
            'House Repair',
        ];

        $minTimestamp = Carbon::parse('2020-01-01')->timestamp;
        $maxTimestamp = now()->timestamp;

        for ($i = 0; $i < $loanCount; $i += $loanChunkSize) {
            $loans = [];
            $documents = [];

            for ($j = 0; $j < $loanChunkSize && ($i + $j) < $loanCount; $j++) {
                $status = fake()->randomElement($statuses);
                $isFraud = $status === 'fraud_rejected';

                $amount = fake()->numberBetween(5000, 500000);
                $income = fake()->numberBetween(8000, 150000);

                if ($isFraud) {
                    $amount = fake()->numberBetween(300000, 1000000);
                    $income = fake()->numberBetween(5000, 25000);
                }

                $appliedAt = Carbon::createFromTimestamp(fake()->numberBetween($minTimestamp, $maxTimestamp));
                $mfiId = $mfiIds[array_rand($mfiIds)];
                $loanProductId = $productMap[$mfiId][array_rand($productMap[$mfiId])];
                $applicationId = (string) Str::uuid();

                $loans[] = [
                    'id' => $applicationId,
                    'user_id' => $userIds[array_rand($userIds)],
                    'mfi_id' => $mfiId,
                    'loan_product_id' => $loanProductId,
                    'amount' => $amount,
                    'monthly_income' => $income,
                    'duration_months' => fake()->randomElement([6, 12, 18, 24, 36]),
                    'purpose' => fake()->randomElement($loanPurposes),
                    'status' => $status,
                    'is_fraud' => $isFraud ? 1 : 0,
                    'fraud_score' => $isFraud
                        ? fake()->randomFloat(2, 0.75, 0.99)
                        : fake()->randomFloat(2, 0.01, 0.45),
                    'description' => $isFraud
                        ? fake()->randomElement($fraudDescriptions)
                        : fake()->randomElement($normalDescriptions),
                    'applied_at' => $appliedAt,
                    'created_at' => $appliedAt,
                    'updated_at' => $appliedAt,
                ];

                $docCode = strtoupper(Str::random(8));
                $documents[] = [
                    'id' => (string) Str::uuid(),
                    'loan_application_id' => $applicationId,
                    'type' => 'nid',
                    'file_path' => "docs/nid_{$docCode}.pdf",
                    'created_at' => $appliedAt,
                    'updated_at' => $appliedAt,
                ];

                if (fake()->boolean(35)) {
                    $documents[] = [
                        'id' => (string) Str::uuid(),
                        'loan_application_id' => $applicationId,
                        'type' => 'tax',
                        'file_path' => "docs/tax_{$docCode}.pdf",
                        'created_at' => $appliedAt,
                        'updated_at' => $appliedAt,
                    ];
                }

                if (fake()->boolean(25)) {
                    $documents[] = [
                        'id' => (string) Str::uuid(),
                        'loan_application_id' => $applicationId,
                        'type' => 'tin',
                        'file_path' => "docs/tin_{$docCode}.pdf",
                        'created_at' => $appliedAt,
                        'updated_at' => $appliedAt,
                    ];
                }
            }

            DB::table('loan_applications')->insert($loans);
            DB::table('application_documents')->insert($documents);
            $this->command?->info('Inserted loans: ' . min($i + $loanChunkSize, $loanCount));
        }

        $this->seedTransactions($transactionCount, $mfiIds, $subscriptionMap);
        $this->seedUtilityTables($userIds, $mfiIds);

        $this->command?->info('Big demo data seeding completed.');
    }

    private function buildReasonPool(int $targetCount, bool $fraud): array
    {
        $subjects = [
            'grocery shop',
            'tailoring business',
            'pharmacy',
            'farm activity',
            'small wholesale trade',
            'mobile repair shop',
            'restaurant business',
            'delivery service',
            'home business',
            'electronics store',
        ];

        $assets = [
            'inventory',
            'raw materials',
            'equipment',
            'seasonal stock',
            'delivery vehicle',
            'shop renovation',
            'working capital',
            'medical support',
            'education expense',
            'house repair',
        ];

        $timings = [
            'before festival season',
            'within this week',
            'this month',
            'before harvest',
            'before school payment date',
            'before supplier deadline',
            'immediately',
            'within two days',
            'as soon as possible',
            'by next week',
        ];

        $normalClosings = [
            'I can repay from regular monthly income.',
            'Installments will be paid from confirmed sales.',
            'I have planned the repayment schedule in advance.',
            'I will pay on time from stable cash flow.',
            'Repayment will be managed from business earnings.',
            'I have existing customers to support repayment.',
            'My income source is steady and predictable.',
            'I can manage EMI from current household income.',
            'I have a clear monthly repayment plan.',
            'I can repay from salary and side income.',
        ];

        $fraudClosings = [
            'I will share full papers after disbursement.',
            'Repayment depends on expected money from another source.',
            'I may not be able to follow fixed EMI dates.',
            'Please release funds quickly before verification delay.',
            'Installments may be irregular for a few months.',
            'I need approval first and can update details later.',
            'I am using temporary account details for now.',
            'I cannot provide complete records immediately.',
            'Repayment is possible if my planned deal succeeds.',
            'I need fast release and documents can be adjusted later.',
        ];

        $fraudKeywords = [
            'urgent cash',
            'same day transfer',
            'alternate account',
            'document mismatch',
            'high amount',
            'short repayment promise',
            'debt rollover',
            'temporary phone number',
            'manual verification skip',
            'third-party disbursement',
            'cash out',
            'bridge loan from other lender',
            'income proof pending',
            'edited statement',
            'high risk trade',
        ];

        $normalKeywords = [
            'inventory purchase',
            'school fees',
            'medical treatment',
            'farm input',
            'shop expansion',
            'machine purchase',
            'home repair',
            'transport support',
            'working capital',
            'supplier payment',
            'seasonal demand',
            'business growth',
            'stable income',
            'monthly installment plan',
            'family support',
        ];

        $templates = $fraud ? [
            'I need this loan for %s in my %s %s. %s Risk note: %s.',
            'I am requesting a large amount for %s related to my %s %s. %s Signal: %s.',
            'This loan is mainly for %s and I need it %s for my %s. %s Mention: %s.',
            'I am taking this amount for %s in the %s %s. %s Indicator: %s.',
        ] : [
            'I need this loan for %s in my %s %s. %s Note: %s.',
            'I am requesting this amount for %s for my %s %s. %s Purpose: %s.',
            'This loan will support %s and help my %s %s. %s Reason: %s.',
            'I am taking this loan to manage %s for my %s %s. %s Context: %s.',
        ];

        $closings = $fraud ? $fraudClosings : $normalClosings;
        $keywords = $fraud ? $fraudKeywords : $normalKeywords;

        $pool = [];
        $attempts = 0;
        $maxAttempts = $targetCount * 30;

        while (count($pool) < $targetCount && $attempts < $maxAttempts) {
            $attempts++;
            $sentence = sprintf(
                $templates[array_rand($templates)],
                $assets[array_rand($assets)],
                $subjects[array_rand($subjects)],
                $timings[array_rand($timings)],
                $closings[array_rand($closings)],
                $keywords[array_rand($keywords)]
            );

            $sentence = preg_replace('/\s+/', ' ', trim($sentence));
            $pool[$sentence] = true;
        }

        if (count($pool) < $targetCount) {
            for ($i = count($pool); $i < $targetCount; $i++) {
                $fallback = sprintf(
                    'I need this loan for %s in my %s. %s Ref-%04d.',
                    $assets[array_rand($assets)],
                    $subjects[array_rand($subjects)],
                    $closings[array_rand($closings)],
                    $i + 1
                );
                $pool[$fallback] = true;
            }
        }

        return array_values(array_slice($pool, 0, $targetCount));
    }

    private function resolveOrCreateLoanRefs(): array
    {
        $mfiIds = DB::table('mfi_institutions')->pluck('id')->all();

        if (empty($mfiIds)) {
            $adminId = DB::table('users')->where('email', 'mfi.bulk.admin@demo.com')->value('id');

            if (!$adminId) {
                $adminId = (string) Str::uuid();
                DB::table('users')->insert([
                    'id' => $adminId,
                    'name' => 'Bulk MFI Admin',
                    'email' => 'mfi.bulk.admin@demo.com',
                    'phone' => '01700000001',
                    'password' => Hash::make('password'),
                    'role' => 'mfi_admin',
                    'status' => 'active',
                    'mfi_id' => null,
                    'email_verified_at' => now(),
                    'remember_token' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $mfiIds = [];
            for ($i = 1; $i <= 5; $i++) {
                $id = (string) Str::uuid();
                DB::table('mfi_institutions')->insert([
                    'id' => $id,
                    'name' => "Bulk Demo MFI {$i}",
                    'email' => "bulk-mfi-{$i}@demo.com",
                    'phone' => '018' . str_pad((string) $i, 8, '0', STR_PAD_LEFT),
                    'owner_id' => $adminId,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $mfiIds[] = $id;
            }
        }

        $loanProducts = DB::table('loan_products')
            ->select('id', 'mfi_id')
            ->get()
            ->groupBy('mfi_id');

        if ($loanProducts->isEmpty()) {
            foreach ($mfiIds as $mfiId) {
                for ($i = 1; $i <= 3; $i++) {
                    DB::table('loan_products')->insert([
                        'id' => (string) Str::uuid(),
                        'mfi_id' => $mfiId,
                        'name' => "Bulk Product {$i}",
                        'description' => 'Auto-generated product for bulk seeding.',
                        'min_amount' => 5000,
                        'max_amount' => 1000000,
                        'processing_fee' => 2,
                        'interest_rate' => 12.5,
                        'duration_months' => [6, 12, 18][array_rand([6, 12, 18])],
                        'status' => 'active',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            $loanProducts = DB::table('loan_products')
                ->select('id', 'mfi_id')
                ->get()
                ->groupBy('mfi_id');
        }

        $productMap = [];
        foreach ($loanProducts as $mfiId => $rows) {
            $productMap[$mfiId] = $rows->pluck('id')->all();
        }

        return [$mfiIds, $productMap];
    }

    private function resolveOrCreateSubscriptions(array $mfiIds): array
    {
        $plans = [
            ['name' => 'starter', 'price_bdt' => 399],
            ['name' => 'growth', 'price_bdt' => 999],
            ['name' => 'enterprise', 'price_bdt' => 2999],
        ];

        $planIds = [];
        foreach ($plans as $plan) {
            $existingId = DB::table('subscription_plans')->where('name', $plan['name'])->value('id');
            if ($existingId) {
                DB::table('subscription_plans')->where('id', $existingId)->update([
                    'price_bdt' => $plan['price_bdt'],
                    'status' => 'active',
                    'updated_at' => now(),
                ]);
                $planIds[$plan['name']] = $existingId;
                continue;
            }

            $id = (string) Str::uuid();
            DB::table('subscription_plans')->insert([
                'id' => $id,
                'name' => $plan['name'],
                'price_bdt' => $plan['price_bdt'],
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $planIds[$plan['name']] = $id;
        }

        $statuses = ['trial', 'active', 'pending_payment', 'expired'];
        $planKeys = array_keys($planIds);
        $subscriptionMap = [];

        foreach ($mfiIds as $idx => $mfiId) {
            $existingId = DB::table('subscriptions')->where('mfi_id', $mfiId)->value('id');
            if ($existingId) {
                $subscriptionMap[$mfiId] = $existingId;
                continue;
            }

            $status = $statuses[$idx % count($statuses)];
            $planKey = $planKeys[$idx % count($planKeys)];
            $startDate = now()->subMonths(rand(1, 24))->toDateString();
            $endDate = $status === 'expired' ? now()->subDays(rand(1, 120))->toDateString() : null;
            $subId = (string) Str::uuid();

            DB::table('subscriptions')->insert([
                'id' => $subId,
                'mfi_id' => $mfiId,
                'plan_id' => $planIds[$planKey],
                'start_date' => $startDate,
                'end_date' => $endDate,
                'is_active' => in_array($status, ['trial', 'active'], true),
                'status' => $status,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $subscriptionMap[$mfiId] = $subId;
        }

        return $subscriptionMap;
    }

    private function seedTransactions(int $transactionCount, array $mfiIds, array $subscriptionMap): void
    {
        $this->command?->info("Creating {$transactionCount} transactions...");
        $chunkSize = 5000;
        $statusSet = ['pending', 'success', 'failed'];
        $gateways = ['sslcommerz', 'bkash', 'nagad'];

        for ($i = 0; $i < $transactionCount; $i += $chunkSize) {
            $rows = [];
            $limit = min($chunkSize, $transactionCount - $i);

            for ($j = 0; $j < $limit; $j++) {
                $mfiId = $mfiIds[array_rand($mfiIds)];
                $timestamp = now()->subDays(rand(0, 730))->subMinutes(rand(0, 1440));
                $status = fake()->randomElement($statusSet);

                $rows[] = [
                    'id' => (string) Str::uuid(),
                    'mfi_id' => $mfiId,
                    'subscription_id' => $subscriptionMap[$mfiId] ?? null,
                    'amount' => rand(200, 10000),
                    'currency' => 'BDT',
                    'status' => $status,
                    'payment_gateway' => fake()->randomElement($gateways),
                    'gateway_transaction_id' => 'GTX-' . strtoupper(Str::random(12)),
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            }

            DB::table('transactions')->insert($rows);
            $this->command?->info('Inserted transactions: ' . min($i + $chunkSize, $transactionCount));
        }
    }

    private function seedUtilityTables(array $userIds, array $mfiIds): void
    {
        $this->command?->info('Seeding utility tables...');
        $nowTs = now()->timestamp;

        $cacheRows = [];
        $cacheLockRows = [];
        for ($i = 1; $i <= 200; $i++) {
            $cacheRows[] = [
                'key' => "demo_cache_key_{$i}",
                'value' => json_encode(['scope' => 'demo', 'index' => $i]),
                'expiration' => $nowTs + rand(600, 86400),
            ];
            $cacheLockRows[] = [
                'key' => "demo_lock_key_{$i}",
                'owner' => (string) Str::uuid(),
                'expiration' => $nowTs + rand(60, 3600),
            ];
        }
        DB::table('cache')->insert($cacheRows);
        DB::table('cache_locks')->insert($cacheLockRows);

        $sessionRows = [];
        for ($i = 0; $i < 5000; $i++) {
            $sessionRows[] = [
                'id' => Str::random(40),
                'user_id' => $userIds[array_rand($userIds)],
                'ip_address' => fake()->ipv4(),
                'user_agent' => fake()->userAgent(),
                'payload' => base64_encode(json_encode(['demo' => true, 'idx' => $i])),
                'last_activity' => $nowTs - rand(60, 1209600),
            ];
        }
        DB::table('sessions')->insert($sessionRows);

        $tokenRows = [];
        for ($i = 0; $i < 3000; $i++) {
            $createdAt = now()->subDays(rand(0, 365));
            $tokenRows[] = [
                'tokenable_type' => 'App\\Models\\User',
                'tokenable_id' => $userIds[array_rand($userIds)],
                'name' => 'api-token-' . Str::random(6),
                'token' => hash('sha256', Str::random(40)),
                'abilities' => json_encode(['*']),
                'last_used_at' => fake()->boolean(70) ? now()->subDays(rand(0, 30)) : null,
                'expires_at' => $createdAt->copy()->addMonths(6),
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];
        }
        DB::table('personal_access_tokens')->insert($tokenRows);

        $pwdResetRows = [];
        for ($i = 1; $i <= 500; $i++) {
            $pwdResetRows[] = [
                'email' => "user{$i}@demo.com",
                'token' => Str::random(64),
                'created_at' => now()->subMinutes(rand(1, 10080)),
            ];
        }
        DB::table('password_reset_tokens')->insert($pwdResetRows);

        $jobRows = [];
        for ($i = 0; $i < 1000; $i++) {
            $jobRows[] = [
                'queue' => fake()->randomElement(['default', 'emails', 'reports']),
                'payload' => json_encode(['type' => 'demo', 'job' => Str::random(10)]),
                'attempts' => rand(0, 3),
                'reserved_at' => null,
                'available_at' => $nowTs - rand(0, 86400),
                'created_at' => $nowTs - rand(0, 86400),
            ];
        }
        DB::table('jobs')->insert($jobRows);

        $batchRows = [];
        for ($i = 0; $i < 100; $i++) {
            $createdTs = $nowTs - rand(0, 604800);
            $batchRows[] = [
                'id' => (string) Str::uuid(),
                'name' => 'demo-batch-' . Str::random(8),
                'total_jobs' => rand(10, 500),
                'pending_jobs' => rand(0, 10),
                'failed_jobs' => rand(0, 5),
                'failed_job_ids' => json_encode([]),
                'options' => json_encode(['mfi' => $mfiIds[array_rand($mfiIds)]]),
                'cancelled_at' => null,
                'created_at' => $createdTs,
                'finished_at' => fake()->boolean(80) ? $createdTs + rand(60, 7200) : null,
            ];
        }
        DB::table('job_batches')->insert($batchRows);

        $failedRows = [];
        for ($i = 0; $i < 300; $i++) {
            $failedRows[] = [
                'uuid' => (string) Str::uuid(),
                'connection' => 'database',
                'queue' => fake()->randomElement(['default', 'emails', 'reports']),
                'payload' => json_encode(['type' => 'demo-failed', 'job' => Str::random(12)]),
                'exception' => 'RuntimeException: Synthetic failed job for demo dataset.',
                'failed_at' => now()->subDays(rand(0, 180)),
            ];
        }
        DB::table('failed_jobs')->insert($failedRows);
    }

    private function resolveDemoUserStartIndex(): int
    {
        $maxIndex = DB::table('users')
            ->where('email', 'like', 'user%@demo.com')
            ->selectRaw("MAX(CAST(SUBSTRING(email FROM 'user([0-9]+)@demo.com') AS BIGINT)) AS max_index")
            ->value('max_index');

        return $maxIndex ? (int) $maxIndex : 0;
    }
}
