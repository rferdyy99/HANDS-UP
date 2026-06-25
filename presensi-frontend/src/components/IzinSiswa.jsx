import { useState } from "react";
import api from "../utils/api";
import toast from 'react-hot-toast'; // Menggunakan Toast agar seragam
import { 
    FiFileText, FiSend, FiInfo, 
    FiUploadCloud, FiThermometer, FiBriefcase, 
    FiRefreshCw, FiFile, FiCheck
} from "react-icons/fi";

export default function IzinSiswa() {
    const [jenis, setJenis] = useState("sakit");
    const [keterangan, setKeterangan] = useState("");
    const [bukti, setBukti] = useState(null);
    const [preview, setPreview] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fungsi untuk menangani upload file (Mendukung Gambar & PDF)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validasi ukuran (Maksimal 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Ukuran file terlalu besar. Maksimal 2MB.");
                resetFileInput();
                return;
            }

            // Validasi tipe file
            if (file.type.startsWith('image/')) {
                setFileType('image');
                setPreview(URL.createObjectURL(file));
            } else if (file.type === 'application/pdf') {
                setFileType('pdf');
                setPreview(file.name); // Hanya tampilkan nama file untuk PDF
            } else {
                toast.error("Format file tidak didukung. Harap upload JPG/PNG atau PDF.");
                resetFileInput();
                return;
            }

            setBukti(file);
        }
    };

    const resetFileInput = () => {
        setBukti(null);
        setPreview(null);
        setFileType(null);
        const fileInput = document.getElementById("bukti-file");
        if (fileInput) fileInput.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!keterangan.trim()) {
            toast.error("Alasan atau keterangan spesifik wajib diisi!");
            return;
        }

        if (!bukti) {
            toast.error("Bukti foto atau surat dokter wajib diunggah!");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("jenis", jenis); 
            formData.append("keterangan", keterangan);
            formData.append("bukti_foto", bukti); 
            
            // Tanggal otomatis dikunci dari backend (hari ini)
            const response = await api.post('/izin', formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            toast.success(response.data.message || "Pengajuan izin berhasil dikirim!");
            
            // Reset form
            setKeterangan("");
            resetFileInput();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal mengirim pengajuan. Coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 animate-fadeIn max-w-[1400px] mx-auto pb-24 md:pb-10 relative xl:min-h-[calc(100vh-100px)]">
            
            {/* =========================================================
                HERO BANNER MODERN (Diselaraskan)
            ========================================================= */}
            <div className="w-full h-auto md:h-32 rounded-2xl overflow-hidden relative shadow-sm border border-slate-200 group shrink-0 flex flex-col justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-indigo-900/80 to-slate-900/90 z-10"></div>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] z-10"></div>
                <img 
                    src="src/assets/edu-bg.jpg" 
                    alt="Educational Background" 
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 opacity-50"
                    onError={(e) => { e.target.style.display = 'none'; }} 
                />
                
                <div className="relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center w-full p-4 md:p-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white shadow-sm hidden sm:flex">
                            <FiFileText className="w-5 h-5 text-lime-300" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md mb-0.5">Pengajuan Izin</h2>
                            <p className="text-[10px] md:text-xs font-medium text-blue-100 drop-shadow-sm max-w-sm">Ajukan ketidakhadiran khusus untuk hari ini beserta bukti lampiran.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* KONTEN UTAMA */}
            <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                
                {/* Form dipisah jadi 2 Kolom (Grid) di Laptop 
                    - Kiri: Kategori + Alasan
                    - Kanan: Upload + Tombol Submit
                */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                    
                    {/* KOLOM KIRI (7/12) */}
                    <div className="lg:col-span-7 flex flex-col gap-8">
                        
                        {/* 1. Pemilihan Jenis (Radio Cards Interaktif) */}
                        <div className="flex flex-col gap-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                <div className="p-1 bg-blue-100 text-blue-600 rounded-md"><FiInfo /></div>
                                Kategori Kehadiran
                            </label>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {/* Card Sakit */}
                                <label className={`relative flex flex-col items-center gap-3 p-5 md:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                                    jenis === 'sakit' 
                                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-lg shadow-blue-600/20 md:scale-[1.02]' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                                }`}>
                                    <input type="radio" name="jenis" value="sakit" checked={jenis === 'sakit'} onChange={() => setJenis('sakit')} className="sr-only" />
                                    <div className={`p-3.5 md:p-4 rounded-full transition-colors ${jenis === 'sakit' ? 'bg-blue-600 text-white shadow-md' : 'bg-white shadow-sm border border-slate-100'}`}>
                                        <FiThermometer className="text-2xl md:text-3xl" />
                                    </div>
                                    <span className="font-black tracking-wide text-sm md:text-base">Sakit</span>
                                    {jenis === 'sakit' && (
                                        <div className="absolute top-4 right-4 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-md animate-fadeIn">
                                            <FiCheck className="text-white w-3 h-3" />
                                        </div>
                                    )}
                                </label>

                                {/* Card Izin */}
                                <label className={`relative flex flex-col items-center gap-3 p-5 md:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                                    jenis === 'izin' 
                                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-lg shadow-indigo-600/20 md:scale-[1.02]' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                                }`}>
                                    <input type="radio" name="jenis" value="izin" checked={jenis === 'izin'} onChange={() => setJenis('izin')} className="sr-only" />
                                    <div className={`p-3.5 md:p-4 rounded-full transition-colors ${jenis === 'izin' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white shadow-sm border border-slate-100'}`}>
                                        <FiBriefcase className="text-2xl md:text-3xl" />
                                    </div>
                                    <span className="font-black tracking-wide text-sm md:text-base">Izin Khusus</span>
                                    {jenis === 'izin' && (
                                        <div className="absolute top-4 right-4 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-md animate-fadeIn">
                                            <FiCheck className="text-white w-3 h-3" />
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* 2. Detail Keterangan */}
                        <div className="flex flex-col gap-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                <div className="p-1 bg-slate-100 text-slate-500 rounded-md"><FiFileText /></div>
                                Alasan Spesifik
                            </label>
                            <textarea 
                                rows="5"
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                placeholder={jenis === 'sakit' ? "Misal: Mengalami demam tinggi dan flu, surat keterangan dokter terlampir..." : "Misal: Menghadiri acara pernikahan keluarga inti di luar kota, mohon kebijaksanaannya..."}
                                className="w-full p-4 md:p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none shadow-inner"
                            ></textarea>
                        </div>
                    </div>

                    {/* KOLOM KANAN (5/12) */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        
                        {/* 3. Upload Area Premium */}
                        <div className="flex flex-col gap-3 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="p-1 bg-amber-100 text-amber-600 rounded-md"><FiUploadCloud /></div>
                                    Lampiran Bukti
                                </label>
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg tracking-wider w-max">
                                    JPG/PNG/PDF (Maks 2MB)
                                </span>
                            </div>
                            
                            <div className="relative flex-1 min-h-[220px] lg:min-h-0 flex">
                                <input 
                                    type="file" 
                                    id="bukti-file" 
                                    accept="image/*,.pdf" 
                                    onChange={handleFileChange} 
                                    className="sr-only" 
                                />
                                <label 
                                    htmlFor="bukti-file" 
                                    className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden relative group ${
                                        preview ? 'border-blue-500 bg-blue-50/30' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400'
                                    }`}
                                >
                                    {preview ? (
                                        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 gap-4 min-h-[200px]">
                                            {fileType === 'image' ? (
                                                <img src={preview} alt="Preview Bukti" className="max-h-40 w-auto object-contain rounded-xl shadow-sm border border-slate-200" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 text-rose-500">
                                                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm">
                                                        <FiFile className="w-10 h-10" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700 text-center px-4 line-clamp-2">{preview}</span>
                                                </div>
                                            )}
                                            
                                            {/* Hover Overlay untuk Ganti File */}
                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                <span className="text-white font-bold flex items-center gap-2 bg-slate-800/80 px-5 py-2.5 rounded-xl text-sm">
                                                    <FiRefreshCw className="animate-spin-slow" /> Ganti Dokumen
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 text-slate-400 min-h-[200px]">
                                            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-md">
                                                <FiUploadCloud className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
                                            </div>
                                            <p className="text-sm font-black text-slate-600 mb-1">Ketuk untuk Memilih File</p>
                                            <p className="text-[10px] md:text-[11px] font-medium text-center px-6">Unggah Surat Keterangan Dokter atau Bukti Pendukung Lainnya</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Tombol Eksekusi Raksasa */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-black text-sm md:text-base uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 mt-2 shrink-0 ${
                                loading 
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 active:scale-95 border border-blue-500"
                            }`}
                        >
                            {loading ? <FiRefreshCw className="w-5 h-5 animate-spin" /> : <FiSend className="w-5 h-5" />}
                            {loading ? "MENGIRIM PENGAJUAN..." : "KIRIM PENGAJUAN IZIN"}
                        </button>

                    </div>
                </form>
            </div>
        </div>
    );
}