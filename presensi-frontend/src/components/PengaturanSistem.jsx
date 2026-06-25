import { useEffect, useState } from "react";
import api from "../utils/api";
import toast from 'react-hot-toast'; 
import { 
    FiMapPin, FiClock, FiCrosshair, FiSave, 
    FiSettings, FiFileText, FiAlertCircle
} from "react-icons/fi";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickEvent({ setFormData }) {
    useMapEvents({
        click(e) {
            setFormData(prev => ({
                ...prev,
                latitude: e.latlng.lat.toFixed(6),
                longitude: e.latlng.lng.toFixed(6)
            }));
        }
    });
    return null;
}

export default function PengaturanSistem() {
    const [formData, setFormData] = useState({
        latitude: "-7.31637", 
        longitude: "112.72541",
        radius_meter: 100,
        jam_mulai_absen: "06:00",
        jam_selesai_absen: "08:00",
        jam_mulai_validasi: "07:00",
        jam_selesai_validasi: "16:00"
    });
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [mapCenter, setMapCenter] = useState([-7.31637, 112.72541]);
    
    // State untuk custom Pop-Up Premium
    const [draftModal, setDraftModal] = useState(false);

    useEffect(() => {
        fetchSetting();
    }, []);

    const fetchSetting = async () => {
        try {
            const response = await api.get('/setting');
            if (response.data.data) {
                setFormData({ ...formData, ...response.data.data });
                const lat = parseFloat(response.data.data.latitude) || -7.31637;
                const lng = parseFloat(response.data.data.longitude) || 112.72541;
                setMapCenter([lat, lng]);
            }
        } catch (error) {
            toast.error("Gagal mengambil pengaturan sistem.");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        if(e) e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                latitude: formData.latitude === "" ? "0" : formData.latitude,
                longitude: formData.longitude === "" ? "0" : formData.longitude,
            };
            
            await api.put('/setting', payload);
            toast.success("Konfigurasi sistem berhasil diperbarui!");
            
            setMapCenter([parseFloat(payload.latitude), parseFloat(payload.longitude)]);
        } catch (error) {
            toast.error("Gagal menyimpan pengaturan.");
        } finally {
            setLoading(false);
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Browser Anda tidak mendukung fitur Geolocation.");
            return;
        }
        
        const toastId = toast.loading("Mencari koordinat GPS Anda...");
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lng = position.coords.longitude.toFixed(6);
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                setMapCenter([parseFloat(lat), parseFloat(lng)]); 
                toast.success("Lokasi berhasil dikalibrasi!", { id: toastId });
            },
            (error) => {
                toast.error("Gagal! Pastikan izin lokasi (GPS) browser diaktifkan.", { id: toastId });
            }
        );
    };

    // Fungsi untuk menampilkan Pop-Up Premium
    const handleGenerateDraftClick = () => {
        setDraftModal(true);
    };

    // Fungsi Eksekusi API Generate Draft
    const executeGenerateDraft = async () => {
        setDraftModal(false); // Tutup modal setelah klik YA
        setGenerating(true);
        const toastId = toast.loading("Menyiapkan draf presensi...");
        try {
            const res = await api.post('/admin/presensi/generate-draft');
            toast.success(res.data.message || "Draf berhasil dibuat!", { id: toastId });
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal membuat draf presensi.", { id: toastId });
        } finally {
            setGenerating(false);
        }
    };

    const validLat = parseFloat(formData.latitude) || mapCenter[0];
    const validLng = parseFloat(formData.longitude) || mapCenter[1];

    return (
        <div className="w-full flex flex-col animate-fadeIn relative max-w-[1400px] mx-auto min-h-screen pb-10">
            
            <style>{`
                .royal-blue-map .leaflet-tile-pane {
                    filter: sepia(1) hue-rotate(185deg) saturate(3) brightness(0.8) contrast(1.2);
                }
                .hide-scroll::-webkit-scrollbar { display: none; }
                .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* MODAL CUSTOM PREMIUM UNTUK DRAFT GENERATOR */}
            {draftModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all scale-100">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-5 shadow-inner border border-amber-100">
                                <FiAlertCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Buat Draf Harian?</h3>
                            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                                Anda akan membuat draf presensi dengan status <span className="text-slate-800 font-bold">"Kosong"</span> untuk semua siswa secara manual hari ini.
                            </p>
                        </div>
                        <div className="p-5 bg-slate-50 flex gap-3 border-t border-slate-100">
                            <button 
                                onClick={() => setDraftModal(false)} 
                                className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-100 transition-colors"
                            >
                                BATAL
                            </button>
                            <button 
                                onClick={executeGenerateDraft} 
                                className="flex-1 py-3.5 bg-amber-500 text-white rounded-xl text-sm font-black shadow-lg hover:bg-amber-600 active:scale-95 transition-all"
                            >
                                YA, BUAT DRAF
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            <FiSettings className="w-5 h-5 text-lime-300" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md mb-0.5">Konfigurasi Sistem</h2>
                            <p className="text-[10px] md:text-xs font-medium text-blue-100 drop-shadow-sm max-w-sm">Atur zona geofencing dan jam operasional sekolah.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col xl:grid xl:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-[600px] pb-6 xl:pb-0">
                
                <div className="order-2 xl:order-1 xl:col-span-4 flex flex-col gap-5 xl:h-full overflow-y-auto hide-scroll rounded-2xl shadow-sm border border-slate-200 bg-white p-5 md:p-6 shrink-0">
                    
                    <div className="shrink-0">
                        <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><FiMapPin className="w-3.5 h-3.5" /></div>
                            Parameter Jarak
                        </h3>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Radius Toleransi (Meter)</label>
                            <input 
                                type="number" 
                                name="radius_meter" 
                                value={formData.radius_meter} 
                                onChange={handleChange} 
                                required min="10"
                                className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl text-2xl font-black text-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner text-center md:text-left"
                            />
                            <p className="text-[10px] font-bold text-slate-400 mt-2 leading-relaxed text-center md:text-left">
                                Area biru pada peta. Siswa di luar radius ini tidak diizinkan melakukan presensi masuk.
                            </p>
                        </div>
                    </div>

                    <hr className="border-slate-100 border-dashed my-2" />

                    <div className="shrink-0">
                        <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><FiClock className="w-3.5 h-3.5" /></div>
                            Waktu Operasional
                        </h3>
                        
                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Sesi Presensi Siswa</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Buka Akses</label>
                                        <input type="time" name="jam_mulai_absen" value={formData.jam_mulai_absen} onChange={handleChange} required className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Tutup Akses</label>
                                        <input type="time" name="jam_selesai_absen" value={formData.jam_selesai_absen} onChange={handleChange} required className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Sesi Validasi Guru</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Mulai Validasi</label>
                                        <input type="time" name="jam_mulai_validasi" value={formData.jam_mulai_validasi} onChange={handleChange} required className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Batas Validasi</label>
                                        <input type="time" name="jam_selesai_validasi" value={formData.jam_selesai_validasi} onChange={handleChange} required className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100 border-dashed my-2" />

                    {/* FITUR BARU: MANUAL DRAFT GENERATOR */}
                    <div className="shrink-0">
                        <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                            <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg"><FiFileText className="w-3.5 h-3.5" /></div>
                            Aksi Administrator
                        </h3>
                        <button 
                            type="button"
                            onClick={handleGenerateDraftClick}
                            disabled={generating}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {generating ? "MEMBUAT DRAF..." : "BUAT DRAF HARI INI"}
                        </button>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 leading-relaxed text-center md:text-left">
                            Klik tombol ini untuk membuat draf presensi hari ini.
                        </p>
                    </div>

                    <div className="xl:hidden mt-auto pt-4 shrink-0">
                        <button 
                            onClick={handleSave} 
                            disabled={loading} 
                            className="w-full flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <FiSave className="w-5 h-5" /> {loading ? "MENYIMPAN..." : "SIMPAN PENGATURAN"}
                        </button>
                    </div>
                </div>

                <div className="order-1 xl:order-2 xl:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px] xl:h-full w-full">
                    <div className="px-4 md:px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 z-10 relative shadow-sm">
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="flex-1 md:w-32">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Latitude</label>
                                <input type="text" name="latitude" value={formData.latitude} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm" />
                            </div>
                            <div className="flex-1 md:w-32">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Longitude</label>
                                <input type="text" name="longitude" value={formData.longitude} onChange={handleChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm" />
                            </div>
                        </div>

                        <div className="flex w-full md:w-auto gap-3">
                            <button 
                                type="button" 
                                onClick={handleGetLocation} 
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm active:scale-95"
                            >
                                <FiCrosshair className="w-4 h-4 text-lime-400 shrink-0" /> <span className="hidden md:inline">Kordinat</span> GPS
                            </button>
                            
                            <button 
                                onClick={handleSave} 
                                disabled={loading} 
                                className="hidden xl:flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <FiSave className="w-4 h-4 shrink-0" /> {loading ? "Menyimpan..." : "Simpan Peta"}
                            </button>
                        </div>
                    </div>

                    <div className="w-full flex-1 relative royal-blue-map bg-slate-200 z-0">
                        <MapContainer 
                            center={mapCenter} 
                            zoom={16} 
                            scrollWheelZoom={true} 
                            className="absolute inset-0 w-full h-full"
                            key={`${mapCenter[0]}-${mapCenter[1]}`} 
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapClickEvent setFormData={setFormData} />
                            
                            {(formData.latitude !== "" && formData.longitude !== "") && (
                                <>
                                    <Marker position={[validLat, validLng]} />
                                    <Circle 
                                        center={[validLat, validLng]} 
                                        pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.3 }} 
                                        radius={Number(formData.radius_meter) || 100} 
                                    />
                                </>
                            )}
                        </MapContainer>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-6 z-[400] bg-white/90 backdrop-blur px-4 py-2.5 rounded-xl shadow-lg border border-white flex items-center gap-2 pointer-events-none w-max">
                            <FiMapPin className="text-blue-500 animate-bounce shrink-0 w-4 h-4" />
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                Klik peta untuk geser titik absen
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}