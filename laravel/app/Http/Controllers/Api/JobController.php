<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InternshipApplication;
use App\Models\InternshipJob;
use App\Models\Notification;
use App\Models\User;
use App\Mail\JobVacancyNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class JobController extends Controller
{
    public function index(Request $request)
    {
        $query = InternshipJob::with('user')->withCount('applications');

        // Hide inactive jobs from students/public feed
        if ($request->user() && $request->user()->type === 'student') {
            $query->where('is_active', true);
        } elseif (!$request->user()) {
             $query->where('is_active', true);
        }

        $query->when($request->filled('type'), function($q) use ($request) {
            $q->where('type', $request->type);
        });
        
        $query->when($request->filled('experience_level'), function($q) use ($request) {
            $q->where('experience_level', $request->experience_level);
        });

        $query->when($request->filled('location'), function($q) use ($request) {
            $q->where('location', 'like', '%' . $request->location . '%');
        });

        // For companies, show only their jobs
        $query->when($request->user() && $request->user()->type === 'company' && $request->has('my_jobs'), function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        });

        $jobs = $query->latest()->get();

        return response()->json($jobs);
    }

    public function store(Request $request)
    {
        if ($request->user()->type !== 'company') {
            return response()->json(['message' => 'Only companies can post jobs'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'location' => 'required|string',
            'type' => 'required|string',
            'experience_level' => 'required|string',
            'description' => 'required|string',
            'skills' => 'nullable|array',
            'salary' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $job = InternshipJob::create([
            'user_id' => $request->user()->id,
            'title' => $request->title,
            'company_name' => $request->user()->name,
            'company_logo' => $request->user()->avatar,
            'location' => $request->location,
            'type' => $request->type,
            'experience_level' => $request->experience_level,
            'salary' => $request->salary,
            'description' => $request->description,
            'skills' => $request->skills,
            'posted_date' => now(),
            'is_active' => true,
        ]);

        // Send Email Notification to all students
        try {
            $students = User::where('type', 'student')->whereNotNull('email')->get();
            if ($students->isNotEmpty()) {
                // 1. Add Internal System Notifications (visible in UI immediately)
                foreach ($students as $student) {
                    try {
                        Notification::create([
                            'user_id' => $student->id,
                            'type' => 'new_vacancy',
                            'message' => 'New Opportunity: ' . $job->title . ' at ' . $job->company_name,
                            'data' => [
                                'job_id' => $job->id,
                                'title' => $job->title,
                                'company' => $job->company_name,
                            ],
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('Failed to create internal notification for student ' . $student->id . ': ' . $e->getMessage());
                    }
                }

                // 2. Send email to each student immediately
                foreach ($students as $student) {
                    try {
                        Mail::to($student->email)->send(new JobVacancyNotification($job));
                        \Log::info('Job vacancy email sent to: ' . $student->email);
                    } catch (\Exception $e) {
                        \Log::error('Failed to send job vacancy email to ' . $student->email . ': ' . $e->getMessage());
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::error('Critical Failure in Job Vacancy Notification System: ' . $e->getMessage(), [
                'job_id' => $job->id,
                'trace' => $e->getTraceAsString()
            ]);
        }

        return response()->json($job, 201);
    }

    public function show($id)
    {
        $job = InternshipJob::with(['user', 'applications' => function($q) {
            $q->where('user_id', auth()->id());
        }])->findOrFail($id);

        return response()->json($job);
    }

    public function destroy(Request $request, $id)
    {
        $job = InternshipJob::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $job->delete();

        return response()->json(['message' => 'Job deleted successfully']);
    }

    public function toggleStatus(Request $request, $id)
    {
        $job = InternshipJob::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $job->is_active = !$job->is_active;
        $job->save();

        return response()->json([
            'message' => 'Job status updated successfully',
            'is_active' => $job->is_active
        ]);
    }

    public function apply(Request $request, $id)
    {
        if ($request->user()->type !== 'student') {
            return response()->json(['message' => 'Only students can apply for jobs'], 403);
        }

        $job = InternshipJob::findOrFail($id);

        // Check if already applied
        $existing = InternshipApplication::where('job_id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already applied for this job'], 422);
        }

        $request->validate([
            'cv_file' => 'required|file|mimes:pdf,doc,docx,jpg,png|max:5120',
            'cover_letter_file' => 'nullable|file|mimes:pdf,doc,docx,jpg,png|max:5120',
            'cover_letter' => 'nullable|string',
        ]);

        $cvPath = $request->file('cv_file')->store('cvs', 'public');
        $coverLetterPath = $request->hasFile('cover_letter_file') 
            ? $request->file('cover_letter_file')->store('cover_letters', 'public') 
            : null;

        $application = InternshipApplication::create([
            'job_id' => $id,
            'user_id' => $request->user()->id,
            'cv_path' => $cvPath,
            'cover_letter' => $request->cover_letter,
            'cover_letter_path' => $coverLetterPath,
            'status' => 'submitted',
            'applied_date' => now(),
        ]);

        // Notify company
        Notification::create([
            'user_id' => $job->user_id,
            'type' => 'new_application',
            'message' => $request->user()->name . ' applied for ' . $job->title,
            'data' => [
                'job_id' => $job->id,
                'application_id' => $application->id,
            ],
        ]);

        return response()->json($application, 201);
    }

    public function applicants(Request $request, $id)
    {
        $job = InternshipJob::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $applications = InternshipApplication::with('user')
            ->where('job_id', $id)
            ->latest()
            ->get();

        return response()->json($applications);
    }

    public function updateApplicationStatus(Request $request, $appId)
    {
        $application = InternshipApplication::with('job')->findOrFail($appId);

        if ($application->job->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:submitted,reviewed,shortlisted,preferred,waitlisted,rejected',
        ]);

        $prevStatus = $application->status;
        $application->status = $request->status;
        $application->save();

        // Notify student if status changed
        if ($prevStatus !== $application->status && $application->status !== 'submitted') {
            $messages = [
                'reviewed' => 'Your application has been reviewed.',
                'shortlisted' => 'Great news! You have been shortlisted.',
                'preferred' => 'You are a preferred candidate for this role!',
                'waitlisted' => 'You have been placed on the waitlist.',
                'rejected' => 'Your application was not selected this time.'
            ];

            Notification::create([
                'user_id' => $application->user_id,
                'type' => 'application_status',
                'message' => $application->job->company_name . ': ' . $messages[$application->status] . ' (' . $application->job->title . ')',
                'data' => [
                    'job_id' => $application->job_id,
                    'app_id' => $application->id,
                    'status' => $application->status,
                ],
            ]);
        }

        return response()->json($application);
    }

    public function getAllApplicants(Request $request)
    {
        if ($request->user()->type !== 'company') {
            return response()->json(['message' => 'Only companies can view all applicants'], 403);
        }

        $myJobIds = InternshipJob::where('user_id', $request->user()->id)->pluck('id');

        $applications = InternshipApplication::with('user', 'job')
            ->whereIn('job_id', $myJobIds)
            ->latest()
            ->get();

        return response()->json($applications);
    }

    public function myApplications(Request $request)
    {
        if ($request->user()->type !== 'student') {
            return response()->json(['message' => 'Only students can have applications'], 403);
        }

        $applications = InternshipApplication::with('job')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($applications);
    }
}
