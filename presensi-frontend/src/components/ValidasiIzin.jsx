import { useEffect, useState } from "react";
import api from "../utils/api";
import toast from 'react-hot-toast'; 
import { 
    FiClipboard, FiClock, FiImage, 
    FiRefreshCw, FiX, FiInfo, FiUserX, FiCheck, FiXCircle, FiLayers, FiCalendar
} from "react-icons/fi";

export default function ValidasiIzin() {

    // 1. STATE MASTER DATA
    const [kelasOptions, setKelasOptions] = useState([]);
    const [dataIzin, setDataIzin] = useState([]);
    
    // 2. STATE UI & FILTER
    const [loading, setLoading] = useState(true);
    const [prosesId, setProsesId] = useState(null); 
    const [kelasId, setKelasId] = useState("semua"); 
    const [filterStatus, setFilterStatus] = useState("pending");
    const [tglMulai, setTglMulai] = useState("");
    const [tglSelesai, setTglSelesai] = useState("");

    // 3. STATE MODAL PREVIEW FILE
    const [modalOpen, setModalOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        setLoading(true);
        try {
            const resKelas = await api.get('/kelas');
            setKelasOptions(resKelas.data.data || []);

            const resIzin = await api.get('/guru/izin'); 
            setDataIzin(resIzin.data.data || []);
        } catch (error) {
            toast.error("Gagal memuat data dari server.");
        } finally {
            setLoading(false);
        }
    };

    const refreshIzinSaja = async () => {
        setLoading(true);
        try {
            const resIzin = await api.get('/guru/izin'); 
            setDataIzin(resIzin.data.data || []);
            toast.success("Data disegarkan", { duration: 1500 });
        } catch (error) {
            toast.error("Gagal menyegarkan data.");
        } finally {
            setLoading(false);
        }
    };

    const handleValidasi = async (id, statusBaru) => {
        setProsesId(id);
        try {
            await api.put(`/guru/izin/${id}`, { status: statusBaru });
            if (statusBaru === 'disetujui') toast.success("Izin Disetujui!");
            else toast.success("Izin Ditolak!", { icon: '❌' });
            refreshIzinSaja();
        } catch (error) {
            toast.error("Gagal memvalidasi.");
        } finally {
            setProsesId(null);
        }
    };

    const openPreview = (url) => {
        setPreviewUrl(url);
        setModalOpen(true);
    };

    const getNamaKelas = (idKelasSiswa) => {
        if (!idKelasSiswa) return "Tanpa Kelas";
        const kelas = kelasOptions.find(k => k.id === idKelasSiswa);
        return kelas ? kelas.nama_kelas : "Kelas...";
    };

    const filteredData = dataIzin.filter(item => {
        const matchStatus = filterStatus === 'pending' ? item.status === 'pending' : item.status !== 'pending';
        const matchKelas = kelasId === 'semua' ? true : String(item.siswa?.kelas_id) === String(kelasId);
        
        let matchTanggal = true;
        if (tglMulai && tglSelesai) {
            const itemDate = item.tanggal_mulai; // Memakai tanggal pengajuan
            matchTanggal = itemDate >= tglMulai && itemDate <= tglSelesai;
        }

        return matchStatus && matchKelas && matchTanggal;
    });

    const pendingCount = dataIzin.filter(i => i.status === 'pending').length;

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

    // Ini data kelas yang sudah rapi untuk ditampilkan di Dropdown
    const sortedKelasOptions = urutkanKelas(kelasOptions);


    return (
        <div className="w-full flex flex-col animate-fadeIn pb-10 relative max-w-[1400px] mx-auto min-h-screen">

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
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white shadow-sm hidden sm:flex">
                            <FiClipboard className="w-5 h-5 text-lime-300" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md mb-0.5">Otorisasi Izin & Sakit</h2>
                            <p className="text-[10px] md:text-xs font-medium text-blue-100 drop-shadow-sm max-w-sm">Periksa dokumen lampiran dan berikan otorisasi pengajuan siswa.</p>
                        </div>
                    </div>

                    <div className="flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5 md:px-4 w-full md:w-auto shadow-sm items-center md:items-start z-[70]">
                        <span className="text-[9px] text-amber-200 uppercase tracking-widest font-black mb-0.5 flex items-center gap-1.5">
                            <FiClock className="w-3 h-3" /> Antrean Pending
                        </span>
                        <span className="text-sm md:text-base font-black text-white">
                            {pendingCount} Pengajuan
                        </span>
                    </div>
                </div>
            </div>

            {/* CONTAINER UTAMA */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col w-full overflow-hidden mb-6">
                
                {/* TOOLBAR FILTER MULTI-LAYER */}
                <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-start sm:items-center">
                        {/* Tombol Tab Pending / Selesai */}
                        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm shrink-0 w-full sm:w-auto">
                            {['pending', 'selesai'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        filterStatus === s ? 'bg-slate-800 text-white shadow-md' : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {s === 'pending' ? 'Menunggu' : 'Riwayat'}
                                </button>
                            ))}
                        </div>

                        {/* Dropdown Kelas */}
                        <div className="relative w-full sm:w-56 shrink-0">
                            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                                <FiLayers className="w-4 h-4 text-blue-500" />
                            </div>
                            <select 
                                value={kelasId}
                                onChange={(e) => setKelasId(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer appearance-none"
                            >
                                <option value="semua">-- SEMUA KELAS --</option>
                                {sortedKelasOptions.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <span className="text-[10px] text-slate-400">▼</span>
                            </div>
                        </div>
                    </div>

                    {/* Filter Tanggal & Tombol Refresh */}
                    <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3 items-start sm:items-center">
                        <div className="flex w-full sm:w-auto items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                            <div className="relative flex-1">
                                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                <input 
                                    type="date" 
                                    value={tglMulai} 
                                    onChange={(e) => setTglMulai(e.target.value)} 
                                    className="w-full pl-8 pr-2 py-1.5 bg-transparent text-[10px] font-bold text-slate-700 outline-none cursor-pointer" 
                                />
                            </div>
                            <span className="text-slate-300 font-bold">-</span>
                            <div className="relative flex-1">
                                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                <input 
                                    type="date" 
                                    value={tglSelesai} 
                                    onChange={(e) => setTglSelesai(e.target.value)} 
                                    className="w-full pl-8 pr-2 py-1.5 bg-transparent text-[10px] font-bold text-slate-700 outline-none cursor-pointer" 
                                />
                            </div>
                        </div>

                        <button 
                            onClick={refreshIzinSaja}
                            disabled={loading}
                            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 shadow-sm shrink-0"
                        >
                            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </button>
                    </div>
                </div>

                {/* INFO BOX */}
                <div className="px-4 md:px-5 pt-4 pb-1 shrink-0">
                    <div className="p-4 rounded-xl border flex items-center justify-between bg-blue-50 border-blue-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg shrink-0 bg-white text-blue-500 shadow-sm border border-blue-100 flex items-center justify-center">
                                <FiInfo className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-xs uppercase tracking-widest text-blue-700">Verifikasi Dokumen</h3>
                                <p className="text-[10px] font-semibold leading-relaxed text-blue-600/80 mt-0.5">
                                    Pastikan surat keterangan sah dan jelas sebelum disetujui.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LIST DATA */}
                <div className="p-4 md:p-5">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                            <FiRefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                            <p className="text-xs font-black tracking-widest uppercase">Memuat Berkas...</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <FiUserX className="w-10 h-10 mb-3 text-slate-300" />
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tidak ada pengajuan ditemukan</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 md:gap-0">
                            {/* Header Kolom PC */}
                            <div className="hidden md:grid grid-cols-12 gap-4 px-5 pb-3 border-b-2 border-slate-100">
                                <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">No</div>
                                <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa</div>
                                <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail & File</div>
                                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase text-right tracking-widest">Opsi</div>
                            </div>
                            
                            {/* Data Rows */}
                            {filteredData.map((item, index) => (
                                <div key={item.id} className="bg-white p-4 md:py-3 md:px-4 rounded-xl md:rounded-none border border-slate-200 md:border-0 md:border-b md:border-slate-100 shadow-sm md:shadow-none hover:bg-slate-50 transition-colors flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center">
                                    
                                    {/* NOMOR PC */}
                                    <div className="hidden md:flex md:col-span-1 justify-center items-center">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xs font-black text-slate-500 border border-slate-200 shadow-sm">
                                            {index + 1}
                                        </div>
                                    </div>
                                    
                                    {/* IDENTITAS */}
                                    <div className="md:col-span-4 flex items-center gap-4 w-full border-b md:border-0 border-slate-200 pb-4 md:pb-0">
                                        {/* Avatar Mobile */}
                                        <div className="md:hidden w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xs font-black text-slate-500 border border-slate-200 shadow-sm shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-sm md:text-xs font-black text-slate-800 uppercase leading-tight">{item.siswa?.nama_lengkap || "User Tidak Dikenal"}</div>
                                            <div className="text-[10px] md:text-[9px] font-bold text-slate-500 uppercase mt-1">
                                                NIS: {item.siswa?.nis} <span className="mx-1">•</span> <span className="text-blue-500">{getNamaKelas(item.siswa?.kelas_id)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DETAIL & FILE */}
                                    <div className="md:col-span-4 flex items-center gap-4 w-full">
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${item.jenis === 'sakit' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                                    {item.jenis}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                                                    <FiClock className="w-3 h-3"/> {item.tanggal_mulai || item.created_at?.split('T')[0]}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 font-medium italic line-clamp-2 leading-relaxed">"{item.keterangan}"</p>
                                        </div>
                                        {item.bukti_foto && (
                                            <button 
                                                onClick={() => openPreview(`http://localhost:8000/storage/${item.bukti_foto}`)} 
                                                className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl border border-slate-200 text-slate-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all group bg-white shadow-sm"
                                            >
                                                <FiImage className="w-5 h-5 mb-1" />
                                                <span className="text-[7px] font-black uppercase tracking-widest">Bukti</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* OPSI VALIDASI */}
                                    <div className="md:col-span-3 flex w-full justify-end border-t border-slate-200 md:border-0 pt-4 md:pt-0">
                                        {item.status === 'pending' ? (
                                            <div className="flex items-center gap-2 w-full md:w-auto">
                                                <button 
                                                    onClick={() => handleValidasi(item.id, 'ditolak')} 
                                                    disabled={prosesId === item.id} 
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all shadow-sm"
                                                >
                                                    <FiXCircle className="w-3.5 h-3.5" /> Tolak
                                                </button>
                                                <button 
                                                    onClick={() => handleValidasi(item.id, 'disetujui')} 
                                                    disabled={prosesId === item.id} 
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95"
                                                >
                                                    <FiCheck className="w-3.5 h-3.5" /> Setuju
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`w-full md:w-auto flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${item.status === 'disetujui' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                                {item.status === 'disetujui' ? <FiCheck /> : <FiXCircle />} {item.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL PREVIEW */}
            {modalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
                            <h3 className="font-black text-slate-800 text-xs flex items-center gap-2 uppercase tracking-widest">
                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><FiImage className="w-4 h-4"/></div>
                                Lampiran Bukti
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="p-2.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all shadow-sm">
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-auto bg-slate-100/50 flex items-center justify-center min-h-[300px]">
                            {previewUrl.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={previewUrl} className="w-full h-[60vh] rounded-2xl bg-white shadow-sm border border-slate-200" title="PDF"></iframe>
                            ) : (
                                <img src={previewUrl} alt="Bukti" className="max-w-full max-h-[65vh] object-contain rounded-2xl shadow-md border border-slate-200 bg-white" />
                            )}
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-white flex justify-end shrink-0">
                            <a href={previewUrl} target="_blank" rel="noreferrer" className="w-full md:w-auto text-center px-8 py-3 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-all shadow-lg active:scale-95">
                                Download File Asli
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}