import { useEffect, useState } from "react";
import api from "../utils/api";
import { 
    FiActivity, FiList, FiCheckCircle, 
    FiAlertCircle, FiXCircle, FiFilter, FiFileText,
    FiCalendar, FiPieChart, FiThermometer
} from "react-icons/fi";

export default function RiwayatSiswa() {
    // State Navigasi Tab
    const [activeTab, setActiveTab] = useState("presensi");

    // State Data Presensi
    const [semuaRiwayat, setSemuaRiwayat] = useState([]); 
    const [riwayatTampil, setRiwayatTampil] = useState([]); 

    // State Data Izin
    const [semuaIzin, setSemuaIzin] = useState([]);
    const [izinTampil, setIzinTampil] = useState([]);

    const [loading, setLoading] = useState(true);
    const [rentang, setRentang] = useState("minggu_ini");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        applyFilter();
    }, [rentang, semuaRiwayat, semuaIzin]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Mengambil data presensi
            const resPresensi = await api.get('/riwayat-presensi');
            setSemuaRiwayat(resPresensi.data.data || []);

            // Mengambil data izin 
            const resIzin = await api.get('/izin');
            setSemuaIzin(resIzin.data.data || []);
        } catch (error) {
            console.error("Gagal mengambil data riwayat", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        const today = new Date();
        let filteredPresensi = semuaRiwayat;
        let filteredIzin = semuaIzin;

        if (rentang === "minggu_ini") {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);
            
            filteredPresensi = semuaRiwayat.filter(item => new Date(item.tanggal) >= sevenDaysAgo);
            filteredIzin = semuaIzin.filter(item => new Date(item.tanggal_mulai) >= sevenDaysAgo);
        } 
        else if (rentang === "bulan_ini") {
            const currentMonth = today.getMonth() + 1;
            const currentYear = today.getFullYear();
            
            filteredPresensi = semuaRiwayat.filter(item => {
                const date = new Date(item.tanggal);
                return (date.getMonth() + 1) === currentMonth && date.getFullYear() === currentYear;
            });
            filteredIzin = semuaIzin.filter(item => {
                const date = new Date(item.tanggal_mulai);
                return (date.getMonth() + 1) === currentMonth && date.getFullYear() === currentYear;
            });
        } 
        else if (rentang === "semester_ini") {
            const currentMonth = today.getMonth() + 1;
            const currentYear = today.getFullYear();
            const isSemesterGanjil = currentMonth >= 7;

            const filterSemester = (dateString) => {
                const date = new Date(dateString);
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                if (year !== currentYear) return false;
                return isSemesterGanjil ? (month >= 7 && month <= 12) : (month >= 1 && month <= 6);
            };

            filteredPresensi = semuaRiwayat.filter(item => filterSemester(item.tanggal));
            filteredIzin = semuaIzin.filter(item => filterSemester(item.tanggal_mulai));
        }

        setRiwayatTampil(filteredPresensi);
        setIzinTampil(filteredIzin);
    };

    // Desain Badge Enterprise yang Responsif
    const renderStatusBadge = (status) => {
        const s = status?.toLowerCase();
        const baseClass = "px-3 py-1.5 md:px-3 md:py-1.5 text-[10px] md:text-[9px] font-black rounded-lg uppercase tracking-widest border text-center w-full md:w-auto inline-block shadow-sm";
        switch (s) {
            case 'hadir': 
            case 'terlambat': 
            case 'disetujui': return <span className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-200`}>{s === 'terlambat' ? 'HADIR' : status}</span>;
            case 'izin': return <span className={`${baseClass} bg-blue-50 text-blue-600 border-blue-200`}>{status}</span>;
            case 'sakit': return <span className={`${baseClass} bg-amber-50 text-amber-600 border-amber-200`}>{status}</span>;
            case 'alpha': 
            case 'ditolak': return <span className={`${baseClass} bg-rose-50 text-rose-600 border-rose-200`}>{status}</span>;
            case 'draft': 
            case 'pending': 
            case 'menunggu': return <span className={`${baseClass} bg-slate-100 text-slate-500 border-slate-200 animate-pulse`}>Menunggu</span>;
            default: return <span className={`${baseClass} bg-slate-100 text-slate-500 border-slate-200`}>{status || "-"}</span>; 
        }
    };

    // LOGIKA REKAP YANG SUDAH DIBERSIHKAN
    const rekap = {
        hadir: riwayatTampil.filter(i => i.status === 'hadir' || i.status === 'terlambat').length,
        alpha: riwayatTampil.filter(i => i.status === 'alpha').length,
        izin: izinTampil.filter(i => (i.jenis === 'izin' || i.jenis_izin === 'izin')).length,
        sakit: izinTampil.filter(i => (i.jenis === 'sakit' || i.jenis_izin === 'sakit')).length,
    };

    const totalHariAktif = riwayatTampil.length;
    const persentaseHadir = totalHariAktif > 0 ? Math.round((rekap.hadir / totalHariAktif) * 100) : 0;
    const totalIzinDisetujui = izinTampil.filter(i => i.status === 'disetujui').length;

    return (
        <div className="w-full flex flex-col animate-fadeIn pb-24 md:pb-10 relative xl:min-h-[calc(100vh-100px)] max-w-[1400px] mx-auto">
            
            {/* HERO BANNER MODERN (Diselaraskan) */}
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
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white shadow-sm hidden sm:flex">
                            <FiActivity className="w-5 h-5 text-lime-300" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md mb-0.5">Rekapitulasi Riwayat</h2>
                            <p className="text-[10px] md:text-xs font-medium text-blue-100 drop-shadow-sm max-w-sm">Pantau catatan kehadiran dan status pengajuan izin Anda.</p>
                        </div>
                    </div>

                    {/* DYNAMIC METRIC BOX - Berubah Sesuai Tab yang Dipilih */}
                    <div className="flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5 md:px-4 w-full md:w-auto shadow-sm items-center md:items-start transition-all z-[70]">
                        <span className="text-[9px] text-lime-200 uppercase tracking-widest font-black mb-0.5 flex items-center gap-1.5">
                            {activeTab === 'presensi' ? <FiPieChart className="w-3 h-3" /> : <FiCheckCircle className="w-3 h-3" />} 
                            {activeTab === 'presensi' ? 'Tingkat Kehadiran' : 'Izin Disetujui'}
                        </span>
                        <span className="text-sm md:text-base font-black text-white flex items-baseline gap-1.5">
                            {activeTab === 'presensi' ? (
                                <>{persentaseHadir}% <span className="text-[9px] font-semibold text-blue-100 tracking-wider">DARI {totalHariAktif} HARI</span></>
                            ) : (
                                <>{totalIzinDisetujui} <span className="text-[9px] font-semibold text-blue-100 tracking-wider">PENGAJUAN</span></>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* CONTAINER UTAMA (Diselaraskan) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
                
                {/* TOOLBAR & FILTER */}
                <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                    
                    {/* TABS NAVIGATION */}
                    <div className="flex gap-2 w-full md:w-auto p-1 bg-slate-200/50 rounded-xl overflow-x-auto no-scrollbar shadow-inner border border-slate-200/60">
                        <button 
                            onClick={() => setActiveTab("presensi")}
                            className={`flex-1 md:flex-none md:px-6 py-2.5 md:py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 ${
                                activeTab === 'presensi' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700 shadow-none hover:bg-slate-100/50'
                            }`}
                        >
                            <FiList className="w-3.5 h-3.5 md:w-4 md:h-4" /> Kehadiran
                        </button>
                        <button 
                            onClick={() => setActiveTab("izin")}
                            className={`flex-1 md:flex-none md:px-6 py-2.5 md:py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 ${
                                activeTab === 'izin' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700 shadow-none hover:bg-slate-100/50'
                            }`}
                        >
                            <FiFileText className="w-3.5 h-3.5 md:w-4 md:h-4" /> Izin Khusus
                        </button>
                    </div>

                    {/* FILTER RENTANG WAKTU */}
                    <div className="w-full md:w-56 flex flex-col">
                        <div className="relative">
                            <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select 
                                value={rentang} 
                                onChange={(e) => setRentang(e.target.value)} 
                                className="w-full pl-10 pr-4 py-3 md:py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 uppercase tracking-widest focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer shadow-sm transition-all"
                            >
                                <option value="minggu_ini">7 Hari Terakhir</option>
                                <option value="bulan_ini">Bulan Ini</option>
                                <option value="semester_ini">Semester Berjalan</option>
                                <option value="semua">Semua Waktu</option>
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <span className="text-[10px] text-slate-400">▼</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KONTEN UTAMA */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    {loading ? (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-blue-500">
                            <FiActivity className="w-8 h-8 animate-pulse mb-4" />
                            <p className="font-black text-slate-400 tracking-widest text-xs uppercase">Menyinkronkan Data...</p>
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: PRESENSI */}
                            {activeTab === 'presensi' && (
                                <div className="flex flex-col gap-6 animate-fadeIn">
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 shrink-0">
                                        <div className="bg-emerald-50 p-4 md:p-5 rounded-xl border border-emerald-100 flex flex-col relative overflow-hidden group shadow-sm">
                                            <FiCheckCircle className="absolute -right-3 -bottom-3 w-16 h-16 md:w-20 md:h-20 text-emerald-500/10 group-hover:scale-110 transition-transform" />
                                            <span className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 z-10">Total Hadir</span>
                                            <span className="text-2xl md:text-3xl font-black text-emerald-700 z-10">{rekap.hadir}</span>
                                        </div>
                                        <div className="bg-blue-50 p-4 md:p-5 rounded-xl border border-blue-100 flex flex-col relative overflow-hidden group shadow-sm">
                                            <FiAlertCircle className="absolute -right-3 -bottom-3 w-16 h-16 md:w-20 md:h-20 text-blue-500/10 group-hover:scale-110 transition-transform" />
                                            <span className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 z-10">Total Izin</span>
                                            <span className="text-2xl md:text-3xl font-black text-blue-700 z-10">{rekap.izin}</span>
                                        </div>
                                        <div className="bg-amber-50 p-4 md:p-5 rounded-xl border border-amber-100 flex flex-col relative overflow-hidden group shadow-sm">
                                            <FiThermometer className="absolute -right-3 -bottom-3 w-16 h-16 md:w-20 md:h-20 text-amber-500/10 group-hover:scale-110 transition-transform" />
                                            <span className="text-[9px] md:text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 z-10">Total Sakit</span>
                                            <span className="text-2xl md:text-3xl font-black text-amber-700 z-10">{rekap.sakit}</span>
                                        </div>
                                        <div className="bg-rose-50 p-4 md:p-5 rounded-xl border border-rose-100 flex flex-col relative overflow-hidden group shadow-sm">
                                            <FiXCircle className="absolute -right-3 -bottom-3 w-16 h-16 md:w-20 md:h-20 text-rose-500/10 group-hover:scale-110 transition-transform" />
                                            <span className="text-[9px] md:text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1 z-10">Alpha / Bolos</span>
                                            <span className="text-2xl md:text-3xl font-black text-rose-700 z-10">{rekap.alpha}</span>
                                        </div>
                                    </div>

                                    {/* Data Presensi List (Responsive) */}
                                    {riwayatTampil.length === 0 ? (
                                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <FiList className="w-12 h-12 mb-4 text-slate-300" />
                                            <span className="text-sm font-black uppercase tracking-widest text-slate-500">Data Kosong</span>
                                            <p className="text-xs font-medium text-slate-400 mt-1 max-w-xs text-center">Tidak ada catatan kehadiran untuk rentang waktu ini.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3 md:gap-0">
                                            {/* Header PC */}
                                            <div className="hidden md:grid grid-cols-12 gap-4 px-5 pb-3 mb-1 border-b-2 border-slate-100">
                                                <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">No</div>
                                                <div className="col-span-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</div>
                                                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Jam Masuk</div>
                                                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</div>
                                            </div>

                                            {/* Data Rows */}
                                            {riwayatTampil.map((item, index) => (
                                                <div key={item.id} className="bg-slate-50/50 p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 hover:bg-white transition-all flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center">
                                                    
                                                    {/* Kanan PC: No */}
                                                    <div className="hidden md:flex md:col-span-1 justify-center items-center text-xs font-black text-slate-400">{index + 1}</div>

                                                    {/* Tanggal */}
                                                    <div className="md:col-span-5 flex items-center justify-between w-full md:block">
                                                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</span>
                                                        <div className="text-sm md:text-sm font-black text-slate-800 flex items-center gap-2">
                                                            <FiCalendar className="text-blue-500 w-4 h-4 md:hidden" />
                                                            {item.tanggal}
                                                        </div>
                                                    </div>

                                                    {/* Jam Masuk */}
                                                    <div className="md:col-span-3 flex items-center justify-between w-full md:justify-center mt-1 md:mt-0 border-t border-slate-100 md:border-0 pt-3 md:pt-0">
                                                        <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Jam Masuk</span>
                                                        <div className="text-xs font-bold text-slate-600 font-mono bg-white md:bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 md:border-transparent shadow-sm md:shadow-none">
                                                            {item.jam_masuk?.substring(0,5) || '--:--'} WIB
                                                        </div>
                                                    </div>

                                                    {/* Status */}
                                                    <div className="md:col-span-3 flex w-full justify-end mt-2 md:mt-0 pt-3 md:pt-0 border-t border-slate-100 md:border-0">
                                                        {renderStatusBadge(item.status)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: IZIN */}
                            {activeTab === 'izin' && (
                                <div className="flex flex-col gap-3 md:gap-0 animate-fadeIn">
                                    {izinTampil.length === 0 ? (
                                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <FiFileText className="w-12 h-12 mb-4 text-slate-300" />
                                            <span className="text-sm font-black uppercase tracking-widest text-slate-500">Data Kosong</span>
                                            <p className="text-xs font-medium text-slate-400 mt-1 max-w-xs text-center">Tidak ada pengajuan izin untuk rentang waktu ini.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Header PC */}
                                            <div className="hidden md:grid grid-cols-12 gap-4 px-5 pb-3 mb-1 border-b-2 border-slate-100">
                                                <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">No</div>
                                                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Pengajuan</div>
                                                <div className="col-span-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail & Keterangan</div>
                                                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status Verifikasi</div>
                                            </div>

                                            {/* Data Rows */}
                                            {izinTampil.map((item, index) => {
                                                const isSameDay = item.tanggal_mulai === item.tanggal_selesai;
                                                
                                                return (
                                                    <div key={item.id} className="bg-slate-50/50 p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 hover:bg-white transition-all flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center">
                                                        
                                                        {/* No */}
                                                        <div className="hidden md:flex md:col-span-1 justify-center items-center text-xs font-black text-slate-400">{index + 1}</div>

                                                        {/* Tgl Pengajuan */}
                                                        <div className="md:col-span-3 flex items-center justify-between w-full md:block">
                                                            <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</span>
                                                            <div className="text-xs md:text-xs font-black text-slate-700">
                                                                {isSameDay ? (
                                                                    <div className="bg-white md:bg-transparent border border-slate-200 md:border-transparent px-3 py-1.5 md:p-0 rounded-lg shadow-sm md:shadow-none inline-block">{item.tanggal_mulai}</div>
                                                                ) : (
                                                                    <div className="flex flex-col gap-1 bg-white md:bg-transparent border border-slate-200 md:border-transparent px-3 py-2 md:p-0 rounded-lg shadow-sm md:shadow-none">
                                                                        <span>{item.tanggal_mulai}</span>
                                                                        <span className="text-[9px] text-blue-500 uppercase tracking-widest">Sampai</span>
                                                                        <span>{item.tanggal_selesai}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Detail Keterangan */}
                                                        <div className="md:col-span-5 flex flex-col items-start gap-2 w-full mt-2 md:mt-0 pt-3 md:pt-0 border-t border-slate-100 md:border-0">
                                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                                                                item.jenis === 'sakit' || item.jenis_izin === 'sakit' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                                                            }`}>
                                                                {item.jenis || item.jenis_izin}
                                                            </span>
                                                            <p className="text-xs md:text-[11px] font-medium text-slate-600 italic leading-relaxed">"{item.keterangan}"</p>
                                                        </div>

                                                        {/* Verifikasi */}
                                                        <div className="md:col-span-3 flex w-full justify-end mt-2 md:mt-0 pt-4 md:pt-0 border-t border-slate-100 md:border-0">
                                                            {renderStatusBadge(item.status)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
            `}</style>
        </div>
    );
}