<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FeedController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\ConnectionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\MessageController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'forgotPassword']);
Route::post('/reset-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'resetPassword']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile/{id?}', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::post('/profile/cover', [ProfileController::class, 'uploadCover']);

    // Jobs & Applications
    Route::get('/jobs', [JobController::class, 'index']);
    Route::post('/jobs', [JobController::class, 'store']);
    Route::get('/jobs/{id}', [JobController::class, 'show']);
    Route::delete('/jobs/{id}', [JobController::class, 'destroy']);
    Route::patch('/jobs/{id}/toggle-status', [JobController::class, 'toggleStatus']);
    Route::post('/jobs/{id}/apply', [JobController::class, 'apply']);
    Route::get('/applicants', [JobController::class, 'getAllApplicants']);
    Route::get('/jobs/{id}/applicants', [JobController::class, 'applicants']);
    Route::get('/applications', [JobController::class, 'myApplications']);
    Route::put('/applications/{id}/status', [JobController::class, 'updateApplicationStatus']);

    // Social Feed
    Route::get('/feed', [FeedController::class, 'index']);
    Route::get('/feed/search', [FeedController::class, 'search']);
    Route::get('/feed/posts/{id}', [FeedController::class, 'show']);
    Route::post('/feed', [FeedController::class, 'store']);
    Route::post('/posts/{id}/like', [FeedController::class, 'like']);
    Route::post('/posts/{id}/comment', [FeedController::class, 'comment']);
    Route::post('/comments/{id}/like', [FeedController::class, 'likeComment']);
    Route::delete('/feed/posts/{id}', [FeedController::class, 'destroy']);
    Route::delete('/comments/{id}', [FeedController::class, 'destroyComment']);

    // Connections
    Route::get('/connections', [ConnectionController::class, 'index']);
    Route::get('/connections/suggestions', [ConnectionController::class, 'suggestions']);
    Route::get('/users/search', [ConnectionController::class, 'search']);
    Route::post('/connections', [ConnectionController::class, 'store']);
    Route::put('/connections/{id}', [ConnectionController::class, 'update']);
    Route::delete('/connections/{id}', [ConnectionController::class, 'destroy']);

    // Messages
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/unread/count', [MessageController::class, 'unreadCount']);
    Route::get('/messages/{id}', [MessageController::class, 'show']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::put('/messages/{id}/read', [MessageController::class, 'markAsRead']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);


});
