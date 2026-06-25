<?php

namespace App\Imports;

use App\Models\Kelas;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class KelasImport implements ToCollection, WithHeadingRow
{
    private $rowNumber = 0;

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $this->rowNumber++;

            if (!isset($row['nama_kelas']) || trim($row['nama_kelas']) == '') {
                continue; 
            }

            $namaKelas = strtoupper(trim($row['nama_kelas']));

            if (!preg_match('/^(X|XI|XII)\s/i', $namaKelas)) {
                throw new \Exception(
                    "Baris {$this->rowNumber}: Format kelas '{$namaKelas}' DITOLAK. " .
                    "Kelas wajib menggunakan awalan huruf Romawi (X, XI, XII) yang diikuti spasi. " .
                    "Contoh yang benar: 'XII RPL 1'. Dilarang menggunakan angka biasa seperti '10', '11', '12'."
                );
            }

            $cekDuplikat = Kelas::where('nama_kelas', $namaKelas)->first();
            if ($cekDuplikat) {
                throw new \Exception(
                    "Baris {$this->rowNumber}: Kelas '{$namaKelas}' DITOLAK karena sudah terdaftar di sistem. " .
                    "Sistem membatalkan seluruh proses import. Harap hapus kelas yang sudah ada tersebut dari file Excel Anda."
                );
            }

            Kelas::create([
                'nama_kelas' => $namaKelas
            ]);
        }
    }
}