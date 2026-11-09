import React, { useState, useEffect } from 'react';
import { 
  Thermometer, Flame, Droplets, ShieldCheck, AlertTriangle, 
  Sparkles, RefreshCw, Volume2, Info, ArrowUpRight, Activity
} from 'lucide-react';
import { fetchThermalStress } from '../utils/api';
import { toBanglaDigits } from '../utils/banglaNumbers';

export const PlantThermalStressCard = ({ plotData, farmerProfile }) => {
  const [thermalData, setThermalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const lat = farmerProfile?.lat ?? 24.7471;
      const lon = farmerProfile?.lon ?? 90.4203;
      const crop = plotData?.crop_name || 'aman_rice';
      const bigha = plotData?.area_value || 3.5;
      const data = await fetchThermalStress(crop, bigha, lat, lon);
      setThermalData(data);
    } catch (err) {
      console.error("Thermal stress error:", err);
      setError("থার্মাল ডাটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [plotData, farmerProfile]);

  const speakAdvice = (text) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-slate-100 rounded mb-2"></div>
        <div className="h-16 bg-slate-50 rounded"></div>
      </div>
    );
  }

  if (error || !thermalData) return null;

  const isHealthy = thermalData.stress_status === 'healthy';
  const isMild = thermalData.stress_status === 'mild_thirst';
  const isCritical = thermalData.stress_status === 'critical_fever';

  const badgeBg = isHealthy ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  isMild ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200';

  const deltaText = thermalData.delta_t_c > 0 
    ? `+${toBanglaDigits(thermalData.delta_t_c)}°C (বাতাসের চেয়ে গরম)` 
    : `${toBanglaDigits(thermalData.delta_t_c)}°C (স্বাভাবিক শীতল)`;

  return (
    <div className="bg-gradient-to-br from-white to-slate-50/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
      {/* Top Banner & Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2.5 rounded-xl ${isHealthy ? 'bg-emerald-100 text-emerald-700' : isMild ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-base font-bold text-slate-900">গাছের জ্বর ও ক্যানোপি থার্মাল স্ট্রেস</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold">
                NASA ECOSTRESS (ISS)
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <span>রেজোলিউশন: ৭০মি × ৭০মি হাইপারলোকাল পিক্সেল</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">লাইভ স্যাটেলাইট ডাটা</span>
            </p>
          </div>
        </div>

        <button 
          onClick={loadData}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="রিফ্রেশ করুন"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Indicator Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium">গাছের পাতার তাপমাত্রা</div>
          <div className="text-lg font-bold text-slate-900 flex items-baseline gap-1 mt-0.5">
            <span>{toBanglaDigits(thermalData.canopy_temperature_c)}°C</span>
            <span className={`text-[10px] font-bold ${thermalData.delta_t_c > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              (ΔT: {deltaText})
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">পরিবেশ: {toBanglaDigits(thermalData.air_temperature_c)}°C</div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium">বাষ্পমোচন শীতলীকরণ</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            {toBanglaDigits(thermalData.transpiration_rate_pct)}%
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div 
              className={`h-full ${isHealthy ? 'bg-emerald-500' : isMild ? 'bg-amber-500' : 'bg-rose-500'}`} 
              style={{ width: `${thermalData.transpiration_rate_pct}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium">থার্মাল স্ট্যাটাস</div>
          <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border mt-1.5 ${badgeBg}`}>
            {isHealthy && <ShieldCheck className="w-3.5 h-3.5" />}
            {isMild && <AlertTriangle className="w-3.5 h-3.5" />}
            {isCritical && <Flame className="w-3.5 h-3.5" />}
            <span>{thermalData.stress_level_bn}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">মাটির আর্দ্রতা: {toBanglaDigits(thermalData.soil_moisture_pct)}%</div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium">ফলন ঝুঁকির সম্ভাবনা</div>
          <div className={`text-lg font-bold mt-0.5 ${thermalData.yield_risk_pct > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {thermalData.yield_risk_pct > 0 ? `${toBanglaDigits(thermalData.yield_risk_pct)}% ক্ষতি ঝুঁকি` : 'কোনো ঝুঁকি নেই (০%)'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {thermalData.yield_risk_pct > 0 ? '৪৮ ঘণ্টার মধ্যে পদক্ষেপ নিন' : 'স্বাভাবিক বৃদ্ধি সক্রিয়'}
          </div>
        </div>
      </div>

      {/* Detailed Diagnosis & Action Box */}
      <div className={`p-3.5 rounded-xl border mt-2 ${
        isHealthy ? 'bg-emerald-50/50 border-emerald-100' :
        isMild ? 'bg-amber-50/60 border-amber-100' :
        'bg-rose-50/60 border-rose-100'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            {thermalData.diagnosis_bn}
          </p>
          <button
            onClick={() => speakAdvice(`${thermalData.diagnosis_bn} করণীয় পদক্ষেপ: ${thermalData.recommended_action_bn}`)}
            className={`p-2 rounded-xl text-white transition-all shadow-sm flex-shrink-0 ${
              isSpeaking ? 'bg-rose-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
            title="মুখে শুনুন"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-2xs border border-slate-200">
            করণীয় পদক্ষেপ:
          </span>
          <span className="text-xs text-slate-700 font-medium">
            {thermalData.recommended_action_bn}
          </span>
        </div>
      </div>
    </div>
  );
};
