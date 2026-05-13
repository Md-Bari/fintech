<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MassiveDemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        $total = max(1, (int) env('DEMO_USER_COUNT', 1000000));
        $chunkSize = max(100, (int) env('DEMO_USER_CHUNK', 5000));
        $startAt = $this->resolveStartIndex();
        $targetIndex = $startAt + $total;

        $inserted = $startAt;

        $this->command?->info("Starting from demo index {$startAt}, target index {$targetIndex}");

        while ($inserted < $targetIndex) {
            $currentChunk = min($chunkSize, $targetIndex - $inserted);

            User::factory()
                ->count($currentChunk)
                ->demoUsers($inserted)
                ->create();

            $inserted += $currentChunk;

            $createdThisRun = $inserted - $startAt;

            if ($createdThisRun % 50000 === 0 || $inserted === $targetIndex) {
                $this->command?->info("Inserted {$createdThisRun}/{$total} demo users in this run");
            }
        }
    }

    private function resolveStartIndex(): int
    {
        $lastDemoEmail = DB::table('users')
            ->where('email', 'like', 'demo_user_%@finbridge.test')
            ->orderByDesc('email')
            ->value('email');

        if (!$lastDemoEmail) {
            return 0;
        }

        if (!preg_match('/^demo_user_(\d{8})@finbridge\.test$/', $lastDemoEmail, $matches)) {
            return 0;
        }

        return (int) $matches[1];
    }
}
