import { useEffect, useState } from "react";
import api from "../utils/api";
import { 
    FiFileText, FiDownload, FiPrinter, FiCalendar, 
    FiLayers, FiUsers, FiSearch, FiCheckCircle, 
    FiAlertCircle, FiXCircle, FiRefreshCw, FiThermometer
} from "react-icons/fi";

export default function LaporanPresensi() {
    const user = JSON.parse(localStorage.getItem('user'));
    const [laporan, setLaporan] = useState([]);
    const [mode, setMode] = useState("kelas"); 
    const [kelasOptions, setKelasOptions] = useState([]);
    const [siswaOptions, setSiswaOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter States
    const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
    const [tanggalSelesai, setTanggalSelesai] = useState(new Date().toISOString().split('T')[0]);
    const [kelasId, setKelasId] = useState("");
    const [siswaId, setSiswaId] = useState(""); 
    
    // State baru untuk menyimpan nama kelas guru
    const [namaKelasWali, setNamaKelasWali] = useState("Memuat...");

    useEffect(() => {
        fetchInitialData();
    }, []);

    // LOGIKA SORTING KELAS OTOMATIS (XII -> XI -> X)
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

    const fetchInitialData = async () => {
        try {
            if (user?.role === 'guru') {
                const resPengguna = await api.get('/pengguna');
                const currentUser = resPengguna.data.data.find(u => u.id === user.id);
                
                const guruKelasId = currentUser?.guru?.kelas?.id || currentUser?.guru?.kelas_id;
                const namaKls = currentUser?.guru?.kelas?.nama_kelas || "Bukan Wali Kelas";
                
                setNamaKelasWali(namaKls);

                if (guruKelasId) {
                    setKelasId(guruKelasId);
                    fetchSiswa(guruKelasId);
                } else {
                    alert("Akses Ditolak: Anda belum ditugaskan sebagai Wali Kelas.");
                }
            } else {
                const resKelas = await api.get('/kelas');
                const daftarKelas = resKelas.data.data || [];
                setKelasOptions(daftarKelas);
                if (daftarKelas.length > 0) {
                    const sorted = urutkanKelas(daftarKelas);
                    const idKls = sorted[0].id;
                    setKelasId(idKls);
                    fetchSiswa(idKls); 
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchSiswa = async (id) => {
        try {
            const res = await api.get(`/pengguna`); 
            const siswaSesuaiKelas = res.data.data.filter(u => {
                const isSiswa = u.role === 'siswa';
                const idKelasSiswa = u.siswa?.kelas_id || u.siswa?.kelas?.id; 
                return isSiswa && (idKelasSiswa?.toString() === id?.toString());
            });
            setSiswaOptions(siswaSesuaiKelas);
        } catch (e) { console.error(e); }
    };

    const handleFetch = async () => {
        if (!kelasId) return alert("Pilih kelas terlebih dahulu!");
        setLoading(true);
        try {
            const res = await api.get(`/laporan/presensi`, {
                params: { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai, kelas_id: kelasId, siswa_id: siswaId }
            });
            setLaporan(res.data.data);
            setMode(res.data.mode);
        } catch (e) { 
            setLaporan([]); 
            alert(e.response?.data?.message || "Gagal mengambil data laporan");
        } finally { setLoading(false); }
    };

    const handleDownloadExcel = async () => {
        if (!kelasId) return alert("Data kelas tidak valid.");
        try {
            const response = await api.get(`/laporan/export`, {
                params: { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai, kelas_id: kelasId, siswa_id: siswaId },
                responseType: 'blob', 
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Rekap_${siswaId ? 'Individu' : 'Kelas'}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) { alert("Gagal mendownload Excel."); }
    };

    const handleDownloadPdf = async () => {
        if (!kelasId) return alert("Data kelas tidak valid.");
        try {
            const response = await api.get(`/laporan/export-pdf`, {
                params: { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai, kelas_id: kelasId, siswa_id: siswaId },
                responseType: 'blob', 
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Laporan_${siswaId ? 'Individu' : 'Kelas'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) { alert("Gagal mendownload PDF."); }
    };

    return (
        <div className="w-full flex flex-col animate-fadeIn pb-6 relative xl:min-h-[calc(100vh-100px)]">
            
            {/* HERO BANNER MODERN (Diselaraskan) */}
            <div className="w-full h-auto md:h-32 rounded-2xl overflow-hidden relative shadow-sm border border-slate-200 group shrink-0 mb-6 flex flex-col justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-indigo-900/80 to-slate-900/90 z-10"></div>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] z-10"></div>
                <img src="src/assets/edu-bg.jpg" alt="Educational Background" className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 opacity-50" onError={(e) => e.target.style.display = 'none'} />
                
                <div className="relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center w-full p-4 md:p-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white shadow-sm hidden sm:flex">
                            <FiFileText className="w-5 h-5 text-lime-300" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md mb-0.5">Analitik & Laporan</h2>
                            <p className="text-[10px] md:text-xs font-medium text-blue-100 drop-shadow-sm max-w-sm">Tarik data rekapitulasi kehadiran kelas atau individu siswa.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto z-[70]">
                        <button onClick={handleDownloadPdf} disabled={laporan.length === 0} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl text-xs font-black shadow-sm hover:bg-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            <FiPrinter className="w-4 h-4" /> EXPORT PDF
                        </button>
                        <button onClick={handleDownloadExcel} disabled={laporan.length === 0} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-lime-400 text-slate-900 rounded-xl text-xs font-black shadow-lg shadow-lime-400/20 hover:bg-lime-300 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            <FiDownload className="w-4 h-4" /> EXPORT EXCEL
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTAINER UTAMA (Diselaraskan) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col w-full overflow-hidden mb-6">
                
                {/* FILTERS TOOLBAR */}
                <div className="p-4 md:p-5 bg-slate-50/50 border-b border-slate-100 shrink-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Dari Tanggal</label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer shadow-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Sampai Tanggal</label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer shadow-sm" />
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Target Kelas</label>
                            <div className="relative">
                                <FiLayers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                {user?.role === 'admin' ? (
                                    <select value={kelasId} onChange={(e) => {setKelasId(e.target.value); fetchSiswa(e.target.value);}} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none shadow-sm">
                                        {sortedKelasOptions.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                                    </select>
                                ) : (
                                    <input type="text" value={namaKelasWali} disabled className="w-full pl-10 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed select-none shadow-inner" />
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Siswa (Opsional)</label>
                            <div className="relative">
                                <FiUsers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select value={siswaId} onChange={(e) => setSiswaId(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none shadow-sm">
                                    <option value="">-- Rekap Semua (Kelas) --</option>
                                    {siswaOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex items-end">
                            <button onClick={handleFetch} disabled={loading || !kelasId} className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs tracking-widest uppercase shadow-lg transition-all active:scale-95 disabled:opacity-50">
                                {loading ? <FiRefreshCw className="animate-spin w-4 h-4" /> : <FiSearch className="w-4 h-4" />} PREVIEW DATA
                            </button>
                        </div>
                    </div>
                </div>

                {/* =========================================================
                    KARTU REKAP INDIVIDU (Bersih dari status Terlambat!)
                ========================================================= */}
                {mode === 'individu' && laporan.length > 0 && (
                    <div className="p-4 md:p-6 bg-white border-b border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 md:gap-4 shrink-0">
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col relative overflow-hidden group shadow-sm">
                            <FiCheckCircle className="absolute -right-3 -bottom-3 w-16 h-16 md:w-20 md:h-20 text-emerald-500/20 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 z-10">Total Hadir</span>
                            <span className="text-3xl font-black text-emerald-700 z-10">{laporan.filter(i => i.status === 'hadir').length}</span>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col relative overflow-hidden group shadow-sm">
                            <FiAlertCircle className="absolute -right-3 -bottom-3 w-16 h-16 md:w-20 md:h-20 text-blue-500/20 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase mb-1 z-10">Izin</span>
                            <span className="text-3xl font-black text-blue-700 z-10">{laporan.filter(i => i.status === 'izin').length}</span>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex flex-col relative overflow-hidden group shadow-sm">
                            <FiThermometer className="absolute -right-3 -bottom-3 w-16 h-16 md:w-20 md:h-20 text-amber-500/20 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 z-10">Sakit</span>
                            <span className="text-3xl font-black text-amber-700 z-10">{laporan.filter(i => i.status === 'sakit').length}</span>
                        </div>
                        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex flex-col relative overflow-hidden group shadow-sm">
                            <FiXCircle className="absolute -right-3 -bottom-3 w-16 h-16 md:w-20 md:h-20 text-rose-500/20 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1 z-10">Alpha / Bolos</span>
                            <span className="text-3xl font-black text-rose-700 z-10">{laporan.filter(i => i.status === 'alpha').length}</span>
                        </div>
                    </div>
                )}

                {/* AREA DATA RESPONSIVE TABLE */}
                <div className="p-4 md:p-6">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                            <FiRefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                            <p className="text-xs font-black uppercase tracking-widest">Menarik Data Laporan...</p>
                        </div>
                    ) : laporan.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <FiSearch className="w-10 h-10 mb-3 text-slate-300" />
                            <p className="text-sm font-black uppercase tracking-widest text-slate-500">Belum Ada Data</p>
                            <p className="text-xs font-medium text-slate-400 mt-1 max-w-xs text-center">Tentukan kriteria pencarian dan klik PREVIEW DATA.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            
                            {/* REKAP KELAS */}
                            {mode === 'kelas' && (
                                <>
                                    <div className="hidden md:grid grid-cols-12 gap-4 px-5 pb-3 border-b-2 border-slate-100">
                                        <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">No</div>
                                        <div className="col-span-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas Siswa</div>
                                        <div className="col-span-6 grid grid-cols-4 gap-4 text-center text-[10px] font-black uppercase tracking-widest">
                                            <div className="text-emerald-600">Hadir</div>
                                            <div className="text-blue-600">Izin</div>
                                            <div className="text-amber-600">Sakit</div>
                                            <div className="text-rose-600">Alpha</div>
                                        </div>
                                    </div>

                                    {laporan.map((item, i) => (
                                        <div key={i} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:bg-white transition-all flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center">
                                            <div className="hidden md:flex md:col-span-1 justify-center items-center text-xs font-black text-slate-400">{i + 1}</div>
                                            <div className="md:col-span-5 flex items-center gap-4 w-full">
                                                <div className="md:hidden w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-slate-500 shadow-sm">{i + 1}</div>
                                                <div className="flex flex-col">
                                                    <div className="text-sm font-black text-slate-800 tracking-tight uppercase">{item.nama_lengkap}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">NIS: <span className="text-blue-500 font-mono font-bold">{item.nis || '-'}</span></div>
                                                </div>
                                            </div>
                                            <div className="md:col-span-6 w-full grid grid-cols-4 gap-3 text-center">
                                                <div className="flex flex-col md:flex-row items-center justify-center gap-1 bg-white md:bg-transparent border border-slate-200 md:border-0 rounded-xl py-2 md:py-0 shadow-sm md:shadow-none">
                                                    <span className="md:hidden text-[8px] font-black text-emerald-500 uppercase tracking-wider mb-0.5">Hadir</span>
                                                    <span className="text-sm font-black text-emerald-600">{item.hadir}</span>
                                                </div>
                                                <div className="flex flex-col md:flex-row items-center justify-center gap-1 bg-white md:bg-transparent border border-slate-200 md:border-0 rounded-xl py-2 md:py-0 shadow-sm md:shadow-none">
                                                    <span className="md:hidden text-[8px] font-black text-blue-500 uppercase tracking-wider mb-0.5">Izin</span>
                                                    <span className="text-sm font-black text-blue-600">{item.izin}</span>
                                                </div>
                                                <div className="flex flex-col md:flex-row items-center justify-center gap-1 bg-white md:bg-transparent border border-slate-200 md:border-0 rounded-xl py-2 md:py-0 shadow-sm md:shadow-none">
                                                    <span className="md:hidden text-[8px] font-black text-amber-500 uppercase tracking-wider mb-0.5">Sakit</span>
                                                    <span className="text-sm font-black text-amber-600">{item.sakit}</span>
                                                </div>
                                                <div className="flex flex-col md:flex-row items-center justify-center gap-1 bg-white md:bg-transparent border border-slate-200 md:border-0 rounded-xl py-2 md:py-0 shadow-sm md:shadow-none">
                                                    <span className="md:hidden text-[8px] font-black text-rose-500 uppercase tracking-wider mb-0.5">Alpha</span>
                                                    <span className="text-sm font-black text-rose-600">{item.alpha}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {/* REKAP INDIVIDU */}
                            {mode === 'individu' && (
                                <>
                                    <div className="hidden md:grid grid-cols-12 gap-4 px-5 pb-3 border-b-2 border-slate-100">
                                        <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">No</div>
                                        <div className="col-span-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Kegiatan</div>
                                        <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Waktu Masuk</div>
                                        <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status Harian</div>
                                    </div>

                                    {laporan.map((item, i) => (
                                        <div key={i} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:bg-white transition-all flex flex-col md:grid md:grid-cols-12 gap-3 items-start md:items-center">
                                            <div className="hidden md:flex md:col-span-1 justify-center items-center text-xs font-black text-slate-400">{i + 1}</div>
                                            <div className="md:col-span-5 flex items-center justify-between w-full md:block">
                                                <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</span>
                                                <div className="text-sm font-black text-slate-800">{item.tanggal}</div>
                                            </div>
                                            <div className="md:col-span-3 flex items-center justify-between w-full md:justify-center">
                                                <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Masuk</span>
                                                <div className="text-xs font-bold text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">{item.jam_masuk || '--:--'} WIB</div>
                                            </div>
                                            <div className="md:col-span-3 flex w-full justify-end">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                                    item.status === 'hadir' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                                                    item.status === 'sakit' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                                                    item.status === 'izin' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                                                    'bg-rose-50 text-rose-600 border-rose-200'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}