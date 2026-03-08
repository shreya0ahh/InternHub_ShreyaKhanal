<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FeedController extends Controller
{
    public function index()
    {
        $posts = Post::with(['user', 'comments.user', 'likes' => function($q) {
            $q->where('user_id', auth()->id());
        }])
        ->withCount(['likes', 'comments'])
        ->latest()
        ->get();

        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required|string',
            'image' => 'nullable|image|max:5120',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('posts', 'public');
        }

        $post = Post::create([
            'user_id' => $request->user()->id,
            'content' => $request->content,
            'image_path' => $imagePath,
        ]);

        return response()->json($post->load('user'), 201);
    }

    public function like($id)
    {
        $post = Post::findOrFail($id);
        $userId = auth()->id();

        $like = Like::where('post_id', $id)->where('user_id', $userId)->first();

        if ($like) {
            $like->delete();
            return response()->json(['liked' => false]);
        } else {
            Like::create([
                'post_id' => $id,
                'user_id' => $userId,
            ]);
            return response()->json(['liked' => true]);
        }
    }

    public function comment(Request $request, $id)
    {
        $request->validate([
            'content' => 'required|string',
        ]);

        $comment = Comment::create([
            'post_id' => $id,
            'user_id' => auth()->id(),
            'content' => $request->content,
        ]);

        return response()->json($comment->load('user'), 201);
    }

    public function destroy($id)
    {
        $post = Post::findOrFail($id);

        // Check if the authenticated user is the owner
        if ($post->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $post->delete();

        return response()->json(['message' => 'Post deleted successfully']);
    }
}
