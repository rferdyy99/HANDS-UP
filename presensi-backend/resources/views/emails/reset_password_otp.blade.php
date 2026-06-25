<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Pemulihan Kata Sandi</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 40px 20px;
            color: #334155;
        }
        .email-wrapper {
            max-width: 500px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }
        .email-header {
            background-color: #1e293b;
            padding: 24px;
            text-align: center;
        }
        .email-header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 20px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .email-body {
            padding: 32px 24px;
        }
        .email-body p {
            line-height: 1.6;
            margin: 0 0 16px 0;
            font-size: 15px;
        }
        .token-container {
            background-color: #eff6ff;
            border: 2px dashed #93c5fd;
            border-radius: 12px;
            padding: 24px 20px;
            text-align: center;
            margin: 30px 0;
        }
        .token-text {
            font-size: 36px;
            font-weight: 900;
            letter-spacing: 10px;
            color: #2563eb;
            margin: 0;
        }
        .email-footer {
            background-color: #f8fafc;
            padding: 20px 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .email-footer p {
            margin: 0;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <h1>Sistem Presensi</h1>
        </div>
        
        <div class="email-body">
            <p>Halo,</p>
            <p>Kami menerima permintaan untuk melakukan reset kata sandi pada akun Anda. Gunakan 6-digit kode verifikasi (OTP) di bawah ini untuk melanjutkan proses pemulihan:</p>
            
            <div class="token-container">
                <p class="token-text">{{ $token }}</p>
            </div>
            
            <p style="font-size: 13px; color: #64748b; background-color: #f8fafc; padding: 14px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <strong>Penting:</strong> Kode ini bersifat rahasia dan hanya berlaku selama <strong>15 menit</strong>. Jangan bagikan kode ini kepada siapa pun. Jika Anda tidak pernah meminta reset kata sandi, abaikan email ini demi keamanan akun Anda.
            </p>
        </div>
        
        <div class="email-footer">
            <p>&copy; {{ date('Y') }} Sistem Presensi Akademik. Hak Cipta Dilindungi.</p>
            <p style="margin-top: 8px;">Pesan ini dikirim secara otomatis oleh sistem, mohon untuk tidak membalas email ini.</p>
        </div>
    </div>
</body>
</html>