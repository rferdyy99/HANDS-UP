<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\PresensiController;
use App\Http\Controllers\API\IzinController;
use App\Http\Controllers\API\GuruController;
use App\Http\Controllers\API\KelasController;
use App\Http\Controllers\API\PenggunaController;
use App\Http\Controllers\API\LaporanController;
use App\Http\Controllers\API\SettingController;
use App\Http\Controllers\API\AnalitikController;
use App\Imports\PenggunaImport;
use App\Imports\KelasImport;

// RUTE PUBLIK
Route::post('/login', [AuthController::class, 'login']);
Route::post('/lupa-password', [AuthController::class, 'lupaPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);


// RUTE TERPROTEKSI 
Route::middleware('auth:sanctum')->group(function () {
    
    // 1. PROFIL & AUTH
    Route::get('/me', function (Request $request) {
        return response()->json($request->user());
    });
    Route::get('/profil', [PenggunaController::class, 'profil']);
    Route::post('/ubah-password', [PenggunaController::class, 'ubahPassword']);
    Route::post('/profil/update-detail', [PenggunaController::class, 'updateProfilDetail']);

    // 2. SISWA: PRESENSI & IZIN
    Route::post('/absen', [PresensiController::class, 'absen']);
    Route::get('/riwayat-presensi', [PresensiController::class, 'riwayat']);
    Route::post('/izin', [IzinController::class, 'ajukan']);
    Route::get('/izin', [IzinController::class, 'riwayat']); 

    // 3. GURU & ADMIN: VALIDASI PRESENSI
    Route::get('/guru/presensi/draft', [PresensiController::class, 'getDraftKelas']); 
    Route::put('/guru/presensi/validasi', [PresensiController::class, 'validasiDraft']); 

    // 4. GURU & ADMIN: MANAJEMEN IZIN SAKIT
    Route::get('/guru/izin', [GuruController::class, 'getIzin']);
    Route::put('/guru/izin/{id}', [GuruController::class, 'validasiIzin']);

    // 5. ADMIN: DATA MASTER KELAS
    Route::get('/kelas', [KelasController::class, 'index']);
    Route::post('/kelas', [KelasController::class, 'store']);
    Route::put('/kelas/{id}', [KelasController::class, 'update']);
    Route::delete('/kelas/{id}', [KelasController::class, 'destroy']);
    Route::get('/kelas/template', [KelasController::class, 'downloadTemplate']);
    Route::post('/kelas/import', [KelasController::class, 'importExcel']);

    // 6. ADMIN: DATA MASTER PENGGUNA
    Route::get('/pengguna', [PenggunaController::class, 'index']);
    Route::post('/pengguna', [PenggunaController::class, 'store']);
    Route::put('/pengguna/{id}', [PenggunaController::class, 'update']);
    Route::delete('/pengguna/{id}', [PenggunaController::class, 'destroy']);
    Route::get('/pengguna/template', [PenggunaController::class, 'downloadTemplate']);
    Route::post('/pengguna/import', [PenggunaController::class, 'importExcel']);

    // 7. ADMIN: PENGATURAN SISTEM
    Route::get('/setting', [SettingController::class, 'index']);
    Route::put('/setting', [SettingController::class, 'update']);
    Route::post('/admin/presensi/generate-draft', [PresensiController::class, 'generateDraftManual']);

    // 8. ADMIN: LAPORAN & EXPORT
    Route::get('/laporan/presensi', [LaporanController::class, 'presensiHarian']);
    Route::get('/laporan/export', [LaporanController::class, 'exportExcel']);
    Route::get('/laporan/export-pdf', [LaporanController::class, 'exportPdf']);

    // 9. ANALITIK
    Route::get('/analitik/kehadiran-harian', [AnalitikController::class, 'kehadiranHarian']); 
    Route::get('/analitik/tren-kehadiran', [AnalitikController::class, 'trenKehadiran']); 
    Route::get('/analitik/ringkasan', [AnalitikController::class, 'ringkasanStats']);
    Route::get('/analitik/insight', [AnalitikController::class, 'insightOtomatis']);
    Route::get('/analitik/online', [AnalitikController::class, 'penggunaOnline']);
    Route::get('/analitik/leaderboard', [AnalitikController::class, 'leaderboard']);
    Route::get('/analitik/heatmap', [AnalitikController::class, 'heatmapKehadiran']);

});