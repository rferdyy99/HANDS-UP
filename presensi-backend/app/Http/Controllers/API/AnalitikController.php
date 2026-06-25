<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Presensi;
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\Kelas;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalitikController extends Controller
{
    // ============================================================
    // HELPER: Filter Query berdasarkan tingkat ATAU kelas_id
    // ============================================================
    private function applyKelasFilter($query, $tingkat, $kelasId = null)
    {
        if ($kelasId) {
            $query->where('kelas_id', $kelasId);
        } elseif ($tingkat) {
            $query->whereHas('kelas', function ($q) use ($tingkat) {
                if ($tingkat == '10') $q->where('nama_kelas', 'LIKE', 'X %')->orWhere('nama_kelas', 'LIKE', '10 %');
                if ($tingkat == '11') $q->where('nama_kelas', 'LIKE', 'XI %')->orWhere('nama_kelas', 'LIKE', '11 %');
                if ($tingkat == '12') $q->where('nama_kelas', 'LIKE', 'XII %')->orWhere('nama_kelas', 'LIKE', '12 %');
            });
        }
        return $query;
    }

    // ============================================================
    // 1. KEHADIRAN HARIAN (DONUT CHART + breakdown per kelas)
    // ============================================================
    public function kehadiranHarian(Request $request)
    {
        $tanggal = $request->tanggal ?? Carbon::today()->toDateString();
        $tingkat = $request->tingkat;
        $kelasId = $request->kelas_id;

        $query = Presensi::where('tanggal', $tanggal);
        $query = $this->applyKelasFilter($query, $tingkat, $kelasId);

        $stats = $query->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')->get()->pluck('total', 'status');

        // PERBAIKAN: Menambahkan Pending ke Donut Chart
        $data = [
            ['name' => 'Hadir',       'value' => (int)($stats['hadir']   ?? 0), 'color' => '#10b981'],
            ['name' => 'Pending',     'value' => (int)($stats['pending'] ?? 0), 'color' => '#8b5cf6'],
            ['name' => 'Izin',        'value' => (int)($stats['izin']    ?? 0), 'color' => '#3b82f6'],
            ['name' => 'Sakit',       'value' => (int)($stats['sakit']   ?? 0), 'color' => '#f59e0b'],
            ['name' => 'Alpha',       'value' => (int)($stats['alpha']   ?? 0), 'color' => '#ef4444'],
            ['name' => 'Belum Absen', 'value' => (int)($stats['kosong']  ?? 0), 'color' => '#94a3b8'],
        ];

        $perKelas = [];
        if (!$kelasId) {
            $kelasList = Kelas::all();
            if ($tingkat) {
                $kelasList = $kelasList->filter(function ($k) use ($tingkat) {
                    $n = strtoupper($k->nama_kelas);
                    if ($tingkat == '10') return str_starts_with($n, 'X ')   || str_starts_with($n, '10 ');
                    if ($tingkat == '11') return str_starts_with($n, 'XI ')  || str_starts_with($n, '11 ');
                    if ($tingkat == '12') return str_starts_with($n, 'XII ') || str_starts_with($n, '12 ');
                    return true;
                });
            }

            $semuaPresensi = Presensi::where('tanggal', $tanggal)
                ->whereIn('kelas_id', $kelasList->pluck('id'))
                ->select('kelas_id', 'status', DB::raw('count(*) as total'))
                ->groupBy('kelas_id', 'status')->get();

            foreach ($kelasList as $kelas) {
                $baris    = $semuaPresensi->where('kelas_id', $kelas->id);
                $hadir    = (int) $baris->where('status', 'hadir')->sum('total');
                $pending  = (int) $baris->where('status', 'pending')->sum('total'); // Tambahan Pending
                $izin     = (int) $baris->whereIn('status', ['izin', 'sakit'])->sum('total');
                $alpha    = (int) $baris->where('status', 'alpha')->sum('total');
                $kosong   = (int) $baris->where('status', 'kosong')->sum('total');
                
                $totalAll = $hadir + $pending + $izin + $alpha + $kosong;

                $perKelas[] = [
                    'kelas_id'     => $kelas->id,
                    'nama_kelas'   => $kelas->nama_kelas,
                    'hadir'        => $hadir,
                    'izin_sakit'   => $izin,
                    'alpha'        => $alpha,
                    'total'        => $totalAll,
                    'persen_hadir' => $totalAll > 0 ? round(($hadir / $totalAll) * 100) : 0,
                ];
            }
            usort($perKelas, fn($a, $b) => $b['persen_hadir'] <=> $a['persen_hadir']);
        }

        return response()->json(['success' => true, 'data' => $data, 'per_kelas' => $perKelas]);
    }

    // ============================================================
    // 2. TREN KEHADIRAN (AREA CHART)
    // ============================================================
    public function trenKehadiran(Request $request)
    {
        $rentang = $request->rentang ?? '7_hari';
        $tingkat = $request->tingkat;
        $kelasId = $request->kelas_id;
        $endDate = Carbon::today();

        if ($rentang === '7_hari')         $startDate = Carbon::today()->subDays(6);
        elseif ($rentang === '1_bulan')    $startDate = Carbon::today()->subDays(29);
        elseif ($rentang === '1_semester') $startDate = Carbon::today()->subMonths(6);
        else                               $startDate = Carbon::today()->subDays(6);

        $query = Presensi::whereBetween('tanggal', [$startDate->toDateString(), $endDate->toDateString()]);
        $query = $this->applyKelasFilter($query, $tingkat, $kelasId);

        $rawData = $query->select('tanggal', 'status', DB::raw('count(*) as total'))
            ->groupBy('tanggal', 'status')->orderBy('tanggal', 'asc')->get();

        $formattedData = [];
        foreach (\Carbon\CarbonPeriod::create($startDate, $endDate) as $date) {
            $tglStr    = $date->toDateString();
            $labelAxis = ($rentang === '1_semester') ? $date->format('M Y') : $date->format('d M');
            $key       = ($rentang === '1_semester') ? $labelAxis : $tglStr;
            if (!isset($formattedData[$key])) {
                // PERBAIKAN: Masukkan 'pending' ke inisialisasi awal agar tidak error 500
                $formattedData[$key] = ['tanggal' => $labelAxis, 'hadir' => 0, 'pending' => 0, 'izin' => 0, 'sakit' => 0, 'alpha' => 0];
            }
        }

        foreach ($rawData as $row) {
            $dateObj = Carbon::parse($row->tanggal);
            $key = ($rentang === '1_semester') ? $dateObj->format('M Y') : $row->tanggal;
            
            // PERBAIKAN: array_key_exists memastikan status kosong tidak dihitung dan status baru aman
            if (isset($formattedData[$key]) && array_key_exists($row->status, $formattedData[$key])) {
                $formattedData[$key][$row->status] += (int) $row->total;
            }
        }

        return response()->json(['success' => true, 'data' => array_values($formattedData)]);
    }

    // ============================================================
    // 3. RINGKASAN QUICK STATS + delta vs kemarin
    // ============================================================
    public function ringkasanStats(Request $request)
    {
        $tanggal = $request->tanggal ?? Carbon::today()->toDateString();
        $kemarin = Carbon::yesterday()->toDateString();

        $totalSiswa = Siswa::count();
        $totalGuru  = Guru::count();

        $statsHariIni = Presensi::where('tanggal', $tanggal)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')->pluck('total', 'status');

        $statsKemarin = Presensi::where('tanggal', $kemarin)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')->pluck('total', 'status');

        $hadir     = $statsHariIni['hadir']   ?? 0;
        $pending   = $statsHariIni['pending'] ?? 0;
        $izinSakit = ($statsHariIni['izin']   ?? 0) + ($statsHariIni['sakit'] ?? 0);
        $alpha     = $statsHariIni['alpha']   ?? 0;
        $kosong    = $statsHariIni['kosong']  ?? 0;

        $totalHariIni = $hadir + $pending + $izinSakit + $alpha + $kosong;
        $persenHadir  = $totalHariIni > 0 ? round(($hadir / $totalHariIni) * 100, 1) : 0;

        $hadirKemarin = $statsKemarin['hadir'] ?? 0;
        $totalKemarin = $hadirKemarin + ($statsKemarin['pending'] ?? 0) + ($statsKemarin['izin'] ?? 0) + ($statsKemarin['sakit'] ?? 0)
            + ($statsKemarin['alpha'] ?? 0) + ($statsKemarin['kosong'] ?? 0);
        $persenKemarin = $totalKemarin > 0 ? round(($hadirKemarin / $totalKemarin) * 100, 1) : 0;

        return response()->json([
            'success' => true,
            'data'    => [
                'total_siswa'  => $totalSiswa,
                'total_guru'   => $totalGuru,
                'hadir'        => $hadir,
                'pending'      => $pending,
                'izin_sakit'   => $izinSakit,
                'alpha'        => $alpha,
                'kosong'       => $kosong,
                'persen_hadir' => $persenHadir,
                'delta_hadir'  => round($persenHadir - $persenKemarin, 1),
            ],
        ]);
    }

    // ============================================================
    // 4. INSIGHT OTOMATIS — 6 insight lengkap
    // ============================================================
    public function insightOtomatis()
    {
        $insights = [];
        $hariIni  = Carbon::today();
        $tanggal  = $hariIni->toDateString();

        // ── Insight 1: Tren minggu ini vs minggu lalu ────────
        $mingguIni  = Presensi::whereBetween('tanggal', [$hariIni->copy()->subDays(6)->toDateString(), $tanggal])->get();
        $mingguLalu = Presensi::whereBetween('tanggal', [$hariIni->copy()->subDays(13)->toDateString(), $hariIni->copy()->subDays(7)->toDateString()])->get();

        $hadirIni  = $mingguIni->count()  > 0 ? ($mingguIni->where('status',  'hadir')->count() / $mingguIni->count())  * 100 : 0;
        $hadirLalu = $mingguLalu->count() > 0 ? ($mingguLalu->where('status', 'hadir')->count() / $mingguLalu->count()) * 100 : 0;
        $diffHadir = round($hadirIni - $hadirLalu, 1);

        if ($diffHadir > 0)     $insights[] = ['type' => 'positive', 'title' => 'Tren Kehadiran Membaik',  'message' => "Kehadiran sekolah minggu ini naik {$diffHadir}% dibandingkan minggu lalu. Pertahankan!"];
        elseif ($diffHadir < 0) $insights[] = ['type' => 'negative', 'title' => 'Tren Kehadiran Menurun', 'message' => "Kehadiran minggu ini turun " . abs($diffHadir) . "% dari minggu lalu. Perlu evaluasi."];
        else                    $insights[] = ['type' => 'neutral',  'title' => 'Kehadiran Stabil',        'message' => "Tingkat kehadiran konsisten dibandingkan minggu lalu."];

        // ── Insight 2: Kelas dengan kehadiran sempurna hari ini ──
        $kelasHariIni = Presensi::where('tanggal', $tanggal)
            ->select('kelas_id', 'status', DB::raw('count(*) as total'))
            ->groupBy('kelas_id', 'status')
            ->get()
            ->groupBy('kelas_id');

        $kelasSempurna = [];
        foreach ($kelasHariIni as $kId => $rows) {
            $totalHadir = $rows->where('status', 'hadir')->sum('total');
            $totalAlpha = $rows->where('status', 'alpha')->sum('total');
            $totalKosong = $rows->where('status', 'kosong')->sum('total');
            $totalSemua = $rows->sum('total');
            if ($totalSemua > 0 && $totalAlpha === 0 && $totalKosong === 0 && $totalHadir > 0) {
                $namaK = Kelas::find($kId)?->nama_kelas ?? "Kelas #$kId";
                $kelasSempurna[] = $namaK;
            }
        }
        if (count($kelasSempurna) > 0) {
            $daftarKelas = implode(', ', array_slice($kelasSempurna, 0, 3));
            $lebih = count($kelasSempurna) > 3 ? ' +' . (count($kelasSempurna) - 3) . ' lainnya' : '';
            $insights[] = [
                'type'    => 'positive',
                'title'   => '🏆 Kehadiran Sempurna!',
                'message' => count($kelasSempurna) . " kelas hadir 100% hari ini: {$daftarKelas}{$lebih}. Berikan apresiasi!",
            ];
        }

        // ── Insight 3: Hari dengan kehadiran terendah dalam 7 hari ──
        $presensiMinggu = Presensi::whereBetween('tanggal', [$hariIni->copy()->subDays(6)->toDateString(), $tanggal])
            ->select('tanggal', 'status', DB::raw('count(*) as total'))
            ->groupBy('tanggal', 'status')
            ->get()
            ->groupBy('tanggal');

        $persenPerHari = [];
        foreach ($presensiMinggu as $tgl => $rows) {
            $h  = $rows->where('status', 'hadir')->sum('total');
            $tot = $rows->whereNotIn('status', ['kosong', 'pending'])->sum('total');
            if ($tot > 0) $persenPerHari[$tgl] = round(($h / $tot) * 100, 1);
        }

        if (count($persenPerHari) >= 2) {
            $tglTerendah  = array_key_first(array_filter($persenPerHari, fn($v) => $v === min($persenPerHari)));
            $persen       = min($persenPerHari);
            $namaHari     = Carbon::parse($tglTerendah)->translatedFormat('l, d M');
            if ($tglTerendah !== $tanggal && $persen < 80) {
                $insights[] = [
                    'type'    => 'warning',
                    'title'   => 'Pola Hari Rawan Bolos',
                    'message' => "Kehadiran terendah minggu ini terjadi pada {$namaHari} ({$persen}%). Waspadai pola absensi di hari tersebut.",
                ];
            }
        }

        // ── Insight 4: Alpha tren memburuk ──
        $alphaMingguIni  = $mingguIni->where('status', 'alpha')->count();
        $alphaMingguLalu = $mingguLalu->where('status', 'alpha')->count();
        $diffAlpha       = $alphaMingguIni - $alphaMingguLalu;

        if ($alphaMingguIni > 0 && $diffAlpha > 3) {
            $insights[] = [
                'type'    => 'negative',
                'title'   => 'Lonjakan Kasus Alpha',
                'message' => "Kasus alpha minggu ini meningkat {$diffAlpha} kasus dibanding minggu lalu ({$alphaMingguIni} vs {$alphaMingguLalu}). Segera tindak lanjut ke BK.",
            ];
        } elseif ($alphaMingguIni > 0 && $diffAlpha < -3) {
            $insights[] = [
                'type'    => 'positive',
                'title'   => 'Alpha Berhasil Ditekan',
                'message' => "Kasus alpha minggu ini berkurang " . abs($diffAlpha) . " kasus dibanding minggu lalu. Program disiplin efektif!",
            ];
        }

        // ── Insight 5: Siswa sering izin berulang ──
        $izinBerulang = Presensi::with('siswa')
            ->whereIn('status', ['izin', 'sakit'])
            ->whereBetween('tanggal', [$hariIni->copy()->subDays(13)->toDateString(), $tanggal])
            ->select('siswa_id', DB::raw('count(*) as total'))
            ->groupBy('siswa_id')
            ->having('total', '>=', 1)
            ->orderBy('total', 'desc')
            ->get();

        if ($izinBerulang->count() > 0) {
            $top      = $izinBerulang->first();
            $namaSiswa = $top->siswa->nama_lengkap ?? 'Seorang siswa';
            $jumlah    = $izinBerulang->count();
            $insights[] = [
                'type'    => 'warning',
                'title'   => 'Izin Berulang Terdeteksi',
                'message' => "{$jumlah} siswa izin/sakit ≥2x dalam 14 hari terakhir. Tertinggi: {$namaSiswa} ({$top->total}x). Rekomendasikan konsultasi BK.",
            ];
        }

        // ── Insight 6: Peringatan draft/kosong masih tinggi ──
        $totalKosong = Presensi::where('tanggal', $tanggal)->whereIn('status', ['kosong', 'pending'])->count();
        $totalPresensiHariIni = Presensi::where('tanggal', $tanggal)->count();

        if ($totalPresensiHariIni > 0) {
            $persenKosong = round(($totalKosong / $totalPresensiHariIni) * 100, 1);
            if ($persenKosong >= 20) {
                $insights[] = [
                    'type'    => 'warning',
                    'title'   => 'Banyak Presensi Belum Divalidasi',
                    'message' => "{$persenKosong}% presensi hari ini ({$totalKosong} siswa) masih berstatus kosong/pending. Ingatkan wali kelas untuk segera memvalidasi.",
                ];
            }
        }

        // ── Kelas rawan alpha (7 hari) ──
        $alphaTerbanyak = Presensi::with('kelas')
            ->where('status', 'alpha')
            ->whereBetween('tanggal', [$hariIni->copy()->subDays(6)->toDateString(), $tanggal])
            ->select('kelas_id', DB::raw('count(*) as total'))
            ->groupBy('kelas_id')->orderBy('total', 'desc')->first();

        if ($alphaTerbanyak && $alphaTerbanyak->total > 0) {
            $namaKelas = $alphaTerbanyak->kelas->nama_kelas ?? 'Suatu Kelas';
            $insights[] = [
                'type'    => 'warning',
                'title'   => 'Kelas Rawan Alpha (BK)',
                'message' => "{$namaKelas} tercatat {$alphaTerbanyak->total} kasus alpha dalam 7 hari terakhir. Prioritaskan pembinaan di kelas ini.",
            ];
        }

        return response()->json(['success' => true, 'data' => $insights]);
    }

    // ============================================================
    // 5. USER ONLINE
    // ============================================================
    public function penggunaOnline()
    {
        $onlineUsers = DB::table('personal_access_tokens')
            ->join('users', 'personal_access_tokens.tokenable_id', '=', 'users.id')
            ->where('last_used_at', '>=', Carbon::now()->subMinutes(15))
            ->select('users.name', 'users.role', 'personal_access_tokens.last_used_at')
            ->orderBy('last_used_at', 'desc')
            ->get()->unique('name')->values();

        $data = $onlineUsers->map(function ($user) {
            $diff = Carbon::parse($user->last_used_at)->diffForHumans();
            $diff = str_replace([' seconds ago', ' minutes ago', ' minute ago'], [' dtk lalu', ' mnt lalu', ' mnt lalu'], $diff);
            return ['nama' => $user->name, 'role' => $user->role, 'terakhir_aktif' => $diff];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    // ============================================================
    // 6. LEADERBOARD
    // ============================================================
    public function leaderboard()
    {
        $kelas       = Kelas::all();
        $leaderboard = [];

        foreach ($kelas as $k) {
            $presensiKelas = Presensi::with('siswa')->where('kelas_id', $k->id)->whereNotIn('status', ['kosong', 'pending'])->get();
            $totalPresensi = $presensiKelas->count();

            if ($totalPresensi > 0) {
                $hadir = $presensiKelas->where('status', 'hadir')->count();
                $alpha = $presensiKelas->where('status', 'alpha')->count();

                $topHadir     = $presensiKelas->where('status', 'hadir')->groupBy('siswa_id')->sortByDesc(fn($i) => $i->count())->first();
                $bintangHadir = $topHadir ? explode(' ', trim($topHadir->first()->siswa->nama_lengkap ?? '-'))[0] : '-';

                $topAlpha     = $presensiKelas->where('status', 'alpha')->groupBy('siswa_id')->sortByDesc(fn($i) => $i->count())->first();
                $bintangAlpha = $topAlpha ? explode(' ', trim($topAlpha->first()->siswa->nama_lengkap ?? '-'))[0] : '-';

                $leaderboard[] = [
                    'nama_kelas'    => $k->nama_kelas,
                    'persen_hadir'  => round(($hadir / $totalPresensi) * 100),
                    'total_alpha'   => $alpha,
                    'bintang_hadir' => $bintangHadir,
                    'bintang_alpha' => $bintangAlpha,
                ];
            }
        }

        $terdisiplin     = $leaderboard;
        $terbanyak_alpha = $leaderboard;
        usort($terdisiplin,     fn($a, $b) => $b['persen_hadir'] <=> $a['persen_hadir']);
        usort($terbanyak_alpha, fn($a, $b) => $b['total_alpha']  <=> $a['total_alpha']);

        return response()->json(['success' => true, 'data' => [
            'terdisiplin'   => array_slice($terdisiplin,     0, 3),
            'darurat_alpha' => array_slice($terbanyak_alpha, 0, 3),
        ]]);
    }

    // ============================================================
    // 7. HEATMAP KEHADIRAN MINGGUAN
    // ============================================================
    public function heatmapKehadiran()
    {
        $hariIni     = Carbon::today();
        $startOfWeek = $hariIni->copy()->startOfWeek(Carbon::MONDAY);
        $hariLabel   = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

        $rawData = Presensi::whereBetween('tanggal', [$startOfWeek->toDateString(), $hariIni->toDateString()])
            ->select('kelas_id', 'tanggal', 'status', DB::raw('count(*) as total'))
            ->groupBy('kelas_id', 'tanggal', 'status')->get();

        $kelasList = Kelas::all()->keyBy('id');
        $result    = [];

        foreach ($kelasList as $kelasId => $kelas) {
            $row = ['kelas' => $kelas->nama_kelas, 'data' => []];
            for ($d = 0; $d < 6; $d++) {
                $tgl     = $startOfWeek->copy()->addDays($d)->toDateString();
                $hariKey = $hariLabel[$d];
                if (Carbon::parse($tgl)->gt($hariIni)) { $row['data'][$hariKey] = null; continue; }
                $dataHari   = $rawData->where('kelas_id', $kelasId)->where('tanggal', $tgl);
                $totalHadir = $dataHari->where('status', 'hadir')->sum('total');
                $totalAll   = $dataHari->whereNotIn('status', ['kosong', 'pending'])->sum('total');
                $row['data'][$hariKey] = $totalAll > 0 ? round(($totalHadir / $totalAll) * 100) : 0;
            }
            $result[] = $row;
        }

        return response()->json(['success' => true, 'data' => $result]);
    }
}