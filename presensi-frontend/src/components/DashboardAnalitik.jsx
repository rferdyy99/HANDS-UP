import { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/api";
import {
    FiPieChart, FiTrendingUp, FiUsers, FiAward, FiCheckCircle,
    FiXCircle, FiActivity, FiStar, FiAlertTriangle,
    FiZap, FiRadio, FiInfo, FiRefreshCw, FiChevronDown, FiPercent,
    FiTrendingDown, FiFilter, FiLayers, FiCalendar, FiClock
} from "react-icons/fi";
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// ─── Warna status ────────────────────────────────────────
const COLOR = {
    hadir:   '#10b981',
    pending: '#8b5cf6',
    izin:    '#3b82f6',
    sakit:   '#f59e0b',
    alpha:   '#ef4444',
    kosong:  '#94a3b8',
};

// ─── Tooltip kustom Recharts ─────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 text-xs z-50">
            {label && (
                <p className="font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1.5 text-[9px]">
                    {label}
                </p>
            )}
            <div className="flex flex-col gap-1.5">
                {payload.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ background: entry.color }} />
                        <span className="font-bold text-slate-600">{entry.name}:</span>
                        <span className="font-black text-slate-800 ml-auto pl-3">{entry.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Warna cell heatmap ──────────────────────────────────
const heatColor = (val) => {
    if (val === null || val === undefined) return 'bg-slate-50 text-slate-300 border border-slate-100';
    if (val >= 90)   return 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20';
    if (val >= 75)   return 'bg-emerald-200 text-emerald-800';
    if (val >= 60)   return 'bg-amber-200 text-amber-800';
    if (val >= 40)   return 'bg-orange-200 text-orange-800';
    return 'bg-rose-200 text-rose-800';
};

const DropdownKelas = ({ daftarKelas = [], tingkat, setTingkat, kelasId, setKelasId }) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState('bottom');
    const [dropdownStyle, setDropdownStyle] = useState({});
    
    useEffect(() => {
        if (open && buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const dropdownWidth = 280; 
            
            const spaceOnRight = viewportWidth - buttonRect.left;
            const spaceOnLeft = buttonRect.right;
            
            let leftPosition = 0;
            if (spaceOnRight >= dropdownWidth) {
                leftPosition = 0;
            } else if (spaceOnLeft >= dropdownWidth) {
                leftPosition = buttonRect.width - dropdownWidth;
            } else {
                leftPosition = -(dropdownWidth - buttonRect.width) / 2;
            }
            
            const spaceBelow = window.innerHeight - buttonRect.bottom;
            const spaceAbove = buttonRect.top;
            const dropdownHeight = 350;
            
            setDropdownStyle({
                left: `${leftPosition}px`,
                minWidth: '240px',
                maxWidth: '280px'
            });
            
            if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                setDropdownPosition('top');
            } else {
                setDropdownPosition('bottom');
            }
        }
    }, [open]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const angkatan = [
        { id: '',  label: 'Semua Angkatan' },
        { id: '10', label: 'Kelas X' },
        { id: '11', label: 'Kelas XI' },
        { id: '12', label: 'Kelas XII' },
    ];

    const urutkanKelas = (kelasArray = []) => {
        return [...kelasArray].sort((a, b) => {
            const getVal = (nama) => {
                const up = nama?.toUpperCase() || "";
                if (up.startsWith('XII')) return 3;
                if (up.startsWith('XI')) return 2;
                if (up.startsWith('X')) return 1;
                return 0;
            };
            const valA = getVal(a.nama_kelas);
            const valB = getVal(b.nama_kelas);
            if (valA !== valB) return valB - valA; 
            return (a.nama_kelas || "").localeCompare(b.nama_kelas || "", undefined, { numeric: true, sensitivity: 'base' });
        });
    };

    const kelasByTingkat = urutkanKelas((daftarKelas || []).filter(k => {
        if (!tingkat) return true;
        const n = k?.nama_kelas?.toUpperCase() || "";
        if (tingkat === '10') return n.startsWith('X ')   || n.startsWith('10 ');
        if (tingkat === '11') return n.startsWith('XI ')  || n.startsWith('11 ');
        if (tingkat === '12') return n.startsWith('XII ') || n.startsWith('12 ');
        return true;
    }));

    const labelAktif = kelasId
        ? (daftarKelas || []).find(k => String(k.id) === String(kelasId))?.nama_kelas
        : tingkat
            ? angkatan.find(a => a.id === tingkat)?.label
            : 'Semua Target';

    return (
        <div className="relative inline-block w-full sm:w-auto" ref={dropdownRef}>
            <button
                ref={buttonRef}
                onClick={() => setOpen(o => !o)}
                className="flex items-center justify-between gap-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm hover:border-blue-400 hover:ring-2 hover:ring-blue-500/10 transition-all min-w-[180px] w-full sm:w-auto"
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FiLayers className="text-blue-500 w-3.5 h-3.5 shrink-0" />
                    <span className="truncate uppercase tracking-wider text-left">{labelAktif || 'MEMUAT...'}</span>
                </div>
                <FiChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
                    <div 
                        className={`absolute z-[9999] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn ${
                            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                        }`}
                        style={{ ...dropdownStyle, maxHeight: '70vh', overflowY: 'auto' }}
                    >
                        <div className="p-3 bg-slate-50/80 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <FiFilter className="w-3 h-3"/> Angkatan
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {angkatan.map(a => (
                                    <button
                                        key={a.id}
                                        onClick={() => { setTingkat(a.id); setKelasId(''); }}
                                        className={`px-2 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all ${
                                            tingkat === a.id && !kelasId
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {a.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {kelasByTingkat.length > 0 && (
                            <div className="p-3">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Kelas Spesifik</p>
                                <div className="flex flex-col gap-0.5">
                                    {kelasByTingkat.map(k => (
                                        <button
                                            key={k.id}
                                            onClick={() => { setKelasId(String(k.id)); setOpen(false); }}
                                            className={`text-left px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                                String(kelasId) === String(k.id)
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                                            }`}
                                        >
                                            {k.nama_kelas}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {kelasByTingkat.length === 0 && tingkat && (
                            <div className="p-6 text-center">
                                <FiInfo className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                    Tidak ada kelas untuk filter ini
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

function KpiCard({ icon, label, value, accent = 'slate', sub, className = "" }) {
    const ring = {
        slate:   'bg-slate-50 text-slate-500 border-slate-200',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        blue:    'bg-blue-50 text-blue-600 border-blue-200',
        rose:    'bg-rose-50 text-rose-600 border-rose-200',
        teal:    'bg-teal-50 text-teal-600 border-teal-200',
        violet:  'bg-violet-50 text-violet-600 border-violet-200',
    };
    const txt = {
        slate:   'text-slate-800', emerald: 'text-emerald-700',
        blue:    'text-blue-700',  rose:    'text-rose-700',
        teal:    'text-teal-700',  violet:  'text-violet-700',
    };
    return (
        <div className={`bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 min-h-[90px] group relative overflow-hidden shrink-0 ${className}`}>
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className={`p-2 rounded-xl shrink-0 border shadow-inner transition-transform group-hover:scale-110 ${ring[accent]}`}>
                    {icon}
                </div>
                {sub && <div>{sub}</div>}
            </div>
            <div className="relative z-10">
                <h3 className={`text-xl font-black leading-none ${txt[accent]}`}>{value}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate w-full">{label}</p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
//  KOMPONEN UTAMA DASHBOARD
// ═══════════════════════════════════════════════════════════
export default function DashboardAnalitik() {

    const [tingkat,      setTingkat]     = useState('');
    const [kelasId,      setKelasId]     = useState('');
    const [rentang,      setRentang]     = useState('7_hari');
    const [daftarKelas,  setDaftarKelas] = useState([]);

    const [ringkasan,   setRingkasan]   = useState(null);
    const [harianData,  setHarianData]  = useState([]);
    const [trenData,    setTrenData]    = useState([]);
    const [leaderboard, setLeaderboard] = useState({ terdisiplin: [], darurat_alpha: [] });
    const [insights,    setInsights]    = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [heatmapData, setHeatmapData] = useState([]);

    const [loading,     setLoading]     = useState(true);
    const [refreshing,  setRefreshing]  = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchAllData = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true);
        else if (!ringkasan) setLoading(true);

        try {
            const params = new URLSearchParams();
            if (kelasId)      params.set('kelas_id', kelasId);
            else if (tingkat) params.set('tingkat',  tingkat);
            params.set('rentang', rentang);
            const p = params.toString();

            const [resRingkasan, resHarian, resTren, resLeaderboard, resInsight, resOnline, resHeatmap] =
                await Promise.all([
                    api.get('/analitik/ringkasan'),
                    api.get(`/analitik/kehadiran-harian?${p}`),
                    api.get(`/analitik/tren-kehadiran?${p}`),
                    api.get('/analitik/leaderboard'),
                    api.get('/analitik/insight'),
                    api.get('/analitik/online'),
                    api.get('/analitik/heatmap'),
                ]);

            // Pertahanan Lapis Baja: Menggunakan || [] agar tidak pernah undefined
            setRingkasan(resRingkasan?.data?.data || null);
            setHarianData(resHarian?.data?.data || []);
            setTrenData(resTren?.data?.data || []);
            setLeaderboard(resLeaderboard?.data?.data || { terdisiplin: [], darurat_alpha: [] });
            setInsights(resInsight?.data?.data || []);
            setOnlineUsers(resOnline?.data?.data || []);
            setHeatmapData(resHeatmap?.data?.data || []);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Gagal memuat data analitik', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tingkat, kelasId, rentang]);

    useEffect(() => {
        api.get('/kelas').then(res => setDaftarKelas(res?.data?.data || [])).catch(() => setDaftarKelas([]));
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    useEffect(() => {
        const id = setInterval(async () => {
            try {
                const [resR, resO] = await Promise.all([
                    api.get('/analitik/ringkasan'),
                    api.get('/analitik/online'),
                ]);
                setRingkasan(resR?.data?.data || null);
                setOnlineUsers(resO?.data?.data || []);
                setLastRefresh(new Date());
            } catch (_) {}
        }, 10000);
        return () => clearInterval(id);
    }, []);

    const getInsightIcon = (type) => {
        if (type === 'positive') return <FiTrendingUp className="w-4 h-4 text-emerald-600" />;
        if (type === 'negative') return <FiTrendingDown className="w-4 h-4 text-rose-600" />;
        if (type === 'warning')  return <FiAlertTriangle className="w-4 h-4 text-amber-600" />;
        return <FiInfo className="w-4 h-4 text-blue-600" />;
    };

    if (loading && !ringkasan) {
        return (
            <div className="w-full h-full min-h-[70vh] flex flex-col items-center justify-center animate-fadeIn">
                <FiActivity className="w-10 h-10 mb-4 text-blue-400 animate-pulse" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Memuat Analitik...</p>
            </div>
        );
    }

    const persenHadir = ringkasan?.persen_hadir ?? (
        ringkasan?.total_siswa ? Math.round((ringkasan.hadir / ringkasan.total_siswa) * 100) : 0
    );
    const delta      = ringkasan?.delta_hadir ?? 0;
    const hariLabel  = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    return (
        <div className="w-full flex flex-col gap-4 pb-24 md:pb-10 max-w-[1400px] mx-auto animate-fadeIn relative">

            <div className="w-full h-auto md:h-28 rounded-2xl overflow-hidden relative shadow-sm border border-slate-200 group shrink-0 flex flex-col justify-center">
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
                            <FiPieChart className="w-5 h-5 text-lime-300" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md mb-0.5">Analitik Presensi</h2>
                            <p className="text-[10px] md:text-xs font-medium text-blue-100 drop-shadow-sm max-w-sm">Command Center Evaluasi & Insight Terpadu.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5 md:px-4 w-full md:w-auto shadow-sm items-center z-[70]">
                        <div className="flex flex-col items-center md:items-start w-full text-center md:text-left pr-2">
                            <span className="text-[9px] text-lime-200 uppercase tracking-widest font-black mb-0.5 flex items-center justify-center md:justify-start gap-1">
                                <FiActivity className="w-3 h-3" /> Update Terakhir
                            </span>
                            <span className="text-xs md:text-sm font-black text-white w-full">
                                {lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                        </div>
                        <button 
                            onClick={() => fetchAllData(true)} 
                            disabled={refreshing} 
                            className="p-2 w-full sm:w-auto bg-white/20 hover:bg-white/30 rounded-lg text-white transition-all shadow-inner active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-lime-300' : ''}`} />
                            <span className="text-[9px] font-bold tracking-widest uppercase sm:hidden">Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 -mt-2 z-30">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <DropdownKelas
                        daftarKelas={daftarKelas}
                        tingkat={tingkat} setTingkat={setTingkat}
                        kelasId={kelasId} setKelasId={setKelasId}
                    />
                </div>
                
                <div className="w-full md:w-auto flex items-center gap-2">
                    <FiCalendar className="text-slate-400 w-4 h-4 ml-2 hidden md:block" />
                    <div className="relative w-full md:w-48">
                        <select
                            value={rentang} onChange={e => setRentang(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-[10px] font-black text-slate-700 uppercase tracking-widest hover:border-blue-400 focus:outline-none transition-all cursor-pointer appearance-none"
                        >
                            <option value="7_hari">7 Hari Terakhir</option>
                            <option value="1_bulan">1 Bulan Terakhir</option>
                            <option value="1_semester">Semester Berjalan</option>
                        </select>
                        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* KPI DENGAN 6 KOLOM (Draft dihapus, menyisakan 6 kotak persis) */}
            <div className="flex overflow-x-auto lg:grid lg:grid-cols-6 gap-3 md:gap-4 hide-scrollbar snap-x z-20 pb-2 -mb-2">
                <KpiCard className="min-w-[140px] snap-start" icon={<FiUsers className="w-4 h-4"/>}        label="Total Siswa"  value={ringkasan?.total_siswa ?? 0} />
                <KpiCard className="min-w-[140px] snap-start" icon={<FiCheckCircle className="w-4 h-4"/>}  label="Hadir"        value={ringkasan?.hadir        ?? 0} accent="emerald" />
                <KpiCard className="min-w-[140px] snap-start" icon={<FiClock className="w-4 h-4"/>}        label="Pending"      value={ringkasan?.pending      ?? 0} accent="violet" />
                <KpiCard className="min-w-[140px] snap-start" icon={<FiActivity className="w-4 h-4"/>}     label="Izin / Sakit" value={ringkasan?.izin_sakit   ?? 0} accent="blue" />
                <KpiCard className="min-w-[140px] snap-start" icon={<FiXCircle className="w-4 h-4"/>}      label="Alpha"        value={ringkasan?.alpha        ?? 0} accent="rose" />
                <KpiCard className="min-w-[170px] lg:min-w-0 snap-start"
                    icon={<FiPercent className="w-4 h-4"/>}
                    label="% Kehadiran"
                    value={`${persenHadir}%`}
                    accent="teal"
                    sub={
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${delta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {delta >= 0 ? '▲ NAIK' : '▼ TURUN'} {Math.abs(delta)}%
                        </span>
                    }
                />
            </div>

            {/* BARIS KEDUA: INSIGHT & TREN KEHADIRAN */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 z-10 mt-2">

                <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 p-5 md:p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col relative overflow-hidden group h-[320px] md:h-[350px]">
                    <div className="absolute -top-6 -right-6 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <FiZap className="w-32 h-32 text-lime-400" />
                    </div>
                    <div className="flex justify-between items-center mb-4 relative z-10 shrink-0">
                        <h3 className="text-[11px] md:text-xs font-black text-lime-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-lime-400 animate-ping shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
                            Insight AI Analitik
                        </h3>
                    </div>

                    <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto custom-scrollbar pr-1.5 relative z-10">
                        {(insights || []).length > 0 ? (insights || []).map((ins, i) => {
                            let bg = 'bg-slate-800/80 border-slate-700';
                            let iconBg = 'bg-slate-700';
                            
                            if (ins.type === 'positive') { bg = 'bg-emerald-500/10 border-emerald-500/20'; iconBg = 'bg-emerald-500/20'; }
                            if (ins.type === 'negative') { bg = 'bg-rose-500/10 border-rose-500/20'; iconBg = 'bg-rose-500/20'; }
                            if (ins.type === 'warning')  { bg = 'bg-amber-500/10 border-amber-500/20'; iconBg = 'bg-amber-500/20'; }
                            if (ins.type === 'info')     { bg = 'bg-blue-500/10 border-blue-500/20'; iconBg = 'bg-blue-500/20'; }
                            
                            return (
                                <div key={i} className={`p-3 rounded-xl border shadow-sm flex items-start gap-3 hover:-translate-y-0.5 transition-transform cursor-default shrink-0 ${bg}`}>
                                    <div className={`shrink-0 p-2 rounded-xl mt-0.5 ${iconBg}`}>
                                        {getInsightIcon(ins.type)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[10px] font-black text-white uppercase tracking-wider mb-1">{ins.title}</h4>
                                        <p className="text-[9px] font-medium text-slate-300 leading-snug">{ins.message}</p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                                <FiActivity className="w-6 h-6 animate-pulse opacity-50"/>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-center px-4">Memproses pola presensi...</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-7 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[320px] md:h-[350px]">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="text-[11px] md:text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><FiTrendingUp className="w-3.5 h-3.5" /></div>
                            Tren Kehadiran
                        </h3>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="99%" height="100%" minHeight={200}>
                            <AreaChart data={trenData || []} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gHadir" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={COLOR.hadir} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={COLOR.hadir} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={COLOR.pending} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={COLOR.pending} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gAlpha" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={COLOR.alpha} stopOpacity={0.15} />
                                        <stop offset="95%" stopColor={COLOR.alpha} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="hadir" name="Hadir" stroke={COLOR.hadir} strokeWidth={2.5} fillOpacity={1} fill="url(#gHadir)" />
                                <Area type="monotone" dataKey="pending" name="Pending" stroke={COLOR.pending} strokeWidth={2} fillOpacity={1} fill="url(#gPending)" />
                                <Area type="monotone" dataKey="izin"  name="Izin/Sakit" stroke={COLOR.izin}  strokeWidth={2} fillOpacity={0} />
                                <Area type="monotone" dataKey="alpha" name="Alpha" stroke={COLOR.alpha} strokeWidth={2} fillOpacity={1} fill="url(#gAlpha)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* BARIS KETIGA: HEATMAP & STATUS HARI INI */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 z-10">

                <div className="lg:col-span-8 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[320px] md:h-[350px]">
                    <h3 className="text-[11px] md:text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 mb-4 shrink-0">
                        <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg"><FiStar className="w-3.5 h-3.5" fill="currentColor" /></div>
                        Heatmap Mingguan
                    </h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative">
                        {(heatmapData || []).length > 0 ? (
                            <table className="w-full text-[9px] md:text-[10px]">
                                <thead className="sticky top-0 bg-white z-10 shadow-sm outline outline-1 outline-slate-100">
                                    <tr>
                                        <th className="text-left font-black text-slate-400 uppercase pb-2 pt-2 px-2 border-b border-slate-100">Kelas</th>
                                        {hariLabel.map(h => (
                                            <th key={h} className="font-black text-slate-400 uppercase pb-2 pt-2 text-center px-1 border-b border-slate-100">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(heatmapData || []).map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="font-black text-slate-600 py-2 pl-2 pr-2 truncate max-w-[120px]">{row.kelas}</td>
                                            {hariLabel.map(h => {
                                                const val = row.data?.[h];
                                                return (
                                                    <td key={h} className="py-1.5 px-1 text-center">
                                                        <span className={`inline-block px-1.5 py-1 rounded md:rounded-md font-black text-[8px] md:text-[9px] w-full text-center ${heatColor(val)}`}>
                                                            {val === null || val === undefined ? '–' : `${val}%`}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 min-h-[120px]">
                                <FiActivity className="w-6 h-6 opacity-50"/>
                                <p className="text-[9px] uppercase font-bold tracking-widest">Belum ada data minggu ini.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[320px] md:h-[350px]">
                    <h3 className="text-[11px] md:text-xs font-black text-slate-700 uppercase tracking-widest mb-1 text-center shrink-0">
                        Status Hari Ini
                    </h3>
                    <div className="flex-1 relative flex items-center justify-center min-h-[160px] mt-2">
                        <ResponsiveContainer width="99%" height={160} minHeight={160}>
                            <PieChart>
                                <Pie data={(harianData || []).filter(d => d.name !== 'Belum Absen')} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                                    {(harianData || []).filter(d => d.name !== 'Belum Absen').map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <RechartsTooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                            <span className="text-2xl md:text-3xl font-black text-slate-800 leading-none">{persenHadir}%</span>
                            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-1">Hadir</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-4 shrink-0">
                        {(harianData || []).filter(d => d.name !== 'Belum Absen').map((d, i) => (
                            <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: d.color }} />
                                <span className="text-[8px] md:text-[9px] font-bold text-slate-500 truncate uppercase tracking-wider">{d.name}</span>
                                <span className="text-[9px] md:text-[10px] font-black text-slate-800 ml-auto pr-1">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* BARIS KEEMPAT: LEADERBOARD & USER ONLINE (SIMETRIS 4-4-4) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mt-1 z-10 items-stretch">

                {/* Kolom Kiri: Terdisiplin */}
                <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[300px]">
                    <h3 className="text-[10px] md:text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 mb-3 shrink-0">
                        <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg"><FiStar className="w-3.5 h-3.5" fill="currentColor" /></div> 
                        Kelas Terdisiplin
                    </h3>
                    <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {(leaderboard?.terdisiplin || []).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:border-amber-200 hover:bg-amber-50/30 transition-all shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm shrink-0 ${
                                        idx === 0 ? 'bg-gradient-to-tr from-amber-400 to-amber-500 ring-2 ring-amber-100' : 
                                        idx === 1 ? 'bg-gradient-to-tr from-slate-300 to-slate-400' : 
                                        'bg-gradient-to-tr from-amber-700 to-amber-800'
                                    }`}>{idx + 1}</span>
                                    <div>
                                        <p className="text-[10px] md:text-[11px] font-black text-slate-800 leading-tight uppercase">{item.nama_kelas}</p>
                                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Hadir: <span className="text-amber-500">{item.bintang_hadir}</span></p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">{item.persen_hadir}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Kolom Tengah: Rawan Alpha */}
                <div className="lg:col-span-4 bg-rose-50/50 p-5 rounded-2xl shadow-sm border border-rose-100 flex flex-col relative overflow-hidden h-[300px]">
                    <h3 className="text-[10px] md:text-[11px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-2 mb-3 relative z-10 shrink-0">
                        <div className="p-1.5 bg-rose-200/50 text-rose-600 rounded-lg"><FiAlertTriangle className="w-3.5 h-3.5" /></div> 
                        Rawan Alpha
                    </h3>
                    <div className="flex flex-col gap-2 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {(leaderboard?.darurat_alpha || []).filter(i => i.total_alpha > 0).length > 0
                            ? (leaderboard?.darurat_alpha || []).filter(i => i.total_alpha > 0).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-rose-100 shadow-sm hover:border-rose-300 transition-all shrink-0">
                                    <div>
                                        <p className="text-[10px] md:text-[11px] font-black text-slate-800 leading-tight uppercase">{item.nama_kelas}</p>
                                        <p className="text-[8px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">Bolos: <span className="text-rose-500">{item.bintang_alpha}</span></p>
                                    </div>
                                    <span className="text-[9px] md:text-[10px] font-black text-rose-600 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                                        <FiXCircle className="w-3 h-3" /> {item.total_alpha}x
                                    </span>
                                </div>
                            ))
                            : (
                                <div className="text-center bg-white/80 p-5 rounded-xl border border-rose-100/50 flex-1 flex flex-col items-center justify-center gap-2">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full"><FiCheckCircle className="w-4 h-4"/></div>
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Aman Terkendali</p>
                                </div>
                            )
                        }
                    </div>
                </div>

                {/* Kolom Kanan: User Online (Diubah menjadi vertikal list agar serasi 4-4-4) */}
                <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-[300px]">
                    <div className="flex justify-between items-center mb-3 shrink-0">
                        <h3 className="text-[10px] md:text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><FiRadio className="w-3.5 h-3.5" /></div> 
                            User Online
                        </h3>
                        <span className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg shadow-sm shadow-blue-500/30 uppercase tracking-wider">
                            {(onlineUsers || []).length} Aktif
                        </span>
                    </div>
                    
                    <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {(onlineUsers || []).length > 0 ? (onlineUsers || []).map((user, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-all shadow-sm shrink-0">
                                <div className="relative shrink-0">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
                                        {user?.nama ? user.nama.substring(0, 2) : 'US'}
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm" />
                                </div>
                                <div className="flex-1 overflow-hidden flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-slate-800 truncate uppercase tracking-wide">{user?.nama}</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{user?.role}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="flex w-full items-center justify-center h-full text-slate-400 gap-2">
                                <FiUsers className="w-6 h-6 opacity-40" />
                                <p className="text-[9px] font-bold uppercase tracking-widest">Sepi</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
                
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn .3s ease forwards; }
                .overflow-visible { overflow: visible !important; }
            `}</style>
        </div>
    );
}