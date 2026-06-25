<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class PresensiExport implements FromView, ShouldAutoSize
{
    protected $data;
    protected $range;
    protected $mode; // Tambahkan ini

    public function __construct($data, $range, $mode)
    {
        $this->data = $data;
        $this->range = $range;
        $this->mode = $mode; // Set nilai mode
    }

    public function view(): View
    {
        return view('exports.presensi', [
            'data' => $this->data,
            'range' => $this->range,
            'mode' => $this->mode // Kirim mode ke view HTML
        ]);
    }
}