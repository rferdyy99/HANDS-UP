<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'latitude', 
        'longitude', 
        'radius_meter',
        'jam_mulai_absen',
        'jam_selesai_absen',
        'jam_mulai_validasi',
        'jam_selesai_validasi'
    ];
}