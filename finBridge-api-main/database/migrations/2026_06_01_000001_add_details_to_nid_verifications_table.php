<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('nid_verifications', 'details')) {
            Schema::table('nid_verifications', function (Blueprint $table): void {
                $table->json('details')->nullable()->after('raw_text');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('nid_verifications', 'details')) {
            Schema::table('nid_verifications', function (Blueprint $table): void {
                $table->dropColumn('details');
            });
        }
    }
};
