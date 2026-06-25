<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Presensi;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AutoValidatePresensi extends Command
{
    protected $signature = 'presensi:autovalidate';
    protected $description = 'Finalisasi otomatis: Pending -> Hadir, lalu Lock semua data jika waktu telah habis.';

    public function handle()
    {
        $setting = Setting::first();
        $waktuSekarangFormat = Carbon::now()->format('H:i:s');

        // PENGECEKAN DINAMIS WAKTU ADMIN
        if ($setting && $setting->jam_selesai_validasi) {
            if ($waktuSekarangFormat <= $setting->jam_selesai_validasi) {
                $this->comment("Belum waktunya eksekusi Auto-Validate. Waktu tutup: {$setting->jam_selesai_validasi} WIB. Sekarang: {$waktuSekarangFormat} WIB.");
                return;
            }
        }

        $hariIni = Carbon::today()->toDateString();
        $waktuSekarang = Carbon::now();

        // 1. Ubah yang Pending (sudah selfie & GPS) menjadi Hadir (karena guru lupa validasi)
        $jumlahDiselamatkan = Presensi::where('tanggal', $hariIni)
            ->where('status', 'pending')
            ->where('is_validated', false)
            ->update([
                'status' => 'hadir',
            ]);

        // 2. Kunci (Lock) semua sisa data yang belum tervalidasi hari ini
        $jumlahDilock = Presensi::where('tanggal', $hariIni)
            ->where('is_validated', false)
            ->update([
                'is_validated' => true,
                'validated_at' => $waktuSekarang,
            ]);

        if ($jumlahDilock > 0 || $jumlahDiselamatkan > 0) {
            $this->info("{$jumlahDiselamatkan} status Pending disahkan jadi Hadir. Total {$jumlahDilock} baris dikunci permanen.");
            Log::info("CRON AUTO-VALIDASI: {$jumlahDiselamatkan} Pending->Hadir, {$jumlahDilock} total dikunci.");
        } else {
            $this->comment("Semua data hari ini sudah terkunci dengan rapi.");
        }
    }
}