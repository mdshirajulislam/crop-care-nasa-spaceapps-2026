import React from 'react';
import { AlertTriangle, ShieldCheck, Info, Sparkles } from 'lucide-react';
import { AudioSpeakerButton } from './AudioSpeakerButton';
import { useLanguage } from '../contexts/LanguageContext';

export const TopAlertBanner = ({ sprayAdvisor, weatherRisk }) => {
  const { lang, t } = useLanguage();

  const isHold = sprayAdvisor?.status === 'hold';
  const isCaution = sprayAdvisor?.status === 'caution';
  const isSafe = sprayAdvisor?.status === 'safe';

  const title = lang === 'bn' 
    ? (sprayAdvisor?.title_bn || "কীটনাশক ও সার প্রয়োগের অনুকূল সময়")
    : (sprayAdvisor?.title_en || (isHold ? "Postpone Pesticide / Fertilizer Spraying" : isCaution ? "Caution: High Wind or Moderate Rain" : "Safe Window for Spray & Fertilizer"));

  const detail = lang === 'bn'
    ? (sprayAdvisor?.detail_bn || "আজকের আবহাওয়া অনুকূল। বিকালের রোদে স্প্রে করতে পারেন।")
    : (sprayAdvisor?.detail_en || (isHold ? "Heavy rain or strong wind forecast within 24 hours. Wait for dry weather." : isCaution ? "Scattered light showers expected. Avoid morning spraying." : "Optimal weather conditions. Good window for field application."));

  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all shadow-sm ${
      isHold 
        ? 'bg-rose-50/90 border-rose-200 text-rose-900 shadow-rose-100/50'
        : isCaution
        ? 'bg-amber-50/90 border-amber-200 text-amber-900 shadow-amber-100/50'
        : 'bg-emerald-50/90 border-emerald-200 text-emerald-900 shadow-emerald-100/50'
    }`}>
      {/* Background Glow */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3.5">
          <div className={`p-2.5 rounded-xl mt-0.5 sm:mt-0 flex-shrink-0 ${
            isHold ? 'bg-rose-100 text-rose-600 border border-rose-200' :
            isCaution ? 'bg-amber-100 text-amber-700 border border-amber-200' :
            'bg-emerald-100 text-emerald-700 border border-emerald-200'
          }`}>
            {isHold ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : 
             isCaution ? <Info className="w-6 h-6" /> : 
             <ShieldCheck className="w-6 h-6" />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isHold ? 'bg-rose-200/70 text-rose-800 border border-rose-300' :
                isCaution ? 'bg-amber-200/70 text-amber-800 border border-amber-300' :
                'bg-emerald-200/70 text-emerald-800 border border-emerald-300'
              }`}>
                {t.topAlert.tag}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                {t.topAlert.sourceNASA}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
              {detail}
            </p>
          </div>
        </div>

        {/* Audio Speaker for illiterate farmers */}
        <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
          <span className="text-xs text-slate-600 hidden md:inline font-medium">{t.topAlert.readAloud}</span>
          <AudioSpeakerButton text={`${title}। ${detail}`} size={20} className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm" />
        </div>
      </div>
    </div>
  );
};
