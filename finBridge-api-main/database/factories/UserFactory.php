<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * High-volume demo users with deterministic unique emails.
     */
    public function demoUsers(int $startAt = 0): static
    {
        $counter = $startAt;

        return $this->state(function () use (&$counter) {
            $counter++;

            return [
                'name' => fake()->name(),
                'email' => sprintf('demo_user_%08d@finbridge.test', $counter),
                'phone' => '01' . str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT),
                'role' => 'entrepreneur',
                'status' => 'active',
                'mfi_id' => null,
                'email_verified_at' => now(),
            ];
        });
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
