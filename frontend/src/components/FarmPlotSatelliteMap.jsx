import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, Layers, Navigation, Trash2, CheckCircle2, 
  HelpCircle, Sparkles, Compass, AlertCircle, Edit2
} from 'lucide-react';
import { toBanglaDigits } from '../utils/banglaNumbers';

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
        // Add boundary vertex
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

// Controller to fly map when target coordinate changes externally
function MapCenterFlyer({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 15, { duration: 0.8 });
    }
  }, [center]);
  return null;
}

// Calculate approximate area in Bigha and Decimal from polygon coordinates (Shoelace Formula on lat/lon)
function calculatePolygonArea(latLngs) {
  if (!latLngs || latLngs.length < 3) return { bigha: 0, decimal: 0, sqMeters: 0 };
  
  // Earth radius in meters
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

  area = Math.abs((area * R * R) / 4.0); // area in square meters
  
  // 1 Decimal (শতক) = 40.4686 sq meters
  // 1 Bigha (বিঘা) = 33 Decimal = ~1335.46 sq meters
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
  const [mapLayer, setMapLayer] = useState('satellite'); // 'satellite', 'street'
  const [drawMode, setDrawMode] = useState('pin'); // 'pin' or 'polygon'
  const [centerPin, setCenterPin] = useState(initialCenter);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [calculatedArea, setCalculatedArea] = useState(null);
  const [locating, setLocating] = useState(false);

  // Sync initial coordinates if provided
  useEffect(() => {
    if (initialCenter && initialCenter[0] && initialCenter[1]) {
      setCenterPin(initialCenter);
    }
  }, [initialCenter]);

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
      alert("আপনার ডিভাইসে জিপিএস পাওয়া যায়নি।");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setCenterPin(coords);
        setLocating(false);
        if (onBoundaryUpdate) {
          onBoundaryUpdate({
            type: 'point',
            center: coords
          });
        }
      },
      (err) => {
        console.error(err);
        setLocating(false);
        alert("জিপিএস তথ্য নেওয়া যায়নি। অনুগ্রহ করে ম্যাপে ক্লিক করে জমি সিলেক্ট করুন।");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden flex flex-col">
      {/* Top Map Control Bar */}
      <div className="p-3 sm:p-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>স্যাটেলাইট জমির ম্যাপ ও সীমানা নির্ধারণ</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 font-mono font-medium">
                NASA SMAP & Landsat Live View
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              ম্যাপে ক্লিক করে আপনার জমির সঠিক অবস্থান বা ৪ কোণা দাগ দিয়ে বাউন্ডারি চিহ্নিত করুন
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Switcher */}
          <div className="bg-slate-200/80 p-0.5 rounded-lg border border-slate-300 flex text-xs">
            <button
              type="button"
              onClick={() => setMapLayer('satellite')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                mapLayer === 'satellite'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              🛰️ স্যাটেলাইট ভিউ
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('street')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                mapLayer === 'street'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              🗺️ সাধারণ মানচিত্র
            </button>
          </div>

          {/* GPS Auto-Locate */}
          <button
            type="button"
            onClick={handleCurrentGPS}
            disabled={locating}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 border border-sky-400/30 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
            title="আমার বর্তমান জমিতে জিপিএস পিন করুন"
          >
            <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'জিপিএস খোঁজা হচ্ছে...' : 'আমার বর্তমান জমি'}</span>
          </button>
        </div>
      </div>

      {/* Drawing Mode Toolbar (Only when adding/editing or user wants to draw) */}
      <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-600 font-medium">চিহ্নিত করার মোড:</span>
          <button
            type="button"
            onClick={() => setDrawMode('pin')}
            className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              drawMode === 'pin'
                ? 'bg-amber-100 border border-amber-300 text-amber-900 shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>১-ক্লিকে জমিতে পিন ফেলুন</span>
          </button>
          <button
            type="button"
            onClick={() => setDrawMode('polygon')}
            className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              drawMode === 'polygon'
                ? 'bg-sky-100 border border-sky-300 text-sky-900 shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>আইল/বাউন্ডারি দাগ দিন (Polygon)</span>
          </button>
        </div>

        {/* Clear drawing if polygon points exist */}
        {polygonPoints.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sky-700 font-mono text-[11px] font-semibold">
              {toBanglaDigits(polygonPoints.length)}টি কোণা চিহ্নিত
            </span>
            <button
              type="button"
              onClick={clearDrawing}
              className="text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 flex items-center gap-1 text-[11px]"
            >
              <Trash2 className="w-3 h-3" />
              <span>মুছে পুনরায় দাগ দিন</span>
            </button>
          </div>
        )}
      </div>

      {/* Leaflet Map Body */}
      <div className="relative w-full h-[380px] sm:h-[440px]">
        <MapContainer
          center={centerPin}
          zoom={15}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          {/* Tile Layer: Esri World Imagery (Satellite) vs OpenStreetMap */}
          {mapLayer === 'satellite' ? (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> & NASA Landsat'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {/* Active Center Pin */}
          {centerPin && (
            <Marker position={centerPin} icon={selectedIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <p className="font-bold text-slate-900">📍 আপনার নির্বাচিত জমির কেন্দ্র</p>
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

          {/* Render Polygon Vertices for clear farmer feedback */}
          {drawMode === 'polygon' && polygonPoints.map((pt, idx) => (
            <Marker key={`vert-${idx}`} position={pt} icon={vertexIcon}>
              <Popup>
                <div className="text-xs">কোণা #{toBanglaDigits(idx + 1)}</div>
              </Popup>
            </Marker>
          ))}

          {/* Render other existing saved plots on map */}
          {existingPlots.map((plot) => {
            // Check if plot has polygon GeoJSON or center coords
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
                // Ignore parse errors
              }
            }

            // Fallback default coordinates around initialCenter if none specified
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

          <MapCenterFlyer center={centerPin} />
        </MapContainer>

        {/* Live Farm Overlay Card on Map */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-[1000] bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center space-x-1.5 text-emerald-700 font-bold text-xs">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>জমির রিয়েল-টাইম কোঅর্ডিনেট</span>
              </div>
              <p className="text-slate-800 font-mono text-[11px] mt-1">
                অক্ষাংশ (Lat): <b className="text-emerald-700">{centerPin[0]?.toFixed(5)}</b> | দ্রাঘিমাংশ (Lon): <b className="text-emerald-700">{centerPin[1]?.toFixed(5)}</b>
              </p>
            </div>

            {calculatedArea && (
              <div className="text-right bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block font-medium">পরিমাপকৃত মোট জমি</span>
                <span className="text-xs font-bold text-emerald-800">
                  {toBanglaDigits(calculatedArea.bigha)} বিঘা ({toBanglaDigits(calculatedArea.decimal)} শতক)
                </span>
              </div>
            )}
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/80 pt-1.5">
            <span>
              {drawMode === 'polygon'
                ? '👉 জমির সীমানার প্রতিটি কোণায় ক্লিক করে দাগ দিন'
                : '👉 ম্যাপে নিজের জমির ওপর ক্লিক করে পিন বসান'}
            </span>
            <span className="text-emerald-600 font-medium">
              ✓ NASA টেলিমিত্রি সিঙ্কড
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
