import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Compass, CheckCircle2, Crosshair, Search, ChevronDown } from 'lucide-react';
import { toBanglaDigits } from '../utils/banglaNumbers';
import { DISTRICTS_DATA, parseBangladeshAddress } from '../utils/bangladeshGeoData';

// Custom Map Marker Icon
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [28, 44],
  iconAnchor: [14, 44],
  popupAnchor: [1, -38],
  shadowSize: [41, 41]
});

// Map click listener component
function LocationMarker({ position, setPosition, onLocationChange, locationTitle }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const newPos = [parseFloat(e.latlng.lat.toFixed(5)), parseFloat(e.latlng.lng.toFixed(5))];
      setPosition(newPos);
      map.flyTo(newPos, map.getZoom(), { duration: 0.8 });
      if (onLocationChange) {
        onLocationChange(newPos[0], newPos[1]);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customMarkerIcon}>
      {locationTitle && (
        <Tooltip permanent direction="top" offset={[0, -42]}>
          <div className="text-xs font-bold text-slate-900 bg-white/95 px-2 py-0.5 rounded shadow-sm border border-emerald-500">
            📍 {locationTitle}
          </div>
        </Tooltip>
      )}
      {locationTitle && (
        <Popup autoPan={false}>
          <div className="text-xs p-1">
            <strong className="text-emerald-800 block text-xs">{locationTitle}</strong>
            <span className="text-[10px] text-slate-500 font-mono">
              {position[0]?.toFixed(5)}° N, {position[1]?.toFixed(5)}° E
            </span>
          </div>
        </Popup>
      )}
    </Marker>
  );
}

// Controller to fly map smoothly to coordinates & invalidate size on mount
function MapController({ center, zoom = 15 }) {
  const map = useMap();

  useEffect(() => {
    if (map && center && center[0] && center[1]) {
      const timer = setTimeout(() => {
        map.invalidateSize();
        map.flyTo(center, zoom, { duration: 1.0 });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [center?.[0], center?.[1], zoom, map]);

  return null;
}

export const InteractiveLocationPicker = ({ 
  initialLat = 24.7471, 
  initialLon = 90.4203, 
  onLocationSelect,
  locationTitle = ""
}) => {
  const [position, setPosition] = useState([initialLat, initialLon]);
  const [targetCenter, setTargetCenter] = useState([initialLat, initialLon]);
  const [targetZoom, setTargetZoom] = useState(15);
  const [mapLayer, setMapLayer] = useState('google_hybrid'); // 'google_hybrid', 'street'
  const [locating, setLocating] = useState(false);

  // Quick District / Upazila Jumper State
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const districtList = Object.keys(DISTRICTS_DATA).sort();
  const upazilaList = selectedDistrict && DISTRICTS_DATA[selectedDistrict]?.upazilas 
    ? Object.keys(DISTRICTS_DATA[selectedDistrict].upazilas).sort() 
    : [];

  // Sync position whenever initialLat or initialLon changes externally
  useEffect(() => {
    if (initialLat && initialLon) {
      const newPos = [parseFloat(Number(initialLat).toFixed(5)), parseFloat(Number(initialLon).toFixed(5))];
      setPosition(newPos);
      setTargetCenter(newPos);
    }
  }, [initialLat, initialLon]);

  const handleCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert("আপনার ব্রাউজারে জিপিএস সুবিধা নেই। উপরের জেলা ও উপজেলা সিলেক্ট করে আপনার এলাকায় যান।");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [
          parseFloat(pos.coords.latitude.toFixed(5)), 
          parseFloat(pos.coords.longitude.toFixed(5))
        ];
        setPosition(coords);
        setTargetCenter(coords);
        setTargetZoom(16);
        if (onLocationSelect) {
          onLocationSelect(coords[0], coords[1]);
        }
        setLocating(false);
      },
      (err) => {
        console.error("GPS error:", err);
        setLocating(false);
        alert("জিপিএস লোকেশন পাওয়া যায়নি। অনুগ্রহ করে উপরের জেলা ও উপজেলা ড্রপডাউন থেকে নির্বাচন করুন।");
      },
      { timeout: 8000 }
    );
  };

  const handleDistrictChange = (dist) => {
    setSelectedDistrict(dist);
    setSelectedUpazila('');
    if (dist && DISTRICTS_DATA[dist]) {
      const d = DISTRICTS_DATA[dist];
      const newPos = [d.lat, d.lon];
      setTargetCenter(newPos);
      setPosition(newPos);
      setTargetZoom(13);
      if (onLocationSelect) onLocationSelect(newPos[0], newPos[1]);
    }
  };

  const handleUpazilaChange = (upa) => {
    setSelectedUpazila(upa);
    if (selectedDistrict && upa && DISTRICTS_DATA[selectedDistrict]?.upazilas?.[upa]) {
      const u = DISTRICTS_DATA[selectedDistrict].upazilas[upa];
      const newPos = [u.lat, u.lon];
      setTargetCenter(newPos);
      setPosition(newPos);
      setTargetZoom(15);
      if (onLocationSelect) onLocationSelect(newPos[0], newPos[1]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const parsed = parseBangladeshAddress(searchQuery);
    if (parsed && parsed.lat && parsed.lon) {
      const newPos = [parsed.lat, parsed.lon];
      setTargetCenter(newPos);
      setPosition(newPos);
      setTargetZoom(16);
      if (parsed.district) setSelectedDistrict(parsed.district);
      if (parsed.upazila) setSelectedUpazila(parsed.upazila);
      if (onLocationSelect) onLocationSelect(newPos[0], newPos[1]);
    } else {
      alert("এলাকা খুঁজে পাওয়া যায়নি। অনুগ্রহ করে জেলা ও উপজেলা নির্বাচন করুন।");
    }
  };

  return (
    <div className="space-y-3">
      {/* Location Jumper Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-900 rounded-2xl p-3 text-white space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-200">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>
              {locationTitle ? (
                <span>অবস্থান: <strong className="text-white">{locationTitle}</strong></span>
              ) : (
                <span>মানচিত্রে আপনার খামার / বাড়ির অবস্থান চিহ্নিত করুন:</span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCurrentGPS}
            disabled={locating}
            className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Crosshair className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'খোঁজা হচ্ছে...' : 'আমার বর্তমান GPS'}</span>
          </button>
        </div>

        {/* District, Upazila & Search Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl px-2.5 py-1.5 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="" className="text-slate-800">১. জেলা নির্বাচন করুন...</option>
              {districtList.map((d) => (
                <option key={d} value={d} className="text-slate-900">{d}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-white/60 absolute right-2.5 top-2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedUpazila}
              onChange={(e) => handleUpazilaChange(e.target.value)}
              disabled={!selectedDistrict}
              className="w-full bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl px-2.5 py-1.5 focus:outline-none appearance-none disabled:opacity-50 cursor-pointer"
            >
              <option value="" className="text-slate-800">২. উপজেলা নির্বাচন করুন...</option>
              {upazilaList.map((u) => (
                <option key={u} value={u} className="text-slate-900">{u}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-white/60 absolute right-2.5 top-2 pointer-events-none" />
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="অথবা এলাকা লিখুন..."
              className="flex-1 bg-white/10 backdrop-blur-md text-white placeholder-emerald-200/60 border border-white/20 rounded-xl px-2.5 py-1.5 focus:outline-none"
            />
            <button
              type="submit"
              className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Map Layer Switcher Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-slate-500">👉 ম্যাপে নিজের জমির ওপর ক্লিক করে সঠিক লোকেশন চিহ্নিত করুন</span>
        <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-300 text-[11px]">
          <button
            type="button"
            onClick={() => setMapLayer('google_hybrid')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              mapLayer === 'google_hybrid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛰️ গুগল স্যাটেলাইট
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('street')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              mapLayer === 'street' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗺️ সাধারণ মানচিত্র
          </button>
        </div>
      </div>

      {/* Leaflet Map Box */}
      <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-300 shadow-sm relative z-10">
        <MapContainer
          center={position}
          zoom={targetZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <MapController center={targetCenter} zoom={targetZoom} />
          {mapLayer === 'google_hybrid' ? (
            <TileLayer
              attribution='&copy; Google Satellite Hybrid'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          ) : (
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onLocationChange={onLocationSelect}
            locationTitle={locationTitle}
          />
        </MapContainer>
      </div>

      {/* Lat/Lon Info Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex-wrap gap-2">
        <div className="flex items-center space-x-3 text-slate-700 font-medium">
          <span>অক্ষাংশ (Lat): <strong className="text-slate-900 font-mono">{position[0]?.toFixed(5)}</strong></span>
          <span>দ্রাঘিমাংশ (Lon): <strong className="text-slate-900 font-mono">{position[1]?.toFixed(5)}</strong></span>
        </div>
        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          নাসা আর্থ সায়েন্স গ্রিডের সাথে সিঙ্ক
        </span>
      </div>
    </div>
  );
};

export default InteractiveLocationPicker;
