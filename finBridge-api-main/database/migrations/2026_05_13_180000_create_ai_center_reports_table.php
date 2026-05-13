<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_center_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('mfi_id')->nullable()->index();
            $table->uuid('generated_by')->nullable()->index();
            $table->string('period', 20);
            $table->date('from_date');
            $table->date('to_date');
            $table->string('report_name', 200);
            $table->json('summary');
            $table->json('payload');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_center_reports');
    }
};
