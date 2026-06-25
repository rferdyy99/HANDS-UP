import { useEffect, useState, useRef } from "react";
import api from "../utils/api";
import toast from 'react-hot-toast';
import { 
    FiUsers, FiSearch, FiEdit2, FiTrash2, 
    FiPlus, FiSave, FiBookOpen, FiAward, FiAlertTriangle, FiFilter,
    FiUploadCloud, FiFileText, FiLayers, FiMail, FiMapPin
} from "react-icons/fi";

import imgSiswa from "../assets/student.png";
import imgGuru from "../assets/teacher.png";

export default function DataPengguna() {
    const [pengguna, setPengguna] = useState([]);
    const [kelasOptions, setKelasOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("semua"); 
    const [filterTingkat, setFilterTingkat] = useState("semua");
    const [filterKelas, setFilterKelas] = useState("semua"); 

    const formTopRef = useRef(null);
    const fileInputRef = useRef(null); 

    const [hapusModal, setHapusModal] = useState({ show: false, data: null });

    const [formData, setFormData] = useState({
        name: "", email: "", password: "", role: "siswa", nis: "", nip: "", 
        kelas_id: "", kelas_wali_id: "", jenis_kelamin: "", alamat_domisili: ""
    });

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

    useEffect(() => {
        fetchPengguna();
        fetchKelas();
    }, []);

    const fetchPengguna = async () => {
        try {
            const res = await api.get('/pengguna');
            setPengguna(res.data.data);
        } catch (error) { 
            console.error("Gagal ambil data pengguna"); 
        }
    };

    const fetchKelas = async () => {
        try {
            const res = await api.get('/kelas');
            setKelasOptions(res.data.data);
            if(res.data.data.length > 0) {
                const sorted = urutkanKelas(res.data.data);
                setFormData(prev => ({
                    ...prev, 
                    kelas_id: sorted[0].id,
                    kelas_wali_id: sorted[0].id 
                }));
            }
        } catch (error) { 
            console.error("Gagal ambil data kelas"); 
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleRoleChange = (role) => {
        setFormData({ 
            ...formData, 
            role: role,
            kelas_id: role === 'siswa' && !formData.kelas_id ? (sortedKelasOptions[0]?.id || "") : formData.kelas_id,
            kelas_wali_id: role === 'guru' && !formData.kelas_wali_id ? (sortedKelasOptions[0]?.id || "") : formData.kelas_wali_id
        });
    };

    const handleEditClick = (user) => {
        setIsEdit(true);
        setEditId(user.id);
        
        const isGuru = user.role === 'guru';
        const profile = isGuru ? user.guru : user.siswa;

        setFormData({
            name: user.name,
            email: user.email,
            password: "", 
            role: user.role,
            nis: user.siswa?.nis || "",
            kelas_id: user.siswa?.kelas_id || (sortedKelasOptions[0]?.id || ""),
            nip: user.guru?.nip || "",
            kelas_wali_id: user.guru?.kelas?.id || (sortedKelasOptions[0]?.id || ""),
            jenis_kelamin: profile?.jenis_kelamin || "",
            alamat_domisili: profile?.alamat_domisili || ""
        });

        setTimeout(() => {
            formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleBatalEdit = () => {
        setIsEdit(false);
        setEditId(null);
        setFormData({ 
            name: "", email: "", password: "", role: "siswa", nis: "", nip: "", 
            kelas_id: sortedKelasOptions[0]?.id || "", 
            kelas_wali_id: sortedKelasOptions[0]?.id || "",
            jenis_kelamin: "", alamat_domisili: ""
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // PERBAIKAN: Validasi Frontend Wajib Tepat 10 Digit
        if (formData.role === 'siswa' && formData.nis.length !== 10) {
            toast.error("Format NIS tidak valid! Harus tepat 10 angka.");
            return;
        }
        
        if (formData.role === 'guru' && formData.nip.length !== 10) {
            toast.error("Format NIP tidak valid! Harus tepat 10 angka.");
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                await api.put(`/pengguna/${editId}`, formData);
                toast.success("Berhasil mengupdate pengguna!"); 
            } else {
                await api.post('/pengguna', formData);
                toast.success("Pengguna baru berhasil didaftarkan!"); 
            }
            handleBatalEdit();
            fetchPengguna();
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
            await api.delete(`/pengguna/${hapusModal.data.id}`);
            toast.success("Data pengguna berhasil dihapus!"); 
            fetchPengguna();
        } catch (error) { 
            toast.error("Gagal menghapus pengguna"); 
        } finally {
            setHapusModal({ show: false, data: null }); 
        }
    };

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        const toastId = toast.loading("Memproses & Menyinkronkan Excel...");
        try {
            await api.post('/pengguna/import', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Data berhasil diimport & diupdate!", { id: toastId });
            fetchPengguna();
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
            const response = await api.get('/pengguna/template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Template_Data_Pengguna.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success("Template berhasil diunduh!", { id: toastId });
        } catch (error) {
            toast.error("Gagal mendownload template", { id: toastId });
        }
    };

    const dynamicKelasOptions = sortedKelasOptions.filter(k => {
        if (filterTingkat === 'semua') return true;
        const regex = new RegExp(`^${filterTingkat}\\b`, 'i');
        return regex.test(k.nama_kelas);
    });

    const filteredPengguna = pengguna.filter((item) => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        const namaMatch = item.name?.toLowerCase().includes(lowerCaseSearch);
        const nisMatch = item.siswa?.nis?.toLowerCase().includes(lowerCaseSearch);
        const nipMatch = item.guru?.nip?.toLowerCase().includes(lowerCaseSearch);
        const matchText = namaMatch || nisMatch || nipMatch;

        const matchRole = filterRole === 'semua' ? true : item.role === filterRole;

        let className = "";
        let classId = "";
        if (item.role === 'siswa' && item.siswa?.kelas) {
            className = item.siswa.kelas.nama_kelas;
            classId = item.siswa.kelas_id;
        } else if (item.role === 'guru' && item.guru?.kelas) {
            className = item.guru.kelas.nama_kelas;
            classId = item.guru.kelas.id;
        }

        let matchTingkat = true;
        if (filterTingkat !== 'semua') {
            if (!className) matchTingkat = false;
            else {
                const regex = new RegExp(`^${filterTingkat}\\b`, 'i');
                matchTingkat = regex.test(className);
            }
        }

        let matchKelas = true;
        if (filterKelas !== 'semua') {
            matchKelas = String(classId) === String(filterKelas);
        }

        return matchText && matchRole && matchTingkat && matchKelas;
    });

    return (
        <div ref={formTopRef} className="w-full flex flex-col animate-fadeIn pb-10 relative max-w-[1400px] mx-auto">
            
            <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".csv, .xlsx, .xls" className="hidden" />

            {/* MODAL HAPUS */}
            {hapusModal.show && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all scale-100">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-5 shadow-inner border border-rose-100">
                                <FiTrash2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Hapus Pengguna?</h3>
                            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                                Anda akan menghapus <span className="text-slate-800 font-bold">"{hapusModal.data?.name}"</span> secara permanen.
                            </p>
                        </div>
                        <div className="p-5 bg-slate-50 flex gap-3 border-t border-slate-100">
                            <button onClick={() => setHapusModal({ show: false, data: null })} className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-100 transition-colors">BATAL</button>
                            <button onClick={executeHapus} className="flex-1 py-3.5 bg-rose-500 text-white rounded-xl text-sm font-black shadow-lg hover:bg-rose-600 active:scale-95 transition-all">YA, HAPUS</button>
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
                    onError={(e) => e.target.style.display = 'none'} 
                />
                
                <div className="relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center w-full p-4 md:p-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white shadow-sm hidden sm:flex">
                            <FiUsers className="w-5 h-5 text-lime-300" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md mb-0.5">Pusat Data Pengguna</h2>
                            <p className="text-[10px] md:text-xs font-medium text-blue-100 drop-shadow-sm max-w-md">Kelola kredensial Siswa dan Guru secara terpusat.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full md:w-auto z-[70]">
                        <button 
                            onClick={handleDownloadTemplate}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl text-xs font-black shadow-sm hover:bg-white/20 transition-all"
                        >
                            <FiFileText className="w-4 h-4" /> TEMPLATE
                        </button>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-lime-400 text-slate-900 rounded-xl text-xs font-black shadow-lg shadow-lime-400/20 hover:bg-lime-300 active:scale-95 transition-all"
                        >
                            <FiUploadCloud className="w-4 h-4" /> IMPORT EXCEL
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 items-stretch xl:h-[630px]">
                
                {/* KOLOM KIRI: FORM PENGISIAN (4/12) */}
                <div className="xl:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                    
                    <div className={`px-5 md:px-6 py-4 border-b border-slate-100 flex items-center gap-3 shrink-0 ${isEdit ? 'bg-amber-50' : 'bg-slate-50/50'}`}>
                        <div className={`p-2 rounded-xl ${isEdit ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            {isEdit ? <FiEdit2 className="w-4 h-4 md:w-5 md:h-5" /> : <FiPlus className="w-4 h-4 md:w-5 md:h-5" />}
                        </div>
                        <div>
                            <h3 className={`font-black text-sm ${isEdit ? 'text-amber-800' : 'text-slate-800'}`}>
                                {isEdit ? 'Edit Pengguna' : 'Registrasi Baru'}
                            </h3>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 md:p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                        
                        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                            <button type="button" onClick={() => handleRoleChange('siswa')} disabled={isEdit} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${formData.role === 'siswa' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'} ${isEdit && formData.role !== 'siswa' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <FiBookOpen className="w-4 h-4" /> Siswa
                            </button>
                            <button type="button" onClick={() => handleRoleChange('guru')} disabled={isEdit} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${formData.role === 'guru' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'} ${isEdit && formData.role !== 'guru' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <FiAward className="w-4 h-4" /> Guru
                            </button>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Lengkap</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Email Login</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Password {isEdit && '(Opsional)'}</label>
                            <input type="text" name="password" value={formData.password} onChange={handleChange} required={!isEdit} minLength="6" placeholder={isEdit ? "Kosongkan jika tak diubah" : "Minimal 6 huruf/angka"} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 shrink-0">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Jenis Kelamin</label>
                                <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none">
                                    <option value="">-- Pilih --</option>
                                    <option value="L">Laki-Laki (L)</option>
                                    <option value="P">Perempuan (P)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Domisili</label>
                                <input type="text" name="alamat_domisili" value={formData.alamat_domisili} onChange={handleChange} required placeholder="Alamat Lengkap" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                            </div>
                        </div>

                        {/* ROLE KHUSUS - SISWA */}
                        {formData.role === 'siswa' && (
                            <div className="grid grid-cols-2 gap-4 shrink-0">
                                <div>
                                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5 block">NIS</label>
                                    <input 
                                        type="text" 
                                        name="nis" 
                                        maxLength="10" 
                                        minLength="10" // <-- Wajib 10 angka
                                        value={formData.nis} 
                                        onChange={(e) => setFormData({...formData, nis: e.target.value.replace(/[^0-9]/g, '')})} 
                                        required 
                                        placeholder="Wajib 10 Angka"
                                        className="w-full px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5 block">Kelas</label>
                                    <div className="relative">
                                        <select 
                                            name="kelas_id" 
                                            value={formData.kelas_id} 
                                            onChange={handleChange} 
                                            required 
                                            className="w-full px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer appearance-none"
                                        >
                                            {sortedKelasOptions.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                            <span className="text-[10px] text-blue-500">▼</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ROLE KHUSUS - GURU */}
                        {formData.role === 'guru' && (
                            <div className="grid grid-cols-2 gap-4 shrink-0">
                                <div>
                                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 block">NIP / ID</label>
                                    <input 
                                        type="text" 
                                        name="nip" 
                                        maxLength="10" 
                                        minLength="10" // <-- Wajib 10 angka
                                        value={formData.nip} 
                                        onChange={(e) => setFormData({...formData, nip: e.target.value.replace(/[^0-9]/g, '')})} 
                                        required 
                                        placeholder="Wajib 10 Angka"
                                        className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 block">Wali Kelas</label>
                                    <div className="relative">
                                        <select 
                                            name="kelas_wali_id" 
                                            value={formData.kelas_wali_id} 
                                            onChange={handleChange} 
                                            required 
                                            className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer appearance-none"
                                        >
                                            {sortedKelasOptions.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                            <span className="text-[10px] text-indigo-500">▼</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2 mt-2 border-t border-slate-100">
                            {isEdit && (
                                <button type="button" onClick={handleBatalEdit} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 transition-colors">
                                    BATAL
                                </button>
                            )}
                            <button type="submit" disabled={loading} className={`flex-[2] py-3 text-white rounded-xl text-xs font-black shadow-md transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50 ${isEdit ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}>
                                {loading ? "MEMPROSES..." : isEdit ? <><FiSave /> UPDATE</> : <><FiPlus /> DAFTARKAN</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* KOLOM KANAN: TABEL DATA & FILTER (8/12) */}
                <div className="xl:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden w-full">
                    
                    <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 shrink-0 flex flex-col gap-4">
                        
                        <div className="relative w-full">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="Cari Nama, NIS/NIP, Email pengguna..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm shrink-0">
                                {['semua', 'guru', 'siswa'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setFilterRole(r)} 
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                            filterRole === r ? 'bg-slate-800 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm shrink-0">
                                {['semua', 'X', 'XI', 'XII'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => { setFilterTingkat(t); setFilterKelas('semua'); }} 
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                            filterTingkat === t ? 'bg-blue-100 text-blue-700' : 'bg-transparent text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {t === 'semua' ? 'SEMUA ANGKATAN' : t}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="relative flex-1 min-w-[180px]">
                                <select
                                    value={filterKelas}
                                    onChange={(e) => setFilterKelas(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm uppercase tracking-widest appearance-none"
                                >
                                    <option value="semua">-- FILTER KELAS SPESIFIK --</option>
                                    {dynamicKelasOptions.map(k => (
                                        <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <FiFilter className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-5 bg-slate-50/50 custom-scrollbar">
                        <div className="flex flex-col gap-3">
                            {filteredPengguna.length > 0 ? (
                                filteredPengguna.map((item) => {
                                    const isGuru = item.role === 'guru';
                                    const idNumber = isGuru ? (item.guru?.nip || 'Tanpa NIP') : (item.siswa?.nis || 'Tanpa NIS');
                                    const className = isGuru ? (item.guru?.kelas?.nama_kelas || 'Tidak Menjabat') : (item.siswa?.kelas?.nama_kelas || 'Belum Ada Kelas');
                                    
                                    const pathFoto = isGuru ? item.guru?.foto : item.siswa?.foto;
                                    const fallbackImg = isGuru ? imgGuru : imgSiswa;
                                    const finalFotoUrl = pathFoto ? (isGuru ? item.guru.foto_url : item.siswa.foto_url) : fallbackImg;

                                    return (
                                        <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            
                                            <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                                                <img 
                                                    src={finalFotoUrl} 
                                                    alt={item.name} 
                                                    className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100 shrink-0 bg-slate-50" 
                                                    onError={(e) => { e.target.src = fallbackImg; }}
                                                />

                                                <div className="flex flex-col overflow-hidden">
                                                    <div className="font-black text-sm md:text-base text-slate-800 tracking-tight truncate">{item.name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">{idNumber}</span>
                                                        <span className="text-[11px] font-semibold text-slate-500 truncate flex items-center gap-1">
                                                            <FiMail className="w-3 h-3 shrink-0"/> {item.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-3 border-t border-slate-100 md:border-0 md:pt-0 shrink-0">
                                                <div className="flex flex-col items-start md:items-end">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black rounded-md uppercase tracking-widest ${isGuru ? 'bg-indigo-50 text-indigo-700' : 'bg-lime-50 text-slate-800'}`}>
                                                        {isGuru ? <FiAward /> : <FiBookOpen />} {item.role}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1">
                                                        {isGuru ? 'WALI' : 'KELAS'} {className}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => handleEditClick(item)} className="p-2 text-amber-500 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-500 hover:text-white transition-all active:scale-95 shadow-sm" title="Edit Data">
                                                        <FiEdit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleHapusClick(item)} className="p-2 text-rose-500 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm" title="Hapus Permanen">
                                                        <FiTrash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                        </div>
                                    )
                                })
                            ) : (
                                <div className="py-20 text-center bg-white rounded-xl border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <FiSearch className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-black text-slate-700 uppercase tracking-wide">Data Kosong</p>
                                    <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm">Pencarian atau filter Anda tidak cocok dengan pengguna manapun di dalam database.</p>
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