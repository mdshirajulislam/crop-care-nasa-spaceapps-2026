import React, { useState, useEffect } from 'react';
import { 
  Waves, CloudLightning, ShieldAlert, CheckCircle2, AlertTriangle, 
  ArrowRight, Calculator, Tractor, ChevronDown, ChevronUp, Sparkles, Volume2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useVoice } from '../contexts/VoiceContext';
import { toBanglaDigits, formatBDT } from '../utils/banglaNumbers';
import { calculateEmergencyHarvest } from '../utils/api';
import { AudioSpeakerButton } from './AudioSpeakerButton';

export const FlashFloodHailstormShieldCard = ({ floodAlert, currentPlot }) => {
  const { lang } = useLanguage();
  const { speak } = useVoice();

  const [cropMaturity, setCropMaturity] = useState(80);
  const [landBigha, setLandBigha] = useState(currentPlot?.area_value || 3.5);
  const [harvestData, setHarvestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Sync land bigha if current plot changes
  useEffect(() => {
    if (currentPlot?.area_value) {
      setLandBigha(currentPlot.area_value);
    }
  }, [currentPlot]);

  // Fetch or calculate harvest analysis whenever maturity or bigha changes
  useEffect(() => {
    let isMounted = true;
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const res = await calculateEmergencyHarvest({
          crop_maturity_pct: cropMaturity,
          land_bigha: Number(landBigha) || 3.5,
          crop_name: currentPlot?.crop_name || "বোরো ধান",
          market_price_per_maund: 1150.0
        });
        if (isMounted) setHarvestData(res);
      } catch (e) {
        console.error("Harvest calc error:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAnalysis();
    return () => { isMounted = false; };
  }, [cropMaturity, landBigha, currentPlot]);

  if (!floodAlert) return null;

  const hailstorm = floodAlert.hailstorm_shield || {
    risk_level: "মাঝারি ঝুঁকি (Moderate)",
    probability_pct: 52,
    convective_wind_gust_kmh: 48,
    hail_advice_bn: "বিকেলে কালবৈশাখী ও শিলাবৃষ্টির ঝুঁকি রয়েছে। পাকা ফসল মাঠে ফেলে না রেখে দ্রুত ত্রিপল দিয়ে ঢাকুন।"
  };

  const isCritical = floodAlert.alert_color === 'red';
  const isWarning = floodAlert.alert_color === 'amber';

  const audioSummary = `নাসা জিপিএম স্যাটেলাইট পূর্বাভাস। উজান আসাম ও মেঘালয় পাহাড়ে ৩ দিনের বৃষ্টিপাত ${floodAlert.upstream_rainfall_mm} মিলিমিটার। ${floodAlert.action_advice_bn}। কালবৈশাখী ও শিলাবৃষ্টির ঝুঁকি ${hailstorm.probability_pct} শতাংশ। ${harvestData?.action_verdict || ''}`;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Top Banner Accent */}
      <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${
        isCritical 
          ? 'from-rose-500 via-amber-500 to-rose-600' 
          : 'from-amber-400 via-sky-500 to-emerald-500'
      }`} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md ${
            isCritical ? 'bg-rose-600' : 'bg-gradient-to-br from-amber-500 to-sky-600'
          }`}>
            <Waves className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                হাওর পাহাড়ি ঢল ও শিলাবৃষ্টি রক্ষা ঢাল
              </h3>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isCritical 
                  ? 'bg-rose-50 text-rose-700 border-rose-300' 
                  : 'bg-amber-50 text-amber-700 border-amber-300'
              }`}>
                {floodAlert.alert_level || 'সতর্কতা স্তর'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
              <span>NASA GPM IMERG & POWER Convective Index</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{currentPlot?.name || 'পূর্বের মাঠ'}</span>
            </p>
          </div>
        </div>

        {/* Audio Speaker */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <AudioSpeakerButton 
            text={audioSummary}
            className="shadow-xs"
            size={18}
          />
        </div>
      </div>

      {/* 2 Side-by-Side Live Satellite Telemetry Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-5">
        
        {/* Box 1: Upstream Catchment Runoff */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/80 to-slate-50 border border-sky-100/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-sky-900 mb-2">
            <span className="flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-sky-600" />
              উজান আসাম/মেঘালয় ঢল বৃষ্টি
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-200/60 text-sky-800 font-mono">
              NASA GPM IMERG
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {toBanglaDigits(floodAlert.upstream_rainfall_mm, lang)}
            </span>
            <span className="text-xs font-bold text-slate-600">মিলিমিটার (৩ দিনে মোট)</span>
          </div>
          <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
            {floodAlert.action_advice_bn}
          </p>
          <div className="mt-2.5 pt-2 border-t border-sky-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>বিপদসীমার সম্ভাব্য সময়:</span>
            <strong className="text-sky-900 font-bold font-mono">
              {toBanglaDigits(floodAlert.projected_lead_time_days, lang)} দিন বাকি
            </strong>
          </div>
        </div>

        {/* Box 2: Hailstorm & Nor'wester Instability */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-slate-50 border border-amber-100/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-2">
            <span className="flex items-center gap-1.5">
              <CloudLightning className="w-4 h-4 text-amber-600" />
              কালবৈশাখী ও শিলাবৃষ্টি তীব্রতা
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200/60 text-amber-800 font-mono">
              Atmospheric Convective
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {toBanglaDigits(hailstorm.probability_pct, lang)}%
            </span>
            <span className="text-xs font-bold text-amber-800">
              {hailstorm.risk_level}
            </span>
          </div>
          <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
            {hailstorm.hail_advice_bn}
          </p>
          <div className="mt-2.5 pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>দমকা বাতাসের সম্ভাব্য গতি:</span>
            <strong className="text-amber-900 font-bold font-mono">
              ~{toBanglaDigits(hailstorm.convective_wind_gust_kmh, lang)} কিমি/ঘণ্টা
            </strong>
          </div>
        </div>

      </div>

      {/* Interactive Emergency Harvest Decision Window (BRRI Model) */}
      <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-700">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                জরুরি ফসল কাটার সিদ্ধান্ত উইন্ডো (BRRI বৈজ্ঞানিক ফর্মুলা)
              </h4>
              <p className="text-[11px] text-slate-500">
                ঢল বা শিলাবৃষ্টি আসার আগে ৮০% পাকা ধান কাটলে কত টাকা লাভবান হবেন?
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs self-start sm:self-auto">
            জমি: <strong className="text-emerald-700 font-mono">{toBanglaDigits(landBigha, lang)} বিঘা</strong>
          </div>
        </div>

        {/* Maturity Range Slider */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700">ধানের বর্তমান পরিপক্কতা (কত শতাংশ পেকেছে?):</span>
            <span className="text-emerald-800 text-base font-black font-mono bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300">
              {toBanglaDigits(cropMaturity, lang)}%
            </span>
          </div>

          <input 
            type="range"
            min="50"
            max="100"
            step="5"
            value={cropMaturity}
            onChange={(e) => setCropMaturity(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>৫০% (কাঁচা/দুধ)</span>
            <span className="text-emerald-700 font-bold">৮০% (আদর্শ জরুরি কর্তন)</span>
            <span>১০০% (পূর্ণ পাকা)</span>
          </div>
        </div>

        {/* Harvest Decision & Balance Sheet */}
        {harvestData && (
          <div className="mt-4 space-y-3.5">
            
            {/* Action Verdict Callout */}
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              harvestData.verdict_badge === 'HARVEST_NOW'
                ? 'bg-emerald-500/10 border-emerald-300 text-emerald-900'
                : (harvestData.verdict_badge === 'PREPARE_HARVEST' 
                    ? 'bg-amber-500/10 border-amber-300 text-amber-900'
                    : 'bg-rose-500/10 border-rose-300 text-rose-900')
            }`}>
              {harvestData.verdict_badge === 'HARVEST_NOW' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-extrabold text-sm block">
                  {harvestData.action_verdict}
                </span>
                <p className="text-xs mt-1 text-slate-700 leading-relaxed font-medium">
                  {harvestData.action_steps_bn[0]}
                </p>
              </div>
            </div>

            {/* Financial Comparison 3 Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
              
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">মোট ফসলের সম্ভাবনা</span>
                <span className="text-lg font-black text-slate-800 font-mono mt-0.5 block">
                  {formatBDT(harvestData.full_potential_value_bdt, lang)}
                </span>
                <span className="text-[10px] text-slate-400">
                  (~{toBanglaDigits(harvestData.total_maunds_expected, lang)} মণ ধান)
                </span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-800 block">🟢 এখন কাটলে ঘরে উঠবে</span>
                <span className="text-lg font-black text-emerald-700 font-mono mt-0.5 block">
                  {formatBDT(harvestData.salvage_value_bdt, lang)}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">
                  {toBanglaDigits(harvestData.grain_weight_secured_pct, lang)}% ফলন সুরক্ষিত
                </span>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200/80 shadow-2xs">
                <span className="text-[11px] font-semibold text-rose-800 block">🔴 অপেক্ষা করলে ক্ষতির ঝুঁকি</span>
                <span className="text-lg font-black text-rose-600 font-mono mt-0.5 block">
                  {formatBDT(harvestData.potential_flood_loss_bdt, lang)}
                </span>
                <span className="text-[10px] text-rose-500 font-bold">
                  ঢলে তলিয়ে যাওয়া বা ঝরে পড়া
                </span>
              </div>

            </div>

            {/* Action Checklist & Guidelines Accordion */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-slate-600 hover:text-emerald-700 font-bold flex items-center gap-1 transition-colors"
              >
                <span>{showDetails ? 'বিস্তারিত পরামর্শ বন্ধ করুন' : 'কৃষি সম্প্রসারণ অধিদপ্তর (DAE) ও কম্বাইন হারভেস্টার গাইড দেখুন'}</span>
                {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDetails && (
                <div className="mt-2.5 p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700 animate-fade-in">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Tractor className="w-4 h-4 text-emerald-600" />
                    জরুরি মাঠ পর্যায়ের করণীয়:
                  </div>
                  <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
                    {harvestData.action_steps_bn.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="italic">{harvestData.brri_official_citation}</span>
                    <span className="font-bold text-emerald-700">হটলাইন: ১৬১২৩</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
