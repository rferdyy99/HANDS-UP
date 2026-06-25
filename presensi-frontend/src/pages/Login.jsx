import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from 'react-hot-toast';
import { 
    FiEye, FiEyeOff, FiAlertCircle, 
    FiX, FiMail, FiLock, FiCheckCircle 
} from "react-icons/fi";
import { MdOutlineWavingHand } from "react-icons/md";

// IMPORT LOGO SECARA LANGSUNG
import logoImg from "../assets/logo.png";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // State untuk Modal Lupa Password
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); 
    const [forgotEmail, setForgotEmail] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    
    // State agar mata di modal tidak kebuka bersamaan
    const [showForgotNewPass, setShowForgotNewPass] = useState(false);
    const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await api.post('/login', {
                email: email,
                password: password
            });

            localStorage.setItem('token', response.data.token);
            const userData = response.data.user || response.data.data;
            localStorage.setItem('user', JSON.stringify(userData));

            navigate('/dashboard');
            toast.success("Berhasil masuk!");
        } catch (err) {
            setError(err.response?.data?.message || "Terjadi kesalahan pada server");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        const toastId = toast.loading("Mengirim token reset ke email Anda...");

        try {
            await api.post('/lupa-password', { email: forgotEmail });
            toast.success("Token berhasil dikirim! Silakan periksa email Anda.", { id: toastId });
            setForgotStep(2); 
        } catch (error) {
            const pesanError = error.response?.data?.message || "Gagal mengirim token. Pastikan email terdaftar.";
            toast.error(pesanError, { id: toastId });
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmNewPassword) {
            return toast.error("Konfirmasi sandi tidak cocok!");
        }
        if (newPassword.length < 6) {
            return toast.error("Sandi baru minimal 6 karakter!");
        }

        setForgotLoading(true);
        const toastId = toast.loading("Memperbarui kata sandi...");

        try {
            await api.post('/reset-password', {
                email: forgotEmail,
                token: resetToken,
                password: newPassword,
                password_confirmation: confirmNewPassword
            });

            toast.success("Sandi berhasil diperbarui! Silakan login dengan sandi baru.", { id: toastId });
            closeForgotModal();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal mereset sandi. Pastikan token benar dan belum kedaluwarsa.", { id: toastId });
        } finally {
            setForgotLoading(false);
        }
    };

    const closeForgotModal = () => {
        setIsForgotModalOpen(false);
        setForgotStep(1);
        setForgotEmail("");
        setResetToken("");
        setNewPassword("");
        setConfirmNewPassword("");
        setShowForgotNewPass(false);
        setShowForgotConfirmPass(false);
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-dark-bg transition-colors duration-500">
            
            {/* BAGIAN KIRI: BRANDING GAMBAR PENDIDIKAN */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden transition-colors duration-500 shadow-2xl z-10 group">
                
                {/* Background Image & Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-indigo-900/90 to-slate-900/95 z-0 dark:from-slate-900/95 dark:via-purple-900/95 dark:to-slate-900/95 transition-colors duration-500"></div>
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] z-0"></div>
                <img 
                    src="src/assets/edu-bg.jpg" 
                    alt="Educational Background" 
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-105 transition-transform duration-1000 z-0"
                    onError={(e) => { e.target.style.display = 'none'; }} 
                />

                {/* Blurs / Lights effect */}
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white/10 dark:bg-purple-primary/20 rounded-full blur-[80px] z-0 pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-neo-indigo/40 dark:bg-lime-neon/10 rounded-full blur-[60px] z-0 pointer-events-none"></div>

                {/* AREA LOGO PREMIUM LOOK */}
                <div className="relative z-20 flex flex-col md:flex-row items-start md:items-center gap-4 bg-white/10 dark:bg-white/5 w-fit p-4 pr-8 rounded-[1.5rem] backdrop-blur-md border border-white/20 shadow-2xl">
                    <div className="p-2 bg-white/20 rounded-xl shadow-inner border border-white/30 flex items-center justify-center">
                        <img 
                            src={logoImg} 
                            alt="Logo Hands Up" 
                            className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-md"
                            onError={(e) => {
                                e.target.src = "https://ui-avatars.com/api/?name=HU&background=B8F60D&color=2B103D&bold=true";
                            }}
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-white tracking-wide drop-shadow-sm">Hands Up</span>
                        <span className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em]">Presensi Digital</span>
                    </div>
                </div>

                <div className="relative z-20 mb-20">
                    <h2 className="text-[3.5rem] font-extrabold leading-tight text-white mb-6">
                        Sistem Presensi <br/> 
                        Digital <span className="text-lime-300 dark:text-lime-neon">Pintar.</span>
                    </h2>
                    <p className="text-lg text-blue-100 dark:text-slate-300 max-w-md leading-relaxed">
                        Pantau kehadiran, kelola data rekapitulasi, dan cetak laporan kelas dengan cepat, aman, serta efisien dalam satu genggaman.
                    </p>
                </div>

                <div className="relative z-20 text-sm font-medium text-blue-200/80 dark:text-slate-500">
                    © 2026 Digarap Oleh Tim Pemweb Kelompok 1.
                </div>
            </div>

            {/* FORM LOGIN UTAMA */}
            <div className="relative flex flex-col justify-center w-full lg:w-1/2 p-8 sm:p-12 lg:p-24 overflow-y-auto">
                
                <div className="w-full max-w-md mx-auto mt-8 md:mt-0">
                    
                    <div className="flex flex-col items-center lg:items-start mb-10 space-y-3">
                        {/* AREA LOGO MOBILE */}
                        <div className="lg:hidden relative p-3 mb-2 bg-white dark:bg-purple-dark rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-purple-primary/30 flex items-center justify-center">
                            <img 
                                src={logoImg} 
                                alt="Logo Hands Up" 
                                className="w-14 h-14 object-contain"
                                onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=HU&background=B8F60D&color=2B103D&bold=true"}
                            />
                        </div>
                        
                        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                            Selamat Datang <MdOutlineWavingHand className="text-yellow-500 animate-pulse" />
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center lg:text-left">
                            Silakan masukkan kredensial akun Anda untuk melanjutkan ke dasbor.
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 mb-6 text-sm font-semibold text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-center gap-3 animate-pulse shadow-sm">
                            <FiAlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                Alamat Email
                            </label>
                            <input 
                                type="email" 
                                required
                                placeholder="alwitiow@gmail.com"
                                className="w-full px-5 py-4 bg-white dark:bg-dark-bg border border-slate-200 dark:border-purple-primary/50 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-neo-blue focus:ring-4 focus:ring-neo-blue/10 dark:focus:ring-lime-neon/20 transition-all shadow-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Kata Sandi
                                </label>
                                <button 
                                    type="button" 
                                    onClick={() => setIsForgotModalOpen(true)}
                                    className="text-xs font-bold text-neo-blue hover:text-neo-indigo dark:text-lime-neon dark:hover:text-lime-300 transition-colors"
                                >
                                    Lupa Kata Sandi?
                                </button>
                            </div>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-5 pr-14 py-4 bg-white dark:bg-dark-bg border border-slate-200 dark:border-purple-primary/50 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-neo-blue focus:ring-4 focus:ring-neo-blue/10 dark:focus:ring-lime-neon/20 transition-all shadow-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-5 text-slate-400 hover:text-neo-blue dark:hover:text-lime-neon transition-colors focus:outline-none"
                                >
                                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 mt-2 text-[15px] font-extrabold text-white dark:text-purple-dark bg-neo-blue dark:bg-lime-neon rounded-xl hover:bg-neo-indigo dark:hover:bg-[#a2db0b] focus:ring-4 focus:ring-neo-blue/30 dark:focus:ring-lime-neon/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-neo-blue/20 dark:shadow-lime-neon/10"
                        >
                            {loading ? "MENGHUBUNGKAN..." : "MASUK KE SISTEM"}
                        </button>
                    </form>
                </div>
            </div>

            {/* MODAL LUPA KATA SANDI */}
            {isForgotModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-dark-bg w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all relative">
                        
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                                    <FiLock className="w-4 h-4" />
                                </div>
                                Pemulihan Akun
                            </h3>
                            <button onClick={closeForgotModal} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Step 1: Input Email */}
                        {forgotStep === 1 && (
                            <form onSubmit={handleRequestReset} className="p-6 md:p-8 flex flex-col gap-6" autoComplete="off">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                        Masukkan alamat email yang terdaftar. Kami akan mengirimkan token rahasia untuk mereset kata sandi Anda.
                                    </p>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Alamat Email Terdaftar</label>
                                    <div className="relative">
                                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="email" 
                                            id="reset-email-input"
                                            autoComplete="off"
                                            required
                                            placeholder="contoh@sekolah.id"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:border-neo-blue transition-all"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={forgotLoading || !forgotEmail}
                                    className="w-full py-3.5 bg-neo-blue hover:bg-neo-indigo text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-neo-blue/20"
                                >
                                    {forgotLoading ? "MENGIRIM TOKEN..." : "KIRIM TOKEN PEMULIHAN"}
                                </button>
                            </form>
                        )}

                        {/* Step 2: Input Token & Pass Baru */}
                        {forgotStep === 2 && (
                            <form onSubmit={handleResetPassword} className="p-6 md:p-8 flex flex-col gap-5" autoComplete="off">
                                
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-start gap-3 mb-2">
                                    <FiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 leading-relaxed">
                                        Token berhasil dikirim ke <span className="font-black underline">{forgotEmail}</span>. Silakan periksa kotak masuk atau folder spam Anda.
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Token Rahasia</label>
                                    <input 
                                        type="text" 
                                        autoComplete="off"
                                        required
                                        placeholder="Masukkan 6 digit token"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-700 dark:text-white focus:outline-none focus:border-neo-blue transition-all text-center tracking-[0.2em] shadow-inner"
                                        value={resetToken}
                                        onChange={(e) => setResetToken(e.target.value)}
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Kata Sandi Baru</label>
                                    <div className="relative">
                                        <input 
                                            type={showForgotNewPass ? "text" : "password"} 
                                            autoComplete="new-password"
                                            required
                                            placeholder="Minimal 6 karakter"
                                            className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:border-neo-blue transition-all shadow-sm"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-neo-blue dark:hover:text-lime-neon transition-colors focus:outline-none"
                                        >
                                            {showForgotNewPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Konfirmasi Sandi Baru</label>
                                    <div className="relative">
                                        <input 
                                            type={showForgotConfirmPass ? "text" : "password"} 
                                            autoComplete="new-password"
                                            required
                                            placeholder="Ulangi sandi baru"
                                            className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:border-neo-blue transition-all shadow-sm"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-neo-blue dark:hover:text-lime-neon transition-colors focus:outline-none"
                                        >
                                            {showForgotConfirmPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={forgotLoading || !resetToken || !newPassword || !confirmNewPassword}
                                    className="w-full py-3.5 mt-2 bg-slate-800 hover:bg-slate-900 dark:bg-lime-neon dark:hover:bg-lime-400 dark:text-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                                >
                                    {forgotLoading ? "MEMPROSES..." : "SIMPAN KATA SANDI BARU"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}