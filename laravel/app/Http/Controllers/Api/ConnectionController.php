<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Connection;
use App\Models\User;
use Illuminate\Http\Request;

class ConnectionController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->query('q');
        $location = $request->query('location');
        $type = $request->query('type');

        $users = User::query();

        if ($query) {
            $users->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('headline', 'like', "%{$query}%")
                  ->orWhere('bio', 'like', "%{$query}%")
                  ->orWhere('skills', 'like', "%{$query}%");
            });
        }

        if ($location) {
            $users->where('location', 'like', "%{$location}%");
        }

        if ($type) {
            $users->where('type', $type);
        }

        return response()->json($users->limit(20)->get());
    }

    public function suggestions(Request $request)
    {
        $userId = $request->user()->id;
        
        $sent = Connection::where('sender_id', $userId)->pluck('receiver_id')->toArray();
        $received = Connection::where('receiver_id', $userId)->pluck('sender_id')->toArray();
        $connectedIds = array_unique(array_merge($sent, $received, [$userId]));

        $suggestions = User::whereNotIn('id', $connectedIds)
            ->limit(15)
            ->get();

        return response()->json($suggestions);
    }

    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $connections = Connection::with(['sender', 'receiver'])
            ->where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->get();

        return response()->json($connections);
    }

    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
        ]);

        $senderId = $request->user()->id;
        $receiverId = $request->receiver_id;

        if ($senderId == $receiverId) {
            return response()->json(['message' => 'You cannot connect with yourself'], 422);
        }

        $existing = Connection::where(function($q) use ($senderId, $receiverId) {
            $q->where('sender_id', $senderId)->where('receiver_id', $receiverId);
        })->orWhere(function($q) use ($senderId, $receiverId) {
            $q->where('sender_id', $receiverId)->where('receiver_id', $senderId);
        })->first();

        if ($existing) {
            return response()->json(['message' => 'Connection already exists'], 422);
        }

        $connection = Connection::create([
            'sender_id' => $senderId,
            'receiver_id' => $receiverId,
            'status' => 'pending',
        ]);

        return response()->json($connection, 201);
    }

    public function update(Request $request, $id)
    {
        $connection = Connection::findOrFail($id);

        if ($connection->receiver_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:accepted,rejected',
        ]);

        $connection->status = $request->status;
        $connection->save();

        return response()->json($connection);
    }

    public function destroy(Request $request, $id)
    {
        $connection = Connection::findOrFail($id);

        // Only the sender or receiver can delete/cancel a connection
        if ($connection->sender_id !== $request->user()->id && $connection->receiver_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $connection->delete();

        return response()->json(['message' => 'Connection removed successfully']);
    }
}
