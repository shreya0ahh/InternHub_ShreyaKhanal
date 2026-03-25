<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InternshipJob extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'company_name',
        'company_logo',
        'location',
        'type',
        'experience_level',
        'salary',
        'description',
        'skills',
        'posted_date',
        'is_active',
    ];

    protected $casts = [
        'skills' => 'array',
        'posted_date' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(InternshipApplication::class, 'job_id');
    }
}
