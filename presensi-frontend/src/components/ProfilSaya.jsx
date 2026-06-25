import { useEffect, useState, useRef } from "react";
import api from "../utils/api";
import toast from 'react-hot-toast';
import { 
    FiUser, FiMail, FiShield, FiAward, 
    FiBookOpen, FiHash, FiLayers, FiCheckCircle, FiInfo,
    FiLock, FiKey, FiSave, FiEye, FiEyeOff, FiX, FiMapPin, FiCamera, FiRefreshCw, FiCrop,
    FiAlertCircle
} from "react-icons/fi";

// IMPORT REACT-IMAGE-CROP
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// IMPORT ASSET DEFAULT
import imgSiswa from "../assets/student.png";
import imgGuru from "../assets/teacher.png";
import imgAdmin from "../assets/admin.png";

export default function ProfilSaya({ switchMenu }) {
    const [profil, setProfil] = useState(null);
    const [loading, setLoading] = useState(true);

    // State Form Edit Biodata Diri
    const [bioForm, setBioForm] = useState({ jenis_kelamin: '', alamat_domisili: '' });

    // State Foto Profil & Crop
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const imgRef = useRef(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imgSrc, setImgSrc] = useState("");
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);

    // State Form Ganti Password
    const [passForm, setPassForm] = useState({ password_lama: '', password_baru: '', konfirmasi: '' });
    const [showPassLama, setShowPassLama] = useState(false);
    const [showPassBaru, setShowPassBaru] = useState(false);
    const [showPassKonfirm, setShowPassKonfirm] = useState(false);
    const [loadingPass, setLoadingPass] = useState(false);

    // State Lupa Password & Modal (HANYA UNTUK NON-ADMIN)
    const [loadingForgot, setLoadingForgot] = useState(false);
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [resetToken, setResetToken] = useState("");
    const [forgotNewPass, setForgotNewPass] = useState("");
    const [forgotConfirmPass, setForgotConfirmPass] = useState("");
    const [showForgotNewPass, setShowForgotNewPass] = useState(false);
    const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);

    useEffect(() => {
        fetchProfil();
    }, []);

    const fetchProfil = async () => {
        try {
            const response = await api.get('/profil');
            const data = response.data.data;
            setProfil(data);
            
            const spesifikProfil = data.role === 'guru' ? data.guru : data.siswa;
            if (spesifikProfil) {
                setBioForm({
                    jenis_kelamin: spesifikProfil.jenis_kelamin || '',
                    alamat_domisili: spesifikProfil.alamat_domisili || ''
                });
            }

            localStorage.setItem('user', JSON.stringify(data));
            window.dispatchEvent(new Event('userUpdated')); 
        } catch (error) {
            console.error("Gagal mengambil profil", error);
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // HANDLER FOTO PROFIL DENGAN CROP
    // =========================================================
    const onSelectFile = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); 
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImgSrc(reader.result?.toString() || '');
                setCropModalOpen(true);
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        const cropSize = Math.min(width, height) * 0.8;
        const x = (width - cropSize) / 2;
        const y = (height - cropSize) / 2;
        
        setCrop({ unit: 'px', x, y, width: cropSize, height: cropSize });
    };

    const handleUploadCrop = async () => {
        if (!completedCrop || !imgRef.current) {
            toast.error("Silakan sesuaikan area potongan foto.");
            return;
        }

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        const ctx = canvas.getContext('2d');
        
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
            image,
            completedCrop.x * scaleX, completedCrop.y * scaleY,
            completedCrop.width * scaleX, completedCrop.height * scaleY,
            0, 0, completedCrop.width, completedCrop.height
        );

        canvas.toBlob(async (blob) => {
            if (!blob) {
                toast.error("Gagal memproses potongan gambar.");
                return;
            }

            const formData = new FormData();
            formData.append('foto', blob, 'profile_cropped.jpg');

            setUploading(true);
            const toastId = toast.loading("Mengunggah foto presisi...");

            try {
                await api.post('/profil/update-detail', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("Foto profil berhasil diperbarui!", { id: toastId });
                setCropModalOpen(false);
                fetchProfil(); 
            } catch (error) {
                toast.error("Gagal mengunggah gambar profil.", { id: toastId });
            } finally {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }, 'image/jpeg', 0.95);
    };

    const closeCropModal = () => {
        setCropModalOpen(false);
        setImgSrc("");
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // =========================================================
    // HANDLER PASSWORD (Hanya Ganti Password, Bukan Lupa)
    // =========================================================
    const handlePassChange = (e) => {
        setPassForm({ ...passForm, [e.target.name]: e.target.value });
    };

    const submitGantiPassword = async (e) => {
        e.preventDefault();
        if (passForm.password_baru !== passForm.konfirmasi) return toast.error("Konfirmasi sandi baru tidak cocok!");
        if (passForm.password_baru.length < 6) return toast.error("Sandi baru minimal 6 karakter!");

        setLoadingPass(true);
        const toastId = toast.loading("Memperbarui kata sandi...");

        try {
            await api.post('/ubah-password', { 
                password_lama: passForm.password_lama, 
                password_baru: passForm.password_baru 
            });
            toast.success("Kata sandi berhasil diperbarui!", { id: toastId });
            setPassForm({ password_lama: '', password_baru: '', konfirmasi: '' });
            setShowPassLama(false); 
            setShowPassBaru(false); 
            setShowPassKonfirm(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal mengubah kata sandi. Pastikan sandi lama benar.", { id: toastId });
        } finally {
            setLoadingPass(false);
        }
    };

    // =========================================================
    // HANDLER LUPA PASSWORD (HANYA UNTUK NON-ADMIN)
    // =========================================================
    const handleRequestToken = async () => {
        // ADMIN TIDAK BISA AKSES FITUR INI
        if (profil?.role === 'admin') {
            toast.error("Admin tidak dapat menggunakan fitur lupa sandi. Gunakan perbarui sandi.");
            return;
        }

        setLoadingForgot(true);
        const toastId = toast.loading("Mengirim token ke email Anda...");
        try {
            await api.post('/lupa-password', { email: profil.email });
            toast.success("Token terkirim! Silakan cek email Anda.", { id: toastId });
            setForgotStep(2); 
        } catch (error) {
            toast.error("Gagal mengirim token pemulihan.", { id: toastId });
        } finally {
            setLoadingForgot(false);
        }
    };

    const submitResetPassword = async (e) => {
        e.preventDefault();
        
        // ADMIN TIDAK BISA AKSES FITUR INI
        if (profil?.role === 'admin') {
            toast.error("Admin tidak dapat menggunakan fitur reset sandi.");
            return;
        }

        if (forgotNewPass !== forgotConfirmPass) return toast.error("Konfirmasi sandi tidak cocok!");
        if (forgotNewPass.length < 6) return toast.error("Sandi baru minimal 6 karakter!");

        setLoadingForgot(true);
        const toastId = toast.loading("Mereset kata sandi...");
        try {
            await api.post('/reset-password', {
                email: profil.email, 
                token: resetToken, 
                password: forgotNewPass, 
                password_confirmation: forgotConfirmPass
            });
            toast.success("Sandi berhasil direset! Silakan gunakan sandi baru.", { id: toastId });
            closeForgotModal();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal mereset. Pastikan token benar.", { id: toastId });
        } finally {
            setLoadingForgot(false);
        }
    };

    // HANYA BUKA MODAL LUPA PASSWORD JIKA BUKAN ADMIN
    const openForgotModal = () => { 
        if (profil?.role === 'admin') {
            toast.error("Admin tidak memiliki fitur lupa sandi. Silakan gunakan form perbarui sandi di samping.");
            return;
        }
        setForgotStep(1); 
        setIsForgotModalOpen(true); 
    };

    const closeForgotModal = () => {
        setIsForgotModalOpen(false); 
        setForgotStep(1); 
        setResetToken("");
        setForgotNewPass(""); 
        setForgotConfirmPass(""); 
        setShowForgotNewPass(false); 
        setShowForgotConfirmPass(false);
    };

    // =========================================================
    // FUNGSI NAVIGASI BANTUAN
    // =========================================================
    const handleBantuanClick = () => {
        if (switchMenu) {
            switchMenu('bantuan');
        } else {
            toast("Fitur navigasi bantuan sedang dimuat.", { icon: '🛟' });
        }
    };

    // =========================================================
    // RENDER UI
    // =========================================================
    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center text-blue-500 w-full animate-fadeIn h-full min-h-[400px]">
            <FiUser className="w-12 h-12 animate-pulse mb-5 text-blue-300" />
            <p className="font-black text-slate-400 tracking-widest text-xs uppercase">Menyinkronkan Identitas...</p>
        </div>
    );
    
    if (!profil) return (
        <div className="p-10 text-center bg-rose-50 border border-rose-200 rounded-3xl max-w-2xl mx-auto mt-10 animate-fadeIn">
            <FiInfo className="w-12 h-12 mx-auto text-rose-500 mb-4" />
            <p className="text-rose-700 font-bold text-lg">Gagal memuat data profil.</p>
        </div>
    );

    const isGuru = profil.role === 'guru';
    const isAdmin = profil.role === 'admin';
    const detailProfil = isGuru ? profil.guru : profil.siswa;
    
    let userAvatar = imgSiswa;
    if (isAdmin) userAvatar = imgAdmin;
    else if (isGuru) userAvatar = imgGuru;
    
    if (detailProfil && detailProfil.foto_url && !detailProfil.foto_url.includes('student.png') && !detailProfil.foto_url.includes('teacher.png')) {
        userAvatar = detailProfil.foto_url;
    }

    return (
        <div className="w-full flex flex-col animate-fadeIn pb-24 md:pb-10 relative max-w-[1400px] mx-auto">
            
            {/* MODAL CROP GAMBAR */}
            {cropModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                                <FiCrop className="text-blue-500 w-4 h-4" /> Sesuaikan Potongan
                            </h3>
                            <button onClick={closeCropModal} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="bg-slate-100/50 flex items-center justify-center min-h-[250px] max-h-[50vh] overflow-hidden p-6">
                            {imgSrc && (
                                <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                                    <ReactCrop
                                        crop={crop}
                                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                                        onComplete={(c) => setCompletedCrop(c)}
                                        aspect={1} 
                                        circularCrop 
                                    >
                                        <img
                                            ref={imgRef}
                                            alt="Crop Area"
                                            src={imgSrc}
                                            onLoad={onImageLoad}
                                            className="max-h-[40vh] object-contain"
                                        />
                                    </ReactCrop>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-5 bg-white border-t border-slate-100 flex gap-3">
                            <button onClick={closeCropModal} className="flex-1 py-3.5 text-slate-600 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black hover:bg-slate-100 transition-all">BATAL</button>
                            <button onClick={handleUploadCrop} disabled={uploading || !completedCrop?.width} className="flex-[2] py-3.5 text-white bg-blue-600 rounded-xl text-xs font-black shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {uploading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
                                {uploading ? "MEMPROSES..." : "TERAPKAN"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HERO BANNER MODERN */}
            <div className="w-full h-auto md:h-32 rounded-2xl overflow-hidden relative shadow-sm border border-slate-200 shrink-0 mb-6 flex flex-col justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-indigo-900/80 to-slate-900/90 z-10"></div>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] z-10"></div>
                <img 
                    src="src/assets/edu-bg.jpg" 
                    alt="Background" 
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-40"
                    onError={(e) => { e.target.style.display = 'none'; }} 
                />
                
                <div className="relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center w-full p-5 md:p-6 gap-4">
                    <div className="flex items-center gap-4 md:gap-5">
                        
                        {/* FOTO PROFIL KIRI ATAS DENGAN FITUR UPLOAD CROP (Kecuali Admin) */}
                        <div className="relative group shrink-0">
                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 shadow-lg flex items-center justify-center bg-white ${isAdmin ? 'border-lime-400' : isGuru ? 'border-indigo-400' : 'border-blue-400'}`}>
                                <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover object-center" />
                            </div>
                            
                            {!isAdmin && (
                                <label className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer rounded-xl transition-all duration-300">
                                    {uploading ? (
                                        <FiRefreshCw className="w-5 h-5 animate-spin text-blue-300" />
                                    ) : (
                                        <>
                                            <FiCamera className="w-4 h-4 md:w-5 md:h-5 mb-1 text-blue-200" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-center">Ubah<br/>Foto</span>
                                        </>
                                    )}
                                    <input type="file" ref={fileInputRef} accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={onSelectFile} disabled={uploading} />
                                </label>
                            )}
                        </div>

                        <div className="overflow-hidden">
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md mb-1 truncate max-w-[220px] sm:max-w-md">{profil.name}</h2>
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-2.5 py-1 rounded-lg shadow-sm">
                                <FiMail className="w-3 h-3 text-blue-200 shrink-0" />
                                <span className="text-[10px] md:text-xs font-medium text-white truncate">{profil.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5 md:px-4 w-full md:w-auto shadow-sm items-center md:items-start shrink-0 z-[70]">
                        <span className="text-[9px] text-lime-200 uppercase tracking-widest font-black mb-0.5 flex items-center gap-1.5">
                            <FiShield className="w-3 h-3" /> OTORITAS AKUN
                        </span>
                        <span className="text-sm md:text-base font-black text-white uppercase tracking-wider">
                            {profil.role}
                        </span>
                    </div>
                </div>
            </div>

            {/* LAYOUT GRID UTAMA: KIRI (8/12) & KANAN (4/12) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 items-start">
                
                {/* ---------------- KOLOM KIRI (Profil & Akademik) ---------------- */}
                <div className="xl:col-span-8 flex flex-col gap-4 md:gap-6">
                    
                    {/* CARD 1: INFORMASI PERSONAL (READ-ONLY) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><FiUser className="w-3.5 h-3.5" /></div>
                                Informasi Personal
                            </h3>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                                {isAdmin ? 'ADMINISTRATOR' : 'HUBUNGI ADMIN'}
                            </span>
                        </div>
                        
                        <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4">
                                <div className="p-2.5 bg-white text-slate-400 border border-slate-100 rounded-lg shadow-sm"><FiUser className="w-4 h-4"/></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jenis Kelamin</p>
                                    <p className="text-sm font-black text-slate-800">
                                        {isAdmin ? 'Akses Admin' : (detailProfil?.jenis_kelamin === 'L' ? 'Laki-Laki' : detailProfil?.jenis_kelamin === 'P' ? 'Perempuan' : 'Belum Diatur')}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4">
                                <div className="p-2.5 bg-white text-slate-400 border border-slate-100 rounded-lg shadow-sm"><FiMapPin className="w-4 h-4"/></div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat Domisili</p>
                                    <p className="text-sm font-bold text-slate-800 truncate" title={detailProfil?.alamat_domisili}>
                                        {isAdmin ? 'Akses Admin' : (detailProfil?.alamat_domisili || 'Belum Diatur')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: DATA AKADEMIK + TOMBOL BANTUAN DI BAWAHNYA */}
                    <div className="flex flex-col gap-3">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-5 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><FiBookOpen className="w-3.5 h-3.5" /></div>
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">
                                    Data Institusi
                                </h3>
                            </div>

                            <div className="p-5 md:p-6">
                                {!isAdmin ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                                        <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors shadow-sm ${isGuru ? 'border-indigo-100 bg-indigo-50/20 hover:border-indigo-200' : 'border-blue-100 bg-blue-50/20 hover:border-blue-200'}`}>
                                            <div className={`p-2.5 rounded-lg shrink-0 ${isGuru ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}><FiHash className="w-4 h-4" /></div>
                                            <div className="overflow-hidden">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{isGuru ? 'NIP Pegawai' : 'Nomor Induk Siswa'}</p>
                                                <p className="text-sm md:text-base font-black text-slate-800 truncate">{isGuru ? (detailProfil?.nip || '-') : (detailProfil?.nis || '-')}</p>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors shadow-sm ${isGuru ? 'border-indigo-100 bg-indigo-50/20 hover:border-indigo-200' : 'border-blue-100 bg-blue-50/20 hover:border-blue-200'}`}>
                                            <div className={`p-2.5 rounded-lg shrink-0 ${isGuru ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}><FiLayers className="w-4 h-4" /></div>
                                            <div className="overflow-hidden">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{isGuru ? 'Wali Kelas' : 'Kelas Saat Ini'}</p>
                                                <p className="text-sm md:text-base font-black text-slate-800 flex items-center gap-2 truncate">
                                                    {detailProfil?.kelas?.nama_kelas || (isGuru ? 'Tidak Menjabat' : 'Belum Ditugaskan')}
                                                    {detailProfil?.kelas && <FiCheckCircle className={`w-4 h-4 shrink-0 ${isGuru ? 'text-indigo-500' : 'text-lime-500'}`} />}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-4 p-5 md:p-6 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 shadow-md">
                                        <div className="p-2.5 bg-slate-800 text-lime-400 rounded-lg shrink-0 border border-slate-700"><FiShield className="w-5 h-5" /></div>
                                        <div>
                                            <h4 className="text-sm font-black text-white mb-2 tracking-wide uppercase">Administrator Sistem</h4>
                                            <p className="text-xs md:text-sm leading-relaxed text-slate-400">Otoritas penuh atas master data pengguna, hierarki kelas, sistem presensi geotagging, dan analitik performa harian.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* TOMBOL BANTUAN (HANYA GURU & SISWA) */}
                        {!isAdmin && (
                            <div className="flex justify-start px-1 mt-1">
                                <button 
                                    onClick={handleBantuanClick}
                                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all group p-2 rounded-xl hover:bg-blue-50"
                                >
                                    <FiAlertCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Ada Kendala? Hubungi Bantuan Admin
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ---------------- KOLOM KANAN (Form Ganti Sandi - 4/12) ---------------- */}
                <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
                    <div className="px-5 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                        <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg"><FiLock className="w-3.5 h-3.5" /></div>
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">
                            Keamanan Akun
                        </h3>
                    </div>
                    
                    <form onSubmit={submitGantiPassword} className="p-5 md:p-6 flex flex-col gap-4" autoComplete="off">
                        
                        <div>
                            {/* HANYA TAMPILKAN LINK LUPA SANDI JIKA BUKAN ADMIN */}
                            <div className="flex justify-between items-end mb-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Sandi Saat Ini</label>
                                {!isAdmin && (
                                    <button 
                                        type="button" 
                                        onClick={openForgotModal} 
                                        className="text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors bg-blue-50 px-2 py-0.5 rounded-md"
                                    >
                                        Lupa Sandi?
                                    </button>
                                )}
                                {isAdmin && (
                                    <span className="text-[9px] font-bold text-slate-300 bg-slate-100 px-2 py-0.5 rounded-md">
                                        WAJIB DIISI
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type={showPassLama ? "text" : "password"} 
                                    name="password_lama" 
                                    autoComplete="off" 
                                    value={passForm.password_lama} 
                                    onChange={handlePassChange} 
                                    required
                                    placeholder="Masukkan sandi saat ini"
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-sm"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassLama(!showPassLama)} 
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassLama ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* GARIS PEMISAH */}
                        <div className="flex items-center gap-3 opacity-50 py-1">
                            <hr className="flex-1 border-dashed border-slate-300" />
                            <FiLock className="text-slate-300 w-3 h-3" />
                            <hr className="flex-1 border-dashed border-slate-300" />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Sandi Baru</label>
                            <div className="relative">
                                <FiShield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type={showPassBaru ? "text" : "password"} 
                                    name="password_baru" 
                                    autoComplete="new-password" 
                                    value={passForm.password_baru} 
                                    onChange={handlePassChange} 
                                    required
                                    placeholder="Minimal 6 karakter"
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-sm"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassBaru(!showPassBaru)} 
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassBaru ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Konfirmasi Sandi Baru</label>
                            <div className="relative">
                                <FiCheckCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type={showPassKonfirm ? "text" : "password"} 
                                    name="konfirmasi" 
                                    autoComplete="new-password" 
                                    value={passForm.konfirmasi} 
                                    onChange={handlePassChange} 
                                    required
                                    placeholder="Ulangi sandi baru"
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-sm"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassKonfirm(!showPassKonfirm)} 
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassKonfirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loadingPass || !passForm.password_lama || !passForm.password_baru}
                            className="w-full mt-2 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs md:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-800/20 active:scale-95 disabled:opacity-50"
                        >
                            {loadingPass ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />} 
                            {loadingPass ? "MEMPROSES..." : "PERBARUI SANDI"}
                        </button>
                    </form>
                </div>
            </div>

            {/* TOMBOL BANTUAN MOBILE */}
            {!isAdmin && (
                <div className="xl:hidden flex justify-center w-full mt-6">
                    <button 
                        onClick={handleBantuanClick}
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all group p-2 rounded-xl hover:bg-blue-50"
                    >
                        <FiAlertCircle className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                        Ada Kendala? Hubungi Bantuan Admin
                    </button>
                </div>
            )}

            {/* MODAL LUPA KATA SANDI - TIDAK AKAN PERNAH MUNCUL UNTUK ADMIN */}
            {isForgotModalOpen && !isAdmin && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all relative flex flex-col">
                        
                        <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                            <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm md:text-base">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <FiLock className="w-4 h-4" />
                                </div>
                                Pemulihan Sandi
                            </h3>
                            <button onClick={closeForgotModal} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 md:p-6 flex flex-col gap-4">
                            {forgotStep === 1 && (
                                <div className="flex flex-col items-center text-center animate-fadeIn py-2">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 shadow-inner border border-blue-100">
                                        <FiMail className="w-8 h-8" />
                                    </div>
                                    <h4 className="font-black text-slate-800 text-lg md:text-xl mb-2">Kirim Token Verifikasi?</h4>
                                    <p className="text-xs md:text-sm font-medium text-slate-500 leading-relaxed mb-5">
                                        Sistem akan mengirimkan 6-digit token rahasia ke alamat email Anda:<br/>
                                        <strong className="text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg mt-2 inline-block">{profil.email}</strong>
                                    </p>
                                    <button 
                                        onClick={handleRequestToken} disabled={loadingForgot}
                                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/30 flex justify-center items-center gap-2"
                                    >
                                        {loadingForgot ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiMail className="w-4 h-4" />}
                                        {loadingForgot ? "MENGIRIM..." : "KIRIM TOKEN SEKARANG"}
                                    </button>
                                </div>
                            )}

                            {forgotStep === 2 && (
                                <form onSubmit={submitResetPassword} className="flex flex-col gap-4 animate-fadeIn" autoComplete="off">
                                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5 mb-1 shadow-sm">
                                        <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <p className="text-xs font-bold text-emerald-700 leading-relaxed">
                                            Token terkirim ke <span className="font-black underline">{profil.email}</span>. Cek kotak masuk/spam email Anda.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Token Rahasia</label>
                                        <input 
                                            type="text" required placeholder="Masukkan 6 digit token" autoComplete="off"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-black text-blue-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-center tracking-[0.3em] shadow-inner"
                                            value={resetToken} onChange={(e) => setResetToken(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Kata Sandi Baru</label>
                                        <div className="relative">
                                            <input 
                                                type={showForgotNewPass ? "text" : "password"} required autoComplete="new-password" placeholder="Minimal 6 karakter"
                                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                                                value={forgotNewPass} onChange={(e) => setForgotNewPass(e.target.value)}
                                            />
                                            <button type="button" onClick={() => setShowForgotNewPass(!showForgotNewPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500">
                                                {showForgotNewPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Konfirmasi Sandi Baru</label>
                                        <div className="relative">
                                            <input 
                                                type={showForgotConfirmPass ? "text" : "password"} required autoComplete="new-password" placeholder="Ulangi sandi baru"
                                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                                                value={forgotConfirmPass} onChange={(e) => setForgotConfirmPass(e.target.value)}
                                            />
                                            <button type="button" onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500">
                                                {showForgotConfirmPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" disabled={loadingForgot || !resetToken || !forgotNewPass || !forgotConfirmPass}
                                        className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                                    >
                                        {loadingForgot ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
                                        {loadingForgot ? "MEMPROSES..." : "SIMPAN KATA SANDI BARU"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}