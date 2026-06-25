<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Presensi;
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class PresensiController extends Controller
{
    /**
     * [BARU] Admin: Generate Draf Presensi Manual (Semua Siswa = Kosong)
     */
    public function generateDraftManual(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Hanya Admin yang bisa membuat draf.'], 403);
        }

        $hariIni = Carbon::today()->toDateString();
        $siswas = Siswa::all();
        $jumlahDibuat = 0;

        foreach ($siswas as $siswa) {
            $sudahAda = Presensi::where('siswa_id', $siswa->id)
                                ->where('tanggal', $hariIni)
                                ->exists();

            if (!$sudahAda) {
                Presensi::create([
                    'siswa_id' => $siswa->id,
                    'kelas_id' => $siswa->kelas_id, 
                    'tanggal' => $hariIni,
                    'status' => 'kosong',
                ]);
                $jumlahDibuat++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Berhasil membuat $jumlahDibuat draf presensi kosong untuk hari ini."
        ], 200);
    }

    /**
     * Menangani proses absensi masuk siswa.
     */
    public function absen(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'siswa') {
            return response()->json(['message' => 'Hanya siswa yang bisa melakukan absensi'], 403);
        }

        $siswa = Siswa::where('user_id', $user->id)->first();
        if (!$siswa) {
            return response()->json(['message' => 'Profil siswa tidak ditemukan'], 404);
        }

        $request->validate([
            'lokasi_lat' => 'required',
            'lokasi_lng' => 'required',
            'foto' => 'required|image|max:2048'
            // Status tidak divalidasi dari frontend, karena absen masuk PASTI diset 'pending'
        ]);

        $setting = Setting::first();
        $waktuSekarang = Carbon::now()->format('H:i:s');
        $tanggal_hari_ini = Carbon::today()->toDateString();

        // Pengecekan Jam Operasional Presensi Siswa
        if ($setting && $setting->jam_mulai_absen && $setting->jam_selesai_absen) {
            if ($waktuSekarang < $setting->jam_mulai_absen || $waktuSekarang > $setting->jam_selesai_absen) {
                return response()->json([
                    'message' => 'Sistem Absensi Tertutup! Silakan absen antara jam ' . 
                                 substr($setting->jam_mulai_absen, 0, 5) . ' - ' . 
                                 substr($setting->jam_selesai_absen, 0, 5)
                ], 400); 
            }
        }

        // Pengecekan Jarak Radius (Geofencing)
        if ($setting) {
            $lat1 = $setting->latitude;
            $lon1 = $setting->longitude;
            $lat2 = $request->lokasi_lat;
            $lon2 = $request->lokasi_lng;

            $theta = $lon1 - $lon2;
            $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +  cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
            $dist = acos($dist);
            $dist = rad2deg($dist);
            $meter = $dist * 60 * 1.1515 * 1609.344;

            if ($meter > $setting->radius_meter) {
                return response()->json([
                    'message' => 'Lokasi Anda di luar jangkauan sekolah! (Jarak Anda: ' . round($meter) . ' meter. Maksimal: ' . $setting->radius_meter . ' meter)'
                ], 400); 
            }
        }

        // Cari draf presensi
        $presensi = Presensi::where('siswa_id', $siswa->id)
                            ->where('tanggal', $tanggal_hari_ini)
                            ->first();

        if (!$presensi) {
            return response()->json(['message' => 'Draft presensi belum tersedia. Hubungi Admin/Wali Kelas.'], 404);
        }

        if ($presensi->status !== 'kosong') {
            return response()->json(['message' => 'Anda sudah merekam kehadiran hari ini. Menunggu validasi guru.'], 400);
        }

        // Simpan foto
        $fotoPath = $request->file('foto')->store('presensi', 'public');

        // Update draf menjadi PENDING
        $presensi->update([
            'status' => 'pending',
            'jam_masuk' => $waktuSekarang,
            'foto_masuk' => $fotoPath,
            'lokasi_masuk_lat' => $request->lokasi_lat,
            'lokasi_masuk_lng' => $request->lokasi_lng,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Presensi berhasil dicatat, menunggu validasi Wali Kelas.',
            'data' => $presensi
        ], 200);
    }

    public function riwayat(Request $request)
    {
        $user = Auth::user();
        $siswa = Siswa::where('user_id', $user->id)->first();

        if (!$siswa) return response()->json(['message' => 'Profil tidak ditemukan'], 404);

        $query = Presensi::where('siswa_id', $siswa->id)->orderBy('tanggal', 'desc');

        if ($request->has('bulan') && $request->has('tahun')) {
            $query->whereMonth('tanggal', $request->bulan)
                  ->whereYear('tanggal', $request->tahun);
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function getDraftKelas(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'guru'])) return response()->json(['message' => 'Akses ditolak'], 403);

        $request->validate(['kelas_id' => 'required|exists:kelas,id']);

        $tanggal = $request->tanggal ?? Carbon::today()->toDateString();
        $draft = Presensi::with('siswa')
                         ->where('kelas_id', $request->kelas_id)
                         ->where('tanggal', $tanggal)
                         ->get();

        $is_validated = $draft->first() ? $draft->first()->is_validated : false;
        $setting = Setting::first();
        $waktuSekarang = Carbon::now()->format('H:i:s');
        $is_validating_time = false;

        if ($setting && $setting->jam_mulai_validasi && $setting->jam_selesai_validasi) {
            $is_validating_time = ($waktuSekarang >= $setting->jam_mulai_validasi && $waktuSekarang <= $setting->jam_selesai_validasi);
        }

        if ($user->role === 'admin') {
            $is_validating_time = true; 
            $is_validated = false; 
        }

        return response()->json([
            'success' => true,
            'tanggal' => $tanggal,
            'is_validated' => (bool) $is_validated,
            'is_validating_time' => $is_validating_time,
            'data' => $draft
        ], 200);
    }

    public function validasiDraft(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'guru'])) return response()->json(['message' => 'Akses ditolak'], 403);

        $request->validate([
            'presensi_data' => 'required|array',
            'presensi_data.*.id' => 'required|exists:presensi,id',
            'presensi_data.*.status' => 'required|in:kosong,pending,hadir,izin,sakit,alpha',
        ]);

        $setting = Setting::first();
        $waktuSekarang = Carbon::now()->format('H:i:s');
        $isAdmin = $user->role === 'admin';

        if (!$isAdmin) {
            if ($setting && ($waktuSekarang < $setting->jam_mulai_validasi || $waktuSekarang > $setting->jam_selesai_validasi)) {
                return response()->json([
                    'message' => 'Sistem Validasi Tertutup! Silakan validasi antara jam ' . substr($setting->jam_mulai_validasi, 0, 5) . ' - ' . substr($setting->jam_selesai_validasi, 0, 5)
                ], 400);
            }

            $sample_id = $request->presensi_data[0]['id'];
            $cek_kuncian = Presensi::find($sample_id);
            if ($cek_kuncian && $cek_kuncian->is_validated) {
                return response()->json(['message' => 'Draft kelas ini sudah divalidasi final dan tidak bisa diubah lagi.'], 403);
            }
        }

        $guru = Guru::where('user_id', $user->id)->first();
        $validator_id = $guru ? $guru->id : null; 

        foreach ($request->presensi_data as $item) {
            $updateData = [
                'status' => $item['status'],
                'is_validated' => true,
                'validated_at' => Carbon::now(),
            ];
            if ($validator_id) $updateData['divalidasi_oleh'] = $validator_id;

            Presensi::where('id', $item['id'])->update($updateData);
        }

        return response()->json(['success' => true, 'message' => 'Presensi kelas berhasil difinalisasi dan dikunci.'], 200);
    }
}