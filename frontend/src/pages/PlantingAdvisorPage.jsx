import React, { useState, useEffect } from 'react';
import { fetchPlantingAdvice, fetchCropsList, fetchNasaClimatology } from '../utils/api';
import { 
  Calendar, CloudSun, AlertTriangle, CheckCircle2, Droplets, Sparkles, 
  TrendingUp, Info, Loader2, Gauge, Sun, ShieldAlert, Award, ArrowRight,
  Compass, BarChart3, ChevronRight, Check, Zap, HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, AreaChart, Area, Bar, Line, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceDot 
} from 'recharts';
import { AudioSpeakerButton } from '../components/AudioSpeakerButton';
import { toBanglaDigits } from '../utils/banglaNumbers';
import { useLanguage } from '../contexts/LanguageContext';

export const PlantingAdvisorPage = () => {
  const { lang, t } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('aman_rice');
  const [plantingDate, setPlantingDate] = useState('2026-07-20');
  const [adviceData, setAdviceData] = useState(null);
  const [climatologyData, setClimatologyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingDate, setUpdatingDate] = useState(false);

  // Default optimal dates per crop
  const defaultDates = {
    aman_rice: '2026-07-20',
    boro_rice: '2026-12-25',
    potato: '2026-11-10',
    mustard: '2026-10-28',
    maize: '2026-11-15'
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const [cList, clim] = await Promise.all([
          fetchCropsList(),
          fetchNasaClimatology()
        ]);
        setCrops(cList);
        setClimatologyData(clim);
        
        const adv = await fetchPlantingAdvice('aman_rice', '2026-07-20');
        setAdviceData(adv);
      } catch (e) {
        console.error("Error loading advisor data:", e);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleCropChange = async (cropId) => {
    setSelectedCrop(cropId);
    const targetDate = defaultDates[cropId] || '2026-07-20';
    setPlantingDate(targetDate);
    setLoading(true);
    try {
      const adv = await fetchPlantingAdvice(cropId, targetDate);
      setAdviceData(adv);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (dateVal) => {
    setPlantingDate(dateVal);
    setUpdatingDate(true);
    try {
      const adv = await fetchPlantingAdvice(selectedCrop, dateVal);
      setAdviceData(adv);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingDate(false);
    }
  };

  // Climatology chart data
  const monthLabelsBn = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
  const monthLabelsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLabels = lang === 'bn' ? monthLabelsBn : monthLabelsEn;

  const climChartData = climatologyData?.monthly?.map((m, idx) => ({
    name: monthLabels[idx],
    rain_mm: m.rain_mm,
    temp_c: m.temp_c,
    soil_moisture: Math.round(m.soil_moisture * 100)
  })) || [];

  const scoring = adviceData?.scoring || {};
  const overallScore = scoring.overall_score || 0;
  const pillars = scoring.pillars || {};

  // Color helper based on suitability score for white background
  const getScoreColor = (score) => {
    if (score >= 90) return { bg: 'from-emerald-50 to-emerald-100/60', text: 'text-emerald-700', border: 'border-emerald-300', badge: 'bg-emerald-100 text-emerald-800' };
    if (score >= 75) return { bg: 'from-sky-50 to-sky-100/60', text: 'text-sky-700', border: 'border-sky-300', badge: 'bg-sky-100 text-sky-800' };
    if (score >= 65) return { bg: 'from-amber-50 to-amber-100/60', text: 'text-amber-800', border: 'border-amber-300', badge: 'bg-amber-100 text-amber-800' };
    return { bg: 'from-rose-50 to-rose-100/60', text: 'text-rose-700', border: 'border-rose-300', badge: 'bg-rose-100 text-rose-800' };
  };

  const scoreTheme = getScoreColor(overallScore);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide">
              {t.advisor.title}
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              NASA Climatology Model 2.0
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
              Optimal Sowing Index (OSI)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
            {t.advisor.subtitle}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {adviceData?.best_window?.rationale_bn && (
            <AudioSpeakerButton 
              text={lang === 'bn' 
                ? `সেরা রোপণ সময়: ${adviceData?.best_window?.window_text_bn}। ${adviceData?.best_window?.rationale_bn}`
                : `Optimal planting window: ${adviceData?.best_window?.window_text_bn}. ${adviceData?.best_window?.rationale_bn}`
              } 
              size={20}
              className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs border border-slate-200"
            />
          )}
        </div>
      </div>

      {/* Interactive Crop & Date Selector Bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 bg-white shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Crop Selection */}
        <div className="md:col-span-6">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <span>🌾 {t.advisor.selectCrop}:</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {crops.map((c) => {
              const isSelected = selectedCrop === c.id;
              const cropName = lang === 'bn' ? c.name_bn : c.name_en;
              return (
                <button
                  key={c.id}
                  onClick={() => handleCropChange(c.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-left border ${
                    isSelected 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold truncate">{cropName}</div>
                  <div className={`text-[10px] font-normal ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {toBanglaDigits(c.duration, lang)} {lang === 'bn' ? 'দিন মেয়াদী' : 'Days'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Selector & Simulation */}
        <div className="md:col-span-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{t.advisor.changeDate}:</span>
            </label>
            {updatingDate && (
              <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
                <Loader2 className="w-3 h-3 animate-spin" /> {lang === 'bn' ? 'হিসাব হচ্ছে...' : 'Calculating...'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={plantingDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="flex-1 bg-white text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleDateChange(defaultDates[selectedCrop] || '2026-07-20')}
              className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 shadow-xs"
              title={lang === 'bn' ? "সেরা তারিখে সেট করুন" : "Set to optimal date"}
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              {t.advisor.goldenDate}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {lang === 'bn' 
              ? '💡 তারিখ বদলিয়ে দেখুন কখন ফলন ও ক্লাইমেট স্কোর সর্বোচ্চ থাকে।'
              : '💡 Change the date to see when yield and climate score reach peak.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center space-y-3 bg-white border-slate-200">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-600 font-medium">
            {lang === 'bn' 
              ? 'নাসা ক্লাইমেট মডেল ও ফসলের সময়সূচী বিশ্লেষণ হচ্ছে...'
              : 'Analyzing NASA climate models & crop timelines...'}
          </p>
        </div>
      ) : adviceData && (
        <>
          {/* TOP HIGHLIGHT: NASA Optimal Sowing Index (OSI) Hero Card */}
          <div className={`glass-card rounded-2xl p-5 sm:p-6 border ${scoreTheme.border} bg-gradient-to-br ${scoreTheme.bg} shadow-sm space-y-5 relative overflow-hidden`}>
            {/* Ambient Background Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-600">
                    {lang === 'bn' ? 'নির্বাচিত তারিখের স্থিতি' : 'Selected Date Status'} ({adviceData.selected_sowing_date})
                  </span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${scoreTheme.border} ${scoreTheme.badge}`}>
                    {scoring.risk_tag}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {lang === 'bn' ? adviceData.crop_name_bn : (crops.find(c => c.id === selectedCrop)?.name_en || adviceData.crop_name_bn)} — {scoring.suitability_level}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {lang === 'bn' 
                    ? `জীবনকাল: ${toBanglaDigits(adviceData.duration_days, lang)} দিন | আনুমানিক ফুল ফোটা: ${adviceData.estimated_flowering_date} | ফসল কর্তন: ${adviceData.estimated_harvest_date}`
                    : `Lifecycle: ${adviceData.duration_days} Days | Est. Flowering: ${adviceData.estimated_flowering_date} | Harvest: ${adviceData.estimated_harvest_date}`}
                </p>
              </div>

              {/* Overall Score Circle & Potential Yield */}
              <div className="flex items-center gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs self-start md:self-auto">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t.advisor.suitabilityScore}</div>
                  <div className={`text-3xl sm:text-4xl font-black ${scoreTheme.text} font-mono`}>
                    {toBanglaDigits(overallScore, lang)}%
                  </div>
                </div>
                <div className="h-10 w-px bg-slate-200"></div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t.advisor.yieldPotential}</div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono flex items-center justify-center gap-1">
                    {toBanglaDigits(scoring.yield_potential_percent || 95, lang)}%
                    <span className="text-xs text-emerald-700 font-semibold">{lang === 'bn' ? 'পিক' : 'Peak'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Pillars of NASA Suitability */}
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-emerald-600" />
                <span>{t.advisor.fourPillars}:</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Rainfall Safety */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                    <span className="flex items-center gap-1">🌧️ {lang === 'bn' ? 'বৃষ্টি ও প্লাবন সুরক্ষা' : 'Rainfall & Flood Safety'}</span>
                    <span className="font-mono font-bold text-sky-600">{toBanglaDigits(pillars.rainfall_safety, lang)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${pillars.rainfall_safety}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-0.5">
                    {lang === 'bn' ? 'অতিবৃষ্টি ও জলাবদ্ধতার ঝুঁকি এড়ানো' : 'Flood & waterlogging risk avoidance'}
                  </p>
                </div>

                {/* 2. Soil Moisture */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                    <span className="flex items-center gap-1">🌱 {lang === 'bn' ? 'মাটির আর্দ্রতা অনুকূল' : 'Soil Moisture'}</span>
                    <span className="font-mono font-bold text-emerald-600">{toBanglaDigits(pillars.soil_moisture, lang)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pillars.soil_moisture}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-0.5">
                    {lang === 'bn' ? 'শিকড় স্থাপন ও বীজের অঙ্কুরোদগম' : 'Root establishment & germination'}
                  </p>
                </div>

                {/* 3. Solar Radiation */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                    <span className="flex items-center gap-1">☀️ {lang === 'bn' ? 'সৌর বিকিরণ ও সূর্যালোক' : 'Solar Radiation'}</span>
                    <span className="font-mono font-bold text-amber-600">{toBanglaDigits(pillars.solar_radiation, lang)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${pillars.solar_radiation}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-0.5">
                    {lang === 'bn' ? 'সালোকসংশ্লেষণ ও দানার পুষ্টতা' : 'Photosynthesis & grain filling'}
                  </p>
                </div>

                {/* 4. Thermal Comfort */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                    <span className="flex items-center gap-1">🌡️ {lang === 'bn' ? 'তাপীয় স্বস্তি ও হিট শক রোধ' : 'Thermal Stability'}</span>
                    <span className="font-mono font-bold text-indigo-600">{toBanglaDigits(pillars.thermal_comfort, lang)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${pillars.thermal_comfort}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-0.5">
                    {lang === 'bn' ? 'ফুল ফোটার সময়ে তাপমাত্রার স্থিতিশীলতা' : 'Flowering temperature comfort'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* NOVELTY VISUAL 1: Interactive Season Suitability Heatmap & Curve */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 bg-white space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  মৌসুমের সেরা রোপণ উইন্ডো ও উপযোগিতা কার্ভ (Suitability Curve)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  নিচের গ্রাফে নাসার ডেটা অনুযায়ী পুরো মৌসুমের কোন তারিখে স্কোর কত তা দেখানো হয়েছে। ৯০%+ চিহ্নিত অংশটি হলো <strong className="text-emerald-700">গোল্ডেন উইন্ডো (Golden Window)</strong>।
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  গোল্ডেন জোন (৯০-১০০%)
                </span>
              </div>
            </div>

            {/* Suitability Curve Chart */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={adviceData.suitability_curve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="display_date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis domain={[40, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} label={{ value: 'স্কোর (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs space-y-1">
                            <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-3">
                              <span>তারিখ: {data.display_date}</span>
                              <span className={data.is_golden ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                                {data.is_golden ? '🌟 গোল্ডেন উইন্ডো' : 'স্বাভাবিক'}
                              </span>
                            </div>
                            <div className="text-emerald-700 font-bold text-sm">স্কোর: {toBanglaDigits(data.score)}%</div>
                            <div className="text-slate-600">ঝুঁকি স্ট্যাটাস: {data.risk_label}</div>
                            <div className="text-slate-400 text-[10px] pt-1">বৃষ্টি নিরাপত্তা: {toBanglaDigits(data.rainfall_safety)}% | সৌরশক্তি: {toBanglaDigits(data.solar_radiation)}%</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#scoreGradient)" name="স্কোর (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Date Selector Chips from the Curve */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-700 font-semibold mb-2">দ্রুত তারিখ নির্বাচন করুন (কার্ভ অনুযায়ী ক্লিক করুন):</div>
              <div className="flex flex-wrap gap-2">
                {adviceData.suitability_curve.map((pt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDateChange(pt.date)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      plantingDate === pt.date 
                        ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                        : pt.is_golden 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pt.display_date} ({toBanglaDigits(pt.score)}%)
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* NOVELTY VISUAL 2: Comparison Windows Matrix (Early vs Optimal vs Late) */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 bg-white space-y-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  মৌসুমের ৩টি পর্বের নাসার জলবায়ু প্রভাব তুলনা (Comparison Matrix)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  বিচারকদের জন্য বিশেষ বিশ্লেষণ: নির্দিষ্ট সময়ের আগে বা পরে রোপণ করলে কী কী আবহাওয়া ঝুঁকি ও ফলনের ক্ষতি হয়।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {adviceData.comparison_table.map((row, idx) => {
                const isBest = row.status === 'best';
                const isWarn = row.status === 'warning';
                return (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-2xl border transition-all ${
                      isBest 
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-xs' 
                        : isWarn
                          ? 'bg-amber-50/70 border-amber-300'
                          : 'bg-rose-50/70 border-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        isBest ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        isWarn ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-rose-100 text-rose-800 border-rose-200'
                      }`}>
                        {isBest ? '🌟 গোল্ডেন উইন্ডো' : isWarn ? '⚠️ আগাম রোপণ ঝুঁকি' : '❄️ নাবি বা দেরি ঝুঁকি'}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700">{row.suitability}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-2">{row.period}</h4>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">নাসার ক্লাইমেট ফ্যাক্টর</span>
                        <p className="text-slate-700 leading-relaxed text-[11px]">{row.weather_risk}</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ফলনের ওপর সম্ভাব্য প্রভাব</span>
                        <p className={`font-semibold leading-relaxed text-[11px] ${isBest ? 'text-emerald-700' : 'text-amber-800'}`}>
                          {row.yield_impact}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NOVELTY VISUAL 3: Multi-Stage Lifecycle Climate Risk Forecast */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 bg-white space-y-4 shadow-sm">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                ফসল চক্রের ৪-ধাপ আবহাওয়া ঝুঁকি পূর্বাভাস (Crop Lifecycle Weather Matrix)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                নির্বাচিত তারিখ অনুযায়ী আগামী ৪ মাসের বৃদ্ধি পর্যায়ে নাসার ২০ বছরের চরম আবহাওয়া সূচক কেমন থাকবে।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adviceData.lifecycle_risks.map((risk, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold text-slate-900">{risk.phase}</span>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      {risk.date_range}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
                    <span>প্যারামিটার: {risk.nasa_parameter}</span>
                    <span className="font-bold text-slate-900">ঝুঁকি: {toBanglaDigits(risk.risk_percent)}</span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    💡 <strong className="text-emerald-700">পরামর্শ:</strong> {risk.recommendation_bn}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* NASA 20-Year Climatology Baseline Chart */}
          <div className="glass-card rounded-2xl p-5 border border-slate-200 bg-white space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  {lang === 'bn' 
                    ? 'নাসা ২০ বছরের মাসিক বৃষ্টিপাত ও তাপমাত্রা বেসলাইন (NASA POWER)'
                    : 'NASA 20-Year Monthly Rain & Temp Baseline (NASA POWER)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'bn'
                    ? 'ঐতিহাসিক তথ্যের ভিত্তিতে অতিবৃষ্টি (Monsoon Peak) ও খরার মাস চিহ্নিতকরণ'
                    : 'Historical benchmark identifying monsoon peaks and drought periods'}
                </p>
              </div>
              <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                NASA POWER Climatology (Bangladesh 20-Yr Average)
              </span>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={climChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" stroke="#0284c7" tick={{ fontSize: 11 }} label={{ value: lang === 'bn' ? 'বৃষ্টি (মিমি)' : 'Rain (mm)', angle: -90, position: 'insideLeft', fill: '#0284c7', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#d97706" tick={{ fontSize: 11 }} label={{ value: lang === 'bn' ? 'তাপমাত্রা (°C)' : 'Temp (°C)', angle: 90, position: 'insideRight', fill: '#d97706', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#1e293b', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar yAxisId="left" dataKey="rain_mm" fill="#0ea5e9" radius={[4, 4, 0, 0]} name={lang === 'bn' ? "বৃষ্টিপাত (মিমি)" : "Rainfall (mm)"} />
                  <Line yAxisId="right" type="monotone" dataKey="temp_c" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} name={lang === 'bn' ? "তাপমাত্রা (°C)" : "Temperature (°C)"} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fertilizer Schedule */}
          {adviceData.fertilizer_plan && adviceData.fertilizer_plan.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-slate-200 bg-white space-y-3 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-emerald-600" />
                {lang === 'bn' ? 'সুষম সার প্রয়োগের মাত্রা (বিঘা প্রতি)' : 'Balanced Fertilizer Schedule (Per Bigha)'}
              </h3>
              <div className="space-y-2">
                {adviceData.fertilizer_plan.map((f, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {toBanglaDigits(idx + 1, lang)}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700">
                      {f.fertilizer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default PlantingAdvisorPage;
