<?php

namespace App\Imports;

use App\Models\User;
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\Kelas;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\WithValidation;

class PenggunaImport implements ToModel, WithHeadingRow, WithValidation
{
    private $rowNumber = 0;
    private $errors = [];

    /**
     * Validasi per baris Excel SEBELUM data diproses
     */
    public function rules(): array
    {
        return [
            'nama' => 'required|string|max:255',
            'email' => 'required|email',
            'role' => 'required|in:siswa,guru',
            
            // PERBAIKAN: Wajib persis 10 digit
            'nomor_induk' => [
                'required',
                'numeric',
                'digits:10' // <--- Aturan wajib 10 angka
            ],
            
            'jenis_kelamin' => 'nullable|in:L,P',
            'nama_kelas' => 'nullable|string',
        ];
    }

    /**
     * Custom message error validasi
     */
    public function customValidationMessages()
    {
        return [
            'nomor_induk.required' => 'Nomor induk wajib diisi',
            'nomor_induk.numeric' => 'Nomor induk harus berupa angka',
            'nomor_induk.digits' => 'Nomor induk (NIS/NIP) di Excel WAJIB terdiri dari tepat 10 angka', // <--- Pesan custom
            'role.required' => 'Role wajib diisi (siswa/guru)',
            'role.in' => 'Role harus diisi "siswa" atau "guru"',
        ];
    }

    public function model(array $row)
    {
        $this->rowNumber++;

        // Bersihkan NIP/NIS dari spasi
        $nomorInduk = trim($row['nomor_induk'] ?? '');
        
        // PERBAIKAN: Jika bukan persis 10 digit, tolak mentah-mentah!
        if (strlen($nomorInduk) !== 10) {
            throw new \Exception(
                "Baris {$this->rowNumber} ({$row['nama']}): NIP/NIS '{$nomorInduk}' HARUS TEPAT 10 digit. " .
                "Panjang yang terdeteksi: " . strlen($nomorInduk) . " digit. Harap perbaiki file Excel."
            );
        }

        if (empty($row['nama']) || empty($row['email'])) {
            return null;
        }

        $role = strtolower(trim($row['role']));
        if (!in_array($role, ['siswa', 'guru'])) {
            throw new \Exception("Baris {$this->rowNumber}: Role harus 'siswa' atau 'guru'. Ditemukan: '{$role}'");
        }

        // Cek duplikasi NIP/NIS UNIK di database
        if ($role === 'siswa') {
            $existingSiswa = Siswa::where('nis', $nomorInduk)->first();
            if ($existingSiswa) {
                $existingUser = User::find($existingSiswa->user_id);
                if ($existingUser && $existingUser->email !== trim($row['email'])) {
                    throw new \Exception(
                        "Baris {$this->rowNumber} ({$row['nama']}): NIS '{$nomorInduk}' " .
                        "sudah digunakan oleh {$existingUser->name} (email: {$existingUser->email})"
                    );
                }
            }
        } elseif ($role === 'guru') {
            $existingGuru = Guru::where('nip', $nomorInduk)->first();
            if ($existingGuru) {
                $existingUser = User::find($existingGuru->user_id);
                if ($existingUser && $existingUser->email !== trim($row['email'])) {
                    throw new \Exception(
                        "Baris {$this->rowNumber} ({$row['nama']}): NIP '{$nomorInduk}' " .
                        "sudah digunakan oleh {$existingUser->name} (email: {$existingUser->email})"
                    );
                }
            }
        }

        $user = User::where('email', $row['email'])->first();
        
        $password = !empty($row['password']) 
            ? Hash::make($row['password']) 
            : Hash::make('password123');

        if ($user) {
            $user->name = $row['nama'];
            if (!empty($row['password'])) {
                $user->password = $password;
            }
            $user->save();
        } else {
            $user = User::create([
                'name'     => $row['nama'],
                'email'    => $row['email'],
                'password' => $password,
                'role'     => $role,
            ]);
        }

        $jk = strtoupper(trim($row['jenis_kelamin'] ?? ''));
        if ($jk !== 'L' && $jk !== 'P') {
            $jk = null;
        }

        $domisili = !empty($row['alamat_domisili']) ? trim($row['alamat_domisili']) : null;

        $kelasId = null;
        $namaKelas = null;
        if (!empty($row['nama_kelas'])) {
            $namaKelas = trim($row['nama_kelas']);
            $kelas = Kelas::where('nama_kelas', 'like', $namaKelas)->first();
            if ($kelas) {
                $kelasId = $kelas->id;
            } else {
                throw new \Exception(
                    "Baris {$this->rowNumber} ({$row['nama']}): Kelas '{$namaKelas}' tidak ditemukan di database. " .
                    "Pastikan nama kelas sudah sesuai (contoh: XII RPL 1)"
                );
            }
        }

        if ($role === 'siswa') {
            $siswa = Siswa::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'nis'              => $nomorInduk,
                    'nama_lengkap'     => $row['nama'],
                    'kelas_id'         => $kelasId,
                    'jenis_kelamin'    => $jk,
                    'alamat_domisili'  => $domisili
                ]
            );
            
        } elseif ($role === 'guru') {
            $guru = Guru::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'nip'              => $nomorInduk,
                    'nama_lengkap'     => $row['nama'],
                    'jenis_kelamin'    => $jk,
                    'alamat_domisili'  => $domisili
                ]
            );

            if ($kelasId) {
                $cekKelas = Kelas::find($kelasId);
                
                if (!$cekKelas) {
                    throw new \Exception("Baris {$this->rowNumber}: Kelas dengan ID {$kelasId} tidak ditemukan");
                }
                
                if ($cekKelas->guru_id !== null && $cekKelas->guru_id != $guru->id) {
                    $guruLama = Guru::find($cekKelas->guru_id);
                    $namaGuruLama = $guruLama ? User::find($guruLama->user_id)->name : 'Tidak Diketahui';
                    
                    throw new \Exception(
                        "Baris {$this->rowNumber} ({$row['nama']}): " .
                        "Kelas {$cekKelas->nama_kelas} sudah memiliki guru validator/ pengampu, yaitu {$namaGuruLama}. " .
                        "Satu kelas hanya boleh memiliki satu guru pengampu. " .
                        "Silakan pilih kelas lain atau hapus guru pengampu yang lama terlebih dahulu."
                    );
                }

                Kelas::where('guru_id', $guru->id)
                    ->where('id', '!=', $kelasId)
                    ->update(['guru_id' => null]);
                    
                $cekKelas->update(['guru_id' => $guru->id]);
            }
        }

        return null;
    }
    
    public function onFailure(\Maatwebsite\Excel\Validators\Failure ...$failures)
    {
        $errorMessages = [];
        foreach ($failures as $failure) {
            $rowNumber = $failure->row();
            $errors = $failure->errors();
            $errorMessages[] = "Baris {$rowNumber}: " . implode(', ', $errors);
        }
        
        throw new \Exception("Validasi Excel gagal:\n" . implode("\n", $errorMessages));
    }
}