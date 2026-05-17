<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mfi_ai_rankings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('mfi_id');
            $table->string('mfi_name');
            $table->uuid('batch_id')->index();

            $table->decimal('performance_score', 8, 2)->default(0);
            $table->integer('rank_position')->default(0)->index();
            $table->unsignedTinyInteger('star_rating')->default(3)->index();
            $table->integer('recommended_account_count')->default(0);

            $table->jsonb('metrics')->nullable();
            $table->text('ai_summary')->nullable();

            $table->string('approval_status')->default('pending')->index();
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();

            $table->foreign('mfi_id')->references('id')->on('mfi_institutions')->cascadeOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['batch_id', 'mfi_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mfi_ai_rankings');
    }
};
