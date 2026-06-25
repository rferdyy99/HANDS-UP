<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('presensi', function (Blueprint $table) {
            if (!Schema::hasColumn('presensi', 'kelas_id')) {
                $table->foreignId('kelas_id')->nullable()->after('siswa_id');
            }
            
            if (!Schema::hasColumn('presensi', 'is_validated')) {
                $table->boolean('is_validated')->default(false)->after('status');
            }
            
            if (!Schema::hasColumn('presensi', 'validated_at')) {
                $table->timestamp('validated_at')->nullable()->after('is_validated');
            }
            
            if (!Schema::hasColumn('presensi', 'divalidasi_oleh')) {
                $table->foreignId('divalidasi_oleh')->nullable()->after('validated_at');
            }
        });

        // SOLUSI ERROR: Ubah dulu semua data 'terlambat' menjadi 'hadir' (atau alpha) agar MySQL tidak bingung
        DB::table('presensi')->where('status', 'terlambat')->update(['status' => 'hadir']);

        // Setelah bersih, baru kita ubah opsi ENUM-nya!
        DB::statement("ALTER TABLE presensi MODIFY COLUMN status ENUM('kosong', 'hadir', 'izin', 'sakit', 'alpha') DEFAULT 'kosong'");
    }

    public function down(): void
    {
        Schema::table('presensi', function (Blueprint $table) {
            $table->dropColumn(['kelas_id', 'is_validated', 'validated_at', 'divalidasi_oleh']);
        });
        
        DB::statement("ALTER TABLE presensi MODIFY COLUMN status ENUM('hadir', 'terlambat', 'izin', 'sakit', 'alpha') DEFAULT 'hadir'");
    }
};