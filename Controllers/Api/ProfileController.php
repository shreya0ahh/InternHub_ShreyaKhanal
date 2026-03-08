<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    public function show($id = null)
    {
        $userId = $id ?: auth()->id();
        $user = User::withCount(['jobs', 'posts', 'sentConnections', 'receivedConnections'])->findOrFail($userId);
        
        // Combine sent and received connections for total count
        $user->connections_count = $user->sent_connections_count + $user->received_connections_count;
        
        return response()->json($user);
    }

    public function update(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'headline' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'company_size' => 'nullable|string|max:255',
            'skills' => 'nullable|array',
            'experience' => 'nullable|array',
            'education' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update($request->only([
            'name', 'headline', 'bio', 'location', 'industry', 'website', 'company_size', 'skills', 'experience', 'education'
        ]));

        // Calculate profile completion (simplified)
        $fields = ['avatar', 'headline', 'bio', 'location', 'skills', 'experience', 'education'];
        $filled = 1; // name is always there
        foreach ($fields as $field) {
            if ($user->$field) $filled++;
        }
        $user->profile_completion = min(100, (int)(($filled / (count($fields) + 1)) * 100));
        $user->save();

        return response()->json($user);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|max:2048',
        ]);

        $file = $request->file('avatar');
        $path = $file->store('avatars', 'public');
        
        $user = auth()->user();
        $user->avatar = 'http://127.0.0.1:8000/storage/' . $path;
        $user->save();

        return response()->json(['avatar_url' => $user->avatar]);
    }

    public function uploadCover(Request $request)
    {
        $request->validate([
            'cover' => 'required|image|max:3072',
        ]);

        $file = $request->file('cover');
        $path = $file->store('covers', 'public');
        
        $user = auth()->user();
        $user->cover = 'http://127.0.0.1:8000/storage/' . $path;
        $user->save();

        return response()->json(['cover_url' => $user->cover]);
    }
}
