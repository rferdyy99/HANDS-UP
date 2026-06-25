import { useState, useEffect } from "react";
import { 
    FiHelpCircle, FiMessageCircle, FiMail, FiSend, 
    FiInfo, FiClock, FiPhone
} from "react-icons/fi";

export default function Bantuan() {
    const [pesan, setPesan] = useState("");
    const [user, setUser] = useState(null);

    const CONTACT = {
        whatsapp: "6287711882047",
        email: "hansupresensi@gmail.com",
    };

    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (userString && userString !== "undefined") {
            setUser(JSON.parse(userString));
        }
    }, []);

    const generateTemplate = () => {
        const nama = user?.name || "Pengguna";
        const role = user?.role || "Siswa";
        const identitas = user?.role === 'siswa' 
            ? `NIS: ${user?.siswa?.nis || '-'} | Kelas: ${user?.siswa?.kelas?.nama_kelas || '-'}`
            : user?.role === 'guru' 
                ? `NIP: ${user?.guru?.nip || '-'}` 
                : "Admin";
        return `Halo Tim Support Hands Up,\n\nSaya ${nama} (${role.toUpperCase()}).\n${identitas}\n\nSaya ingin menyampaikan kendala / pertanyaan berikut:\n\n${pesan}\n\nTerima kasih.`;
    };

    const kirimWhatsApp = () => {
        if (!pesan.trim()) return;
        const text = encodeURIComponent(generateTemplate());
        window.open(`https://wa.me/${CONTACT.whatsapp}?text=${text}`, '_blank');
    };

    const kirimEmail = () => {
        if (!pesan.trim()) return;
        const subject = encodeURIComponent(`Bantuan Hands Up - Keluhan dari ${user?.name || 'Pengguna'}`);
        const body = encodeURIComponent(generateTemplate());
        const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT.email}&su=${subject}&body=${body}`;
        window.open(gmailLink, '_blank');
    };

    const faqItems = [
        {
            q: "Gagal Melakukan Presensi?",
            a: "Pastikan GPS aktif, izin lokasi browser diberikan, dan Anda berada dalam radius yang ditentukan."
        },
        {
            q: "Lupa Kata Sandi Akun?",
            a: "Buka menu Profil Saya, klik Lupa Sandi untuk reset password melalui email terdaftar."
        },
        {
            q: "Data Presensi Tidak Muncul?",
            a: "Coba refresh halaman atau hubungi admin jika data tidak muncul setelah 1x24 jam."
        },
        {
            q: "Akun Terkunci/Bermasalah?",
            a: "Segera hubungi Tim IT melalui WhatsApp atau Email yang tertera untuk bantuan."
        },
    ];

    return (
        <div className="w-full flex flex-col animate-fadeIn pb-24 md:pb-10 relative max-w-[1400px] mx-auto">
            
            {/* HERO BANNER */}
            <div className="w-full h-auto md:h-32 rounded-2xl overflow-hidden relative shadow-sm border border-slate-200 group shrink-0 mb-6 flex flex-col justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-indigo-900/80 to-slate-900/90 z-10"></div>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] z-10"></div>
                <img 
                    src="src/assets/edu-bg.jpg" 
                    alt="Background" 
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 opacity-50"
                    onError={(e) => { e.target.style.display = 'none'; }} 
                />
                
                <div className="relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center w-full p-4 md:p-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white shadow-sm hidden sm:flex">
                            <FiHelpCircle className="w-5 h-5 text-lime-300" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md mb-0.5">Pusat Bantuan</h2>
                            <p className="text-[10px] md:text-xs font-medium text-blue-100 drop-shadow-sm max-w-sm">Sampaikan kendala atau pertanyaan Anda kepada Tim Support.</p>
                        </div>
                    </div>

                    <div className="flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5 md:px-4 w-full md:w-auto shadow-sm items-center md:items-start shrink-0 z-[70]">
                        <span className="text-[9px] text-lime-200 uppercase tracking-widest font-black mb-0.5 flex items-center gap-1.5">
                            <FiClock className="w-3 h-3" /> JAM OPERASIONAL
                        </span>
                        <span className="text-xs md:text-sm font-black text-white">
                            Sen - Jum | 07:00 - 16:00 WIB
                        </span>
                    </div>
                </div>
            </div>

            {/* GRID UTAMA */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 items-stretch">

                {/* KOLOM KIRI: FORM (8/12) */}
                <div className="xl:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                    {/* Header card */}
                    <div className="px-5 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 shrink-0">
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                            <FiMessageCircle className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">
                            Form Tiket Bantuan
                        </h3>
                    </div>

                    {/* Body */}
                    <div className="p-5 md:p-6 flex flex-col gap-4 flex-1">

                        {/* Info identitas */}
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                            <FiInfo className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black text-blue-800 uppercase tracking-wider mb-1">
                                    Identitas Terekam Otomatis
                                </p>
                                <p className="text-[10px] font-medium text-blue-600/80 leading-relaxed">
                                    Nama, Role, NIS/NIP, dan Kelas Anda akan otomatis terlampir saat mengirim pesan. Cukup tuliskan inti permasalahan di bawah.
                                </p>
                            </div>
                        </div>

                        {/* User preview card */}
                        {user && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm shrink-0">
                                    {user.name?.substring(0, 2) || 'HU'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-slate-800 truncate">{user.name}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <span>{user.role}</span>
                                        <span className="text-slate-300">•</span>
                                        <span>
                                            {user.role === 'siswa'
                                                ? user.siswa?.kelas?.nama_kelas || 'Belum Ada Kelas'
                                                : user.role === 'guru'
                                                    ? user.guru?.kelas?.nama_kelas || 'Tidak Menjabat'
                                                    : 'Sistem'}
                                        </span>
                                    </p>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 bg-slate-200 px-2 py-1 rounded-md uppercase tracking-wider shrink-0">
                                    {user.role}
                                </span>
                            </div>
                        )}

                        {/* Textarea */}
                        <div className="flex flex-col flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                Deskripsi Masalah / Pertanyaan
                            </label>
                            <textarea
                                value={pesan}
                                onChange={(e) => setPesan(e.target.value)}
                                placeholder="Jelaskan kendala Anda secara detail. Contoh: Saya gagal absen di gerbang utara karena GPS tidak terbaca..."
                                className="w-full flex-1 min-h-[140px] px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none shadow-sm"
                            />
                        </div>

                        {/* Tombol aksi */}
                        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                            <button
                                onClick={kirimWhatsApp}
                                disabled={!pesan.trim()}
                                className="flex-1 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FiSend className="w-4 h-4" /> Kirim via WhatsApp
                            </button>
                            <button
                                onClick={kirimEmail}
                                disabled={!pesan.trim()}
                                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-800/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FiMail className="w-4 h-4" /> Buka via Gmail
                            </button>
                        </div>
                    </div>
                </div>

                {/* KOLOM KANAN: KONTAK & FAQ (4/12) */}
                <div className="xl:col-span-4 flex flex-col gap-4 md:gap-6">

                    {/* CARD KONTAK */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
                        <div className="px-5 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                                <FiPhone className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">
                                Kontak Langsung
                            </h3>
                        </div>
                        <div className="p-5 md:p-6 flex flex-col gap-3">
                            {/* WhatsApp */}
                            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shadow-sm shrink-0">
                                    <FiSend className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">WhatsApp</p>
                                    <p className="text-xs font-black text-slate-800 truncate">+{CONTACT.whatsapp}</p>
                                </div>
                            </div>
                            {/* Email */}
                            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shadow-sm shrink-0">
                                    <FiMail className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email Support</p>
                                    <p className="text-xs font-black text-slate-800 break-all">{CONTACT.email}</p>
                                </div>
                            </div>
                            {/* Jam operasional */}
                            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <FiClock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Jam Operasional</p>
                                </div>
                                <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                                    Layanan support tersedia <strong className="font-black text-amber-800">Senin - Jumat</strong>, pukul <strong className="font-black text-amber-800">07:00 - 16:00 WIB</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CARD FAQ */}
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 md:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 shrink-0">
                            <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                                <FiHelpCircle className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">
                                Pertanyaan Umum
                            </h3>
                        </div>
                        <div className="p-5 md:p-6 flex flex-col gap-3 flex-1">
                            {faqItems.map((item, i) => (
                                <div key={i} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                                    <p className="text-[10px] font-black text-slate-700 mb-1">{item.q}</p>
                                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes fadeIn { 
                    from { opacity: 0; transform: translateY(8px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
                .animate-fadeIn { animation: fadeIn .3s ease forwards; }
            `}</style>
        </div>
    );
}