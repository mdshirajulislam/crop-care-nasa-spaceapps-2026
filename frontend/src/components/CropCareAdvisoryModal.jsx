import React, { useState, useEffect } from 'react';
import { 
  Sprout, Calendar, Sparkles, CheckCircle2, Circle, AlertTriangle, 
  Droplets, ShieldAlert, ShieldCheck, Info, Clock, ArrowRight, 
  Printer, X, Layers, Check, Loader2, Award, ChevronRight, Beaker,
  Compass, MapPin, BookmarkPlus, RefreshCw
} from 'lucide-react';
import { AudioSpeakerButton } from './AudioSpeakerButton';
import { toBanglaDigits, formatBDT } from '../utils/banglaNumbers';
import { useLanguage } from '../contexts/LanguageContext';
import { calculateCropAdvisory, fetchPlotAdvisory, togglePlotTask, addPlot, updatePlot } from '../utils/api';

const POPULAR_CROPS = [
  { id: 'aman_rice', name_bn: 'রোপা আমন ধান', name_en: 'Aman Rice', icon: '🌾', varieties: ['ব্রি ধান ৪৯', 'ব্রি ধান ৮৭', 'ব্রি ধান ৩৪ (সুগন্ধি)', 'স্বর্ণা', 'বিনা ধান-৭'] },
  { id: 'boro_rice', name_bn: 'বোরো ধান', name_en: 'Boro Rice', icon: '🌾', varieties: ['ব্রি ধান ২৮', 'ব্রি ধান ২৯', 'ব্রি ধান ৮৮', 'ব্রি ধান ৮৯', 'হাইব্রিড হীরা ২', 'তেজ গোল্ড'] },
  { id: 'potato', name_bn: 'আলু', name_en: 'Potato', icon: '🥔', varieties: ['ডায়মন্ড', 'কার্ডিনাল', 'গ্রানোলা', 'বারি আলু-৭ (এস্টারিক্স)'] },
  { id: 'mustard', name_bn: 'সরিষা', name_en: 'Mustard', icon: '🌼', varieties: ['বারি সরিষা-১৪', 'বারি সরিষা-১৫', 'বারি সরিষা-১৭', 'টোরি-৭'] },
  { id: 'maize', name_bn: 'ভুট্টা', name_en: 'Maize / Corn', icon: '🌽', varieties: ['এনকে ৪০', 'সুপার শাইন', 'পায়োনিয়ার ৩৩৫৫', 'প্যাসিফিক ৯৮৪'] },
  { id: 'wheat', name_bn: 'গম', name_en: 'Wheat', icon: '🌾', varieties: ['বারি গম ৩৩ (ব্লাস্ট প্রতিরোধী)', 'বারি গম ২৮', 'বারি গম ৩০', 'শতাব্দী'] },
  { id: 'tomato', name_bn: 'টমেটো', name_en: 'Tomato', icon: '🍅', varieties: ['বিজলী', 'বাহার', 'রতন', 'মিন্টু সুপার', 'বিউটি'] }
];

const SOIL_OPTIONS = [
  { value: 'দোআঁশ মাটি', label_bn: 'দোআঁশ মাটি (Loamy - আদর্শ উর্বর মাটি)', tip_bn: 'সার ও সেচের স্বাভাবিক রুটিন কার্যকর' },
  { value: 'বেলে-দোআঁশ মাটি', label_bn: 'বেলে-দোআঁশ মাটি (Sandy Loam - হালকা মাটি)', tip_bn: 'ইউরিয়া ৩-৪ কিস্তিতে অল্প অল্প দিন, পটাশ ১০% বাড়ান' },
  { value: 'এঁটেল মাটি', label_bn: 'এঁটেল মাটি (Clay Soil - ভারী ও আঠালো মাটি)', tip_bn: 'পানি নিষ্কাশন নালা রাখুন, মাটি শুকিয়ে জো আসলে সার দিন' },
  { value: 'বেলে মাটি', label_bn: 'বেলে মাটি (Sandy Soil - বেলে প্রধান)', tip_bn: 'পানি দ্রুত টানে, ঘন ঘন হালকা সেচ ও জৈব সার দিন' },
  { value: 'পলি মাটি', label_bn: 'পলি মাটি (Silt Loam - চরাঞ্চলের উর্বর পলি)', tip_bn: 'প্রাকৃতিক পুষ্টি সমৃদ্ধ' }
];

export const CropCareAdvisoryModal = ({ isOpen, onClose, initialPlot = null, onPlotSaved = null }) => {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'fertilizer', 'spray', 'irrigation'
  const [showInputForm, setShowInputForm] = useState(!initialPlot);
  const [loading, setLoading] = useState(false);
  const [savingPlot, setSavingPlot] = useState(false);
  const [saveToPlotsCheckbox, setSaveToPlotsCheckbox] = useState(!initialPlot);
  const [advisoryData, setAdvisoryData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    plot_name: initialPlot?.name || 'আমার ফসলের মাঠ ১',
    crop_name: initialPlot?.crop_name || 'রোপা আমন ধান',
    crop_variety: initialPlot?.crop_variety || 'ব্রি ধান ৪৯',
    planting_date: initialPlot?.planting_date || new Date().toISOString().split('T')[0],
    soil_type: initialPlot?.soil_type || 'দোআঁশ মাটি',
    area_value: initialPlot?.area_value || 2.5,
    area_unit: initialPlot?.area_unit || 'bigha',
    irrigation_source: initialPlot?.irrigation_source || 'গভীর নলকূপ'
  });

  const [currentPlotId, setCurrentPlotId] = useState(initialPlot?.id || null);

  // Load advisory if initialPlot is provided
  useEffect(() => {
    if (initialPlot) {
      setCurrentPlotId(initialPlot.id);
      setFormData({
        plot_name: initialPlot.name || 'আমার ফসলের মাঠ',
        crop_name: initialPlot.crop_name || 'রোপা আমন ধান',
        crop_variety: initialPlot.crop_variety || '',
        planting_date: initialPlot.planting_date || new Date().toISOString().split('T')[0],
        soil_type: initialPlot.soil_type || 'দোআঁশ মাটি',
        area_value: initialPlot.area_value || 1.0,
        area_unit: initialPlot.area_unit || 'bigha',
        irrigation_source: initialPlot.irrigation_source || 'গভীর নলকূপ'
      });
      setShowInputForm(false);
      loadPlotAdvisory(initialPlot.id);
    } else {
      setShowInputForm(true);
      setAdvisoryData(null);
    }
  }, [initialPlot]);

  const loadPlotAdvisory = async (plotId) => {
    setLoading(true);
    try {
      const adv = await fetchPlotAdvisory(plotId);
      setAdvisoryData(adv);
    } catch (e) {
      console.error("Plot advisory fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAdvisory = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      let savedPlotObj = null;
      // If user checked "save to plots", create plot or update existing
      if (saveToPlotsCheckbox && !currentPlotId) {
        setSavingPlot(true);
        try {
          const res = await addPlot({
            name: formData.plot_name || `${formData.crop_name} মাঠ`,
            crop_name: formData.crop_name,
            crop_variety: formData.crop_variety,
            planting_date: formData.planting_date,
            area_value: parseFloat(formData.area_value) || 1.0,
            area_unit: formData.area_unit,
            soil_type: formData.soil_type,
            irrigation_source: formData.irrigation_source
          });
          if (res?.plot) {
            savedPlotObj = res.plot;
            setCurrentPlotId(res.plot.id);
            if (onPlotSaved) onPlotSaved(res.plot);
          }
        } catch (err) {
          console.error("Auto add plot error:", err);
        } finally {
          setSavingPlot(false);
        }
      }

      // Calculate advisory
      const adv = await calculateCropAdvisory({
        crop_name: formData.crop_name,
        planting_date: formData.planting_date,
        crop_variety: formData.crop_variety,
        soil_type: formData.soil_type,
        area_value: parseFloat(formData.area_value) || 1.0,
        area_unit: formData.area_unit,
        irrigation_source: formData.irrigation_source,
        completed_tasks: []
      });
      setAdvisoryData(adv);
      setShowInputForm(false);
    } catch (err) {
      console.error("Advisory calculation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId, currentCompletedStatus) => {
    const newStatus = !currentCompletedStatus;
    // Optimistic UI update
    setAdvisoryData((prev) => {
      if (!prev) return prev;
      const updateList = (list) =>
        list.map((item) =>
          item.task_id === taskId
            ? { ...item, is_completed: newStatus, status: newStatus ? 'completed' : (item.days_remaining < 0 ? 'overdue' : (item.days_remaining === 0 ? 'today' : 'upcoming')) }
            : item
        );

      const updatedAll = updateList(prev.all_actions || []);
      const updatedFert = updateList(prev.fertilizer_timeline || []);
      const updatedSpray = updateList(prev.spray_timeline || []);
      const completedCount = updatedAll.filter((a) => a.is_completed).length;
      const totalCount = updatedAll.length;

      return {
        ...prev,
        all_actions: updatedAll,
        fertilizer_timeline: updatedFert,
        spray_timeline: updatedSpray,
        progress: {
          total_tasks: totalCount,
          completed_tasks: completedCount,
          percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
        }
      };
    });

    // If plot exists in database, persist to backend
    if (currentPlotId) {
      try {
        await togglePlotTask(currentPlotId, taskId, newStatus);
      } catch (err) {
        console.error("Failed to toggle plot task:", err);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Selected crop helpers
  const matchedCrop = POPULAR_CROPS.find(
    (c) => c.name_bn === formData.crop_name || c.id === formData.crop_name
  ) || POPULAR_CROPS[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-emerald-700/40 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Sprout className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  {lang === 'bn' ? 'ফসলের পরিচর্যা ও পরামর্শ সময়সূচী' : 'Crop Care & Advisory Schedule'}
                </h2>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                  BRRI & BARI AI
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                {lang === 'bn' 
                  ? 'রোপণের তারিখ ও মাটির ধরন অনুযায়ী সার, স্প্রে ও সেচের সুনির্দিষ্ট পরামর্শ' 
                  : 'Tailored fertilizer dosages, spray schedule & irrigation roadmap'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!showInputForm && advisoryData && (
              <button
                onClick={() => setShowInputForm(true)}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/20 cursor-pointer"
                title={lang === 'bn' ? 'তথ্য পরিবর্তন করুন' : 'Edit Input'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'তথ্য বদলান' : 'Change Crop'}</span>
              </button>
            )}

            {!showInputForm && advisoryData && (
              <button
                onClick={handlePrint}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/20 cursor-pointer"
                title={lang === 'bn' ? 'প্রিন্ট বা পিডিএফ সেভ' : 'Print Advisory'}
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* MODE 1: Input / Entry Form */}
          {showInputForm ? (
            <form onSubmit={handleGenerateAdvisory} className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 space-y-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {lang === 'bn' ? '১. আপনার ফসলের প্রাথমিক তথ্য দিন' : '1. Enter Crop Details'}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'bn' 
                    ? 'ফসল ও রোপণের তারিখ সিলেক্ট করলে সিস্টেম স্বয়ংক্রিয়ভাবে হিসাব করে বলে দেবে আজ ফসলের কত দিন বয়স, কখন কোন সার দিতে হবে এবং কোন স্প্রে বা কীটনাশক প্রয়োগ করতে হবে।'
                    : 'Select crop, sowing date, and soil type to receive an actionable day-by-day care calendar.'}
                </p>
              </div>

              {/* Step 1: Crop Selection with Visual Chips */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between">
                  <span>{lang === 'bn' ? 'ফসলের ধরন নির্বাচন করুন *' : 'Select Crop *'}</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">{formData.crop_name}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {POPULAR_CROPS.map((crop) => {
                    const isSelected = formData.crop_name === crop.name_bn || formData.crop_name === crop.id;
                    return (
                      <button
                        type="button"
                        key={crop.id}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            crop_name: crop.name_bn,
                            crop_variety: crop.varieties[0] || ''
                          }));
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center space-x-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-700/20 ring-2 ring-emerald-500/30'
                            : 'bg-slate-50 hover:bg-emerald-50 text-slate-800 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <span className="text-xl">{crop.icon}</span>
                        <div>
                          <span className="text-xs sm:text-sm font-bold block leading-tight">{crop.name_bn}</span>
                          <span className={`text-[10px] block ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>{crop.name_en}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Sowing Date & Variety */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sowing Date */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'bn' ? 'কবে লাগিয়েছেন বা রোপণ করেছেন? *' : 'Planting / Sowing Date *'}</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.planting_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, planting_date: e.target.value }))}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, planting_date: new Date().toISOString().split('T')[0] }))}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                    >
                      {lang === 'bn' ? 'আজকে' : 'Today'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 15);
                        setFormData((prev) => ({ ...prev, planting_date: d.toISOString().split('T')[0] }));
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                    >
                      {lang === 'bn' ? '১৫ দিন আগে' : '15d ago'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 30);
                        setFormData((prev) => ({ ...prev, planting_date: d.toISOString().split('T')[0] }));
                      }}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                    >
                      {lang === 'bn' ? '৩০ দিন আগে' : '30d ago'}
                    </button>
                  </div>
                </div>

                {/* Seed Variety (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between">
                    <span>{lang === 'bn' ? 'বীজ বা জাতের নাম (ঐচ্ছিক)' : 'Seed Variety / Name (Optional)'}</span>
                    <span className="text-[11px] text-slate-400 font-normal">{lang === 'bn' ? 'যেমন ব্রি ধান ৪৯' : 'e.g. BRRI 49'}</span>
                  </label>
                  <input
                    type="text"
                    value={formData.crop_variety}
                    onChange={(e) => setFormData((prev) => ({ ...prev, crop_variety: e.target.value }))}
                    placeholder={lang === 'bn' ? 'বীজের জাত বা ব্র্যান্ড লিখুন...' : 'Enter seed variety...'}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  {/* Quick Variety suggestions */}
                  {matchedCrop?.varieties && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {matchedCrop.varieties.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, crop_variety: v }))}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            formData.crop_variety === v
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Soil Type & Land Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Soil Type */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-800">
                    {lang === 'bn' ? 'ক্ষেতের মাটির ধরন *' : 'Soil Type *'}
                  </label>
                  <select
                    value={formData.soil_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, soil_type: e.target.value }))}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    {SOIL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label_bn}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-emerald-700 italic">
                    💡 {SOIL_OPTIONS.find((s) => s.value === formData.soil_type)?.tip_bn}
                  </p>
                </div>

                {/* Land Area & Unit */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-800">
                    {lang === 'bn' ? 'জমির পরিমাণ ও একক *' : 'Land Size & Unit *'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={formData.area_value}
                      onChange={(e) => setFormData((prev) => ({ ...prev, area_value: e.target.value }))}
                      className="w-1/2 bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                    <select
                      value={formData.area_unit}
                      onChange={(e) => setFormData((prev) => ({ ...prev, area_unit: e.target.value }))}
                      className="w-1/2 bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="bigha">{lang === 'bn' ? 'বিঘা (৩৩ শতক)' : 'Bigha (33 Dec)'}</option>
                      <option value="decimal">{lang === 'bn' ? 'শতক / শতাংশ' : 'Decimal / Shatak'}</option>
                      <option value="katha">{lang === 'bn' ? 'কাঠা (১.৬৫ শতক)' : 'Katha (1.65 Dec)'}</option>
                      <option value="acre">{lang === 'bn' ? 'একর (১০০ শতক)' : 'Acre (100 Dec)'}</option>
                    </select>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {lang === 'bn' ? 'সারের মোট পরিমাণ এই পরিমাপ অনুযায়ী হিসাব হবে।' : 'Fertilizer doses will scale to this exact area.'}
                  </span>
                </div>
              </div>

              {/* Step 4: Irrigation & Save Option */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-800">
                    {lang === 'bn' ? 'সেচের প্রধান ব্যবস্থা' : 'Irrigation Source'}
                  </label>
                  <select
                    value={formData.irrigation_source}
                    onChange={(e) => setFormData((prev) => ({ ...prev, irrigation_source: e.target.value }))}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="গভীর নলকূপ">{lang === 'bn' ? 'গভীর নলকূপ (Deep Tubewell)' : 'Deep Tubewell'}</option>
                    <option value="অগভীর নলকূপ / শ্যালো">{lang === 'bn' ? 'অগভীর নলকূপ / শ্যালো মেশিন' : 'Shallow Tubewell'}</option>
                    <option value="বৃষ্টি নির্ভর">{lang === 'bn' ? 'বৃষ্টি নির্ভর (Rainfed)' : 'Rainfed'}</option>
                    <option value="নদী / খাল / পুকুর">{lang === 'bn' ? 'নদী / খাল / পুকুর থেকে সেচ' : 'Canal / River / Pond'}</option>
                  </select>
                </div>

                {/* Plot Name (if saving) */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-800">
                    {lang === 'bn' ? 'প্লটের নাম (জমির মাঠের পরিচিতি)' : 'Plot / Field Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.plot_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, plot_name: e.target.value }))}
                    placeholder={lang === 'bn' ? 'যেমন: পূর্বের মাঠ, নদীর পাড়...' : 'Field Name...'}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Checkbox to save */}
              {!currentPlotId && (
                <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="checkbox"
                    id="savePlotCheck"
                    checked={saveToPlotsCheckbox}
                    onChange={(e) => setSaveToPlotsCheckbox(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="savePlotCheck" className="text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer">
                    {lang === 'bn' 
                      ? 'এই ফসলটি আমার "জমির প্লট" তালিকায় স্থায়ীভাবে যুক্ত রাখুন (যাতে পরে চেকলিস্ট ও স্যাটেলাইট ভিউ পাওয়া যায়)' 
                      : 'Save this crop entry to my Plots list for ongoing monitoring and task tracking'}
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-700/25 flex items-center justify-center space-x-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{lang === 'bn' ? 'কৃষি পরামর্শ প্রস্তুত হচ্ছে...' : 'Generating Advisory...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-emerald-200" />
                      <span>{lang === 'bn' ? 'সার ও স্প্রে পরামর্শ সময়সূচী দেখুন' : 'Generate Care & Spray Roadmap'}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* MODE 2: Output Advisory Dashboard */
            advisoryData && (
              <div className="space-y-6">
                
                {/* 1. Executive Summary & Growth Stage Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-64 h-full bg-radial-gradient from-emerald-500/15 to-transparent pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-xl">🌾</span>
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                          {advisoryData.crop.name_bn}
                        </h3>
                        {advisoryData.crop.crop_variety && (
                          <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-mono font-medium">
                            {advisoryData.crop.crop_variety}
                          </span>
                        )}
                        <span className="text-xs bg-white/10 text-slate-300 border border-white/15 px-2.5 py-0.5 rounded-full font-medium">
                          {toBanglaDigits(advisoryData.planting_info.total_decimals, lang)} {lang === 'bn' ? 'শতক' : 'Dec'} ({toBanglaDigits(advisoryData.planting_info.total_bigha, lang)} {lang === 'bn' ? 'বিঘা' : 'Bigha'})
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-300 flex-wrap gap-y-1">
                        <span>
                          {lang === 'bn' ? 'রোপণ: ' : 'Sowing: '} 
                          <b className="text-white font-mono">{advisoryData.planting_info.planting_date}</b>
                        </span>
                        <span>•</span>
                        <span>
                          {lang === 'bn' ? 'মাটি: ' : 'Soil: '} 
                          <b className="text-emerald-300">{advisoryData.planting_info.soil_type}</b>
                        </span>
                        <span>•</span>
                        <span>
                          {lang === 'bn' ? 'সেচ: ' : 'Irrigation: '} 
                          <b className="text-white">{advisoryData.planting_info.irrigation_source}</b>
                        </span>
                      </div>

                      {/* Current Stage Badge */}
                      <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 mt-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-300">
                            {lang === 'bn' ? 'বর্তমান বৃদ্ধির পর্যায়' : 'Current Growth Stage'}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                            {lang === 'bn' ? 'বয়স: ' : 'Age: '}{toBanglaDigits(advisoryData.planting_info.days_after_sowing, lang)} {lang === 'bn' ? 'দিন' : 'Days'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white">
                          {advisoryData.planting_info.current_stage?.name_bn}
                        </h4>
                        <p className="text-xs text-slate-300">
                          {advisoryData.planting_info.current_stage?.desc_bn}
                        </p>
                      </div>
                    </div>

                    {/* Progress Circle & Audio Button */}
                    <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <AudioSpeakerButton
                          text={advisoryData.audio_summary_bn}
                          size={18}
                          className="bg-white/15 hover:bg-white/25 text-white border-white/20 shadow-md"
                        />
                        <span className="text-xs text-emerald-300 font-semibold">
                          {lang === 'bn' ? 'পরামর্শ শুনুন' : 'Listen'}
                        </span>
                      </div>

                      {/* Progress Stats */}
                      <div className="text-left md:text-right">
                        <span className="text-[11px] text-slate-300 block">
                          {lang === 'bn' ? 'পরিচর্যা সম্পন্ন:' : 'Tasks Completed:'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-emerald-400">
                            {toBanglaDigits(advisoryData.progress.completed_tasks, lang)} / {toBanglaDigits(advisoryData.progress.total_tasks, lang)}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            ({toBanglaDigits(advisoryData.progress.percentage, lang)}%)
                          </span>
                        </div>
                        <div className="w-32 bg-slate-700 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-600">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500" 
                            style={{ width: `${advisoryData.progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Urgent Next Action Alert Banner */}
                {advisoryData.next_action && (
                  <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                    advisoryData.next_action.days_remaining <= 0
                      ? 'bg-amber-50/90 border-amber-300 text-amber-900'
                      : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className={`p-2.5 rounded-xl border mt-0.5 ${
                        advisoryData.next_action.days_remaining <= 0
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {advisoryData.next_action.type === 'spray' ? (
                          <ShieldAlert className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                            advisoryData.next_action.days_remaining <= 0
                              ? 'bg-amber-200 text-amber-900 border-amber-400'
                              : 'bg-emerald-200 text-emerald-900 border-emerald-300'
                          }`}>
                            {advisoryData.next_action.days_remaining === 0
                              ? (lang === 'bn' ? '⚠️ আজকের করণীয়' : '⚠️ Due Today')
                              : advisoryData.next_action.days_remaining < 0
                              ? (lang === 'bn' ? '🚨 অতিক্রান্ত কাজ' : '🚨 Overdue')
                              : (lang === 'bn' ? `⏰ আর ${toBanglaDigits(advisoryData.next_action.days_remaining, lang)} দিন পর (${advisoryData.next_action.target_date})` : `⏰ In ${advisoryData.next_action.days_remaining} Days`)}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {lang === 'bn' ? 'রোপণের ' : 'DAS: '}{toBanglaDigits(advisoryData.next_action.day_after_sowing, lang)} {lang === 'bn' ? 'তম দিনে' : 'th day'}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                          {advisoryData.next_action.title_bn}
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
                          {advisoryData.next_action.instructions_bn}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleTask(advisoryData.next_action.task_id, advisoryData.next_action.is_completed)}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-auto flex-shrink-0 cursor-pointer ${
                        advisoryData.next_action.is_completed
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-xs'
                      }`}
                    >
                      {advisoryData.next_action.is_completed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>{lang === 'bn' ? 'সম্পন্ন হয়েছে' : 'Done'}</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-slate-400" />
                          <span>{lang === 'bn' ? 'সম্পন্ন হিসেবে চিহ্নিত করুন' : 'Mark Done'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* 3. Navigation Tabs */}
                <div className="flex items-center space-x-1 border-b border-slate-200 pb-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'সব সময়সূচী' : 'All Timeline'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 ml-1">
                      {advisoryData.all_actions.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('fertilizer')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                      activeTab === 'fertilizer'
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Beaker className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'সার প্রয়োগের তালিকা' : 'Fertilizer Schedule'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 ml-1">
                      {advisoryData.fertilizer_timeline.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('spray')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                      activeTab === 'spray'
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'কীটনাশক ও স্প্রে গাইড' : 'Spray & Pest Guide'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 ml-1">
                      {advisoryData.spray_timeline.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('irrigation')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                      activeTab === 'irrigation'
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Droplets className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'সেচ ও পানি ব্যবস্থাপনা' : 'Irrigation Guide'}</span>
                  </button>
                </div>

                {/* TAB 1: ALL ACTIONS TIMELINE */}
                {activeTab === 'all' && (
                  <div className="space-y-4">
                    <div className="relative border-l-2 border-emerald-300 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6">
                      {advisoryData.all_actions.map((act) => {
                        const isFert = act.type === 'fertilizer';
                        return (
                          <div 
                            key={act.task_id} 
                            className={`glass-card rounded-2xl p-4 sm:p-5 border transition-all relative ${
                              act.is_completed
                                ? 'bg-slate-50/80 border-slate-200 opacity-75'
                                : act.days_remaining === 0
                                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-md'
                                : act.days_remaining < 0
                                ? 'bg-rose-50/40 border-rose-200'
                                : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
                            }`}
                          >
                            {/* Circle Node on Timeline */}
                            <div className={`absolute -left-[25px] sm:-left-[33px] top-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              act.is_completed 
                                ? 'bg-emerald-600 border-white text-white shadow-sm' 
                                : isFert 
                                ? 'bg-teal-500 border-white text-white' 
                                : 'bg-amber-500 border-white text-white'
                            }`}>
                              {act.is_completed ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">{toBanglaDigits(act.day_after_sowing, lang)}</span>}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center space-x-2 flex-wrap">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${
                                    isFert ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}>
                                    {isFert ? (lang === 'bn' ? 'সার প্রয়োগ' : 'Fertilizer') : (lang === 'bn' ? 'স্প্রে ও ঔষধ' : 'Spray & Medicine')}
                                  </span>

                                  <span className="text-xs font-mono font-semibold text-slate-500">
                                    {lang === 'bn' ? 'দিন ' : 'Day '}{toBanglaDigits(act.day_after_sowing, lang)} ({act.target_date})
                                  </span>

                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    act.is_completed
                                      ? 'bg-slate-200 text-slate-700'
                                      : act.days_remaining === 0
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : act.days_remaining < 0
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {act.is_completed 
                                      ? (lang === 'bn' ? 'সম্পন্ন' : 'Completed') 
                                      : act.days_remaining === 0 
                                      ? (lang === 'bn' ? 'আজকের কাজ' : 'Due Today') 
                                      : act.days_remaining < 0 
                                      ? (lang === 'bn' ? 'সময় পার হয়েছে' : 'Past Due') 
                                      : (lang === 'bn' ? `আর ${toBanglaDigits(act.days_remaining, lang)} দিন বাকি` : `In ${act.days_remaining}d`)}
                                  </span>
                                </div>

                                <h4 className={`text-sm sm:text-base font-bold ${act.is_completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                  {act.title_bn}
                                </h4>

                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {act.instructions_bn}
                                </p>

                                {/* Fertilizer Items list if present */}
                                {act.items && (
                                  <div className="flex flex-wrap gap-2 pt-1.5">
                                    {act.items.map((it, idx) => (
                                      <span key={idx} className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                                        <strong>{it.name_bn}:</strong> {toBanglaDigits(it.amount_kg, lang)} {it.unit}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Spray details if present */}
                                {act.medicines_bn && (
                                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs space-y-1 mt-2">
                                    <div>
                                      <strong className="text-amber-900">{lang === 'bn' ? 'প্রস্তাবিত ঔষধ:' : 'Medicine:'} </strong>
                                      <span className="text-slate-800 font-semibold">{act.medicines_bn}</span>
                                    </div>
                                    <div>
                                      <strong className="text-amber-900">{lang === 'bn' ? 'প্রয়োগের সঠিক মাত্রা:' : 'Dosage:'} </strong>
                                      <span className="text-slate-800">{act.dosage_bn}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Task Checkbox Button */}
                              <button
                                onClick={() => handleToggleTask(act.task_id, act.is_completed)}
                                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all self-start flex-shrink-0 cursor-pointer ${
                                  act.is_completed
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                }`}
                              >
                                {act.is_completed ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                    <span>{lang === 'bn' ? 'সম্পন্ন' : 'Done'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Circle className="w-4 h-4 text-slate-400" />
                                    <span>{lang === 'bn' ? 'টিক দিন' : 'Mark Done'}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: FERTILIZER SCHEDULE ONLY */}
                {activeTab === 'fertilizer' && (
                  <div className="space-y-6">
                    {/* Total Fertilizer Requirements Breakdown Cards */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                          <Beaker className="w-4 h-4 text-teal-600" />
                          <span>
                            {lang === 'bn' ? `আপনার ${toBanglaDigits(advisoryData.planting_info.total_decimals, lang)} শতক (${toBanglaDigits(advisoryData.planting_info.total_bigha, lang)} বিঘা) জমির জন্য মোট প্রয়োজনীয় সার:` : 'Total Fertilizer Needed:'}
                          </span>
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                        {Object.entries(advisoryData.total_fertilizer_requirement || {}).map(([key, val]) => {
                          const nameMap = {
                            urea: lang === 'bn' ? 'ইউরিয়া (Urea)' : 'Urea',
                            tsp: lang === 'bn' ? 'টিএসপি / ডিএপি' : 'TSP / DAP',
                            mop: lang === 'bn' ? 'এমওপি (পটাশ)' : 'MOP (Potash)',
                            gypsum: lang === 'bn' ? 'জিপসাম' : 'Gypsum',
                            zinc_sulfate: lang === 'bn' ? 'জিংক সালফেট' : 'Zinc Sulfate',
                            boron: lang === 'bn' ? 'বোরন' : 'Boron',
                            cowdung: lang === 'bn' ? 'গোবর / কম্পোস্ট' : 'Organic Manure'
                          };
                          return (
                            <div key={key} className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-center space-y-0.5">
                              <span className="text-[11px] text-teal-800 font-semibold block leading-tight">
                                {nameMap[key] || key}
                              </span>
                              <strong className="text-base sm:text-lg font-bold text-teal-900 block font-mono">
                                {toBanglaDigits(val, lang)} {lang === 'bn' ? 'কেজি' : 'KG'}
                              </strong>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Soil Type Guidance Alert */}
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start space-x-3 text-xs sm:text-sm text-emerald-900">
                      <Info className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">
                          {advisoryData.planting_info.soil_advice?.name_bn} {lang === 'bn' ? 'এর জন্য বিশেষ পরামর্শ:' : 'Tips:'}
                        </strong>
                        <p className="mt-0.5 leading-relaxed text-emerald-800">
                          {advisoryData.planting_info.soil_advice?.irrigation_note_bn}
                        </p>
                      </div>
                    </div>

                    {/* Step-by-Step Fertilizer Timeline */}
                    <div className="space-y-4">
                      {advisoryData.fertilizer_timeline.map((plan, idx) => (
                        <div 
                          key={plan.task_id} 
                          className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 bg-white shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                                {toBanglaDigits(idx + 1, lang)}
                              </span>
                              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                                {plan.title_bn}
                              </h4>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-slate-500 font-mono">
                                {lang === 'bn' ? 'তারিখ: ' : 'Date: '}{plan.target_date} ({lang === 'bn' ? 'দিন ' : 'Day '}{toBanglaDigits(plan.day_after_sowing, lang)})
                              </span>
                              <button
                                onClick={() => handleToggleTask(plan.task_id, plan.is_completed)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  plan.is_completed ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                {plan.is_completed ? (lang === 'bn' ? '✓ সম্পন্ন' : '✓ Done') : (lang === 'bn' ? 'টিক দিন' : 'Mark Done')}
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed">
                            {plan.instructions_bn}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                            {plan.items?.map((it, i) => (
                              <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700">{it.name_bn}</span>
                                <strong className="text-teal-800 font-bold font-mono">
                                  {toBanglaDigits(it.amount_kg, lang)} {it.unit}
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: SPRAY & MEDICINES ONLY */}
                {activeTab === 'spray' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                      <strong className="block font-bold">
                        ⚠️ {lang === 'bn' ? 'স্প্রে করার সঠিক নিয়ম ও নিরাপত্তা সতর্কতা:' : 'Safe Spraying Guidelines:'}
                      </strong>
                      <p className="leading-relaxed">
                        {lang === 'bn' 
                          ? 'সবসময় রোদ থাকা অবস্থায় বিকেল ৩টার পর স্প্রে করুন (সকালে পরাগায়নে মৌমাছির ক্ষতি হয়)। বাতাসের অনুকূলে স্প্রে করুন। বৃষ্টির সম্ভাবনা থাকলে বা পাতা ভেজা থাকলে স্প্রে স্থগিত রাখুন। স্প্রে শেষে সাবান দিয়ে হাত-মুখ ধুয়ে নিন।'
                          : 'Always spray after 3 PM when foliage is dry to protect pollinators. Do not spray during windy or rainy weather.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {advisoryData.spray_timeline.map((sp) => (
                        <div 
                          key={sp.task_id} 
                          className="glass-card rounded-2xl p-5 border border-slate-200 bg-white shadow-xs space-y-3.5 flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                {lang === 'bn' ? 'দিন ' : 'Day '}{toBanglaDigits(sp.day_after_sowing, lang)} ({sp.target_date})
                              </span>
                              <button
                                onClick={() => handleToggleTask(sp.task_id, sp.is_completed)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  sp.is_completed ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border'
                                }`}
                              >
                                {sp.is_completed ? (lang === 'bn' ? '✓ সম্পন্ন' : '✓ Done') : (lang === 'bn' ? 'টিক দিন' : 'Mark Done')}
                              </button>
                            </div>

                            <h4 className="text-base font-bold text-slate-900">
                              {sp.title_bn}
                            </h4>

                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                              <span className="text-slate-500 block text-[11px] font-semibold">{lang === 'bn' ? 'লক্ষ্য রোগ / পোকা:' : 'Target Pest:'}</span>
                              <strong className="text-slate-900">{sp.target_pest_bn}</strong>
                            </div>

                            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs space-y-1">
                              <span className="text-blue-900 block font-bold text-[11px]">{lang === 'bn' ? 'অনুমোদিত ঔষধ ও বাণিজ্যিক নাম:' : 'Medicine:'}</span>
                              <p className="text-blue-950 font-semibold">{sp.medicines_bn}</p>
                              <div className="pt-1 border-t border-blue-200/60 mt-1">
                                <span className="text-blue-900 font-bold">{lang === 'bn' ? 'প্রয়োগ মাত্রা: ' : 'Dosage: '}</span>
                                <span className="text-slate-800">{sp.dosage_bn}</span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed">
                              {sp.instructions_bn}
                            </p>
                          </div>

                          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span>{lang === 'bn' ? 'প্রস্তাবিত মোট পানি:' : 'Water:'} <strong>{toBanglaDigits(sp.water_liters_recommended, lang)} {lang === 'bn' ? 'লিটার' : 'L'}</strong></span>
                            <span className="text-emerald-700 font-semibold">BRRI / BARI Certified</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: IRRIGATION GUIDE ONLY */}
                {activeTab === 'irrigation' && (
                  <div className="space-y-4">
                    <div className="glass-card rounded-2xl p-5 border border-slate-200 bg-white space-y-4">
                      <div className="flex items-center space-x-2">
                        <Droplets className="w-5 h-5 text-sky-600" />
                        <h4 className="text-base font-bold text-slate-900">
                          {lang === 'bn' ? 'সেচ ও পানি নিষ্কাশনের বিশেষ নির্দেশনা' : 'Irrigation & Drainage Roadmap'}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {advisoryData.irrigation_plan?.map((ir, idx) => (
                          <div key={idx} className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-200 flex items-start space-x-2.5 text-xs">
                            <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                              {toBanglaDigits(idx + 1, lang)}
                            </span>
                            <span className="text-slate-800 leading-relaxed font-medium">
                              {ir.title_bn}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <strong className="text-slate-900 block font-bold">
                          {lang === 'bn' ? '💡 পানি সাশ্রয়ী এডব্লিউডি (AWD) পদ্ধতি:' : '💡 AWD Method:'}
                        </strong>
                        <p className="text-slate-600 leading-relaxed">
                          {lang === 'bn'
                            ? 'মাটিতে সবসময় পানি জমিয়ে না রেখে জমিতে ছিদ্রযুক্ত প্লাস্টিক পাইপ বসিয়ে পানির স্তর পর্যবেক্ষণ করুন। পাইপের ভেতরে পানি মাটি থেকে ৫ সেমি নিচে নেমে গেলে তবেই সেচ দিন। এতে ২০-২৫% পানি ও বিদ্যুৎ/ডিজেল খরচ সাশ্রয় হয়।'
                            : 'Alternate Wetting and Drying (AWD) saves up to 25% irrigation water without reducing yield.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )
          )}

        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Crop Care — NASA Space Apps Challenge 2026
          </span>

          <div className="flex items-center space-x-2">
            {!showInputForm && (
              <button
                onClick={() => setShowInputForm(true)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                {lang === 'bn' ? 'নতুন এন্ট্রি / এডিট' : 'Edit Input'}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
