<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Siswa extends Model
{
    protected $table = 'siswa';
    public $timestamps = false;
    
    protected $fillable = [
        'user_id', 
        'kelas_id', 
        'nis', 
        'nama_lengkap', 
        'alamat_domisili', 
        'no_telepon', 
        'jenis_kelamin', 
        'foto'
    ];

    protected $appends = ['foto_url'];

    public function getFotoUrlAttribute()
    {
        return $this->foto 
            ? asset('storage/' . $this->foto) 
            : asset('src/assets/student.png'); 
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }
}