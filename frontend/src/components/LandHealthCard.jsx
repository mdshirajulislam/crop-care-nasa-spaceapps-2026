import React from 'react';
import { Sprout, Activity, Compass, Droplet, ArrowUpRight } from 'lucide-react';
import { toBanglaDigits, formatLandArea } from '../utils/banglaNumbers';
import { useLanguage } from '../contexts/LanguageContext';

export const LandHealthCard = ({ plotData, onNavigateToMap, onNavigateToAdvisor }) => {
  const { lang, t } = useLanguage();

  const plot = plotData?.plots?.[0] || {
    name: "প্লট ১ - পূর্বের মাঠ",
    crop_name: "আমন ধান",
    crop_variety: "ব্রি ধান ৪৯",
    area_value: 3.5,
    area_unit: "bigha",
    current_stage: "কুশি গজানো পর্যায়",
    health_status: "ভালো (Good)",
    ndvi_score: 0.68,
    soil_type: "দোআঁশ মাটি",
    irrigation_source: "গভীর নলকূপ"
  };

  const landFormatted = formatLandArea(plot.area_value, lang);

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {lang === 'bn' ? plot.name : (plot.name?.replace('প্লট', 'Plot') || 'Plot 1 - East Field')}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'bn' ? `ময়মনসিংহ সদর • ${plot.soil_type}` : `Mymensingh Sadar • ${plot.soil_type || 'Loamy Soil'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateToMap}
            className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200 transition-all shadow-xs"
          >
            <span>{t.landHealth.allPlotsBtn}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Current Crop */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 space-y-1">
          <span className="text-[11px] text-slate-500 block font-semibold">{t.landHealth.currentCrop}</span>
          <p className="text-sm font-extrabold text-slate-900 line-clamp-1">
            {lang === 'bn' ? plot.crop_name : (plot.crop_name_en || 'Aman Rice')}
          </p>
          <span className="text-[11px] text-emerald-800 font-bold block">{plot.crop_variety}</span>
        </div>

        {/* Total Land (Fixed Unit & Format) */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 space-y-1">
          <span className="text-[11px] text-slate-500 block font-semibold">{t.landHealth.totalLand}</span>
          <p className="text-sm font-extrabold text-slate-900">{landFormatted.bighaText}</p>
          <span className="text-[11px] text-slate-600 font-medium">({landFormatted.decimalText})</span>
        </div>

        {/* Health / NDVI */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold">{t.landHealth.satelliteHealth}</span>
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-sm font-extrabold text-emerald-800">
            {toBanglaDigits(plot.ndvi_score, lang)} • {t.landHealth.good}
          </p>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full" style={{ width: `${plot.ndvi_score * 100}%` }}></div>
          </div>
        </div>

        {/* Current Stage */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 space-y-1">
          <span className="text-[11px] text-slate-500 block font-semibold">{t.landHealth.stage}</span>
          <p className="text-sm font-extrabold text-amber-800 line-clamp-1">
            {lang === 'bn' ? plot.current_stage : 'Tillering Stage'}
          </p>
          <span className="text-[11px] text-slate-600 font-medium block">{t.landHealth.seedlingAge} {toBanglaDigits(78, lang)} {t.landHealth.days}</span>
        </div>
      </div>

      {/* Stage Action Reminder */}
      <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <Droplet className="w-4 h-4 text-sky-600 flex-shrink-0" />
          <span className="text-xs text-slate-700">
            <strong className="text-slate-900">{t.landHealth.dailyAdviceTitle}</strong> {t.landHealth.dailyAdviceText}
          </span>
        </div>
        <button
          onClick={onNavigateToAdvisor}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline decoration-emerald-500"
        >
          {lang === 'bn' ? 'ক্যালেন্ডার গাইড দেখুন →' : 'View Calendar Guide →'}
        </button>
      </div>
    </div>
  );
};
