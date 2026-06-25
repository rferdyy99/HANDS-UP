<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Siswa;
use App\Models\Presensi;
use Carbon\Carbon;

class GenerateDraftPresensi extends Command
{
    protected $signature = 'presensi:generate-draft';
    protected $description = 'Membuat draft presensi harian dengan status kosong untuk semua siswa';

    public function handle()
    {
        $hariIni = Carbon::today()->toDateString();
        $siswas = Siswa::all();
        $jumlahDibuat = 0;

        foreach ($siswas as $siswa) {
            $sudahAda = Presensi::where('siswa_id', $siswa->id)
                                ->where('tanggal', $hariIni)
                                ->exists();

            if (!$sudahAda) {
                Presensi::create([
                    'siswa_id' => $siswa->id,
                    'kelas_id' => $siswa->kelas_id ?? null, 
                    'tanggal' => $hariIni,
                    'status' => 'kosong',
                ]);
                $jumlahDibuat++;
            }
        }

        $this->info("Selesai! {$jumlahDibuat} draft absensi 'kosong' untuk tanggal {$hariIni} berhasil dibuat.");
    }
}