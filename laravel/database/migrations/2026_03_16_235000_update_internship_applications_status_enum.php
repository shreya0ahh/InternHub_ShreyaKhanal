<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL/MariaDB, we can use a raw statement to alter the enum
        DB::statement("ALTER TABLE internship_applications MODIFY COLUMN status ENUM('submitted', 'reviewed', 'shortlisted', 'preferred', 'waitlisted', 'rejected') DEFAULT 'submitted'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE internship_applications MODIFY COLUMN status ENUM('submitted', 'reviewed', 'shortlisted', 'rejected') DEFAULT 'submitted'");
    }
};
