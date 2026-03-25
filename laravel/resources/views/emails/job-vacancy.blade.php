<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7fafc; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #edf2f7; }
        .logo { font-size: 28px; font-weight: 800; color: #6366f1; text-decoration: none; letter-spacing: -0.5px; }
        .content { padding: 30px 0; }
        .job-card { background-color: #f8faff; border: 1px solid #ebf4ff; padding: 25px; border-radius: 12px; margin: 20px 0; }
        .job-title { font-size: 22px; font-weight: 700; color: #1a202c; margin-bottom: 8px; }
        .company-info { font-size: 16px; color: #4a5568; font-weight: 600; margin-bottom: 15px; }
        .job-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
        .badge { background-color: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; }
        .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-align: center; }
        .footer { font-size: 12px; color: #a0aec0; text-align: center; padding-top: 20px; border-top: 1px solid #edf2f7; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="#" class="logo">InternHub</a>
        </div>
        <div class="content">
            <p>Hello there!</p>
            <p>A new job vacancy has just been posted that might interest you.</p>
            
            <div class="job-card">
                <div class="job-title">{{ $job->title }}</div>
                <div class="company-info">{{ $job->company_name }}</div>
                
                <div class="job-meta">
                    <span class="badge">{{ $job->location }}</span>
                    <span class="badge">{{ $job->type }}</span>
                    <span class="badge">{{ $job->experience_level }}</span>
                </div>
                
                <p style="color: #4a5568; font-size: 14px; margin-bottom: 25px;">
                    {{ Str::limit($job->description, 150) }}
                </p>
                
                <a href="{{ config('app.url') }}/jobs.html" class="btn">View Vacancy Detail</a>
            </div>
            
            <p>Don't miss out on this opportunity. Good luck with your application!</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} InternHub. All rights reserved.<br>
            You are receiving this because you're a registered student on InternHub.
        </div>
    </div>
</body>
</html>
