<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kelas extends Model
{
    protected $table = 'kelas'; 
    
    public $timestamps = false; 

    protected $fillable = [
        'nama_kelas', 
        'guru_id'
    ];

    public function siswa()
    {
        return $this->hasMany(Siswa::class, 'kelas_id');
    }
}