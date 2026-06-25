<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Izin extends Model
{
    protected $table = 'izin';
    public $timestamps = false;
    
    protected $fillable = [
        'siswa_id', 
        'tanggal_mulai', 
        'tanggal_selesai', 
        'jenis', 
        'keterangan', 
        'bukti_foto', 
        'status', 
        'divalidasi_oleh'
    ];
    public function siswa()
    {
    return $this->belongsTo(Siswa::class, 'siswa_id');
    }
}