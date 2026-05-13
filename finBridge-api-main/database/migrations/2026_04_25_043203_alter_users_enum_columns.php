<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!$this->isPostgres()) {
            return;
        }

        // 1. Drop default first
        DB::statement("ALTER TABLE users ALTER COLUMN role DROP DEFAULT");
        DB::statement("ALTER TABLE users ALTER COLUMN status DROP DEFAULT");

        // 2. Convert to ENUM
        DB::statement("
            ALTER TABLE users 
            ALTER COLUMN role TYPE user_role_enum 
            USING role::text::user_role_enum
        ");

        DB::statement("
            ALTER TABLE users 
            ALTER COLUMN status TYPE app_status_enum 
            USING status::text::app_status_enum
        ");

        // 3. Re-add default (as ENUM)
        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'entrepreneur'");
        DB::statement("ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active'");
    }

    public function down(): void
    {
        if (!$this->isPostgres()) {
            return;
        }

        DB::statement("ALTER TABLE users ALTER COLUMN role DROP DEFAULT");
        DB::statement("ALTER TABLE users ALTER COLUMN status DROP DEFAULT");

        DB::statement("ALTER TABLE users ALTER COLUMN role TYPE varchar");
        DB::statement("ALTER TABLE users ALTER COLUMN status TYPE varchar");

        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'borrower'");
        DB::statement("ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active'");
    }

    private function isPostgres(): bool
    {
        return DB::connection()->getDriverName() === 'pgsql';
    }
};
