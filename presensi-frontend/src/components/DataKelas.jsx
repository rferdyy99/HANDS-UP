import { useEffect, useState, useRef } from "react";
import api from "../utils/api";
import toast from 'react-hot-toast';
import { 
    FiLayers, FiSearch, FiEdit2, FiTrash2, 
    FiPlus, FiSave, FiBookOpen, FiAlertTriangle, FiFilter, FiInfo,
    FiUploadCloud, FiFileText, FiPieChart
} from "react-icons/fi";

export default function DataKelas() {
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.role === 'admin';

    const [dataKelas, setDataKelas] = useState([]);
    const [namaKelas, setNamaKelas] = useState("");
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // State Filter & Modal Hapus
    const [filterTingkat, setFilterTingkat] = useState("Semua");
    const [hapusModal, setHapusModal] = useState({ show: false, data: null });
    
    // Ref
    const formTopRef = useRef(null);
    const fileInputRef = useRef(null); 

    useEffect(() => { 
        fetchKelas(); 
    }, []);

    const fetchKelas = async () => {
        try {
            const response = await api.get('/kelas');
            setDataKelas(response.data.data);
        } catch (error) { 
            console.error("Gagal mengambil kelas", error); 
        }
    };

    const handleEditClick = (item) => {
        setIsEdit(true);
        setEditId(item.id);
        setNamaKelas(item.nama_kelas);
        
        setTimeout(() => {
            formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleBatalEdit = () => {
        setIsEdit(false);
        setEditId(null);
        setNamaKelas("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!namaKelas) return;

        // VALIDASI FORMAT ROMAWI (Harus berawalan X, XI, atau XII diikuti spasi)
        const formatValid = /^(X|XI|XII)\s/i.test(namaKelas.trim());
        if (!formatValid) {
            toast.error("Format Kelas tidak valid! Wajib berawalan Romawi (X, XI, XII) dan diikuti spasi. Contoh: XII RPL 1");
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                await api.put(`/kelas/${editId}`, { nama_kelas: namaKelas.trim().toUpperCase() });
                toast.success("Data kelas berhasil diperbarui!");
            } else {
                await api.post('/kelas', { nama_kelas: namaKelas.trim().toUpperCase() });
                toast.success("Kelas baru berhasil ditambahkan!");
            }
            handleBatalEdit();
            fetchKelas();
        } catch (error) { 
            toast.error(error.response?.data?.message || "Terjadi kesalahan sistem"); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleHapusClick = (item) => {
        setHapusModal({ show: true, data: item });
    };

    const executeHapus = async () => {
        if (!hapusModal.data) return;
        try {
            await api.delete(`/kelas/${hapusModal.data.id}`);
            toast.success("Data kelas berhasil dihapus permanen!");
            fetchKelas();
        } catch (error) { 
            toast.error("Gagal! Pastikan tidak ada siswa di kelas ini."); 
        } finally {
            setHapusModal({ show: false, data: null });
        }
    };

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        const toastId = toast.loading("Mengimport Kelas...");
        try {
            await api.post('/kelas/import', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Data Kelas berhasil diimport!", { id: toastId });
            fetchKelas();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal import file Excel", { id: toastId });
        } finally {
            e.target.value = null; 
        }
    };

    const handleDownloadTemplate = async () => {
        const toastId = toast.loading("Menyiapkan file template...");
        try {
            const response = await api.get('/kelas/template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Template_Import_Kelas.xlsx');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Template berhasil diunduh!", { id: toastId });
        } catch (error) {
            toast.error("Gagal mendownload template", { id: toastId });
        }
    };

    // Filter Logic
    const filteredKelas = dataKelas.filter((item) => {
        const matchSearch = item.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase());
        let matchTingkat = true;
        
        if (filterTingkat !== "Semua") {
            const regex = new RegExp(`^${filterTingkat}\\b`, 'i');
            matchTingkat = regex.test(item.nama_kelas);
        }

        return matchSearch && matchTingkat;
    });

    // Logika Sorting Otomatis (XII -> XI -> X)
    const getTingkatValue = (nama) => {
        const upperName = nama.toUpperCase();
        if (upperName.startsWith('XII')) return 3;
        if (upperName.startsWith('XI')) return 2;
        if (upperName.startsWith('X')) return 1;
        return 0;
    };

    const sortedKelas = [...filteredKelas].sort((a, b) => {
        const valA = getTingkatValue(a.nama_kelas);
        const valB = getTingkatValue(b.nama_kelas);
        if (valA !== valB) return valB - valA;
        return a.nama_kelas.localeCompare(b.nama_kelas, undefined, { numeric: true, sensitivity: 'base' });
    });

    const getTingkatKelas = (nama) => {
        if (nama.toUpperCase().startsWith('XII')) return 'XII';
        if (nama.toUpperCase().startsWith('XI')) return 'XI';
        if (nama.toUpperCase().startsWith('X')) return 'X';
        return <FiLayers className="w-4 h-4" />;
    };

    // Logika Hitung Statistik
    const countTotal = dataKelas.length;
    const countX = dataKelas.filter(k => k.nama_kelas.toUpperCase().startsWith('X ')).length;
    const countXI = dataKelas.filter(k => k.nama_kelas.toUpperCase().startsWith('XI ')).length;
    const countXII = dataKelas.filter(k => k.nama_kelas.toUpperCase().startsWith('XII ')).length;

    return (
        <div ref={formTopRef} className="w-full flex flex-col animate-fadeIn pb-10 relative max-w-[1400px] mx-auto">
            
            {/* Input Tersembunyi */}
            {isAdmin && (
                <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".csv, .xlsx, .xls" className="hidden" />
            )}

            {/* MODAL HAPUS */}
            {hapusModal.show && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all scale-100">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-5 shadow-inner border border-rose-100">
                                <FiAlertTriangle className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Hapus Kelas?</h3>
                            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                                Kelas <span className="text-slate-800 font-bold">"{hapusModal.data?.nama_kelas}"</span> akan dihapus permanen.
                            </p>
                        </div>
                        <div className="p-5 bg-slate-50 flex gap-3 border-t border-slate-100">
                            <button onClick={() => setHapusModal({ show: false, data: null })} className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-100 transition-colors">BATAL</button>
                            <button onClick={executeHapus} className="flex-1 py-3.5 bg-rose-500 text-white rounded-xl text-sm font-black shadow-lg hover:bg-rose-600 active:scale-95 transition-all">YA, HAPUS</button>
                        </div>
                    </div>
                </div>
            )}

            {/* HERO BANNER MODERN (Diselaraskan) */}
            <div className="w-full h-auto md:h-32 rounded-2xl overflow-hidden relative shadow-sm border border-slate-200 shrink-0 mb-6 flex flex-col justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-indigo-900/80 to-slate-900/90 z-10"></div>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] z-10"></div>
                <img src="src/assets/edu-bg.jpg" alt="Educational Background" className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 opacity-50" onError={(e) => e.target.style.display = 'none'} />
                
                <div className="relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center w-full p-4 md:p-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white shadow-sm hidden sm:flex">
                            <FiLayers className="w-5 h-5 text-lime-300" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md mb-0.5">Master Data Kelas</h2>
                            <p className="text-[10px] md:text-xs font-medium text-blue-100 drop-shadow-sm max-w-md">
                                {isAdmin ? 'Kelola direktori kelas dan rombongan belajar.' : 'Daftar kelas yang berada di bawah wewenang Anda.'}
                            </p>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="flex flex-wrap gap-3 w-full md:w-auto z-[70]">
                            <button onClick={handleDownloadTemplate} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl text-xs font-black shadow-sm hover:bg-white/20 transition-all"><FiFileText className="w-4 h-4" /> TEMPLATE</button>
                            <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-lime-400 text-slate-900 rounded-xl text-xs font-black shadow-lg shadow-lime-400/20 hover:bg-lime-300 active:scale-95 transition-all"><FiUploadCloud className="w-4 h-4" /> IMPORT KELAS</button>
                        </div>
                    )}
                </div>
            </div>

            {/* GRID LAYOUT UTAMA */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 items-stretch xl:h-[600px]">
                
                {/* KOLOM KIRI: FORM + MINI STATISTIK */}
                {isAdmin && (
                    <div className="xl:col-span-4 flex flex-col h-full gap-4 md:gap-6 shrink-0 overflow-hidden">
                        
                        {/* 1. Form Pendaftaran & Catatan Standar Penggunaan Kata */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
                            <div className={`px-5 md:px-6 py-4 border-b border-slate-100 flex items-center gap-2 shrink-0 ${isEdit ? 'bg-amber-50' : 'bg-slate-50/50'}`}>
                                {isEdit ? <FiEdit2 className="text-amber-500 w-4 h-4" /> : <FiPlus className="text-blue-500 w-4 h-4" />}
                                <h3 className={`font-black uppercase tracking-widest text-xs ${isEdit ? 'text-amber-700' : 'text-slate-700'}`}>
                                    {isEdit ? 'Edit Identitas Kelas' : 'Registrasi Kelas'}
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5 md:p-6 flex flex-col gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Rombel / Kelas</label>
                                    <div className="relative">
                                        <FiBookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" value={namaKelas} onChange={(e) => setNamaKelas(e.target.value.toUpperCase())} placeholder="Contoh: XII RPL 1" required className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:font-medium placeholder:text-slate-300 uppercase" />
                                    </div>
                                </div>

                                {/* BOX CATATAN STANDAR PENGGUNAAN KATA */}
                                <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl flex gap-3">
                                    <FiInfo className="text-rose-500 w-4 h-4 shrink-0 mt-0.5" />
                                    <div className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                                        <span className="font-black text-rose-800 uppercase tracking-wider block mb-1">Standar Penamaan:</span>
                                        Wajib menggunakan <strong className="text-rose-600 font-bold">ROMAWI</strong> di awal (X, XI, XII). Dilarang memakai angka Numerik (10, 11, 12).
                                    </div>
                                </div>

                                <div className="flex gap-2 shrink-0 border-t border-slate-100 pt-3">
                                    {isEdit && (
                                        <button type="button" onClick={handleBatalEdit} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 transition-colors">BATAL</button>
                                    )}
                                    <button type="submit" disabled={loading} className={`flex-[2] py-2.5 text-white rounded-xl text-xs font-black shadow-md transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50 ${isEdit ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}>
                                        {loading ? "MENYIMPAN..." : isEdit ? <><FiSave /> SIMPAN</> : <><FiPlus /> TAMBAH KELAS</>}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* 2. Ringkasan Statistik */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 flex flex-col justify-start overflow-y-auto custom-scrollbar flex-1">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 shrink-0">
                                <FiPieChart className="text-blue-500 w-4 h-4" /> Ikhtisar Tingkatan Kelas
                            </h4>
                            <div className="grid grid-cols-2 gap-3 shrink-0">
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Kelas</div>
                                    <div className="text-xl font-black text-slate-800 mt-0.5">{countTotal}</div>
                                </div>
                                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                                    <div className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Kelas XII</div>
                                    <div className="text-xl font-black text-blue-700 mt-0.5">{countXII}</div>
                                </div>
                                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                    <div className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Kelas XI</div>
                                    <div className="text-xl font-black text-indigo-700 mt-0.5">{countXI}</div>
                                </div>
                                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                    <div className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Kelas X</div>
                                    <div className="text-xl font-black text-emerald-700 mt-0.5">{countX}</div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* KOLOM KANAN: TABEL DATA & FILTER */}
                <div className={`${isAdmin ? 'xl:col-span-8' : 'xl:col-span-12'} bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden w-full`}>
                    
                    <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 shrink-0 flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs flex items-center gap-2">
                                <FiFilter className="text-blue-500 w-4 h-4" /> Filter Data Kelas
                            </h3>
                            <div className="relative w-full md:w-72">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input type="text" placeholder="Ketik pencarian spesifik..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm" />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                            {['Semua', 'X', 'XI', 'XII'].map(tingkat => (
                                <button key={tingkat} onClick={() => setFilterTingkat(tingkat)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${filterTingkat === tingkat ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-700'}`}>{tingkat === 'Semua' ? 'SEMUA KELAS' : `KELAS ${tingkat}`}</button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-5 bg-slate-50/50 custom-scrollbar">
                        <div className="flex flex-col gap-3">
                            {sortedKelas.length > 0 ? (
                                sortedKelas.map((item) => (
                                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        
                                        <div className="flex items-center justify-start gap-4 pl-1 w-full md:w-auto overflow-hidden">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                                                {getTingkatKelas(item.nama_kelas)}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <div className="font-black text-sm md:text-base text-slate-800 tracking-tight truncate">{item.nama_kelas}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tahun Ajaran Aktif</div>
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-3 border-t border-slate-100 md:border-0 md:pt-0 shrink-0">
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => handleEditClick(item)} className="p-2 text-amber-500 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-500 hover:text-white transition-all active:scale-95 shadow-sm" title="Edit Kelas"><FiEdit2 className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleHapusClick(item)} className="p-2 text-rose-500 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm" title="Hapus Kelas"><FiTrash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <FiLayers className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-black text-slate-700 uppercase tracking-wide">Kelas Tidak Ditemukan</p>
                                    <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm">Data kelas untuk kriteria filter tersebut belum tersedia.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}