<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InitialSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedPlatformAdmin();
        $this->seedSubscriptionPlan('trial', 0);
        $this->seedSubscriptionPlan('pro', 999);
    }

    private function seedPlatformAdmin(): void
    {
        $existing = DB::table('users')
            ->where('email', 'admin@finbridge.com')
            ->first();

        $data = [
            'name' => 'Platform Admin',
            'phone' => '01700000000',
            'password' => bcrypt('password'),
            'role' => 'platform_admin',
            'status' => 'active',
            'updated_at' => now(),
        ];

        if ($existing) {
            DB::table('users')
                ->where('id', $existing->id)
                ->update($data);

            return;
        }

        DB::table('users')->insert([
            ...$data,
            'id' => (string) Str::uuid(),
            'email' => 'admin@finbridge.com',
            'created_at' => now(),
        ]);
    }

    private function seedSubscriptionPlan(string $name, int $priceBdt): void
    {
        $existing = DB::table('subscription_plans')
            ->where('name', $name)
            ->first();

        $data = [
            'price_bdt' => $priceBdt,
            'status' => 'active',
            'updated_at' => now(),
        ];

        if ($existing) {
            DB::table('subscription_plans')
                ->where('id', $existing->id)
                ->update($data);

            return;
        }

        DB::table('subscription_plans')->insert([
            ...$data,
            'id' => (string) Str::uuid(),
            'name' => $name,
            'created_at' => now(),
        ]);
    }
}
