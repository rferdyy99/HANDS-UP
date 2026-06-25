<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordOTP extends Mailable
{
    use Queueable, SerializesModels;

    // 1. Daftarkan variabel public agar otomatis terbaca di file Blade (HTML Email)
    public $token;

    /**
     * Create a new message instance.
     */
    public function __construct($token)
    {
        // 2. Tangkap token yang dikirim dari AuthController
        $this->token = $token;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            // 3. Ubah subjek email di sini
            subject: 'Token Pemulihan Kata Sandi',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            // 4. Arahkan view ke folder resources/views/emails/reset_password_otp.blade.php
            view: 'emails.reset_password_otp',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}