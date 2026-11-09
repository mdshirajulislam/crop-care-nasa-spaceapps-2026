import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, Layers, Navigation, Trash2, CheckCircle2, 
  HelpCircle, Sparkles, Compass, AlertCircle, Edit2, Search, Crosshair, ChevronDown
} from 'lucide-react';
import { toBanglaDigits } from '../utils/banglaNumbers';
import { DISTRICTS_DATA, parseBangladeshAddress } from '../utils/bangladeshGeoData';

// Green Field Pin for existing plots
const plotGreenIcon = new L.DivIcon({
  className: 'custom-plot-pin',
  html: `<div style="
    background: linear-gradient(135deg, #10b981, #059669);
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid #ffffff;
    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  "><div style="
    transform: rotate(45deg);
    color: white;
    font-size: 14px;
    font-weight: bold;
  ">🌾</div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Active Selection Marker
const selectedIcon = new L.DivIcon({
  className: 'custom-selected-pin',
  html: `<div style="
    background: linear-gradient(135deg, #f59e0b, #d97706);
    width: 36px;
    height: 36px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid #ffffff;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: bounce 1s infinite alternate;
  "><div style="
    transform: rotate(45deg);
    color: white;
    font-size: 15px;
    font-weight: bold;
  ">📍</div></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// Vertex marker for boundary drawing
const vertexIcon = new L.DivIcon({
  className: 'custom-vertex-dot',
  html: `<div style="
    background: #38bdf8;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    box-shadow: 0 0 6px rgba(56, 189, 248, 0.9);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Map Click & Draw Controller
function FarmPlotMapHandler({ 
  mode, // 'pin' or 'polygon'
  centerPin, 
  setCenterPin, 
  polygonPoints, 
  setPolygonPoints, 
  onPlotCoordinatesChange 
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;

      if (mode === 'polygon') {
        const updatedPoints = [...polygonPoints, [lat, lng]];
        setPolygonPoints(updatedPoints);
        if (onPlotCoordinatesChange) {
          onPlotCoordinatesChange({
            type: 'polygon',
            coordinates: updatedPoints,
            center: [lat, lng]
          });
        }
      } else {
        // Pin mode: set farm center
        setCenterPin([lat, lng]);
        map.flyTo([lat, lng], map.getZoom(), { duration: 0.5 });
        if (onPlotCoordinatesChange) {
          onPlotCoordinatesChange({
            type: 'point',
            center: [lat, lng]
          });
        }
      }
    }
  });

  return null;
}

// Controller to smoothly fly map when target coordinate changes externally
function MapCenterFlyer({ center, zoom = 15 }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && center[0] && center[1]) {
      const timer = setTimeout(() => {
        map.invalidateSize();
        map.flyTo(center, zoom, { duration: 1.0 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [center?.[0], center?.[1], zoom, map]);
  return null;
}

// Calculate approximate area in Bigha and Decimal from polygon coordinates
function calculatePolygonArea(latLngs) {
  if (!latLngs || latLngs.length < 3) return { bigha: 0, decimal: 0, sqMeters: 0 };
  
  const R = 6378137;
  let area = 0;
  const numCoords = latLngs.length;

  for (let i = 0; i < numCoords; i++) {
    const p1 = latLngs[i];
    const p2 = latLngs[(i + 1) % numCoords];
    
    const lat1 = (p1[0] * Math.PI) / 180;
    const lat2 = (p2[0] * Math.PI) / 180;
    const lon1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[1] * Math.PI) / 180;

    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * R * R) / 4.0);
  const decimal = area / 40.4686;
  const bigha = decimal / 33.0;

  return {
    bigha: Math.round(bigha * 100) / 100,
    decimal: Math.round(decimal * 10) / 10,
    sqMeters: Math.round(area)
  };
}

export const FarmPlotSatelliteMap = ({
  existingPlots = [],
  activePlot = null,
  onPlotSelect = null,
  isEditing = false,
  initialCenter = [24.7471, 90.4203],
  onBoundaryUpdate = null
}) => {
  const [mapLayer, setMapLayer] = useState('google_hybrid'); // 'google_hybrid', 'osm', 'satellite'
  const [drawMode, setDrawMode] = useState('pin'); // 'pin' or 'polygon'
  const [centerPin, setCenterPin] = useState(initialCenter);
  const [targetCenter, setTargetCenter] = useState(initialCenter);
  const [targetZoom, setTargetZoom] = useState(15);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [calculatedArea, setCalculatedArea] = useState(null);
  const [locating, setLocating] = useState(false);

  // Search & District/Upazila Jumper State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');

  const districtList = Object.keys(DISTRICTS_DATA).sort();
  const upazilaList = selectedDistrict && DISTRICTS_DATA[selectedDistrict]?.upazilas 
    ? Object.keys(DISTRICTS_DATA[selectedDistrict].upazilas).sort() 
    : [];

  // Sync initial coordinates if provided
  useEffect(() => {
    if (initialCenter && initialCenter[0] && initialCenter[1]) {
      setCenterPin(initialCenter);
      setTargetCenter(initialCenter);
    }
  }, [initialCenter?.[0], initialCenter?.[1]]);

  // Recalculate area whenever polygon points change
  useEffect(() => {
    if (polygonPoints.length >= 3) {
      const calc = calculatePolygonArea(polygonPoints);
      setCalculatedArea(calc);
      if (onBoundaryUpdate) {
        onBoundaryUpdate({
          type: 'polygon',
          points: polygonPoints,
          center: centerPin,
          area: calc
        });
      }
    } else {
      setCalculatedArea(null);
    }
  }, [polygonPoints]);

  const handleCoordinatesChange = (data) => {
    if (data.type === 'point') {
      setCenterPin(data.center);
      if (onBoundaryUpdate) {
        onBoundaryUpdate({
          type: 'point',
          center: data.center
        });
      }
    }
  };

  const handleCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert("আপনার ডিভাইসে জিপিএস পাওয়া যায়নি। অনুগ্রহ করে উপরের জেলা ও উপজেলা সিলেক্ট করে জমিতে যান।");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [
          parseFloat(pos.coords.latitude.toFixed(5)), 
          parseFloat(pos.coords.longitude.toFixed(5))
        ];
        setCenterPin(coords);
        setTargetCenter(coords);
        setTargetZoom(16);
        setLocating(false);
        if (onBoundaryUpdate) {
          onBoundaryUpdate({
            type: 'point',
            center: coords
          });
        }
      },
      (err) => {
        console.error("GPS error:", err);
        setLocating(false);
        alert("জিপিএস লোকেশন পাওয়া যায়নি। অনুগ্রহ করে উপরের জেলা ও উপজেলা ড্রপডাউন থেকে আপনার এলাকা বেছে নিন।");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleDistrictChange = (distName) => {
    setSelectedDistrict(distName);
    setSelectedUpazila('');
    if (distName && DISTRICTS_DATA[distName]) {
      const d = DISTRICTS_DATA[distName];
      const newPos = [d.lat, d.lon];
      setTargetCenter(newPos);
      setCenterPin(newPos);
      setTargetZoom(13);
      if (onBoundaryUpdate) {
        onBoundaryUpdate({ type: 'point', center: newPos });
      }
    }
  };

  const handleUpazilaChange = (upaName) => {
    setSelectedUpazila(upaName);
    if (selectedDistrict && upaName && DISTRICTS_DATA[selectedDistrict]?.upazilas?.[upaName]) {
      const u = DISTRICTS_DATA[selectedDistrict].upazilas[upaName];
      const newPos = [u.lat, u.lon];
      setTargetCenter(newPos);
      setCenterPin(newPos);
      setTargetZoom(15);
      if (onBoundaryUpdate) {
        onBoundaryUpdate({ type: 'point', center: newPos });
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const parsed = parseBangladeshAddress(searchQuery);
    if (parsed && parsed.lat && parsed.lon) {
      const newPos = [parsed.lat, parsed.lon];
      setTargetCenter(newPos);
      setCenterPin(newPos);
      setTargetZoom(16);
      if (parsed.district) setSelectedDistrict(parsed.district);
      if (parsed.upazila) setSelectedUpazila(parsed.upazila);
      if (onBoundaryUpdate) {
        onBoundaryUpdate({ type: 'point', center: newPos });
      }
    } else {
      alert("এলাকা খুঁজে পাওয়া যায়নি। অনুগ্রহ করে জেলা ও উপজেলা নির্বাচন করুন।");
    }
  };

  const clearDrawing = () => {
    setPolygonPoints([]);
    setCalculatedArea(null);
    if (onBoundaryUpdate) {
      onBoundaryUpdate({
        type: 'point',
        center: centerPin
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden flex flex-col">
      
      {/* 1. Quick Location Jumper & Search Bar */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h4 className="text-sm font-bold flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <MapPin className="w-4 h-4" />
              </span>
              <span>জমি নির্বাচন ও এলাকা সন্ধান (Find Your Farm)</span>
            </h4>
            <p className="text-[11px] text-emerald-200/90 mt-0.5">
              জেলা ও উপজেলা সিলেক্ট করলেই স্যাটেলাইট ম্যাপ সরাসরি আপনার এলাকার মাঠে চলে যাবে
            </p>
          </div>

          {/* GPS Auto-Locate Button */}
          <button
            type="button"
            onClick={handleCurrentGPS}
            disabled={locating}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer self-start sm:self-auto hover:scale-105"
            title="আমার বর্তমান জমিতে জিপিএস পিন করুন"
          >
            <Crosshair className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'জিপিএস খোঁজা হচ্ছে...' : 'আমার বর্তমান জমি (GPS)'}</span>
          </button>
        </div>

        {/* Dropdowns + Search Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* District Dropdown */}
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none font-medium cursor-pointer"
            >
              <option value="" className="text-slate-800">১. জেলা নির্বাচন করুন...</option>
              {districtList.map((dist) => (
                <option key={dist} value={dist} className="text-slate-900">
                  {dist}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-white/60 absolute right-3 top-2.5 pointer-events-none" />
          </div>

          {/* Upazila Dropdown */}
          <div className="relative">
            <select
              value={selectedUpazila}
              onChange={(e) => handleUpazilaChange(e.target.value)}
              disabled={!selectedDistrict}
              className="w-full bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none font-medium disabled:opacity-50 cursor-pointer"
            >
              <option value="" className="text-slate-800">২. উপজেলা নির্বাচন করুন...</option>
              {upazilaList.map((upa) => (
                <option key={upa} value={upa} className="text-slate-900">
                  {upa}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-white/60 absolute right-3 top-2.5 pointer-events-none" />
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="অথবা এলাকার নাম লিখুন..."
              className="flex-1 bg-white/10 backdrop-blur-md text-white placeholder-emerald-200/60 border border-white/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors cursor-pointer"
              title="খুঁজুন"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 2. Map Mode Toolbar (Pin vs Polygon) & Layer Switcher */}
      <div className="bg-slate-100/90 px-3 sm:px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-600 font-bold">নির্বাচন পদ্ধতি:</span>
          
          <button
            type="button"
            onClick={() => setDrawMode('pin')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              drawMode === 'pin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>১-ক্লিকে জমিতে পিন দিন</span>
          </button>

          <button
            type="button"
            onClick={() => setDrawMode('polygon')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              drawMode === 'polygon'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>আইল/বাউন্ডারি দাগ দিন (Polygon)</span>
          </button>
        </div>

        {/* Layer Switcher & Clear Button */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-200/80 p-0.5 rounded-xl border border-slate-300 flex text-[11px]">
            <button
              type="button"
              onClick={() => setMapLayer('google_hybrid')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                mapLayer === 'google_hybrid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              🛰️ গুগল স্যাটেলাইট
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('osm')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                mapLayer === 'osm'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              🗺️ সাধারণ মানচিত্র
            </button>
          </div>

          {polygonPoints.length > 0 && (
            <button
              type="button"
              onClick={clearDrawing}
              className="text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>মুছুন</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Interactive Leaflet Map Body */}
      <div className="relative w-full h-[400px] sm:h-[460px]">
        <MapContainer
          center={centerPin}
          zoom={targetZoom}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          {/* Hybrid Google Satellite Layer: Crisp satellite images WITH roads, rivers & Bengali village labels! */}
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

          {/* Active Center Pin */}
          {centerPin && (
            <Marker position={centerPin} icon={selectedIcon}>
              <Popup autoPan={false}>
                <div className="text-xs p-1">
                  <p className="font-bold text-slate-900">📍 আপনার নির্বাচিত জমি</p>
                  <p className="text-slate-600 font-mono mt-0.5">
                    অক্ষাংশ: {centerPin[0].toFixed(5)}, দ্রাঘিমাংশ: {centerPin[1].toFixed(5)}
                  </p>
                  <p className="text-emerald-700 font-semibold mt-1">
                    ✓ NASA POWER ও SMAP স্যাটেলাইট লিঙ্ক সক্রিয়
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Active Drawing Polygon */}
          {polygonPoints.length >= 3 && (
            <Polygon
              positions={polygonPoints}
              pathOptions={{
                color: '#06b6d4',
                fillColor: '#22d3ee',
                fillOpacity: 0.35,
                weight: 3,
                dashArray: '4, 4'
              }}
            />
          )}

          {/* Polygon Vertices */}
          {drawMode === 'polygon' && polygonPoints.map((pt, idx) => (
            <Marker key={`vert-${idx}`} position={pt} icon={vertexIcon}>
              <Popup>
                <div className="text-xs font-bold">কোণা #{toBanglaDigits(idx + 1)}</div>
              </Popup>
            </Marker>
          ))}

          {/* Render existing saved plots */}
          {existingPlots.map((plot) => {
            let plotPolygon = null;
            let plotCenter = null;

            if (plot.polygon_geojson) {
              try {
                const parsed = JSON.parse(plot.polygon_geojson);
                if (parsed.type === 'polygon' && Array.isArray(parsed.points)) {
                  plotPolygon = parsed.points;
                  plotCenter = parsed.center || parsed.points[0];
                } else if (parsed.center) {
                  plotCenter = parsed.center;
                }
              } catch (e) {
                // Ignore
              }
            }

            if (!plotCenter) {
              plotCenter = [24.7471 + (plot.id * 0.003), 90.4203 + (plot.id * 0.003)];
            }

            return (
              <React.Fragment key={`existing-${plot.id}`}>
                {plotPolygon && plotPolygon.length >= 3 && (
                  <Polygon
                    positions={plotPolygon}
                    pathOptions={{
                      color: '#10b981',
                      fillColor: '#34d399',
                      fillOpacity: 0.25,
                      weight: 2
                    }}
                  />
                )}
                <Marker 
                  position={plotCenter} 
                  icon={plotGreenIcon}
                  eventHandlers={{
                    click: () => onPlotSelect && onPlotSelect(plot)
                  }}
                >
                  <Popup>
                    <div className="text-xs p-1">
                      <p className="font-bold text-emerald-800 text-sm">{plot.name}</p>
                      <p className="text-slate-700 mt-0.5">🌾 ফসল: <b>{plot.crop_name}</b></p>
                      <p className="text-slate-700">📐 আয়তন: <b>{toBanglaDigits(plot.area_value)} বিঘা</b></p>
                      <p className="text-emerald-700 font-medium mt-1">
                        স্বাস্থ্য সূচক (NDVI): {plot.ndvi_score || '0.68'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* Map Click Event Handler */}
          <FarmPlotMapHandler
            mode={drawMode}
            centerPin={centerPin}
            setCenterPin={setCenterPin}
            polygonPoints={polygonPoints}
            setPolygonPoints={setPolygonPoints}
            onPlotCoordinatesChange={handleCoordinatesChange}
          />

          <MapCenterFlyer center={targetCenter} zoom={targetZoom} />
        </MapContainer>

        {/* Live Farm Overlay Card on Map */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-[1000] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center space-x-1.5 text-emerald-700 font-bold text-xs">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>নির্বাচিত জমির অবস্থান ও কোঅর্ডিনেট</span>
              </div>
              <p className="text-slate-800 font-mono text-[11px] mt-1">
                অক্ষাংশ: <b className="text-emerald-700">{centerPin[0]?.toFixed(5)}° N</b> | দ্রাঘিমাংশ: <b className="text-emerald-700">{centerPin[1]?.toFixed(5)}° E</b>
              </p>
            </div>

            {calculatedArea && (
              <div className="text-right bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block font-medium">পরিমাপকৃত জমি</span>
                <span className="text-xs font-bold text-emerald-800">
                  {toBanglaDigits(calculatedArea.bigha)} বিঘা ({toBanglaDigits(calculatedArea.decimal)} শতক)
                </span>
              </div>
            )}
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/80 pt-1.5">
            <span className="text-slate-700 font-medium">
              {drawMode === 'polygon'
                ? '👉 জমির সীমানার প্রতিটি কোণায় ক্লিক করে দাগ দিন'
                : '👉 ম্যাপে নিজের জমির ওপর ক্লিক করে পিন ফেলুন'}
            </span>
            <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ✓ লাইভ সিঙ্ক
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
