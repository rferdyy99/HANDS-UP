<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Rekapitulasi Presensi</title>
    <style>
        @page { margin: 40px 50px; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #334155; }
        
        .header-title { text-align: center; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 2px solid #cbd5e1; }
        .header-title h2 { margin: 0 0 5px 0; font-size: 18px; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
        .header-title p { margin: 0; color: #64748b; font-size: 11px; }
        
        .info-box { margin-bottom: 20px; font-size: 12px; }
        .info-box table { width: 100%; border: none; }
        .info-box td { padding: 2px 0; border: none; }
        .info-label { font-weight: bold; width: 120px; color: #475569; }
        
        .table-data { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table-data th, .table-data td { border: 1px solid #cbd5e1; padding: 10px 8px; }
        .table-data th { background-color: #f8fafc; font-weight: bold; color: #1e293b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
        .table-data tbody tr:nth-child(even) { background-color: #fbfcfd; }
        
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        
        /* Badges for PDF Print */
        .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 9px; text-transform: uppercase; }
        .bg-hadir { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .bg-izin { background-color: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        .bg-sakit { background-color: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
        .bg-alpha { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        
        .summary-row { background-color: #f1f5f9; font-weight: bold; }
    </style>
</head>
<body>

    <div class="header-title">
        <h2>Laporan Presensi {{ $mode == 'individu' ? 'Siswa' : 'Kelas' }}</h2>
        <p>Digenerate oleh Sistem Presensi pada {{ date('d M Y, H:i') }} WIB</p>
    </div>

    <div class="info-box">
        <table>
            <tr>
                <td class="info-label">Periode Laporan</td>
                <td>: <strong>{{ strtoupper($range) }}</strong></td>
            </tr>
            @if($mode == 'individu' && count($data) > 0)
                @php $siswa = $data->first()->siswa; @endphp
                <tr>
                    <td class="info-label">Nama Lengkap</td>
                    <td>: <strong>{{ $siswa->nama_lengkap ?? '-' }}</strong></td>
                </tr>
                <tr>
                    <td class="info-label">Nomor Induk Siswa</td>
                    <td>: <strong>{{ $siswa->nis ?? '-' }}</strong></td>
                </tr>
            @endif
        </table>
    </div>

    <table class="table-data">
        <thead>
            @if($mode == 'kelas')
                <tr>
                    <th width="5%" class="text-center">No</th>
                    <th width="15%" class="text-center">NIS</th>
                    <th class="text-left">Nama Siswa</th>
                    <th width="10%" class="text-center">Hadir</th>
                    <th width="10%" class="text-center">Izin</th>
                    <th width="10%" class="text-center">Sakit</th>
                    <th width="10%" class="text-center">Alpha</th>
                </tr>
            @else
                <tr>
                    <th width="5%" class="text-center">No</th>
                    <th width="25%" class="text-center">Tanggal</th>
                    <th width="25%" class="text-center">Jam Masuk</th>
                    <th width="25%" class="text-center">Status Kehadiran</th>
                </tr>
            @endif
        </thead>
        <tbody>
            @foreach($data as $index => $item)
                @if($mode == 'kelas')
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td class="text-center">{{ $item['nis'] }}</td>
                        <td>{{ $item['nama_lengkap'] }}</td>
                        <td class="text-center font-bold" style="color: #059669;">{{ $item['hadir'] }}</td>
                        <td class="text-center font-bold" style="color: #2563eb;">{{ $item['izin'] }}</td>
                        <td class="text-center font-bold" style="color: #d97706;">{{ $item['sakit'] }}</td>
                        <td class="text-center font-bold" style="color: #dc2626;">{{ $item['alpha'] }}</td>
                    </tr>
                @else
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td class="text-center">{{ date('d F Y', strtotime($item->tanggal)) }}</td>
                        <td class="text-center">{{ $item->jam_masuk ? date('H:i', strtotime($item->jam_masuk)) . ' WIB' : '-' }}</td>
                        <td class="text-center">
                            @if($item->status == 'hadir' || $item->status == 'terlambat')
                                <span class="badge bg-hadir">Hadir</span>
                            @elseif($item->status == 'izin')
                                <span class="badge bg-izin">Izin</span>
                            @elseif($item->status == 'sakit')
                                <span class="badge bg-sakit">Sakit</span>
                            @else
                                <span class="badge bg-alpha">Alpha</span>
                            @endif
                        </td>
                    </tr>
                @endif
            @endforeach
        </tbody>
        
        @if($mode == 'individu' && count($data) > 0)
            @php
                $hadir = $data->whereIn('status', ['hadir', 'terlambat'])->count();
                $izin = $data->where('status', 'izin')->count();
                $sakit = $data->where('status', 'sakit')->count();
                $alpha = $data->where('status', 'alpha')->count();
            @endphp
            <tfoot>
                <tr class="summary-row">
                    <td colspan="3" class="text-right" style="padding-right: 15px;"><strong>TOTAL REKAPITULASI:</strong></td>
                    <td class="text-center">
                        <span style="color: #059669;">H: {{ $hadir }}</span> | 
                        <span style="color: #2563eb;">I: {{ $izin }}</span> | 
                        <span style="color: #d97706;">S: {{ $sakit }}</span> | 
                        <span style="color: #dc2626;">A: {{ $alpha }}</span>
                    </td>
                </tr>
            </tfoot>
        @endif
    </table>

</body>
</html>