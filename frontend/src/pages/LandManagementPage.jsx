import React, { useState, useEffect } from 'react';
import { fetchPlots, addPlot, updatePlot, deletePlot } from '../utils/api';
import { 
  MapPin, Plus, Trash2, Edit3, Check, Sprout, ArrowRightLeft, 
  Droplet, Shield, X, Loader2, Satellite, Compass, Sparkles, Layers
} from 'lucide-react';
import { toBanglaDigits, formatLandArea } from '../utils/banglaNumbers';
import { useLanguage } from '../contexts/LanguageContext';
import { FarmPlotSatelliteMap } from '../components/FarmPlotSatelliteMap';

export const LandManagementPage = () => {
  const { lang, t } = useLanguage();
  const [plotData, setPlotData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlotOnMap, setSelectedPlotOnMap] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlot, setEditingPlot] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    crop_name: 'আমন ধান',
    crop_variety: 'ব্রি ধান ৪৯',
    area_value: 3.5,
    area_unit: 'bigha',
    soil_type: 'দোআঁশ মাটি',
    irrigation_source: 'গভীর নলকূপ',
    planting_date: '2026-07-20',
    polygon_geojson: null
  });

  // Modal Map Boundary State
  const [modalBoundary, setModalBoundary] = useState({
    center: [24.7471, 90.4203],
    points: []
  });

  // Unit Converter state
  const [convertValue, setConvertValue] = useState(3.5);
  const [fromUnit, setFromUnit] = useState('bigha');

  const loadPlots = async () => {
    try {
      const data = await fetchPlots();
      setPlotData(data);
      if (data?.plots?.length > 0 && !selectedPlotOnMap) {
        setSelectedPlotOnMap(data.plots[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlots();
  }, []);

  const handleOpenAdd = () => {
    setEditingPlot(null);
    const newCenter = [24.7471, 90.4203];
    setFormData({
      name: `প্লট ${(plotData?.plots?.length || 0) + 1} - নতুন মাঠ`,
      crop_name: 'আমন ধান',
      crop_variety: 'ব্রি ধান ৪৯',
      area_value: 2.0,
      area_unit: 'bigha',
      soil_type: 'দোআঁশ মাটি',
      irrigation_source: 'গভীর নলকূপ',
      planting_date: '2026-07-20',
      polygon_geojson: JSON.stringify({ center: newCenter })
    });
    setModalBoundary({ center: newCenter, points: [] });
    setShowAddModal(true);
  };

  const handleOpenEdit = (plot) => {
    setEditingPlot(plot);
    let parsedBoundary = { center: [24.7471, 90.4203], points: [] };
    if (plot.polygon_geojson) {
      try {
        const parsed = JSON.parse(plot.polygon_geojson);
        if (parsed.center) parsedBoundary.center = parsed.center;
        if (parsed.points) parsedBoundary.points = parsed.points;
      } catch (e) {
        // fallback
      }
    }
    setFormData({
      name: plot.name,
      crop_name: plot.crop_name,
      crop_variety: plot.crop_variety || '',
      area_value: plot.area_value,
      area_unit: plot.area_unit || 'bigha',
      soil_type: plot.soil_type || 'দোআঁশ মাটি',
      irrigation_source: plot.irrigation_source || 'গভীর নলকূপ',
      planting_date: plot.planting_date || '2026-07-20',
      polygon_geojson: plot.polygon_geojson
    });
    setModalBoundary(parsedBoundary);
    setShowAddModal(true);
  };

  const handleBoundaryUpdateInModal = (boundaryData) => {
    if (boundaryData.type === 'polygon' && boundaryData.area) {
      // Auto-update area value from satellite polygon measurement!
      setFormData((prev) => ({
        ...prev,
        area_value: boundaryData.area.bigha || prev.area_value,
        polygon_geojson: JSON.stringify({
          type: 'polygon',
          points: boundaryData.points,
          center: boundaryData.center,
          area: boundaryData.area
        })
      }));
    } else if (boundaryData.type === 'point') {
      setFormData((prev) => ({
        ...prev,
        polygon_geojson: JSON.stringify({
          type: 'point',
          center: boundaryData.center
        })
      }));
    }
  };

  const handleSavePlot = async (e) => {
    e.preventDefault();
    try {
      if (editingPlot) {
        await updatePlot(editingPlot.id, {
          ...formData,
          area_value: parseFloat(formData.area_value) || 1.0
        });
      } else {
        await addPlot({
          ...formData,
          area_value: parseFloat(formData.area_value) || 1.0
        });
      }
      setShowAddModal(false);
      loadPlots();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlot = async (plotId) => {
    if (window.confirm(lang === 'bn' ? "আপনি কি নিশ্চিতভাবে এই প্লটটি মুছে ফেলতে চান?" : "Are you sure you want to delete this plot?")) {
      try {
        await deletePlot(plotId);
        loadPlots();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Conversion calculations baseline in Decimal (শতক)
  const getDecimalValue = (val, unit) => {
    const v = parseFloat(val) || 0;
    switch (unit) {
      case 'bigha': return v * 33.0;
      case 'katha': return v * 1.65;
      case 'acre': return v * 100.0;
      case 'hectare': return v * 247.1;
      default: return v;
    }
  };

  const baseDecimals = getDecimalValue(convertValue, fromUnit);
  const conversions = {
    bigha: Math.round((baseDecimals / 33.0) * 100) / 100,
    decimal: Math.round(baseDecimals * 10) / 10,
    katha: Math.round((baseDecimals / 1.65) * 10) / 10,
    acre: Math.round((baseDecimals / 100.0) * 100) / 100,
    hectare: Math.round((baseDecimals / 247.1) * 1000) / 1000
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t.lands.title}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-medium">
              NASA Satellite GIS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t.lands.subtitle}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all self-start sm:self-auto border border-emerald-500"
        >
          <Plus className="w-4 h-4" />
          <span>{t.lands.addNewPlot}</span>
        </button>
      </div>

      {/* Primary Satellite Map Section showing ALL farmer plots */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Satellite className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {t.lands.mapTitle}
            </h3>
          </div>
          <span className="text-xs text-slate-600">
            {t.lands.totalPlots}: <b className="text-emerald-700">{toBanglaDigits(plotData?.plots?.length || 0, lang)} {lang === 'bn' ? 'টি' : ''}</b>
          </span>
        </div>

        <FarmPlotSatelliteMap
          existingPlots={plotData?.plots || []}
          activePlot={selectedPlotOnMap}
          onPlotSelect={(plot) => setSelectedPlotOnMap(plot)}
          initialCenter={[24.7471, 90.4203]}
        />
      </div>

      {/* Plots Summary Card Grid */}
      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {plotData?.plots?.map((p) => {
            const formatted = formatLandArea(p.area_value, lang);
            const isSelected = selectedPlotOnMap?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlotOnMap(p)}
                className={`glass-card rounded-2xl p-5 border transition-all cursor-pointer relative group bg-white shadow-sm ${
                  isSelected 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' 
                    : 'border-slate-200/90 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>{p.name}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300 font-medium">
                            {t.lands.selectedOnMap}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{lang === 'bn' ? 'ময়মনসিংহ সদর' : 'Mymensingh Sadar'} • NASA GRID: 24.74°N, 90.42°E</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
                      title={t.lands.editPlot}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {plotData.plots.length > 1 && (
                      <button
                        onClick={() => handleDeletePlot(p.id)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all"
                        title={t.lands.deletePlot}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 my-3">
                  <span className="text-xs font-semibold text-slate-600">{t.lands.totalArea}:</span>
                  <span className="text-xs font-bold text-emerald-700">
                    {formatted.bighaText} ({formatted.decimalText})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-700">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">{t.lands.currentCrop}</span>
                    <strong className="text-slate-900 text-xs">{p.crop_name}</strong>
                    <span className="text-[10px] text-emerald-700 block font-mono">{p.crop_variety}</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">{t.lands.soilType}</span>
                    <strong className="text-slate-900 text-xs">{p.soil_type}</strong>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">{t.lands.irrigationSource}</span>
                    <strong className="text-slate-900 text-xs">{p.irrigation_source}</strong>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">{t.lands.plantHealth} (NDVI)</span>
                    <strong className="text-emerald-700 text-xs flex items-center gap-1">
                      <span>{toBanglaDigits(p.ndvi_score, lang)}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">({p.health_status})</span>
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bangladeshi Land Unit Converter Widget */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200/90 bg-white shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <ArrowRightLeft className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">
            {t.lands.converterTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 flex gap-2">
            <input
              type="number"
              step="0.1"
              value={convertValue}
              onChange={(e) => setConvertValue(e.target.value)}
              className="flex-1 bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-500"
              placeholder={lang === 'bn' ? "জমির পরিমাণ লিখুন..." : "Enter land area..."}
            />

            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="bigha">{lang === 'bn' ? 'বিঘা (Bigha - ৩৩ শতক)' : 'Bigha (33 Decimals)'}</option>
              <option value="decimal">{lang === 'bn' ? 'শতক / শতাংশ (Decimal)' : 'Decimal / Shatak'}</option>
              <option value="katha">{lang === 'bn' ? 'কাঠা (Katha - ১.৬৫ শতক)' : 'Katha (1.65 Decimals)'}</option>
              <option value="acre">{lang === 'bn' ? 'একর (Acre - ১০০ শতক)' : 'Acre (100 Decimals)'}</option>
              <option value="hectare">{lang === 'bn' ? 'হেক্টর (Hectare - ২৪৭.১ শতক)' : 'Hectare (247.1 Decimals)'}</option>
            </select>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col justify-center">
            <span className="text-xs text-emerald-800 font-medium">{t.lands.calculatedDecimal}:</span>
            <span className="text-lg font-bold text-emerald-700">
              {toBanglaDigits(baseDecimals, lang)} {lang === 'bn' ? 'শতক' : 'Decimals'}
            </span>
          </div>
        </div>

        {/* Live Converted Results Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">{lang === 'bn' ? 'বিঘা' : 'Bigha'}</span>
            <strong className="text-sm text-slate-800">{toBanglaDigits(conversions.bigha, lang)}</strong>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[10px] text-emerald-700 block font-medium">{lang === 'bn' ? 'শতক / ডেসিমাল' : 'Decimal'}</span>
            <strong className="text-sm text-emerald-800 font-bold">{toBanglaDigits(conversions.decimal, lang)}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">{lang === 'bn' ? 'কাঠা' : 'Katha'}</span>
            <strong className="text-sm text-slate-800">{toBanglaDigits(conversions.katha, lang)}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block">{lang === 'bn' ? 'একর' : 'Acre'}</span>
            <strong className="text-sm text-slate-800">{toBanglaDigits(conversions.acre, lang)}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-500 block">{lang === 'bn' ? 'হেক্টর' : 'Hectare'}</span>
            <strong className="text-sm text-slate-800">{toBanglaDigits(conversions.hectare, lang)}</strong>
          </div>
        </div>
      </div>

      {/* Add / Edit Plot Modal with Satellite Boundary Drawing */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 w-full max-w-3xl shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingPlot 
                      ? (lang === 'bn' ? 'প্লটের তথ্য ও ম্যাপ সীমানা সম্পাদনা' : 'Edit Plot Details & Boundary')
                      : (lang === 'bn' ? 'ম্যাপে নতুন প্লট যুক্ত করুন' : 'Add New Plot on Map')
                    }
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'bn' 
                      ? 'স্যাটেলাইট ম্যাপে আপনার জমিতে ক্লিক করুন বা আইল বরাবর দাগ টেনে বাউন্ডারি দিন'
                      : 'Click on your field or trace the boundary line directly on the satellite map'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 bg-slate-100 border border-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded Satellite Map for this plot entry */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <FarmPlotSatelliteMap
                existingPlots={plotData?.plots?.filter(p => p.id !== editingPlot?.id) || []}
                initialCenter={modalBoundary.center || [24.7471, 90.4203]}
                onBoundaryUpdate={handleBoundaryUpdateInModal}
              />
            </div>

            <form onSubmit={handleSavePlot} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">
                    {lang === 'bn' ? 'প্লটের নাম:' : 'Plot Name:'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={lang === 'bn' ? "যেমন: প্লট ২ - উত্তরের মাঠ" : "e.g., Plot 2 - North Field"}
                    required
                    className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-medium">
                    {lang === 'bn' ? 'জমির পরিমাণ (বিঘা)' : 'Land Area (Bigha)'} 
                    <span className="text-[11px] text-emerald-600 ml-1.5">
                      {lang === 'bn' ? '(ম্যাপে দাগ দিলে অটোমেটিক পরিমাপ হবে)' : '(Auto-calculated from map polygon)'}
                    </span>:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.area_value}
                    onChange={(e) => setFormData({ ...formData, area_value: e.target.value })}
                    required
                    className="w-full bg-slate-50 text-slate-900 font-mono font-semibold border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">
                    {lang === 'bn' ? 'ফসলের নাম:' : 'Crop Name:'}
                  </label>
                  <select
                    value={formData.crop_name}
                    onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="আমন ধান">{lang === 'bn' ? 'আমন ধান' : 'Aman Rice'}</option>
                    <option value="বোরো ধান">{lang === 'bn' ? 'বোরো ধান' : 'Boro Rice'}</option>
                    <option value="আলু">{lang === 'bn' ? 'আলু' : 'Potato'}</option>
                    <option value="সরিষা">{lang === 'bn' ? 'সরিষা' : 'Mustard'}</option>
                    <option value="ভুট্টা">{lang === 'bn' ? 'ভুট্টা' : 'Maize'}</option>
                    <option value="শাকসবজি">{lang === 'bn' ? 'শাকসবজি' : 'Vegetables'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-medium">
                    {lang === 'bn' ? 'জাত (Variety):' : 'Variety:'}
                  </label>
                  <input
                    type="text"
                    value={formData.crop_variety}
                    onChange={(e) => setFormData({ ...formData, crop_variety: e.target.value })}
                    placeholder={lang === 'bn' ? "যেমন: ব্রি ধান ৪৯ / ডায়মন্ড আলু" : "e.g., BRRI Dhan 49"}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">
                    {lang === 'bn' ? 'মাটির ধরন:' : 'Soil Type:'}
                  </label>
                  <select
                    value={formData.soil_type}
                    onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="দোআঁশ মাটি">{lang === 'bn' ? 'দোআঁশ মাটি (Loamy)' : 'Loamy Soil'}</option>
                    <option value="বেলে দোআঁশ">{lang === 'bn' ? 'বেলে দোআঁশ (Sandy Loam)' : 'Sandy Loam'}</option>
                    <option value="এঁটেল মাটি">{lang === 'bn' ? 'এঁটেল মাটি (Clay)' : 'Clay Soil'}</option>
                    <option value="পলি মাটি">{lang === 'bn' ? 'পলি মাটি (Silty)' : 'Silty Soil'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-medium">
                    {lang === 'bn' ? 'সেচ সুবিধা:' : 'Irrigation Source:'}
                  </label>
                  <select
                    value={formData.irrigation_source}
                    onChange={(e) => setFormData({ ...formData, irrigation_source: e.target.value })}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="গভীর নলকূপ">{lang === 'bn' ? 'গভীর নলকূপ (Deep Tubewell)' : 'Deep Tubewell'}</option>
                    <option value="অগভীর নলকূপ">{lang === 'bn' ? 'অগভীর নলকূপ (Shallow Tubewell)' : 'Shallow Tubewell'}</option>
                    <option value=" খাল বা নদী">{lang === 'bn' ? 'খাল বা নদী (Canal/River)' : 'Canal / River'}</option>
                    <option value="বৃষ্টি নির্ভর">{lang === 'bn' ? 'বৃষ্টি নির্ভর (Rain-fed)' : 'Rain-fed'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  {t.common?.cancel || (lang === 'bn' ? 'বাতিল' : 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-700/20 transition-colors"
                >
                  {editingPlot 
                    ? (lang === 'bn' ? 'হালনাগাদ ও সেভ করুন' : 'Update & Save') 
                    : (lang === 'bn' ? 'ম্যাপে জমি সংরক্ষণ করুন' : 'Save Plot on Map')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
