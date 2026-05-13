<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('loan_applications', 'fraud_reason')) {
            Schema::table('loan_applications', function (Blueprint $table) {
                $table->text('fraud_reason')->nullable()->after('fraud_score');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('loan_applications', 'fraud_reason')) {
            Schema::table('loan_applications', function (Blueprint $table) {
                $table->dropColumn('fraud_reason');
            });
        }
    }
};
