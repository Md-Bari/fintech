<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(InitialSeeder::class);
        $this->call(HundredDemoDataSeeder::class);

        if (env('SEED_MFI_ACCOUNTS', false)) {
            $this->call(BulkMfiAccountsSeeder::class);
        }

        if (env('SEED_LOAN_INSIGHTS_DEMO', false)) {
            $this->call(LoanInsightsDemoSeeder::class);
        }
    }
}
