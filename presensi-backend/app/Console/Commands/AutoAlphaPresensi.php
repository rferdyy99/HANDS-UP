<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Presensi;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AutoAlphaPresensi extends Command
{
    protected $signature = 'presensi:auto-alpha';
    protected $description = 'Mengubah status draf KOSONG menjadi ALPHA jika waktu validasi admin telah habis.';

    public function handle()
    {
        $setting = Setting::first();
        $waktuSekarangFormat = Carbon::now()->format('H:i:s');

        // PENGECEKAN DINAMIS WAKTU ADMIN
        if ($setting && $setting->jam_selesai_validasi) {
            if ($waktuSekarangFormat <= $setting->jam_selesai_validasi) {
                $this->comment("Belum waktunya eksekusi Auto-Alpha. Waktu tutup: {$setting->jam_selesai_validasi} WIB. Sekarang: {$waktuSekarangFormat} WIB.");
                return;
            }
        }

        $hariIni = Carbon::today()->toDateString();
        $waktuSekarang = Carbon::now();

        // Cari yang statusnya masih 'kosong' dan belum divalidasi
        $jumlahDiubah = Presensi::where('tanggal', $hariIni)
            ->where('status', 'kosong')
            ->where('is_validated', false)
            ->update([
                'status' => 'alpha',
                'is_validated' => true, // Sekalian dikunci
                'validated_at' => $waktuSekarang,
                'divalidasi_oleh' => null
            ]);

        if ($jumlahDiubah > 0) {
            $this->info("{$jumlahDiubah} siswa (Kosong -> Alpha) dieksekusi karena waktu validasi telah habis.");
            Log::info("CRON AUTO-ALPHA: {$jumlahDiubah} siswa di-Alpha-kan secara otomatis.");
        } else {
            $this->comment("Tidak ada data Kosong yang perlu diubah.");
        }
    }
}