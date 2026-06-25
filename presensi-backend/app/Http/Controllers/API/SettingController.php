<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;

class SettingController extends Controller
{
    public function index()
    {
        $setting = Setting::firstOrCreate(
            ['id' => 1],
            [
                'latitude' => '-7.31637', 
                'longitude' => '112.72541', 
                'radius_meter' => 100, 
                'jam_mulai_absen' => '06:00',
                'jam_selesai_absen' => '08:00',
                'jam_mulai_validasi' => '07:00',
                'jam_selesai_validasi' => '16:00'
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $setting
        ]);
    }

    public function update(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak. Role anda: ' . Auth::user()->role], 403);
        }

        $request->validate([
            'latitude' => 'required|string',
            'longitude' => 'required|string',
            'radius_meter' => 'required|integer|min:10',
            'jam_mulai_absen' => 'required',
            'jam_selesai_absen' => 'required',
            'jam_mulai_validasi' => 'required',
            'jam_selesai_validasi' => 'required'
        ]);

        $setting = Setting::find(1);
        
        $setting->update([
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'radius_meter' => $request->radius_meter,
            'jam_mulai_absen' => $request->jam_mulai_absen,
            'jam_selesai_absen' => $request->jam_selesai_absen,
            'jam_mulai_validasi' => $request->jam_mulai_validasi,
            'jam_selesai_validasi' => $request->jam_selesai_validasi
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan sistem berhasil diperbarui',
            'data' => $setting
        ]);
    }
}