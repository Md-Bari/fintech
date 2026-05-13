<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('rejected_loan_application')) {
            Schema::create('rejected_loan_application', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('loan_application_id')->index();
                $table->decimal('fraud_rate', 5, 2);
                $table->text('review_report');
                $table->json('analysis_payload')->nullable();
                $table->string('review_source', 32)->default('gemini');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('rejected_loan_application');
    }
};

