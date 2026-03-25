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
        $userId = auth()->id();
        $posts = Post::with([
            'user',
            'likes' => function($q) use ($userId) {
                $q->where('user_id', $userId);
            },
            'comments' => function($q) use ($userId) {
                $q->whereNull('parent_id')
                  ->with([
                      'user',
                      'likes' => function($sq) use ($userId) {
                          $sq->where('user_id', $userId);
                      },
                      'replies' => function($sq) use ($userId) {
                          $sq->with([
                              'user',
                              'likes' => function($ssq) use ($userId) {
                                  $ssq->where('user_id', $userId);
                              }
                          ])->withCount('likes');
                      }
                  ])
                  ->withCount(['likes', 'replies'])
                  ->latest();
            }
        ])
        ->withCount(['likes', 'comments'])
        ->latest()
        ->get();

        return response()->json($posts);
    }

    public function show($id)
    {
        $userId = auth()->id();
        $post = Post::with([
            'user',
            'likes' => function($q) use ($userId) {
                $q->where('user_id', $userId);
            },
            'comments' => function($q) use ($userId) {
                $q->whereNull('parent_id')
                  ->with([
                      'user',
                      'likes' => function($sq) use ($userId) {
                          $sq->where('user_id', $userId);
                      },
                      'replies' => function($sq) use ($userId) {
                          $sq->with([
                              'user',
                              'likes' => function($ssq) use ($userId) {
                                  $ssq->where('user_id', $userId);
                              }
                          ])->withCount('likes');
                      }
                  ])
                  ->withCount(['likes', 'replies'])
                  ->latest();
            }
        ])
        ->withCount(['likes', 'comments'])
        ->findOrFail($id);

        return response()->json($post);
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

    public function likeComment($id)
    {
        $comment = Comment::findOrFail($id);
        $userId = auth()->id();

        $like = Like::where('comment_id', $id)->where('user_id', $userId)->first();

        if ($like) {
            $like->delete();
            return response()->json(['liked' => false]);
        } else {
            Like::create([
                'comment_id' => $id,
                'user_id' => $userId,
            ]);
            return response()->json(['liked' => true]);
        }
    }

    public function comment(Request $request, $id)
    {
        $request->validate([
            'content' => 'required|string',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $comment = Comment::create([
            'post_id' => $id,
            'user_id' => auth()->id(),
            'content' => $request->content,
            'parent_id' => $request->parent_id,
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

    public function search(Request $request)
    {
        $query = $request->query('q');

        if (!$query) {
            return response()->json([]);
        }

        $posts = Post::with(['user', 'comments.user', 'likes' => function($q) {
            $q->where('user_id', auth()->id());
        }])
        ->withCount(['likes', 'comments'])
        ->where('content', 'like', "%{$query}%")
        ->latest()
        ->get();

        return response()->json($posts);
    }

    public function destroyComment(Request $request, $id)
    {
        $comment = Comment::findOrFail($id);

        // Check if the authenticated user is the owner of the comment
        if ($comment->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }
}
