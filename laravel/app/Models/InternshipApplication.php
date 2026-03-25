<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternshipApplication extends Model
{
    protected $fillable = [
        'job_id',
        'user_id',
        'cv_path',
        'cover_letter',
        'cover_letter_path',
        'status',
        'applied_date',
    ];

    protected $casts = [
        'applied_date' => 'datetime',
    ];

    public function job(): BelongsTo
    {
        return $this->belongsTo(InternshipJob::class, 'job_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
