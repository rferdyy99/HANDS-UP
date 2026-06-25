import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import { 
    LuUser, LuMapPin, LuFileText, LuHistory, LuMenu, LuX,
    LuClipboardCheck, LuMailOpen, LuLayoutDashboard, 
    LuUsers, LuSettings, LuLogOut, LuSchool, LuLifeBuoy 
} from "react-icons/lu";

import AbsenSiswa from "../components/AbsenSiswa";
import IzinSiswa from "../components/IzinSiswa";
import RiwayatSiswa from "../components/RiwayatSiswa";
import ValidasiPresensi from "../components/ValidasiPresensi";
import ValidasiIzin from "../components/ValidasiIzin";
import DataKelas from "../components/DataKelas";
import DataPengguna from "../components/DataPengguna";
import LaporanPresensi from "../components/LaporanPresensi";
import PengaturanSistem from "../components/PengaturanSistem";
import ProfilSaya from "../components/ProfilSaya"; 
import DashboardAnalitik from "../components/DashboardAnalitik";
import Bantuan from "../components/Bantuan"; 

// Import Logo Aplikasi
import logoImg from "../assets/logo.png";

// Import Custom Avatar Profile
import iconSiswa from "../assets/student.png";
import iconGuru from "../assets/teacher.png";
import iconAdmin from "../assets/admin.png";

export default function Dashboard() {
    const navigate = useNavigate();
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
    const [isCollapsed, setIsCollapsed] = useState(false); 
    const [menuAktif, setMenuAktif] = useState("profil");
    
    // Gunakan state untuk user agar React bisa me-render ulang Navbar saat data berubah
    const [user, setUser] = useState(() => {
        const userString = localStorage.getItem('user');
        return userString && userString !== "undefined" ? JSON.parse(userString) : null;
    });

    // Event Listener untuk mendengarkan perubahan data profil (khususnya update foto)
    useEffect(() => {
        const handleUserUpdate = () => {
            const userString = localStorage.getItem('user');
            setUser(userString && userString !== "undefined" ? JSON.parse(userString) : null);
        };
        
        window.addEventListener('userUpdated', handleUserUpdate);
        return () => window.removeEventListener('userUpdated', handleUserUpdate);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const switchMenu = (target) => {
        setMenuAktif(target);
        setIsSidebarOpen(false); 
    };

    // Fungsi Pintar Penentu Avatar Berdasarkan Role & Database
    const getAvatarIcon = () => {
        if (!user) return iconSiswa;

        if (user.role === 'admin') return iconAdmin;
        
        if (user.role === 'guru') {
            if (user.guru?.foto_url && !user.guru.foto_url.includes('teacher.png')) {
                return user.guru.foto_url;
            }
            return iconGuru;
        }
        
        // Role Siswa
        if (user.siswa?.foto_url && !user.siswa.foto_url.includes('student.png')) {
            return user.siswa.foto_url;
        }
        return iconSiswa;
    };

    // Navigasi Admin (TANPA Pusat Bantuan)
    const adminMenu = [
        { id: 'profil', label: 'Profil Saya', icon: LuUser },
        { id: 'analitik', label: 'Dashboard', icon: LuLayoutDashboard },
        { id: 'kelas', label: 'Data Kelas', icon: LuSchool },
        { id: 'pengguna', label: 'Data Pengguna', icon: LuUsers },
        { id: 'validasi_presensi', label: 'Validasi Presensi', icon: LuClipboardCheck },
        { id: 'validasi_izin', label: 'Validasi Izin', icon: LuMailOpen },
        { id: 'laporan', label: 'Laporan Presensi', icon: LuFileText },
        { id: 'setting', label: 'Pengaturan Sistem', icon: LuSettings, isBottom: true }
    ];

    // Navigasi Guru (ADA Pusat Bantuan)
    const guruMenu = [
        { id: 'profil', label: 'Profil Saya', icon: LuUser },
        { id: 'presensi', label: 'Validasi Presensi', icon: LuClipboardCheck },
        { id: 'izin', label: 'Validasi Izin', icon: LuMailOpen },
        { id: 'laporan', label: 'Laporan Presensi', icon: LuLayoutDashboard },
        { id: 'bantuan', label: 'Pusat Bantuan', icon: LuLifeBuoy }
    ];

    // Navigasi Siswa (ADA Pusat Bantuan)
    const siswaMenu = [
        { id: 'profil', label: 'Profil Saya', icon: LuUser },
        { id: 'presensi', label: 'Presensi Harian', icon: LuMapPin },
        { id: 'izin', label: 'Pengajuan Izin', icon: LuFileText },
        { id: 'riwayat', label: 'Riwayat Presensi', icon: LuHistory },
        { id: 'bantuan', label: 'Pusat Bantuan', icon: LuLifeBuoy } 
    ];

    const activeMenuArray = user?.role === 'admin' ? adminMenu : user?.role === 'guru' ? guruMenu : siswaMenu;

    return (
        <div className="flex h-screen bg-slate-50/80 font-sans text-slate-800 overflow-hidden">
            
            {/* OVERLAY MOBILE */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* SIDEBAR KIRI (PREMIUM & COLLAPSIBLE) */}
            <aside className={`
                fixed md:relative z-50 h-full bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
                ${isSidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0'}
                ${isCollapsed ? 'md:w-20' : 'md:w-[280px]'}
            `}>
                
                {/* 1. BRANDING & LOGO */}
                <div className="h-24 flex items-center justify-between px-6 shrink-0 relative">
                    <div className={`flex items-center gap-3.5 overflow-hidden ${isCollapsed ? 'md:justify-center w-full' : ''}`}>
                        <div className="relative shrink-0 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 w-11 h-11 overflow-hidden group p-1.5">
                            <img 
                                src={logoImg} 
                                alt="Logo" 
                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=HU&background=B8F60D&color=2B103D&bold=true"}
                            />
                        </div>
                        <div className={`flex flex-col transition-all duration-300 ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>
                            <h2 className="text-[18px] font-black tracking-tight text-slate-800 whitespace-nowrap leading-tight">Hands Up</h2>
                            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-[0.25em] whitespace-nowrap">Presensi Pintar</p>
                        </div>
                    </div>

                    {/* Tombol Collapse */}
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden md:flex items-center justify-center w-6 h-6 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-full transition-all absolute -right-3 top-9 shadow-sm hover:shadow z-10"
                    >
                        {isCollapsed ? <LuMenu size={12} /> : <LuX size={12} />}
                    </button>
                </div>
                
                {/* 2. NAVIGATION MENU (PREMIUM LOOK) */}
                <nav className="flex-1 overflow-y-auto px-4 py-4 flex flex-col custom-scrollbar">
                    {activeMenuArray.map((item) => {
                        const Icon = item.icon;
                        const active = menuAktif === item.id;
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => switchMenu(item.id)}
                                title={isCollapsed ? item.label : ""}
                                className={`flex items-center w-full rounded-xl transition-all duration-300 font-bold text-[13px] group relative overflow-hidden
                                    ${isCollapsed ? 'justify-center p-3 mb-2' : 'gap-3.5 px-4 py-3.5 mb-1.5'}
                                    ${active 
                                        ? 'bg-blue-50/80 text-blue-600' 
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                                    ${item.isBottom ? 'mt-auto border border-slate-100 bg-white shadow-sm hover:border-blue-200' : ''}
                                `}
                            >
                                {/* Indikator Aktif (Garis Kiri) */}
                                {active && !isCollapsed && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-blue-600 rounded-r-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                                )}
                                
                                <div className={`relative shrink-0 flex items-center justify-center transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    <Icon size={20} className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'} />
                                </div>

                                <span className={`whitespace-nowrap tracking-wide transition-all duration-300 ${isCollapsed ? 'md:opacity-0 md:w-0 md:hidden' : 'opacity-100'}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* 3. LOGOUT BUTTON */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <button 
                        onClick={handleLogout} 
                        title={isCollapsed ? "Keluar Sistem" : ""}
                        className={`flex items-center w-full px-4 py-3.5 text-xs font-black text-rose-600 bg-rose-50/50 hover:bg-rose-100 rounded-xl transition-all border border-rose-100/50 hover:border-rose-200 active:scale-95 group
                            ${isCollapsed ? 'md:justify-center md:px-0' : 'justify-center gap-2.5'}
                        `}
                    >
                        <LuLogOut size={18} className="shrink-0 group-hover:-translate-x-1 transition-transform" /> 
                        <span className={`whitespace-nowrap transition-all duration-300 tracking-widest ${isCollapsed ? 'md:hidden' : ''}`}>KELUAR AKSES</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                
                {/* TOP NAVBAR (HEADER) */}
                <header className="flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-5 md:px-8 h-20 md:h-24 z-30 sticky top-0 shrink-0">
                    
                    {/* Kiri: Hamburger (Mobile) & Greeting (PC) */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors active:scale-95 shadow-sm">
                            <LuMenu size={22} />
                        </button>
                        
                        <div className="hidden md:flex flex-col">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Halo, {user?.name?.split(' ')[0] || 'Pengguna'}! 👋</h2>
                            <p className="text-[13px] font-semibold text-slate-500 mt-0.5">Siap untuk memantau presensi hari ini?</p>
                        </div>
                        
                        {/* Mobile Title */}
                        <div className="md:hidden flex flex-col ml-1">
                            <h1 className="font-black text-lg text-slate-800 tracking-tight leading-tight">Hands Up</h1>
                        </div>
                    </div>

                    {/* Kanan: Custom Avatar (Student / Teacher / Admin) */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end text-right">
                            <span className="text-sm font-black text-slate-800">{user?.name}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                user?.role === 'admin' ? 'text-lime-600' :
                                user?.role === 'guru' ? 'text-indigo-600' : 'text-emerald-600'
                            }`}>{user?.role}</span>
                        </div>

                        {/* AVATAR KUSTOM (DIKLIK MENUJU PROFIL) */}
                        <button 
                            onClick={() => setMenuAktif('profil')} 
                            title="Lihat Profil Saya"
                            className="relative w-11 h-11 md:w-14 md:h-14 rounded-[1rem] md:rounded-[1.2rem] shadow-sm border-2 border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group overflow-hidden bg-white flex items-center justify-center p-0.5"
                        >
                            <img 
                                src={getAvatarIcon()} 
                                alt="Avatar Profil" 
                                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300 rounded-[0.8rem] md:rounded-[1rem]"
                                onError={(e) => { e.target.src = user?.role === 'guru' ? iconGuru : user?.role === 'admin' ? iconAdmin : iconSiswa; }}
                            />
                            
                            {/* Indikator Online (Bulatan Hijau) */}
                            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
                        </button>
                    </div>
                </header>

                {/* CONTENT ROUTER */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-24 md:pb-0 h-full">
                        
                        {menuAktif === 'profil' && <ProfilSaya switchMenu={switchMenu} />}
                        {menuAktif === 'analitik' && <DashboardAnalitik/>}
                        
                        {/* Bantuan hanya dirender untuk Selain Admin demi keamanan tampilan */}
                        {menuAktif === 'bantuan' && user?.role !== 'admin' && <Bantuan />}

                        {user?.role === 'siswa' && (
                            <>
                                {menuAktif === 'presensi' && <AbsenSiswa />}
                                {menuAktif === 'izin' && <IzinSiswa />}
                                {menuAktif === 'riwayat' && <RiwayatSiswa />}
                            </>
                        )}

                        {user?.role === 'guru' && (
                            <>
                                {menuAktif === 'presensi' && <ValidasiPresensi />}
                                {menuAktif === 'izin' && <ValidasiIzin />}
                                {menuAktif === 'laporan' && <LaporanPresensi />}
                            </>
                        )}

                        {user?.role === 'admin' && (
                            <>
                                {menuAktif === 'kelas' && <DataKelas />}
                                {menuAktif === 'pengguna' && <DataPengguna />}
                                {menuAktif === 'validasi_presensi' && <ValidasiPresensi />}
                                {menuAktif === 'validasi_izin' && <ValidasiIzin />}
                                {menuAktif === 'laporan' && <LaporanPresensi />}
                                {menuAktif === 'setting' && <PengaturanSistem />}
                            </>
                        )}

                    </div>
                </main>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
            `}</style>
        </div>
    );
}