<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Presensi;
use App\Models\Izin;
use App\Models\Guru;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon; // Pastikan Carbon di-import

class GuruController extends Controller
{
    public function getPresensi(Request $request)
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            $query = Presensi::with('siswa')->orderBy('tanggal', 'desc');
            if ($request->has('kelas_id') && $request->kelas_id != '') {
                $siswa_ids = \App\Models\Siswa::where('kelas_id', $request->kelas_id)->pluck('id');
                $query->whereIn('siswa_id', $siswa_ids);
            }
            return response()->json(['success' => true, 'data' => $query->get()]);
        }

        if ($user->role === 'guru') {
            $guru = Guru::where('user_id', $user->id)->first();
            $kelas = \App\Models\Kelas::where('guru_id', $guru->id)->first();
            if (!$kelas) return response()->json(['data' => []]);

            $siswa_ids = \App\Models\Siswa::where('kelas_id', $kelas->id)->pluck('id');
            $presensi = Presensi::with('siswa')->whereIn('siswa_id', $siswa_ids)->orderBy('tanggal', 'desc')->get();
            return response()->json(['success' => true, 'data' => $presensi]);
        }
        return response()->json(['message' => 'Akses ditolak'], 403);
    }

    public function validasiPresensiBulk(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['guru', 'admin'])) return response()->json(['message' => 'Akses ditolak'], 403);

        $request->validate([
            'ids' => 'required|array',
            'status' => 'required|in:hadir,terlambat,alpha'
        ]);

        $guru_id = null;
        if ($user->role === 'guru') {
            $guru_id = Guru::where('user_id', $user->id)->first()->id;
        }

        Presensi::whereIn('id', $request->ids)->update([
            'status' => $request->status,
            'divalidasi_oleh' => $guru_id
        ]);

        return response()->json(['success' => true, 'message' => 'Berhasil memvalidasi sekaligus']);
    }

    public function validasiPresensi(Request $request, $id)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['guru', 'admin'])) {
            return response()->json(['message' => 'Hanya guru dan admin yang berhak mengakses ini'], 403);
        }

        $presensi = Presensi::find($id);

        if (!$presensi) {
            return response()->json(['message' => 'Data presensi tidak ditemukan'], 404);
        }

        $request->validate([
            'status' => 'required|in:hadir,terlambat,alpha'
        ]);

        $guru_id = null;
        if ($user->role === 'guru') {
            $guru = Guru::where('user_id', $user->id)->first();
            $guru_id = $guru->id;
        }

        $presensi->update([
            'status' => $request->status,
            'divalidasi_oleh' => $guru_id 
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status presensi berhasil diupdate menjadi ' . $request->status,
            'data' => $presensi
        ]);
    }

    public function getIzin()
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            $izin = Izin::with('siswa')->orderBy('tanggal_mulai', 'desc')->get();
            return response()->json(['success' => true, 'data' => $izin]);
        }

        if ($user->role === 'guru') {
            $guru = Guru::where('user_id', $user->id)->first();
            $kelas = \App\Models\Kelas::where('guru_id', $guru->id)->first();
            
            if (!$kelas) return response()->json(['data' => []]);

            $siswa_ids = \App\Models\Siswa::where('kelas_id', $kelas->id)->pluck('id');
            $izin = Izin::with('siswa')->whereIn('siswa_id', $siswa_ids)->orderBy('tanggal_mulai', 'desc')->get();
            
            return response()->json(['success' => true, 'data' => $izin]);
        }

        return response()->json(['message' => 'Akses ditolak'], 403);
    }

    public function validasiIzin(Request $request, $id)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['guru', 'admin'])) {
            return response()->json(['message' => 'Hanya guru dan admin yang berhak mengakses ini'], 403);
        }

        $izin = Izin::find($id);

        if (!$izin) {
            return response()->json(['message' => 'Data pengajuan tidak ditemukan'], 404);
        }

        $request->validate([
            'status' => 'required|in:disetujui,ditolak'
        ]);

        $guru_id = null;
        if ($user->role === 'guru') {
            $guru = Guru::where('user_id', $user->id)->first();
            $guru_id = $guru->id;
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // 1. Update status di tabel izin
            $izin->update([
                'status' => $request->status,
                'divalidasi_oleh' => $guru_id
            ]);

            // 2. LOGIKA SINKRONISASI OTOMATIS
            if ($request->status === 'disetujui') {
                // Jika disetujui, otomatis jadi izin/sakit
                Presensi::where('siswa_id', $izin->siswa_id)
                    ->whereBetween('tanggal', [$izin->tanggal_mulai, $izin->tanggal_selesai])
                    ->update([
                        'status' => $izin->jenis, 
                        'is_validated' => true,
                        'validated_at' => Carbon::now(),
                        'divalidasi_oleh' => $guru_id
                    ]);
            } else if ($request->status === 'ditolak') {
                // Jika ditolak, otomatis jadi alpha (hanya jika data masih kosong)
                Presensi::where('siswa_id', $izin->siswa_id)
                    ->whereBetween('tanggal', [$izin->tanggal_mulai, $izin->tanggal_selesai])
                    ->where('status', 'kosong')
                    ->update([
                        'status' => 'alpha', 
                        'is_validated' => true,
                        'validated_at' => Carbon::now(),
                        'divalidasi_oleh' => $guru_id
                    ]);
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Status izin berhasil diupdate menjadi ' . strtoupper($request->status),
                'data' => $izin
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memvalidasi: ' . $e->getMessage()
            ], 500);
        }
    }
}