import { useEffect, useState } from "react";
import api from "../utils/api";
import toast from 'react-hot-toast'; 
import { 
    LuClipboardCheck, LuSave, LuRefreshCw, LuUserX, LuClock, LuImageOff
} from "react-icons/lu";
import { FiLock, FiUnlock, FiCheckCircle, FiLayers, FiAlertCircle, FiCheckSquare } from "react-icons/fi";

export default function ValidasiPresensi() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    const [kelasOptions, setKelasOptions] = useState([]);
    const [kelasId, setKelasId] = useState("");
    const [tanggal, setTanggal] = useState("");
    
    // Live Clock State
    const [waktuSekarang, setWaktuSekarang] = useState(new Date());

    // State Utama
    const [dataDraft, setDataDraft] = useState([]);
    const [isValidated, setIsValidated] = useState(false);
    const [isValidatingTime, setIsValidatingTime] = useState(false);
    
    // State UI & Modal
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [finalisasiModal, setFinalisasiModal] = useState(false);

    useEffect(() => {
        fetchKelas();
        
        const timer = setInterval(() => {
            setWaktuSekarang(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchKelas = async () => {
        try {
            const res = await api.get('/kelas');
            const daftarKelas = res.data.data;
            
            setKelasOptions(daftarKelas);
            
            if (daftarKelas.length > 0) {
                const sorted = urutkanKelas(daftarKelas);
                const firstKelasId = sorted[0].id;
                
                setKelasId(firstKelasId);
                fetchDraftKelas(firstKelasId);
            } else {
                if (user?.role === 'guru') {
                    toast.error("Anda belum ditetapkan sebagai Wali Kelas. Hubungi Admin.", { duration: 5000 });
                }
            }
        } catch (error) { 
            toast.error("Gagal memuat data direktori kelas.");
        }
    };

    const fetchDraftKelas = async (idKls = kelasId) => {
        if (!idKls) return;
        setLoading(true);
        
        try {
            const response = await api.get(`/guru/presensi/draft?kelas_id=${idKls}`);
            setDataDraft(response.data.data);
            setIsValidated(response.data.is_validated);
            setIsValidatingTime(response.data.is_validating_time);
            setTanggal(response.data.tanggal);
        } catch (error) { 
            toast.error(error.response?.data?.message || "Gagal mengambil data draft presensi.");
        } finally { 
            setLoading(false); 
        }
    };

    const handleStatusChange = (id, newStatus) => {
        if (isValidated) return; 
        
        setDataDraft(prevData => 
            prevData.map(item => 
                item.id === id ? { ...item, status: newStatus } : item
            )
        );
    };

    // Fungsi: Memborong data Pending menjadi Hadir
    const handleValidasiSemua = () => {
        if (isValidated) return;
        
        setDataDraft(prevData => 
            prevData.map(item => 
                item.status === 'pending' ? { ...item, status: 'hadir' } : item
            )
        );
        toast.success("Semua siswa yang Pending disetujui menjadi Hadir!", { icon: '✅' });
    };

    // Fungsi: Menampilkan Modal Kunci Data (Dicegat jika ada Pending/Kosong)
    const handleFinalisasiClick = () => {
        if (dataDraft.length === 0) return;

        const adaBelumValid = dataDraft.some(item => item.status === 'pending' || item.status === 'kosong');
        if (adaBelumValid) {
            toast.error("Tidak bisa dikunci! Masih ada siswa berstatus PENDING atau KOSONG. Selesaikan manual atau tunggu sistem auto-alpha.", {
                icon: '⚠️',
                duration: 5000
            });
            return;
        }
        setFinalisasiModal(true);
    };

    const executeFinalisasi = async () => {
        setSaving(true);
        try {
            const payload = {
                presensi_data: dataDraft.map(item => ({
                    id: item.id,
                    status: item.status
                }))
            };
            const response = await api.put('/guru/presensi/validasi', payload);
            toast.success(response.data.message || "Presensi berhasil dikunci permanen!");
            
            setFinalisasiModal(false);
            fetchDraftKelas(kelasId);
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal melakukan finalisasi.");
        } finally {
            setSaving(false);
        }
    };

    const urutkanKelas = (kelasArray) => {
        return [...kelasArray].sort((a, b) => {
            const getVal = (nama) => {
                const up = nama.toUpperCase();
                if (up.startsWith('XII')) return 3;
                if (up.startsWith('XI')) return 2;
                if (up.startsWith('X')) return 1;
                return 0;
            };
            const valA = getVal(a.nama_kelas);
            const valB = getVal(b.nama_kelas);
            if (valA !== valB) return valB - valA; 
            return a.nama_kelas.localeCompare(b.nama_kelas, undefined, { numeric: true, sensitivity: 'base' });
        });
    };

    const sortedKelasOptions = urutkanKelas(kelasOptions);

    return (
        <div className="w-full flex flex-col animate-fadeIn pb-10 relative max-w-[1400px] mx-auto min-h-screen">
            
            {/* MODAL POP-UP FINALISASI */}
            {finalisasiModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all scale-100">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-5 shadow-inner border border-blue-100">
                                <FiLock className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Kunci Data Absensi?</h3>
                            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                                Seluruh siswa telah memiliki status kehadiran akhir. Data yang difinalisasi <span className="text-slate-800 font-bold">tidak dapat diubah kembali</span>.
                            </p>
                        </div>
                        <div className="p-5 bg-slate-50 flex gap-3 border-t border-slate-100">
                            <button 
                                onClick={() => setFinalisasiModal(false)} 
                                disabled={saving}
                                className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                BATAL
                            </button>
                            <button 
                                onClick={executeFinalisasi} 
                                disabled={saving}
                                className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <span className="flex items-center gap-2"><LuRefreshCw className="w-4 h-4 animate-spin" /> PROSES...</span>
                                ) : (
                                    <span className="flex items-center gap-2">YA, KUNCI</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HERO BANNER MODERN */}
            <div className="w-full h-auto md:h-32 rounded-2xl overflow-hidden relative shadow-sm border border-slate-200 group shrink-0 mb-6 flex flex-col justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-indigo-900/80 to-slate-900/90 z-10"></div>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] z-10"></div>
                <img 
                    src="src/assets/edu-bg.jpg" 
                    alt="Educational Background" 
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 opacity-50"
                    onError={(e) => { e.target.style.display = 'none'; }} 
                />
                
                <div className="relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center w-full p-4 md:p-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white shadow-sm hidden sm:flex">
                            <LuClipboardCheck className="w-6 h-6 text-lime-300" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md mb-0.5">Validasi Presensi</h2>
                            <p className="text-[10px] md:text-xs font-medium text-blue-100 drop-shadow-sm max-w-sm">Periksa draf absensi masuk dan kunci data harian kelas.</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto z-[70]">
                        <div className="flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5 md:px-4 shadow-sm">
                            <span className="text-[9px] text-blue-200 uppercase tracking-widest font-black mb-0.5">TANGGAL BERLAKU</span>
                            <span className="text-sm md:text-base font-black text-white">{tanggal || "Memuat..."}</span>
                        </div>
                        <div className="flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5 md:px-4 shadow-sm">
                            <span className="text-[9px] text-emerald-200 uppercase tracking-widest font-black mb-0.5 flex items-center gap-1">
                                <LuClock className="w-3 h-3" /> WAKTU SISTEM
                            </span>
                            <span className="text-sm md:text-base font-black text-white tracking-widest">
                                {waktuSekarang.toLocaleTimeString('id-ID', { hour12: false })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col w-full overflow-hidden mb-6">
                
                {/* TOOLBAR ATAS */}
                <div className="p-4 md:p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-start sm:items-center">
                        
                        {/* Selector Kelas */}
                        <div className="relative w-full sm:w-56 shrink-0">
                            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                                <FiLayers className="w-4 h-4 text-blue-500" />
                            </div>
                            <select 
                                value={kelasId} 
                                onChange={(e) => { setKelasId(e.target.value); fetchDraftKelas(e.target.value); }} 
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer appearance-none"
                                disabled={loading || saving}
                            >
                                {sortedKelasOptions.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <span className="text-[10px] text-slate-400">▼</span>
                            </div>
                        </div>

                        {/* Tombol Aksi Kiri */}
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button 
                                onClick={() => fetchDraftKelas(kelasId)}
                                disabled={loading || saving}
                                className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 shadow-sm"
                            >
                                <LuRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> REFRESH
                            </button>
                        </div>
                    </div>

                    {/* Tombol Aksi Kanan (Validasi Semua PENDING) */}
                    {(!loading && dataDraft.length > 0 && !isValidated && (isValidatingTime || user?.role === 'admin')) && (
                        <button 
                            onClick={handleValidasiSemua}
                            disabled={saving || !dataDraft.some(d => d.status === 'pending')}
                            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 shadow-sm rounded-xl"
                        >
                            <FiCheckSquare className="w-4 h-4" /> VALIDASI SEMUA
                        </button>
                    )}
                </div>

                {/* BANNER SESI VALIDASI TERBUKA/TERTUTUP */}
                {!loading && dataDraft.length > 0 && (
                    <div className="px-4 md:px-5 pt-4 pb-1">
                        <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-start gap-4 shadow-sm ${
                            isValidated 
                                ? "bg-slate-50 border-slate-200" 
                                : isValidatingTime || user?.role === 'admin'
                                    ? "bg-blue-50/30 border-blue-100"
                                    : "bg-amber-50 border-amber-200"
                        }`}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                isValidated ? "bg-white text-slate-400 border border-slate-200 shadow-sm" : isValidatingTime || user?.role === 'admin' ? "bg-blue-500 text-white shadow-md shadow-blue-500/30" : "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                            }`}>
                                {isValidated ? <FiLock className="w-5 h-5" /> : isValidatingTime || user?.role === 'admin' ? <FiUnlock className="w-5 h-5" /> : <LuClock className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className={`font-black text-xs uppercase tracking-widest ${isValidated ? "text-slate-600" : isValidatingTime || user?.role === 'admin' ? "text-blue-700" : "text-amber-700"}`}>
                                    {isValidated ? "Data Telah Terkunci" : isValidatingTime || user?.role === 'admin' ? "Sesi Validasi Terbuka" : "Di Luar Jam Operasional"}
                                </h3>
                                <p className={`text-[11px] font-semibold mt-1 leading-relaxed ${isValidated ? "text-slate-500" : isValidatingTime || user?.role === 'admin' ? "text-blue-600/80" : "text-amber-600/80"}`}>
                                    {isValidated 
                                        ? "Presensi untuk tanggal ini sudah difinalisasi dan tidak dapat diubah lagi." 
                                        : isValidatingTime || user?.role === 'admin'
                                            ? "Periksa bukti foto, tekan Terima/Tolak, atau klik Validasi Semua untuk menyetujui sekaligus."
                                            : "Anda hanya dapat melihat draf. Silakan tunggu hingga jam validasi dibuka."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 md:p-5">
                    {loading ? (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                            <LuRefreshCw className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                            <p className="text-xs font-black tracking-widest uppercase">Merekap Data Siswa...</p>
                        </div>
                    ) : dataDraft.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <LuUserX className="w-12 h-12 mb-3 text-slate-300" />
                            <p className="text-sm font-black uppercase tracking-widest text-slate-500">Draf belum tersedia.</p>
                            <p className="text-xs font-medium text-slate-400 mt-1">Draf belum dibuat. Hubungi admin.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {/* HEADER TABEL */}
                            <div className="hidden md:grid grid-cols-12 gap-4 px-5 pb-3 border-b-2 border-slate-100">
                                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas Siswa</div>
                                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Waktu & Lokasi</div>
                                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Bukti Foto</div>
                                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</div>
                                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Validasi</div>
                            </div>

                            {/* BARIS DATA */}
                            {dataDraft.map((item, index) => (
                                <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center">
                                    
                                    {/* 1. Identitas Siswa */}
                                    <div className="md:col-span-3 flex items-center gap-4 w-full">
                                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xs font-black text-blue-500 shrink-0 border border-slate-200 shadow-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-sm font-black text-slate-800 tracking-tight">{item.siswa?.nama_lengkap}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                NIS: <span className="text-blue-500">{item.siswa?.nis || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* 2. Waktu & Lokasi */}
                                    <div className="md:col-span-3 flex flex-col items-center justify-center w-full border-t border-slate-100 md:border-0 pt-3 md:pt-0">
                                        {item.jam_masuk ? (
                                            <>
                                                <span className="text-xs font-black text-slate-800 tracking-widest">{item.jam_masuk.substring(0,8)} WIB</span>
                                                <a 
                                                    href={`https://www.google.com/maps?q=${item.lokasi_masuk_lat},${item.lokasi_masuk_lng}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="text-[9px] font-black text-blue-500 hover:text-blue-700 hover:underline mt-1 uppercase tracking-widest"
                                                >
                                                    CEK GPS
                                                </a>
                                            </>
                                        ) : (
                                            <span className="text-xs font-black text-slate-400">--:--:--</span>
                                        )}
                                    </div>

                                    {/* 3. Bukti Foto */}
                                    <div className="md:col-span-2 flex items-center justify-center w-full border-t border-slate-100 md:border-0 pt-3 md:pt-0">
                                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest flex-1">Bukti Foto:</span>
                                        {item.foto_masuk ? (
                                            <a href={'http://localhost:8000/storage/' + item.foto_masuk} target="_blank" rel="noreferrer" className="block group relative shrink-0">
                                                <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                                                    <img 
                                                        src={'http://localhost:8000/storage/' + item.foto_masuk} 
                                                        alt="Selfie" 
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                        onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Img"; }}
                                                    />
                                                </div>
                                            </a>
                                        ) : (
                                            <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-300 shadow-sm">
                                                <LuImageOff className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* 4. Dropdown Status */}
                                    <div className="md:col-span-2 flex w-full justify-center border-t border-slate-100 md:border-0 pt-3 md:pt-0">
                                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest flex-1">Status:</span>
                                        <div className="relative w-full md:w-32">
                                            <select 
                                                value={item.status}
                                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                disabled={isValidated || (!isValidatingTime && user?.role !== 'admin')}
                                                className={`w-full pl-3 pr-8 py-2 text-[10px] font-black tracking-widest rounded-lg border outline-none uppercase appearance-none transition-all shadow-sm ${
                                                    item.status === 'kosong' ? 'bg-slate-50 border-slate-200 text-slate-500' :
                                                    item.status === 'pending' ? 'bg-violet-50 border-violet-200 text-violet-600' :
                                                    item.status === 'hadir' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                                    item.status === 'izin' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                                                    item.status === 'sakit' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                                                    'bg-rose-50 border-rose-200 text-rose-600'
                                                } ${isValidated || (!isValidatingTime && user?.role !== 'admin') ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                            >
                                                {/* PENDING disembunyikan, kecuali memang data ini sedang pending */}
                                                {item.status === 'pending' && <option value="pending" hidden disabled>PENDING</option>}
                                                <option value="kosong">KOSONG</option>
                                                <option value="hadir">HADIR</option>
                                                <option value="izin">IZIN</option>
                                                <option value="sakit">SAKIT</option>
                                                <option value="alpha">ALPHA</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                                <span className="text-[8px] opacity-60">▼</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5. Tombol Validasi (Terima & Tolak) - HANYA TAMPIL JIKA STATUS PENDING */}
                                    <div className="md:col-span-2 flex w-full justify-end md:justify-end gap-3 border-t border-slate-100 md:border-0 pt-3 md:pt-0">
                                        {item.status === 'pending' && (
                                            <>
                                                <button 
                                                    onClick={() => handleStatusChange(item.id, 'hadir')}
                                                    disabled={isValidated || (!isValidatingTime && user?.role !== 'admin')}
                                                    className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] tracking-widest hover:text-emerald-600 transition-colors disabled:opacity-50"
                                                >
                                                    TERIMA 
                                                    <div className="w-5 h-5 bg-emerald-100 border border-emerald-300 rounded flex items-center justify-center"></div>
                                                </button>
                                                <button 
                                                    onClick={() => handleStatusChange(item.id, 'alpha')}
                                                    disabled={isValidated || (!isValidatingTime && user?.role !== 'admin')}
                                                    className="flex items-center gap-1.5 text-rose-500 font-black text-[10px] tracking-widest hover:text-rose-600 transition-colors disabled:opacity-50"
                                                >
                                                    TOLAK 
                                                    <div className="w-5 h-5 bg-rose-100 border border-rose-300 rounded flex items-center justify-center"></div>
                                                </button>
                                            </>
                                        )}
                                    </div>

                                </div>
                            ))}

                            {/* KUNCI DATA PRESENSI (DI BAWAH TABEL) */}
                            {(!loading && dataDraft.length > 0 && !isValidated && (isValidatingTime || user?.role === 'admin')) && (
                                <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
                                    <button 
                                        onClick={handleFinalisasiClick}
                                        disabled={saving}
                                        className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-95 shrink-0"
                                    >
                                        {saving ? (
                                            <span className="flex items-center gap-2"><LuRefreshCw className="w-5 h-5 animate-spin" /> MENGUNCI DATA...</span>
                                        ) : (
                                            <span className="flex items-center gap-2"><LuSave className="w-5 h-5" /> KUNCI DATA PRESENSI</span>
                                        )}
                                    </button>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}