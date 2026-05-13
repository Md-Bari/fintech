<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LoanInsightsDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $planIds = $this->seedSubscriptionPlans();
            $mfiAdminId = $this->seedMfiAdmin();
            $mfiIds = $this->seedMfis($mfiAdminId, 8);

            $this->seedSubscriptionsAndTransactions($mfiIds, $planIds);

            $productMap = $this->seedLoanProducts($mfiIds);
            $borrowerIds = $this->seedBorrowers(1200);

            $this->seedLoanApplicationsAndDocuments($borrowerIds, $mfiIds, $productMap);
        });
    }

    private function seedSubscriptionPlans(): array
    {
        $plans = [
            ['name' => 'starter', 'price_bdt' => 399, 'status' => 'active'],
            ['name' => 'growth', 'price_bdt' => 999, 'status' => 'active'],
            ['name' => 'enterprise', 'price_bdt' => 2999, 'status' => 'active'],
        ];

        $ids = [];
        foreach ($plans as $plan) {
            $existingId = DB::table('subscription_plans')->where('name', $plan['name'])->value('id');
            if ($existingId) {
                DB::table('subscription_plans')->where('id', $existingId)->update([
                    'price_bdt' => $plan['price_bdt'],
                    'status' => $plan['status'],
                    'updated_at' => now(),
                ]);
                $ids[$plan['name']] = $existingId;
                continue;
            }

            $id = (string) Str::uuid();
            DB::table('subscription_plans')->insert([
                'id' => $id,
                'name' => $plan['name'],
                'price_bdt' => $plan['price_bdt'],
                'status' => $plan['status'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $ids[$plan['name']] = $id;
        }

        return $ids;
    }

    private function seedMfiAdmin(): string
    {
        $email = 'mfi.admin.demo@finbridge.test';
        $existing = DB::table('users')->where('email', $email)->value('id');
        if ($existing) {
            return $existing;
        }

        return User::factory()->create([
            'name' => 'Demo MFI Admin',
            'email' => $email,
            'phone' => '01711111111',
            'role' => 'mfi_admin',
            'status' => 'active',
            'mfi_id' => null,
        ])->id;
    }

    private function seedMfis(string $ownerId, int $count): array
    {
        $mfiIds = [];

        for ($i = 1; $i <= $count; $i++) {
            $name = "Demo MFI {$i}";
            $existingId = DB::table('mfi_institutions')->where('name', $name)->value('id');

            if ($existingId) {
                $mfiIds[] = $existingId;
                continue;
            }

            $id = (string) Str::uuid();
            DB::table('mfi_institutions')->insert([
                'id' => $id,
                'name' => $name,
                'email' => "contact{$i}@mfi-demo.test",
                'phone' => '018' . str_pad((string) $i, 8, '0', STR_PAD_LEFT),
                'owner_id' => $ownerId,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $mfiIds[] = $id;
        }

        return $mfiIds;
    }

    private function seedSubscriptionsAndTransactions(array $mfiIds, array $planIds): void
    {
        $planRotation = ['starter', 'growth', 'enterprise'];
        $statuses = ['trial', 'active', 'pending_payment', 'expired'];

        foreach ($mfiIds as $index => $mfiId) {
            $subscriptionId = (string) Str::uuid();
            $status = $statuses[$index % count($statuses)];
            $planKey = $planRotation[$index % count($planRotation)];

            DB::table('subscriptions')->insert([
                'id' => $subscriptionId,
                'mfi_id' => $mfiId,
                'plan_id' => $planIds[$planKey],
                'start_date' => now()->subMonths(rand(1, 12))->toDateString(),
                'end_date' => $status === 'expired' ? now()->subDays(rand(5, 60))->toDateString() : null,
                'is_active' => in_array($status, ['trial', 'active'], true),
                'status' => $status,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('transactions')->insert([
                'id' => (string) Str::uuid(),
                'mfi_id' => $mfiId,
                'subscription_id' => $subscriptionId,
                'amount' => match ($planKey) {
                    'starter' => 399,
                    'growth' => 999,
                    default => 2999,
                },
                'currency' => 'BDT',
                'status' => $status === 'pending_payment' ? 'pending' : 'success',
                'payment_gateway' => 'sslcommerz',
                'gateway_transaction_id' => 'GTX-' . strtoupper(Str::random(10)),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function seedLoanProducts(array $mfiIds): array
    {
        $productMap = [];
        $productTemplates = [
            ['name' => 'Agri Growth Loan', 'min' => 30000, 'max' => 300000, 'rate' => 12.50],
            ['name' => 'Shop Expansion Loan', 'min' => 50000, 'max' => 500000, 'rate' => 14.25],
            ['name' => 'Working Capital Boost', 'min' => 20000, 'max' => 200000, 'rate' => 11.75],
        ];

        foreach ($mfiIds as $mfiId) {
            $productIds = [];

            foreach ($productTemplates as $template) {
                $id = (string) Str::uuid();
                DB::table('loan_products')->insert([
                    'id' => $id,
                    'mfi_id' => $mfiId,
                    'name' => $template['name'],
                    'description' => 'General-purpose product for MSME borrowers',
                    'min_amount' => $template['min'],
                    'max_amount' => $template['max'],
                    'processing_fee' => rand(1, 3),
                    'interest_rate' => $template['rate'],
                    'duration_months' => [6, 12, 18][array_rand([6, 12, 18])],
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $productIds[] = $id;
            }

            $productMap[$mfiId] = $productIds;
        }

        return $productMap;
    }

    private function seedBorrowers(int $count): array
    {
        $startAt = $this->resolveDemoUserStartIndex();

        $users = User::factory()
            ->count($count)
            ->demoUsers($startAt)
            ->create();

        return $users->pluck('id')->all();
    }

    private function resolveDemoUserStartIndex(): int
    {
        $maxIndex = DB::table('users')
            ->where('email', 'like', 'demo_user_%@finbridge.test')
            ->selectRaw(
                "MAX(CAST(SUBSTRING(email FROM 'demo_user_([0-9]+)@finbridge.test') AS BIGINT)) AS max_index"
            )
            ->value('max_index');

        return $maxIndex ? (int) $maxIndex : 0;
    }

    private function seedLoanApplicationsAndDocuments(array $borrowerIds, array $mfiIds, array $productMap): void
    {
        $normalPurposes = [
            'Buy inventory for Eid season sales',
            'Expand tailoring unit with two new machines',
            'Working capital for daily raw materials',
            'Open second tea stall near bus terminal',
            'Purchase irrigation equipment for farm',
        ];

        $fraudPurposes = [
            'urgent cashout, fake invoice provided by broker',
            'layered transfer request with mule account',
            'synthetic identity used for fast disbursement',
            'money laundering attempt through shell business',
            'forged NID and edited bank statement',
        ];

        $normalReasons = [
            'I need this loan to buy additional inventory for my shop before peak sales season.',
            'I am taking this loan to purchase equipment so I can increase production capacity.',
            'I need working capital to pay suppliers and keep my business running smoothly.',
            'I am requesting this amount for my child education expenses for the current year.',
            'I need this loan to cover medical treatment costs for a family member.',
            'I want to repair my house roof before monsoon and repay from monthly income.',
            'I am applying for this loan to expand my tailoring business with new machines.',
            'I need funds to buy seeds and fertilizer for the next farming cycle.',
            'I am taking this loan to renovate my small tea stall and improve customer service.',
            'I need this amount to buy a used vehicle for business delivery work.',
        ];

        $fraudReasons = [
            'I need urgent cash today and will provide full documents after disbursement.',
            'I am requesting a high amount now and repayment depends on expected outside funds.',
            'I need this loan to manage other outstanding debts and immediate payment pressure.',
            'I am using another account temporarily and will update details later.',
            'I need quick approval first; supporting records can be shared in the next few days.',
            'This amount is needed for a short-term deal and repayment is not fully fixed yet.',
            'I am facing an emergency and cannot complete all verification right now.',
            'I need immediate transfer and may delay installments until cash flow improves.',
            'I am rotating funds from one lender to another to handle current obligations.',
            'I need fast release now; I will submit corrected paperwork after receiving funds.',
        ];

        foreach ($borrowerIds as $i => $userId) {
            $mfiId = $mfiIds[$i % count($mfiIds)];
            $loanProductId = $productMap[$mfiId][array_rand($productMap[$mfiId])];
            $isFraudCase = ($i % 11 === 0);

            $purpose = $isFraudCase
                ? $fraudPurposes[array_rand($fraudPurposes)]
                : $normalPurposes[array_rand($normalPurposes)];
            $description = $isFraudCase
                ? $fraudReasons[array_rand($fraudReasons)]
                : $normalReasons[array_rand($normalReasons)];

            $status = $isFraudCase
                ? (rand(0, 1) ? 'rejected' : 'pending')
                : ['approved', 'pending', 'approved', 'rejected'][array_rand(['approved', 'pending', 'approved', 'rejected'])];

            $amount = $isFraudCase
                ? rand(400000, 900000)
                : rand(30000, 300000);
            $monthlyIncome = $isFraudCase
                ? rand(8000, 25000)
                : rand(18000, 150000);
            $fraudScore = $isFraudCase
                ? rand(78, 98) / 100
                : rand(2, 45) / 100;
            $appliedAt = now()->subDays(rand(1, 120))->subMinutes(rand(0, 1440));

            $applicationId = (string) Str::uuid();

            DB::table('loan_applications')->insert([
                'id' => $applicationId,
                'user_id' => $userId,
                'mfi_id' => $mfiId,
                'loan_product_id' => $loanProductId,
                'amount' => $amount,
                'monthly_income' => $monthlyIncome,
                'duration_months' => [6, 12, 18, 24][array_rand([6, 12, 18, 24])],
                'purpose' => $purpose,
                'status' => $status,
                'is_fraud' => $isFraudCase ? 1 : 0,
                'fraud_score' => $fraudScore,
                'description' => $description,
                'applied_at' => $appliedAt,
                'created_at' => $appliedAt,
                'updated_at' => $appliedAt,
            ]);

            $docSuffix = strtoupper(Str::random(6));
            DB::table('application_documents')->insert([
                [
                    'id' => (string) Str::uuid(),
                    'loan_application_id' => $applicationId,
                    'type' => 'nid',
                    'file_path' => $isFraudCase ? "fraud/nid_mismatch_{$docSuffix}.pdf" : "docs/nid_{$docSuffix}.pdf",
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'id' => (string) Str::uuid(),
                    'loan_application_id' => $applicationId,
                    'type' => 'tin',
                    'file_path' => $isFraudCase ? "fraud/forged_tin_{$docSuffix}.pdf" : "docs/tin_{$docSuffix}.pdf",
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }
}
