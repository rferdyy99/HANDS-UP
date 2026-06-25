<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Presensi extends Model
{
    protected $table = 'presensi';
    public $timestamps = false;

    protected $fillable = [
        'siswa_id', 
        'kelas_id', 
        'tanggal', 
        'jam_masuk',
        'foto_masuk', 
        'lokasi_masuk_lat', 
        'lokasi_masuk_lng', 
        'status', 
        'is_validated',     
        'validated_at',     
        'divalidasi_oleh'
    ];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'siswa_id');
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }
}