<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TemplateKelasExport implements FromArray, WithHeadings, ShouldAutoSize, WithStyles
{
    public function array(): array
    {
        return [
            ['XII RPL 1'],
            ['XI TKJ 2'],
            ['X DKV 1'],
        ];
    }

    public function headings(): array
    {
        // Header wajib sama persis untuk proses import
        return [
            'nama_kelas'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Baris 1 (Header) otomatis dicetak tebal
            1 => ['font' => ['bold' => true]],
        ];
    }
}