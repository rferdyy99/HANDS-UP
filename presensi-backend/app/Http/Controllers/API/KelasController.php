<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Kelas;
use Illuminate\Support\Facades\Auth;

class KelasController extends Controller
{
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
            $user = Auth::user();
            $user->load(['siswa.kelas', 'guru.kelas']);
        
        if ($user->role === 'guru') {
            $guru = \App\Models\Guru::where('user_id', $user->id)->first();
            
            if ($guru) {
                $kelas = \App\Models\Kelas::where('guru_id', $guru->id)->get();
            } else {
                $kelas = []; 
            }
        } else {
            $kelas = \App\Models\Kelas::all();
        }

        return response()->json([
            'success' => true, 
            'data' => $kelas
        ]);
    }

    public function store(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $request->validate([
            // Wajib berawalan X, XI, atau XII diikuti spasi
            'nama_kelas' => ['required', 'string', 'max:50', 'unique:kelas,nama_kelas', 'regex:/^(X|XI|XII)\s/i']
        ], [
            'nama_kelas.regex' => 'Format kelas tidak valid! Wajib berawalan Romawi (X, XI, XII) dan diikuti spasi. Contoh: XII RPL 1'
        ]);

        $kelas = Kelas::create(['nama_kelas' => strtoupper(trim($request->nama_kelas))]);

        return response()->json([
            'success' => true,
            'message' => 'Data kelas berhasil ditambahkan',
            'data' => $kelas
        ]);
    }

    public function update(Request $request, int $id)
    {
        if (Auth::user()->role !== 'admin') return response()->json(['message' => 'Akses ditolak'], 403);
        
        $request->validate([
            'nama_kelas' => ['required', 'string', 'max:50', 'regex:/^(X|XI|XII)\s/i']
        ], [
            'nama_kelas.regex' => 'Format kelas tidak valid! Wajib berawalan Romawi (X, XI, XII) dan diikuti spasi. Contoh: XII RPL 1'
        ]);

        $kelas = Kelas::find($id);
        
        if (!$kelas) return response()->json(['message' => 'Kelas tidak ditemukan'], 404);
        
        $kelas->update(['nama_kelas' => strtoupper(trim($request->nama_kelas))]);
        return response()->json(['success' => true, 'message' => 'Data kelas berhasil diupdate']);
    }

    public function destroy( int $id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        Kelas::destroy($id);

        return response()->json([
            'success' => true,
            'message' => 'Data kelas berhasil dihapus'
        ]);
    }

    public function importExcel(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:5120',
        ]);

        try {
            \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\KelasImport, $request->file('file'));
            
            return response()->json([
                'success' => true,
                'message' => 'Data Kelas berhasil diimport!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal import kelas. Detail: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download Template Excel Rapi (.xlsx) untuk Import Kelas
     */
    public function downloadTemplate()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\TemplateKelasExport, 'Template_Import_Kelas.xlsx');
    }
}