<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BulkMfiAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $targetCount = (int) env('SEED_MFI_ACCOUNTS_COUNT', 10000);
        $chunkSize = 500;

        if ($targetCount <= 0) {
            $this->command?->warn('SEED_MFI_ACCOUNTS_COUNT is <= 0, skipping bulk MFI account seeding.');
            return;
        }

        $passwordHash = Hash::make('password');
        $now = now();

        $ownerId = DB::table('users')->where('email', 'admin@finbridge.com')->value('id');
        if (!$ownerId) {
            $ownerId = (string) Str::uuid();
            DB::table('users')->insert([
                'id' => $ownerId,
                'mfi_id' => null,
                'name' => 'Platform Admin',
                'email' => 'admin@finbridge.com',
                'phone' => '01700000000',
                'password' => $passwordHash,
                'role' => 'platform_admin',
                'status' => 'active',
                'email_verified_at' => $now,
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $maxIndex = DB::table('users')
            ->where('email', 'like', 'mfi.admin.%@demo.com')
            ->selectRaw("MAX(CAST(SUBSTRING(email FROM 'mfi.admin.([0-9]+)@demo.com') AS BIGINT)) AS max_index")
            ->value('max_index');

        $startIndex = $maxIndex ? (int) $maxIndex : 0;

        for ($i = 0; $i < $targetCount; $i += $chunkSize) {
            $limit = min($chunkSize, $targetCount - $i);
            $mfiRows = [];
            $userRows = [];
            $seqStart = $startIndex + $i + 1;

            for ($j = 0; $j < $limit; $j++) {
                $seq = $seqStart + $j;
                $mfiId = (string) Str::uuid();
                $userId = (string) Str::uuid();

                $mfiRows[] = [
                    'id' => $mfiId,
                    'name' => "Demo MFI {$seq}",
                    'email' => "mfi.{$seq}@demo.com",
                    'phone' => '018' . str_pad((string) $seq, 8, '0', STR_PAD_LEFT),
                    'owner_id' => $ownerId,
                    'status' => 'active',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $userRows[] = [
                    'id' => $userId,
                    'mfi_id' => $mfiId,
                    'name' => "MFI Admin {$seq}",
                    'email' => "mfi.admin.{$seq}@demo.com",
                    'phone' => '017' . str_pad((string) $seq, 8, '0', STR_PAD_LEFT),
                    'password' => $passwordHash,
                    'role' => 'mfi_admin',
                    'status' => 'active',
                    'email_verified_at' => $now,
                    'remember_token' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DB::beginTransaction();
            try {
                DB::table('mfi_institutions')->insert($mfiRows);
                DB::table('users')->insert($userRows);
                DB::commit();
            } catch (\Throwable $e) {
                DB::rollBack();
                throw $e;
            }

            $this->command?->info('Seeded MFI accounts: ' . ($i + $limit) . '/' . $targetCount);
        }

        $this->command?->info("Bulk MFI account seeding complete. Added {$targetCount} MFI admin accounts.");
    }
}

