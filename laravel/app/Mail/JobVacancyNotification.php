<?php

namespace App\Mail;

use App\Models\InternshipJob;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class JobVacancyNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $job;

    /**
     * Create a new message instance.
     */
    public function __construct(InternshipJob $job)
    {
        $this->job = $job;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Job Vacancy: ' . $this->job->title . ' at ' . $this->job->company_name,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.job-vacancy',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
