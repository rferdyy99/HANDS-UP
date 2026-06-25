<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\Kelas;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PenggunaController extends Controller
{
    public function index()
    {
        $users = User::with(['siswa.kelas', 'guru.kelas']) 
                ->where('role', '!=', 'admin')
                ->orderBy('created_at', 'desc')
                ->get();
                
        return response()->json([
            'success' => true, 
            'data' => $users
        ]);
    }

    public function profil()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $user->load(['siswa.kelas', 'guru.kelas']);
        
        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    public function store(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'required|in:siswa,guru',
            
            'nis' => [
                'required_if:role,siswa',
                'nullable',
                'numeric',
                'digits:10', // <--- Wajib 10 angka persis
                'unique:siswa,nis',
            ],
            'kelas_id' => 'required_if:role,siswa',
            
            'nip' => [
                'required_if:role,guru',
                'nullable',
                'numeric',
                'digits:10', // <--- Wajib 10 angka persis
                'unique:guru,nip',
            ],
            'kelas_wali_id' => 'required_if:role,guru', 
            
            'jenis_kelamin' => 'nullable|in:L,P',
            'alamat_domisili' => 'nullable|string',
        ]);

        if ($request->role === 'guru' && $request->kelas_wali_id) {
            $cekKelas = Kelas::find($request->kelas_wali_id);
            if ($cekKelas && $cekKelas->guru_id !== null) {
                return response()->json([
                    'success' => false, 
                    'message' => "Gagal! Kelas {$cekKelas->nama_kelas} sudah memiliki Guru Pengampu/Validator."
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $request->name, 
                'email' => $request->email,
                'password' => Hash::make($request->password), 
                'role' => $request->role,
            ]);

            if ($request->role === 'siswa') {
                Siswa::create([
                    'user_id' => $user->id, 
                    'kelas_id' => $request->kelas_id, 
                    'nis' => $request->nis, 
                    'nama_lengkap' => $request->name,
                    'jenis_kelamin' => $request->jenis_kelamin,
                    'alamat_domisili' => $request->alamat_domisili,
                    'foto' => null 
                ]);
            } else if ($request->role === 'guru') {
                $guru = Guru::create([
                    'user_id' => $user->id, 
                    'nip' => $request->nip, 
                    'nama_lengkap' => $request->name,
                    'jenis_kelamin' => $request->jenis_kelamin,
                    'alamat_domisili' => $request->alamat_domisili,
                    'foto' => null 
                ]);
                
                if($request->kelas_wali_id) {
                    Kelas::where('id', $request->kelas_wali_id)->update(['guru_id' => $guru->id]);
                }
            }
            
            DB::commit();
            return response()->json(['success' => true, 'message' => 'Pengguna berhasil ditambahkan']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request,int $id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$id,
            'kelas_wali_id' => 'required_if:role,guru', 

            'nis' => [
                'required_if:role,siswa',
                'nullable',
                'numeric',
                'digits:10', 
                'unique:siswa,nis,' . ($user->siswa->id ?? 'NULL'),
            ],
            'nip' => [
                'required_if:role,guru',
                'nullable',
                'numeric',
                'digits:10', 
                'unique:guru,nip,' . ($user->guru->id ?? 'NULL'),
            ],
            
            'jenis_kelamin' => 'nullable|in:L,P',
            'alamat_domisili' => 'nullable|string',
        ]);

        if ($user->role === 'guru' && $request->kelas_wali_id) {
            $guru = Guru::where('user_id', $user->id)->first();
            $cekKelas = Kelas::find($request->kelas_wali_id);
            
            if ($cekKelas && $cekKelas->guru_id !== null && $cekKelas->guru_id !== $guru->id) {
                return response()->json([
                    'success' => false, 
                    'message' => "Gagal Update! Kelas {$cekKelas->nama_kelas} sudah diampu oleh guru lain."
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            $user->update([
                'name' => $request->name, 
                'email' => $request->email
            ]);
            
            if ($request->password) {
                $user->update(['password' => Hash::make($request->password)]);
            }

            if ($user->role === 'siswa') {
                Siswa::where('user_id', $user->id)->update([
                    'nis' => $request->nis, 
                    'kelas_id' => $request->kelas_id, 
                    'nama_lengkap' => $request->name,
                    'jenis_kelamin' => $request->jenis_kelamin,
                    'alamat_domisili' => $request->alamat_domisili
                ]);
            } else if ($user->role === 'guru') {
                $guru = Guru::where('user_id', $user->id)->first();
                $guru->update([
                    'nip' => $request->nip, 
                    'nama_lengkap' => $request->name,
                    'jenis_kelamin' => $request->jenis_kelamin,
                    'alamat_domisili' => $request->alamat_domisili
                ]);

                Kelas::where('guru_id', $guru->id)->update(['guru_id' => null]);
                if($request->kelas_wali_id){
                    Kelas::where('id', $request->kelas_wali_id)->update(['guru_id' => $guru->id]);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Data pengguna berhasil diupdate']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateProfilDetail(Request $request)
    {
        $request->validate([
            'jenis_kelamin'   => 'nullable|in:L,P',
            'alamat_domisili' => 'nullable|string',
            'foto'            => 'nullable|image|mimes:jpeg,png,jpg|max:2048' 
        ]);

        $user = Auth::user();
        $profile = $user->role === 'guru' ? $user->guru : $user->siswa;

        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Profil tidak ditemukan'], 404);
        }

        if ($request->hasFile('foto')) {
            if ($profile->foto && Storage::disk('public')->exists($profile->foto)) {
                Storage::disk('public')->delete($profile->foto);
            }
            
            $path = $request->file('foto')->store('profiles', 'public');
            $profile->foto = $path;
        }

        if ($request->has('jenis_kelamin')) {
            $profile->jenis_kelamin = $request->jenis_kelamin;
        }
        
        if ($request->has('alamat_domisili')) {
            $profile->alamat_domisili = $request->alamat_domisili;
        }

        $profile->save();

        return response()->json([
            'success' => true, 
            'message' => 'Profil berhasil diperbarui!',
            'data' => $profile->fresh()
        ]);
    }

    public function destroy(int $id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        if ($user->role === 'siswa') {
            $profile = Siswa::where('user_id', $user->id)->first();
        } else if ($user->role === 'guru') {
            $profile = Guru::where('user_id', $user->id)->first();
        }

        if (isset($profile) && $profile->foto && Storage::disk('public')->exists($profile->foto)) {
            Storage::disk('public')->delete($profile->foto);
        }

        if(isset($profile)) {
            $profile->delete();
        }
        
        $user->delete();
        
        return response()->json(['success' => true, 'message' => 'Pengguna berhasil dihapus']);
    }

    public function ubahPassword(Request $request)
    {
        $request->validate([
            'password_lama' => 'required',
            'password_baru' => 'required|min:6',
        ]);

        $user = Auth::user();

        if (!Hash::check($request->password_lama, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi lama yang Anda masukkan salah.'
            ], 400);
        }

        $user->password = Hash::make($request->password_baru);
        /** @var \App\Models\Guru|\App\Models\Siswa $profile */
        $profile->save();

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui.'
        ]);
    }

    public function importExcel(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }

        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:5120', 
        ]);

        try {
            \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\PenggunaImport, $request->file('file'));
            
            return response()->json([
                'success' => true,
                'message' => 'Data berhasil diimport dan diupdate!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengimport data. Pastikan format kolom benar. Detail: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function downloadTemplate()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\TemplatePenggunaExport, 'Template_Data_Pengguna.xlsx');
    }
}