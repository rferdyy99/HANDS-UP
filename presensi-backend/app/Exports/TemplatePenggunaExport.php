<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TemplatePenggunaExport implements FromArray, WithHeadings, ShouldAutoSize, WithStyles
{
    public function array(): array
    {
        return [
            // name, email, password, role, jenis_kelamin, alamat_domisili, nomor_induk, nama_kelas
            ['Andi Syahputra', 'andi@siswa.com', '', 'siswa', 'L', 'Jl. Merdeka No. 1, Surabaya', '2024001', 'XII RPL 1'],
            ['Thy Kirana', 'thy@guru.com', 'rahasia123', 'guru', 'P', 'Perum. Indah Blok B', '19900202', 'XII RPL 1'],
        ];
    }

    public function headings(): array
    {
        // Header ini HARUS PERSIS karena jadi patokan saat proses Import
        return [
            'nama', 
            'email', 
            'password', 
            'role', 
            'jenis_kelamin',     
            'alamat_domisili',   
            'nomor_induk', 
            'nama_kelas'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Bikin header baris pertama jadi tebal (bold) otomatis
            1 => ['font' => ['bold' => true]],
        ];
    }
}