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
        Schema::create('internship_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // The company user who posted it
            $table->string('title');
            $table->string('company_name')->nullable();
            $table->string('company_logo')->nullable();
            $table->string('location');
            $table->string('type'); // Internship, Full-time, etc.
            $table->string('experience_level');
            $table->string('salary')->nullable();
            $table->text('description');
            $table->json('skills')->nullable();
            $table->timestamp('posted_date')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('internship_jobs');
    }
};
