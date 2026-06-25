<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Presensi;
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\Kelas;
use Illuminate\Support\Facades\Auth;
use App\Exports\PresensiExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf; 

class LaporanController extends Controller
{
    /**
     * Menampilkan Preview Laporan di Tabel
     */
    public function presensiHarian(Request $request)
    {
        $user = Auth::user();
        $request->validate([
            'tanggal_mulai' => 'required|date', 
            'tanggal_selesai' => 'required|date'
        ]);

        $kelas_id = $user->role === 'guru' 
                    ? (Guru::where('user_id', $user->id)->first()->kelas->id ?? null) 
                    : $request->kelas_id;

        if (!$kelas_id) return response()->json(['message' => 'Kelas tidak ditemukan'], 404);

        if ($request->has('siswa_id') && $request->siswa_id != "") {
            $data = Presensi::with('siswa')
                    ->where('siswa_id', $request->siswa_id)
                    ->whereBetween('tanggal', [$request->tanggal_mulai, $request->tanggal_selesai])
                    ->orderBy('tanggal', 'asc')
                    ->get();
            
            return response()->json(['success' => true, 'mode' => 'individu', 'data' => $data]);
        }

        $daftarSiswa = Siswa::where('kelas_id', $kelas_id)->orderBy('nama_lengkap', 'asc')->get();
        $presensi = Presensi::whereBetween('tanggal', [$request->tanggal_mulai, $request->tanggal_selesai])
                            ->whereIn('siswa_id', $daftarSiswa->pluck('id'))
                            ->get();

        $rekapData = $daftarSiswa->map(function($s) use ($presensi) {
            $p = $presensi->where('siswa_id', $s->id);
            return [
                'nis' => $s->nis,
                'nama_lengkap' => $s->nama_lengkap,
                'hadir' => $p->whereIn('status', ['hadir', 'terlambat'])->count(), // Jaga-jaga kalau data lawas masih ada 'terlambat'
                'izin' => $p->where('status', 'izin')->count(),
                'sakit' => $p->where('status', 'sakit')->count(),
                'alpha' => $p->where('status', 'alpha')->count(),
            ];
        });

        return response()->json([
            'success' => true,
            'mode' => 'kelas',
            'data' => $rekapData
        ]);
    }

    /**
     * Download Laporan Format EXCEL
     */
    public function exportExcel(Request $request)
    {
        $request->validate([
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date',
            'kelas_id' => 'required'
        ]);

        $range = $request->tanggal_mulai . ' s/d ' . $request->tanggal_selesai;

        if ($request->has('siswa_id') && $request->siswa_id != "") {
            $data = Presensi::with('siswa')
                    ->where('siswa_id', $request->siswa_id)
                    ->whereBetween('tanggal', [$request->tanggal_mulai, $request->tanggal_selesai])
                    ->orderBy('tanggal', 'asc')
                    ->get();
            
            return Excel::download(new PresensiExport($data, $range, 'individu'), 'Rekap_Individu.xlsx');
        } 
        
        $daftarSiswa = Siswa::where('kelas_id', $request->kelas_id)->orderBy('nama_lengkap', 'asc')->get();
        $presensi = Presensi::whereBetween('tanggal', [$request->tanggal_mulai, $request->tanggal_selesai])
                            ->whereIn('siswa_id', $daftarSiswa->pluck('id'))
                            ->get();

        $data = $daftarSiswa->map(function($s) use ($presensi) {
            $p = $presensi->where('siswa_id', $s->id);
            return [
                'nis' => $s->nis,
                'nama_lengkap' => $s->nama_lengkap,
                'hadir' => $p->whereIn('status', ['hadir', 'terlambat'])->count(),
                'izin' => $p->where('status', 'izin')->count(),
                'sakit' => $p->where('status', 'sakit')->count(),
                'alpha' => $p->where('status', 'alpha')->count(),
            ];
        });

        return Excel::download(new PresensiExport($data, $range, 'kelas'), 'Rekap_Kelas.xlsx');
    }

    /**
     * Download Laporan Format PDF
     */
    public function exportPdf(Request $request)
    {
        $request->validate([
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date',
            'kelas_id' => 'required'
        ]);

        $range = $request->tanggal_mulai . ' s/d ' . $request->tanggal_selesai;
        $mode = ($request->has('siswa_id') && $request->siswa_id != "") ? 'individu' : 'kelas';

        if ($mode == 'individu') {
            $data = Presensi::with('siswa')
                    ->where('siswa_id', $request->siswa_id)
                    ->whereBetween('tanggal', [$request->tanggal_mulai, $request->tanggal_selesai])
                    ->orderBy('tanggal', 'asc')
                    ->get();
        } else {
            $daftarSiswa = Siswa::where('kelas_id', $request->kelas_id)->orderBy('nama_lengkap', 'asc')->get();
            $presensi = Presensi::whereBetween('tanggal', [$request->tanggal_mulai, $request->tanggal_selesai])
                                ->whereIn('siswa_id', $daftarSiswa->pluck('id'))
                                ->get();

            $data = $daftarSiswa->map(function($s) use ($presensi) {
                $p = $presensi->where('siswa_id', $s->id);
                return [
                    'nis' => $s->nis,
                    'nama_lengkap' => $s->nama_lengkap,
                    'hadir' => $p->whereIn('status', ['hadir', 'terlambat'])->count(),
                    'izin' => $p->where('status', 'izin')->count(),
                    'sakit' => $p->where('status', 'sakit')->count(),
                    'alpha' => $p->where('status', 'alpha')->count(),
                ];
            });
        }

        $pdf = Pdf::loadView('exports.presensi', compact('data', 'range', 'mode'))
                  ->setPaper('a4', 'landscape');

        return $pdf->download('Laporan_Presensi_' . time() . '.pdf');
    }
}