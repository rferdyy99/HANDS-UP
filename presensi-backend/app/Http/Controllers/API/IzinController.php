<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Izin;
use App\Models\Siswa;
use App\Models\Presensi;
use App\Models\Guru;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class IzinController extends Controller
{
    /**
     * Menyimpan data pengajuan izin/sakit (Method: POST)
     */
    public function ajukan(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'siswa') {
            return response()->json(['message' => 'Hanya siswa yang bisa mengajukan izin'], 403);
        }

        $siswa = Siswa::where('user_id', $user->id)->first();
        $hariIni = Carbon::today()->toDateString();

        // 🛡️ LAPIS BARU: CEK ANTI-SPAM (Mencegah siswa izin 2x di hari yang sama)
        $cekIzin = Izin::where('siswa_id', $siswa->id)
                       ->where('tanggal_mulai', $hariIni)
                       ->first();

        if ($cekIzin) {
            $statusTeks = strtoupper($cekIzin->status);
            return response()->json([
                'message' => "Anda sudah mengajukan izin/sakit hari ini (Status: {$statusTeks}). Tidak bisa mengajukan lagi."
            ], 400); // 400 Bad Request
        }

        // 🛡️ LAPIS 1: Validasi Ketat Magic Bytes & Batas Karakter
        $request->validate([
            'jenis' => 'required|in:sakit,izin',
            'keterangan' => 'required|string|max:1000', 
            'bukti_foto' => 'required|file|mimetypes:image/jpeg,image/png,application/pdf|mimes:jpeg,png,jpg,pdf|max:2048' 
        ]);

        $fotoPath = null;
        
        // 🛡️ LAPIS 2: Pengecekan Integritas File Upload
        if ($request->hasFile('bukti_foto')) {
            $file = $request->file('bukti_foto');
            
            if ($file->isValid()) {
                $fotoPath = $file->store('izin', 'public');
            } else {
                return response()->json(['message' => 'File bukti rusak atau tidak valid saat diunggah.'], 400);
            }
        }

        $izin = Izin::create([
            'siswa_id' => $siswa->id,
            'tanggal_mulai' => $hariIni, 
            'tanggal_selesai' => $hariIni, 
            'jenis' => $request->jenis,
            'keterangan' => strip_tags($request->keterangan),
            'bukti_foto' => $fotoPath,
            'status' => 'pending'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan izin berhasil, menunggu persetujuan guru',
            'data' => $izin
        ]);
    }

    /**
     * Mengambil daftar riwayat izin siswa yang login (Method: GET)
     */
    public function riwayat(Request $request)
    {
        $user = Auth::user();
        $siswa = Siswa::where('user_id', $user->id)->first();

        if (!$siswa) {
            return response()->json(['message' => 'Profil siswa tidak ditemukan'], 404);
        }

        $data = Izin::where('siswa_id', $siswa->id)
                    ->orderBy('id', 'desc')
                    ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Mengambil semua data izin untuk divalidasi oleh Guru/Admin (Method: GET)
     */
    public function getIzinGuru(Request $request)
    {
        $data = Izin::with(['siswa.kelas'])->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Memvalidasi izin (Terima/Tolak) oleh Guru/Admin (Method: PUT)
     */
    public function validasi(Request $request, int $id)
    {
        $request->validate([
            'status' => 'required|in:disetujui,ditolak'
        ]);

        $izin = Izin::find($id);

        if (!$izin) {
            return response()->json(['message' => 'Data pengajuan tidak ditemukan'], 404);
        }

        // 1. UPDATE STATUS DI TABEL IZIN
        $izin->update([
            'status' => $request->status
        ]);

        $statusPresensi = ($request->status === 'disetujui') ? $izin->jenis : 'alpha';

        $user = Auth::user();
        $guru = Guru::where('user_id', $user->id)->first();
        $validator_id = $guru ? $guru->id : null;

        Presensi::where('siswa_id', $izin->siswa_id)
                ->where('tanggal', $izin->tanggal_mulai)
                ->update([
                    'status' => $statusPresensi,
                    'is_validated' => true,
                    'validated_at' => Carbon::now(),
                    'divalidasi_oleh' => $validator_id
                ]);

        return response()->json([
            'success' => true,
            'message' => 'Status izin berhasil diperbarui dan disinkronkan ke daftar presensi.',
            'data' => $izin
        ]);
    }
}