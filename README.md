# 🎓 Hands Up - Sistem Presensi Akademik Terpadu

[![GitHub Repository](https://img.shields.io/badge/GitHub-HandsUp--Presensi-blue?logo=github)](https://github.com/alwznx/HandsUp-Presensi)

**Hands Up** adalah platform manajemen kehadiran sekolah berbasis web yang mengintegrasikan teknologi **Geofencing (GPS)** dan **Autentikasi Wajah (Face Capture)**. Sistem ini dirancang untuk mendigitalisasi proses validasi presensi oleh guru, mencegah kecurangan siswa, dan memberikan wawasan analitik secara *real-time*.

---

## ✨ Fitur Utama

| Role | Fitur |
|------|-------|
| **👨‍💼 Admin** | Dashboard analitik, kelola data master (siswa, guru, kelas), import/export Excel, pengaturan sekolah |
| **👩‍🏫 Guru** | Validasi presensi siswa (2 tahap), *bulk validation*, *lock data*, rekap presensi |
| **👨‍🎓 Siswa** | Presensi dengan geofencing & *selfie*, pengajuan izin/sakit, riwayat presensi |

### 🤖 Automation Engine (Cron Jobs)
- **Auto-Draft**: Membuat draf presensi harian secara otomatis.
- **Auto-Validate**: Mengesahkan presensi *pending* jika guru lupa.
- **Auto-Alpha & Lock**: Mengunci data dan memberikan status Alpha bagi siswa yang tidak absen setelah jam operasional.

---

## 🛠️ Teknologi yang Digunakan

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React.js + Vite + Tailwind CSS + Recharts + Leaflet.js |
| **Backend** | Laravel 12 (RESTful API) |
| **Database** | MySQL / MariaDB |
| **Autentikasi** | Laravel Sanctum |

---

## ⚙️ Prasyarat Sistem

Pastikan komputer Anda telah terinstall:
- [PHP](https://www.php.net/) >= 8.1
- [Composer](https://getcomposer.org/)
- [Node.js](https://nodejs.org/) (LTS version)
- [MySQL](https://www.mysql.com/) (XAMPP / Laragon)
- [Git](https://git-scm.com/) (opsional, untuk clone)

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

Ikuti langkah-langkah berikut secara berurutan.

### 1. Clone Repository
```bash
git clone https://github.com/alwznx/HandsUp-Presensi.git
cd HandsUp-Presensi
```
Atau download ZIP dan ekstrak.

---

### 2. Setup Database
1. Nyalakan **Apache** dan **MySQL** di XAMPP / Laragon.
2. Buka phpMyAdmin: `http://localhost/phpmyadmin`
3. Buat database baru dengan nama: `db_web_presensi`
4. Import file: `db_web_presensi.sql` pada zip tugas.

---

### 3. Setup Backend (Laravel)

Buka terminal/CMD di folder **`presensi-backend`**:

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Install dependencies PHP
composer install

# 3. Generate application key (WAJIB!)
php artisan key:generate

# 4. Edit file .env - sesuaikan dengan database Anda
#    DB_DATABASE=db_web_presensi
#    DB_USERNAME=root
#    DB_PASSWORD=

# 5. Buat symbolic link untuk akses file foto
php artisan storage:link

# 6. Jalankan server backend
php artisan serve
```
> Backend akan berjalan di **`http://localhost:8000`**

---

### 4. Setup Frontend (React)

Buka **terminal baru** di folder **`presensi-frontend`**:

```bash
# 1. Install dependencies Node.js
npm install

# 2. Jalankan server frontend
npm run dev
```
> Frontend akan berjalan di **`http://localhost:5173`**

---

### 5. Jalankan Automation Engine (PENTING!)

Buka **terminal ketiga** di folder **`presensi-backend`**:
```bash
php artisan schedule:work
```
> ⚠️ Biarkan terminal ini tetap **terbuka** selama aplikasi berjalan. Tanpa ini, presensi harian tidak akan otomatis dibuat.

---

### 6. Akses Aplikasi

Buka browser dan akses: **`http://localhost:5173`**

---

## 👥 Akun Default (Seeder)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@sekolah.com` | `password123` |
| **Guru** | `guru@sekolah.com` | `password123` |
| **Siswa** | `siswa@sekolah.com` | `password123` |

---

## 🧭 Panduan Penggunaan Singkat

### Untuk **Siswa**
1. Login dengan akun siswa.
2. Pada halaman utama, pastikan GPS dan kamera aktif.
3. Klik tombol **Presensi Masuk** → sistem akan memverifikasi lokasi dan wajah.
4. Untuk izin/sakit, buka menu **Pengajuan Izin** dan upload bukti.

### Untuk **Guru**
1. Login dengan akun guru.
2. Buka menu **Validasi Presensi**.
3. Lihat draf presensi siswa → klik **Setujui** atau **Tolak**.
4. Gunakan *Bulk Validation* untuk mempercepat proses.

### Untuk **Admin**
1. Login dengan akun admin.
2. Buka menu **Kelola Data Master** (Siswa, Guru, Kelas).
3. Atur **Pengaturan Sekolah** (lokasi geofencing & jam operasional).
4. Pantau dashboard analitik.

---

## 🔧 Troubleshooting Umum

| Masalah | Solusi |
|---------|--------|
| **MissingAppKeyException** | Jalankan `php artisan key:generate` di folder `presensi-backend` |
| **CORS Error (Access-Control-Allow-Origin)** | Pastikan `bootstrap/app.php` memiliki `$middleware->prepend(HandleCors::class)` |
| **Error 500 saat Lupa Password** | Di `.env` ubah `MAIL_MAILER=SMTP` agar kode reset password terkirim ke email pengguna asli. |
| **Foto / Gambar Tidak Muncul** | Hal ini wajar karena kami tidak upload gambar gambar riwayat kami, Jalankan `php artisan storage:link` lalu upload foto profile, presensi, dan izin baru |
| **Grafik Dashboard Kosong** | Pastikan `php artisan schedule:work` berjalan di terminal terpisah |
| **Port 8000 sudah digunakan** | Jalankan `php artisan serve --port=8001` |
| **Port 5173 sudah digunakan** | Vite akan otomatis memilih port berikutnya (5174, dst) |

---

## 📁 Struktur Folder

```
HandsUp-Presensi/
├── presensi-backend/          # Laravel 12 Backend API
│   ├── app/                   # Models, Controllers
│   ├── bootstrap/             # CORS config (app.php)
│   ├── config/                # Database, CORS, etc
│   ├── database/              # Migrations & Seeders
│   ├── routes/                # API routes
│   ├── storage/               # File uploads (foto, bukti izin)
│   └── .env.example           # Template environment
│
├── presensi-frontend/         # React.js Frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md                  # Dokumen ini
```

---

## 📞 Kontributor

**Dikembangkan oleh:**  
Kelompok 1 - Pemrograman Web  
Pendidikan Teknologi Informasi  
Universitas Negeri Surabaya

**Tahun Akademik:** 2025/2026

---
