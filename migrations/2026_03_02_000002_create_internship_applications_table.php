<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('internship_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('internship_jobs')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('cv_path')->nullable();
            $table->text('cover_letter')->nullable();
            $table->enum('status', ['submitted', 'reviewed', 'shortlisted', 'rejected'])->default('submitted');
            $table->timestamp('applied_date')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('internship_applications');
    }
};
