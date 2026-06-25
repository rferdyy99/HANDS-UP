<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Guru extends Model
{
    protected $table = 'guru';
    public $timestamps = false;
    
    protected $fillable = [
        'user_id', 
        'nip', 
        'nama_lengkap', 
        'no_telepon', 
        'jenis_kelamin', 
        'alamat_domisili', 
        'foto'
    ];

    protected $appends = ['foto_url'];

    public function getFotoUrlAttribute()
    {
        return $this->foto 
            ? asset('storage/' . $this->foto) 
            : asset('src/assets/teacher.png');
    }

    public function kelas() 
    { 
        return $this->hasOne(Kelas::class, 'guru_id'); 
    }
}