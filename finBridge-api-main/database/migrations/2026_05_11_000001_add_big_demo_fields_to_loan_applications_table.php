<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            if (!Schema::hasColumn('loan_applications', 'monthly_income')) {
                $table->decimal('monthly_income', 12, 2)->default(0)->after('amount');
            }

            if (!Schema::hasColumn('loan_applications', 'is_fraud')) {
                $table->boolean('is_fraud')->default(false)->after('status');
            }

            if (!Schema::hasColumn('loan_applications', 'fraud_score')) {
                $table->decimal('fraud_score', 5, 2)->default(0)->after('is_fraud');
            }

            if (!Schema::hasColumn('loan_applications', 'description')) {
                $table->text('description')->nullable()->after('fraud_score');
            }

            if (!Schema::hasColumn('loan_applications', 'applied_at')) {
                $table->timestamp('applied_at')->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $columns = [];

            foreach (['monthly_income', 'is_fraud', 'fraud_score', 'description', 'applied_at'] as $column) {
                if (Schema::hasColumn('loan_applications', $column)) {
                    $columns[] = $column;
                }
            }

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};

