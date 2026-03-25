<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'type',
        'avatar',
        'headline',
        'bio',
        'location',
        'profile_completion',
        'industry',
        'website',
        'company_size',
        'cover',
        'github',
        'portfolio',
        'skills',
        'experience',
        'education',
        'projects',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'skills' => 'array',
            'experience' => 'array',
            'education' => 'array',
            'projects' => 'array',
        ];
    }

    public function jobs()
    {
        return $this->hasMany(InternshipJob::class);
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function sentConnections()
    {
        return $this->hasMany(Connection::class, 'sender_id')->where('status', 'accepted');
    }

    public function receivedConnections()
    {
        return $this->hasMany(Connection::class, 'receiver_id')->where('status', 'accepted');
    }
}
