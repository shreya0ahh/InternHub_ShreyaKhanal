<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\User;
use App\Models\Connection;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        // Get users from messages
        $messagedUserIds = Message::where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->select(DB::raw('DISTINCT CASE WHEN sender_id = ' . (int)$userId . ' THEN receiver_id ELSE sender_id END as contact_id'))
            ->get()
            ->pluck('contact_id');

        // Get users from accepted connections
        $connectedUserIds = Connection::where(function($q) use ($userId) {
                $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
            })
            ->where('status', 'accepted')
            ->get()
            ->map(function($c) use ($userId) {
                return $c->sender_id == $userId ? $c->receiver_id : $c->sender_id;
            });

        $allContactIds = collect($messagedUserIds)->concat($connectedUserIds)->unique();

        $users = User::whereIn('id', $allContactIds)->get();

        // Add last message preview to each user
        $users->map(function ($user) use ($userId) {
            $lastMessage = Message::where(function ($q) use ($userId, $user) {
                $q->where('sender_id', $userId)->where('receiver_id', $user->id);
            })->orWhere(function ($q) use ($userId, $user) {
                $q->where('sender_id', $user->id)->where('receiver_id', $userId);
            })->latest()->first();

            $user->last_message = $lastMessage;
            return $user;
        });

        return response()->json($users);
    }

    public function show(Request $request, $id)
    {
        $userId = $request->user()->id;
        $contactId = $id;

        $messages = Message::where(function ($q) use ($userId, $contactId) {
            $q->where('sender_id', $userId)->where('receiver_id', $contactId);
        })->orWhere(function ($q) use ($userId, $contactId) {
            $q->where('sender_id', $contactId)->where('receiver_id', $userId);
        })->orderBy('created_at', 'asc')->get();

        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content' => 'required|string',
        ]);

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $request->receiver_id,
            'content' => $request->content,
            'read_status' => false,
        ]);

        return response()->json($message, 201);
    }

    public function markAsRead(Request $request, $id)
    {
        $userId = $request->user()->id;
        $contactId = $id;

        Message::where('sender_id', $contactId)
            ->where('receiver_id', $userId)
            ->where('read_status', false)
            ->update(['read_status' => true]);

        return response()->json(['message' => 'Messages marked as read']);
    }

    public function unreadCount(Request $request)
    {
        $count = Message::where('receiver_id', $request->user()->id)
            ->where('read_status', false)
            ->count();

        return response()->json(['count' => $count]);
    }
}
