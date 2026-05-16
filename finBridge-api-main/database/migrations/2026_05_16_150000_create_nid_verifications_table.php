<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('nid_verifications')) {
            return;
        }

        Schema::create('nid_verifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('loan_application_id')->unique();
            $table->string('customer_unique_id')->nullable();
            $table->string('verification_status')->default('not_verified');
            $table->boolean('matched_reference')->default(false);
            $table->decimal('similarity_score', 6, 2)->nullable();
            $table->string('nid_number')->nullable();
            $table->string('extracted_name')->nullable();
            $table->decimal('ocr_confidence', 6, 2)->nullable();
            $table->text('uploaded_image_url')->nullable();
            $table->text('reference_image_url')->nullable();
            $table->longText('raw_text')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('nid_verifications')) {
            return;
        }

        Schema::dropIfExists('nid_verifications');
    }
};
