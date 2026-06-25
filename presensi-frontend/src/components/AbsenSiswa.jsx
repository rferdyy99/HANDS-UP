import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import api from "../utils/api";
import toast from 'react-hot-toast';
import { 
    FiCamera, FiRefreshCw, FiMapPin, FiSend, 
    FiInfo, FiCrosshair, FiMaximize, FiLock,
    FiCheckCircle, FiXCircle
} from "react-icons/fi";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const studentIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const schoolIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

export default function AbsenSiswa() {
    const webcamRef = useRef(null);
    const [lokasi, setLokasi] = useState({ lat: null, lng: null });
    const [settingSekolah, setSettingSekolah] = useState({ lat: null, lng: null, radius: 0 });
    const [alamatDetail, setAlamatDetail] = useState("Menghubungkan ke satelit GPS...");
    const [foto, setFoto] = useState(null);
    const [loading, setLoading] = useState(false);

    const [gpsStatus, setGpsStatus] = useState("loading"); 
    const [camStatus, setCamStatus] = useState("loading"); 

    useEffect(() => {
        const fetchSetting = async () => {
            try {
                const res = await api.get('/setting');
                const data = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
                if (data) {
                    setSettingSekolah({
                        lat: parseFloat(data.latitude),
                        lng: parseFloat(data.longitude),
                        radius: parseInt(data.radius_meter)
                    });
                }
            } catch (err) {
                toast.error("Gagal memuat batas wilayah presensi.");
            }
        };

        fetchSetting();

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setLokasi({ lat, lng });
                    setGpsStatus("granted");

                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                        const data = await res.json();
                        setAlamatDetail(data.display_name || "Alamat spesifik tidak ditemukan.");
                    } catch (err) {
                        setAlamatDetail("Titik GPS berhasil didapatkan.");
                    }
                },
                (error) => {
                    setGpsStatus("denied");
                    toast.error("Akses GPS ditolak! Sistem membutuhkan lokasi untuk presensi.", { duration: 5000 });
                    setAlamatDetail("Akses GPS Tidak Diizinkan");
                },
                { enableHighAccuracy: true }
            );
        } else {
            setGpsStatus("denied");
            toast.error("Browser tidak mendukung fitur GPS.");
            setAlamatDetail("GPS Tidak Didukung");
        }
    }, []);

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setFoto(imageSrc);
        }
    }, [webcamRef]);

    const dataURLtoFile = (dataurl, filename) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){ u8arr[n] = bstr.charCodeAt(n); }
        return new File([u8arr], filename, {type:mime});
    }

    const handleAbsen = async () => {
        if (!foto || !lokasi.lat || !lokasi.lng) {
            toast.error("Pastikan foto selfie dan lokasi GPS sudah siap!");
            return;
        }

        setLoading(true);

        try {
            const fileFoto = dataURLtoFile(foto, "selfie.jpg");
            const formData = new FormData();
            
            // Berubah menjadi pending sesuai flow baru
            formData.append("status", "pending"); 
            formData.append("lokasi_lat", lokasi.lat);
            formData.append("lokasi_lng", lokasi.lng);
            formData.append("foto", fileFoto);

            const response = await api.post('/absen', formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            toast.success(response.data.message || "Presensi dikirim, menunggu validasi Guru!");
            setFoto(null); 
        } catch (error) {
            toast.error(error.response?.data?.message || "Terjadi kesalahan sistem, coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col animate-fadeIn pb-24 md:pb-10 relative max-w-[1400px] mx-auto min-h-screen">
            
            <style>{`
                .neo-map .leaflet-tile-pane {
                    filter: sepia(0.8) hue-rotate(185deg) saturate(2) brightness(0.9) contrast(1.1);
                }
            `}</style>

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
                            <FiCrosshair className="w-5 h-5 text-lime-300 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md mb-0.5">Konfirmasi Kehadiran</h2>
                            <p className="text-[10px] md:text-xs font-medium text-blue-100 drop-shadow-sm max-w-sm">Sistem Presensi Autentikasi Wajah & Geotagging.</p>
                        </div>
                    </div>

                    <div className="flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5 md:px-4 w-full md:w-auto shadow-sm z-[70]">
                        <span className="text-[9px] text-lime-200 uppercase tracking-widest font-black mb-1.5 flex items-center gap-1.5">
                            <FiLock className="w-3 h-3" /> AKSES PERANGKAT
                        </span>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <FiCamera className="text-white w-3.5 h-3.5" />
                                <span className="text-[10px] md:text-xs font-bold text-white tracking-wide">Kamera</span>
                                {camStatus === 'loading' ? <FiRefreshCw className="w-3 h-3 text-blue-200 animate-spin ml-0.5" /> :
                                 camStatus === 'granted' ? <FiCheckCircle className="w-3.5 h-3.5 text-lime-400 ml-0.5" /> :
                                 <FiXCircle className="w-3.5 h-3.5 text-rose-400 ml-0.5" />}
                            </div>
                            
                            <div className="w-px h-4 bg-white/20"></div>

                            <div className="flex items-center gap-1.5">
                                <FiMapPin className="text-white w-3.5 h-3.5" />
                                <span className="text-[10px] md:text-xs font-bold text-white tracking-wide">Lokasi</span>
                                {gpsStatus === 'loading' ? <FiRefreshCw className="w-3 h-3 text-blue-200 animate-spin ml-0.5" /> :
                                 gpsStatus === 'granted' ? <FiCheckCircle className="w-3.5 h-3.5 text-lime-400 ml-0.5" /> :
                                 <FiXCircle className="w-3.5 h-3.5 text-rose-400 ml-0.5" />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch xl:h-[500px]">
                
                <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
                    <div className="p-5 flex-1 flex flex-col">
                        
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <h3 className="text-[11px] md:text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><FiCamera className="w-3.5 h-3.5" /></div>
                                Autentikasi Wajah
                            </h3>
                        </div>
                        
                        <div className="relative bg-slate-900 rounded-xl overflow-hidden flex-1 w-full flex items-center justify-center shadow-inner group border border-slate-800 min-h-[250px]">
                            {!foto ? (
                                <Webcam 
                                    audio={false} 
                                    ref={webcamRef} 
                                    screenshotFormat="image/jpeg" 
                                    mirrored={true} 
                                    videoConstraints={{ facingMode: "user" }}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onUserMedia={() => setCamStatus("granted")}
                                    onUserMediaError={() => setCamStatus("denied")}
                                />
                            ) : (
                                <img src={foto} alt="Selfie" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            )}
                            
                            {!foto && camStatus === 'granted' && (
                                <div className="absolute inset-0 pointer-events-none p-5 flex flex-col justify-between">
                                    <div className="flex justify-between w-full">
                                        <div className="w-8 h-8 border-t-4 border-l-4 border-lime-400 rounded-tl-lg shadow-[0_0_10px_rgba(163,230,53,0.5)]"></div>
                                        <div className="w-8 h-8 border-t-4 border-r-4 border-lime-400 rounded-tr-lg shadow-[0_0_10px_rgba(163,230,53,0.5)]"></div>
                                    </div>
                                    <div className="flex justify-center">
                                        <span className="text-[8px] text-white/80 font-mono tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                                            Face Detection Active
                                        </span>
                                    </div>
                                    <div className="flex justify-between w-full">
                                        <div className="w-8 h-8 border-b-4 border-l-4 border-lime-400 rounded-bl-lg shadow-[0_0_10px_rgba(163,230,53,0.5)]"></div>
                                        <div className="w-8 h-8 border-b-4 border-r-4 border-lime-400 rounded-br-lg shadow-[0_0_10px_rgba(163,230,53,0.5)]"></div>
                                    </div>
                                </div>
                            )}

                            {camStatus === 'denied' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-900">
                                    <FiXCircle className="w-10 h-10 text-rose-500 mb-3" />
                                    <p className="text-white font-bold text-sm">Akses Kamera Diblokir</p>
                                    <p className="text-slate-400 text-xs mt-1">Harap izinkan akses kamera di pengaturan browser.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 w-full shrink-0">
                            {!foto ? (
                                <button 
                                    onClick={capture} 
                                    disabled={camStatus !== 'granted'}
                                    className="w-full py-3 md:py-3.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiCamera className="w-4 h-4" /> Ambil Foto Selfie
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setFoto(null)} 
                                    disabled={loading} 
                                    className="w-full py-3 md:py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-black tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <FiRefreshCw className="w-4 h-4" /> Ulangi Foto
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-7 flex flex-col h-full gap-4 md:gap-6">
                    
                    <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden shrink-0">
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <h3 className="text-[11px] md:text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><FiMapPin className="w-3.5 h-3.5" /></div>
                                Radar Geofencing
                            </h3>
                            {gpsStatus === 'granted' && (
                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-200 shadow-sm animate-pulse flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Sinyal Kuat
                                </span>
                            )}
                            {gpsStatus === 'denied' && (
                                <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-rose-200 shadow-sm flex items-center gap-1.5">
                                    <FiXCircle className="w-3 h-3" /> GPS Ditolak
                                </span>
                            )}
                        </div>
                        
                        <div className="w-full flex-1 rounded-xl min-h-[250px] md:min-h-0 overflow-hidden border border-slate-200 relative z-0 shadow-inner bg-slate-100 neo-map">
                            {gpsStatus === 'granted' && lokasi.lat ? (
                                <MapContainer 
                                    center={[lokasi.lat, lokasi.lng]} 
                                    zoom={17} 
                                    scrollWheelZoom={false}
                                    style={{ height: '100%', width: '100%' }}
                                    key={`${lokasi.lat}-${lokasi.lng}`} 
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    
                                    <Marker position={[lokasi.lat, lokasi.lng]} icon={studentIcon}>
                                        <Popup>
                                            <span className="font-bold text-slate-700 text-xs">Lokasi Anda</span>
                                        </Popup>
                                    </Marker>

                                    {settingSekolah.lat && (
                                        <>
                                            <Marker position={[settingSekolah.lat, settingSekolah.lng]} icon={schoolIcon}>
                                                <Popup>
                                                    <span className="font-bold text-slate-700 text-xs">Pusat Sekolah</span>
                                                </Popup>
                                            </Marker>
                                            <Circle 
                                                center={[settingSekolah.lat, settingSekolah.lng]} 
                                                radius={settingSekolah.radius} 
                                                pathOptions={{ 
                                                    color: '#2563eb', 
                                                    fillColor: '#3b82f6', 
                                                    fillOpacity: 0.25, 
                                                    weight: 2 
                                                }} 
                                            />
                                        </>
                                    )}
                                </MapContainer>
                            ) : gpsStatus === 'denied' ? (
                                <div className="h-full w-full flex flex-col items-center justify-center text-rose-500 gap-2 bg-rose-50/50">
                                    <FiXCircle className="w-8 h-8" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 px-6 text-center">GPS diblokir. Harap izinkan.</span>
                                </div>
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center text-blue-500 gap-2 bg-blue-50/30">
                                    <FiRefreshCw className="w-6 h-6 animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Melacak Satelit...</span>
                                </div>
                            )}

                            <div className="absolute bottom-3 right-3 z-[400]">
                                <button className="w-8 h-8 bg-white rounded-lg shadow border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors pointer-events-none">
                                    <FiMaximize className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        <div className={`mt-4 p-3 rounded-xl border flex items-start gap-3 shrink-0 ${gpsStatus === 'denied' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 shrink-0">
                                <FiMapPin className={gpsStatus === 'denied' ? 'text-rose-500 w-3.5 h-3.5' : 'text-blue-600 w-3.5 h-3.5'} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Titik Lokasi Terbaca</p>
                                <p className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2" title={alamatDetail}>{alamatDetail}</p>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 flex flex-col gap-3">
                        <button 
                            onClick={handleAbsen}
                            disabled={loading || !foto || !lokasi.lat || gpsStatus !== 'granted'}
                            className={`w-full py-3.5 md:py-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                                foto && lokasi.lat && gpsStatus === 'granted'
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 active:scale-95 border border-blue-500" 
                                : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed border border-slate-200"
                            }`}
                        >
                            {loading ? (
                                <><FiRefreshCw className="w-4 h-4 animate-spin" /> MENGIRIM DATA...</>
                            ) : (
                                <><FiSend className="w-4 h-4" /> REKAM PRESENSI</>
                            )}
                        </button>

                        <div className="flex items-start gap-2 px-2 text-slate-400">
                            <FiInfo className="shrink-0 w-3.5 h-3.5 mt-0.5" />
                            <p className="text-[9px] font-medium leading-relaxed">
                                Pastikan indikator titik Anda (Marker Biru) berada di dalam lingkaran radius sekolah untuk menghindari status presensi ditolak sistem. Data akan diserahkan ke sistem untuk divalidasi oleh guru.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}