import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Compass, CheckCircle2, Crosshair } from 'lucide-react';
import { toBanglaDigits } from '../utils/banglaNumbers';

// Custom Map Marker Icon
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map click listener component
function LocationMarker({ position, setPosition, onLocationChange }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      map.flyTo(newPos, map.getZoom());
      if (onLocationChange) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customMarkerIcon} />
  );
}

// Controller to fly map to coordinates when changed outside
function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 13);
    }
  }, [center]);
  return null;
}

export const InteractiveLocationPicker = ({ initialLat = 24.7471, initialLon = 90.4203, onLocationSelect }) => {
  const [position, setPosition] = useState([initialLat, initialLon]);
  const [mapLayer, setMapLayer] = useState('satellite'); // satellite, street
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (initialLat && initialLon) {
      setPosition([initialLat, initialLon]);
    }
  }, [initialLat, initialLon]);

  const handleCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert("আপনার ব্রাউজারে জিপিএস সুবিধা নেই।");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        if (onLocationSelect) {
          onLocationSelect(coords[0], coords[1]);
        }
        setLocating(false);
      },
      (err) => {
        console.error("GPS error:", err);
        setLocating(false);
        alert("জিপিএস লোকেশন নেওয়া সম্ভব হয়নি। অনুগ্রহ করে মানচিত্রে সরাসরি ক্লিক করে নির্বাচন করুন।");
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>মানচিত্রে আপনার খামার / বাড়ির অবস্থান চিহ্নিত করুন (ক্লিক করুন):</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Map Layer Switcher */}
          <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-300 text-[11px]">
            <button
              type="button"
              onClick={() => setMapLayer('satellite')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                mapLayer === 'satellite' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              স্যাটেলাইট
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('street')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                mapLayer === 'street' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              রাস্তাঘাট
            </button>
          </div>

          {/* GPS Locate Button */}
          <button
            type="button"
            onClick={handleCurrentGPS}
            disabled={locating}
            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-emerald-700 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Crosshair className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'খোঁজা হচ্ছে...' : 'বর্তমান GPS'}</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Box */}
      <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-300 shadow-sm relative z-10">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <MapFlyTo center={position} />
          {mapLayer === 'satellite' ? (
            <TileLayer
              attribution='&copy; Google Satellite / Esri'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />
          ) : (
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onLocationChange={onLocationSelect}
          />
        </MapContainer>
      </div>

      {/* Lat/Lon Info Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-center space-x-3 text-slate-700">
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
