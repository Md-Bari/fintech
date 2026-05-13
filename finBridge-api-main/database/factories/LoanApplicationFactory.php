<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class LoanApplicationFactory extends Factory
{
    public function definition(): array
    {
        $status = fake()->randomElement([
            'pending',
            'approved',
            'rejected',
            'under_review',
            'fraud_rejected',
        ]);

        $isFraud = $status === 'fraud_rejected';
        $appliedAt = fake()->dateTimeBetween('2020-01-01', 'now');

        return [
            'amount' => fake()->numberBetween(5000, 500000),
            'monthly_income' => fake()->numberBetween(8000, 150000),
            'purpose' => fake()->randomElement([
                'Business',
                'Education',
                'Medical',
                'Agriculture',
                'Personal',
                'Emergency',
                'House Repair',
            ]),
            'status' => $status,
            'is_fraud' => $isFraud,
            'fraud_score' => $isFraud
                ? fake()->randomFloat(2, 0.75, 0.99)
                : fake()->randomFloat(2, 0.01, 0.45),
            'description' => fake()->sentence(),
            'applied_at' => $appliedAt,
            'created_at' => $appliedAt,
            'updated_at' => $appliedAt,
        ];
    }
}

