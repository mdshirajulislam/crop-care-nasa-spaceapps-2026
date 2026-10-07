import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import { Map, Layers, Calendar, Info, Activity, ZoomIn, Eye, Sparkles } from 'lucide-react';
import { fetchNdviTimeSeries } from '../utils/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { toBanglaDigits } from '../utils/banglaNumbers';
import { useLanguage } from '../contexts/LanguageContext';

export const SatelliteMapPage = () => {
  const { lang, t } = useLanguage();
  const [activeLayer, setActiveLayer] = useState('satellite'); // satellite, ndvi, osm
  const [selectedTime, setSelectedTime] = useState('2026-10-01');
  const [ndviHistory, setNdviHistory] = useState([]);

  useEffect(() => {
    fetchNdviTimeSeries().then(data => setNdviHistory(data || [])).catch(console.error);
  }, []);

  // Mymensingh Sadar plot coordinates (3.5 Bigha boundary)
  const centerPos = [24.7471, 90.4203];
  const plotPolygon = [
    [24.7455, 90.4185],
    [24.7485, 90.4190],
    [24.7490, 90.4225],
    [24.7460, 90.4220],
  ];

  // Weak zone inside plot
  const weakZonePolygon = [
    [24.7462, 90.4195],
    [24.7472, 90.4198],
    [24.7470, 90.4210],
    [24.7460, 90.4208],
  ];

  const ndviLegends = [
    { 
      range: lang === 'bn' ? "০.০ - ০.২" : "0.0 - 0.2", 
      color: "#ef4444", 
      label: lang === 'bn' ? "অনাবাদী / জলাশয় / শূন্য গাছপালা" : "Barren / Waterbody / Bare Soil" 
    },
    { 
      range: lang === 'bn' ? "০.২ - ০.৪" : "0.2 - 0.4", 
      color: "#f59e0b", 
      label: lang === 'bn' ? "দুর্বল বৃদ্ধি / পানির অভাব (Weak Zone)" : "Weak Growth / Moisture Deficit (Weak Zone)" 
    },
    { 
      range: lang === 'bn' ? "০.৪ - ০.৭" : "0.4 - 0.7", 
      color: "#84cc16", 
      label: lang === 'bn' ? "সুস্থ ও সতেজ সবুজ ফসল" : "Healthy & Vigorous Crop" 
    },
    { 
      range: lang === 'bn' ? "০.৭ - ১.০" : "0.7 - 1.0", 
      color: "#15803d", 
      label: lang === 'bn' ? "চমৎকার ও ঘন সবুজ ফসল (Peak Health)" : "Peak Health & Dense Biomass" 
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t.satellite.title}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              NASA GIBS / HLS 30m
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {t.satellite.subtitle}
          </p>
        </div>

        {/* Layer Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveLayer('satellite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeLayer === 'satellite' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.satellite.satelliteLayer}
          </button>
          <button
            onClick={() => setActiveLayer('ndvi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeLayer === 'ndvi' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.satellite.ndviLayer}
          </button>
        </div>
      </div>

      {/* Interactive Map & Side Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Map Box */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 h-[460px] sm:h-[500px] relative shadow-sm">
            <MapContainer
              center={centerPos}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              className="z-10"
            >
              {activeLayer === 'satellite' ? (
                <TileLayer
                  attribution='&copy; Google Satellite / NASA GIBS'
                  url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                />
              ) : (
                <TileLayer
                  attribution='&copy; NASA ESDIS GIBS / OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              )}

              {/* Main Farm Polygon (3.5 Bigha) */}
              <Polygon
                positions={plotPolygon}
                pathOptions={{
                  color: activeLayer === 'ndvi' ? '#16a34a' : '#10b981',
                  fillColor: activeLayer === 'ndvi' ? '#16a34a' : '#10b981',
                  fillOpacity: activeLayer === 'ndvi' ? 0.6 : 0.25,
                  weight: 3
                }}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <strong className="text-slate-900 block text-sm">
                      {lang === 'bn' ? 'প্লট ১ (পূর্বের মাঠ)' : 'Plot 1 (East Field)'}
                    </strong>
                    <p>{lang === 'bn' ? 'ফসল: আমন ধান (ব্রি ধান ৪৯)' : 'Crop: Aman Rice (BRRI 49)'}</p>
                    <p>{lang === 'bn' ? 'আয়তন: ৩.৫ বিঘা (১১৫.৫ শতক)' : 'Area: 3.5 Bigha (115.5 Decimals)'}</p>
                    <p className="text-emerald-700 font-bold">
                      {lang === 'bn' ? 'গড় NDVI: ০.৬৮ (সুস্থ)' : 'Avg NDVI: 0.68 (Healthy)'}
                    </p>
                  </div>
                </Popup>
              </Polygon>

              {/* Weak Zone Highlight (Demonstrating precision agriculture) */}
              <Polygon
                positions={weakZonePolygon}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#f87171',
                  fillOpacity: 0.5,
                  weight: 2,
                  dashArray: '4, 4'
                }}
              >
                <Popup>
                  <div className="p-1 text-xs text-red-900">
                    <strong className="block text-sm">{lang === 'bn' ? 'দুর্বল অঞ্চল (Weak Zone)' : 'Weak Zone'}</strong>
                    <p>NDVI: {toBanglaDigits('0.34', lang)} ({lang === 'bn' ? 'কম সবুজ' : 'Low Biomass'})</p>
                    <p>{lang === 'bn' ? 'পরামর্শ: এই অংশে পানি জমে আছে অথবা ইউরিয়ার অভাব রয়েছে।' : 'Advice: Waterlogged or deficient in nitrogen fertilizer.'}</p>
                  </div>
                </Popup>
              </Polygon>
            </MapContainer>

            {/* Float Overlay Info on Map */}
            <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 text-xs shadow-md space-y-0.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'bn' ? '৩.৫ বিঘা আমন ধানের প্লট চিহ্নিত' : '3.5 Bigha Aman Rice Plot Outlined'}
              </span>
              <p className="text-[11px] text-rose-600 font-medium">
                {lang === 'bn' ? 'লাল ডটেড অংশে দ্রুত নজর দিন (কম বৃদ্ধি)' : 'Inspect red dotted zone (low vigor)'}
              </p>
            </div>
          </div>

          {/* Time Slider */}
          <div className="glass-card rounded-xl p-4 border border-slate-200 bg-white space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {t.satellite.timeSeries}:
              </span>
              <span className="text-emerald-700 font-bold">{selectedTime}</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              defaultValue="3"
              onChange={(e) => {
                const dates = ['2026-07-01', '2026-08-15', '2026-09-10', '2026-10-01'];
                setSelectedTime(dates[e.target.value]);
              }}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>{lang === 'bn' ? 'জুলাই (রোপণ)' : 'July (Planting)'}</span>
              <span>{lang === 'bn' ? 'আগস্ট (কুশি)' : 'Aug (Tillering)'}</span>
              <span>{lang === 'bn' ? 'সেপ্টেম্বর (থোর)' : 'Sept (Booting)'}</span>
              <span>{lang === 'bn' ? 'অক্টোবর (বর্তমান)' : 'Oct (Current)'}</span>
            </div>
          </div>
        </div>

        {/* Sidebar: Legend & NDVI History Trend */}
        <div className="space-y-4">
          {/* NDVI Legend */}
          <div className="glass-card rounded-2xl p-4 border border-slate-200 bg-white space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              {t.satellite.legendTitle}
            </h3>

            <div className="space-y-2">
              {ndviLegends.map((leg, i) => (
                <div key={i} className="flex items-start space-x-2 text-xs">
                  <div className="w-3.5 h-3.5 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: leg.color }} />
                  <div>
                    <span className="font-bold text-slate-900">{leg.range}</span>
                    <p className="text-[11px] text-slate-500 font-medium">{leg.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical NDVI Chart */}
          <div className="glass-card rounded-2xl p-4 border border-slate-200 bg-white space-y-2 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              {t.satellite.cropHealthTrend}
            </h3>

            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ndviHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#64748b" domain={[0, 1]} tick={{ fontSize: 9 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', color: '#1e293b', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="ndvi" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name={lang === 'bn' ? "NDVI সূচক" : "NDVI Index"} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-500 text-center font-medium">
              {lang === 'bn' 
                ? 'সর্বোচ্চ বৃদ্ধি অর্জিত হয়েছে সেপ্টেম্বর মাসে (০.৭৮)'
                : 'Peak vigor achieved in September (0.78)'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
