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
        Schema::table('likes', function (Blueprint $table) {
            // Check if foreign key exists before dropping
            // $table->dropForeign(['post_id']);
            // $table->dropUnique(['post_id', 'user_id']);
            
            if (!Schema::hasColumn('likes', 'comment_id')) {
                $table->unsignedBigInteger('post_id')->nullable()->change();
                $table->foreignId('comment_id')->nullable()->after('post_id')->constrained('comments')->onDelete('cascade');
            }
            
            // $table->foreign('post_id')->references('id')->on('posts')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('likes', function (Blueprint $table) {
            $table->dropForeign(['comment_id']);
            $table->dropColumn('comment_id');
            $table->foreignId('post_id')->nullable(false)->change();
            $table->unique(['post_id', 'user_id']);
        });
    }
};
