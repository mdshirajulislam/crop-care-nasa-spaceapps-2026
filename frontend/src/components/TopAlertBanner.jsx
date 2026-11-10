import React from 'react';
import { AlertTriangle, ShieldCheck, Info, Sparkles, MapPin, CloudRain, Wind, ExternalLink } from 'lucide-react';
import { AudioSpeakerButton } from './AudioSpeakerButton';
import { useLanguage } from '../contexts/LanguageContext';
import { toBanglaDigits } from '../utils/banglaNumbers';

export const TopAlertBanner = ({ sprayAdvisor, weatherRisk, farmerProfile, onNavigateSettings }) => {
  const { lang, t } = useLanguage();

  const isHold = sprayAdvisor?.status === 'hold';
  const isCaution = sprayAdvisor?.status === 'caution';
  const isSafe = sprayAdvisor?.status === 'safe' || (!isHold && !isCaution);

  // Construct precise location label from saved farmer profile
  const locationParts = [
    farmerProfile?.village,
    farmerProfile?.ward,
    farmerProfile?.union_name,
    farmerProfile?.upazila,
    farmerProfile?.district
  ].filter(Boolean);

  const shortLoc = farmerProfile?.upazila 
    ? `${farmerProfile.village ? farmerProfile.village + ', ' : ''}${farmerProfile.upazila}`
    : (sprayAdvisor?.location_name || (lang === 'bn' ? 'আপনার এলাকা' : 'Your Farm Area'));

  const fullLoc = locationParts.length > 0 
    ? locationParts.join(', ') 
    : (sprayAdvisor?.location_name || (lang === 'bn' ? 'ময়মনসিংহ সদর, ময়মনসিংহ' : 'Mymensingh Sadar, Mymensingh'));

  const coordsStr = (farmerProfile?.lat && farmerProfile?.lon)
    ? `${farmerProfile.lat.toFixed(4)}° N, ${farmerProfile.lon.toFixed(4)}° E`
    : (sprayAdvisor?.lat && sprayAdvisor?.lon ? `${sprayAdvisor.lat.toFixed(4)}° N, ${sprayAdvisor.lon.toFixed(4)}° E` : '');

  const title = lang === 'bn' 
    ? (sprayAdvisor?.title_bn || (isHold ? "কীটনাশক ও সার স্প্রে সাময়িক স্থগিত রাখুন" : isCaution ? "সতর্কতার সাথে স্প্রে করুন" : "কীটনাশক ও সার প্রয়োগের অনুকূল সময়"))
    : (sprayAdvisor?.title_en || (isHold ? "Postpone Pesticide / Fertilizer Spraying" : isCaution ? "Caution: High Wind or Moderate Rain" : "Safe Window for Spray & Fertilizer"));

  // Keep description paragraph clean and focused on agricultural advisory without repeating address
  const cleanDetail = (lang === 'bn'
    ? (sprayAdvisor?.detail_bn || (isHold ? "আজ বৃষ্টির সম্ভাবনা রয়েছে। জমিতে কীটনাশক বা সার প্রয়োগ সাময়িক বন্ধ রাখুন যাতে ওষুধ ধুয়ে নষ্ট না হয়।" : isCaution ? "আবহাওয়া বা বাতাসের তারতম্যের কারণে সতর্কতার সাথে স্প্রে সম্পন্ন করুন।" : "আজ সারাদিন আকাশ অনুকূল থাকবে এবং বৃষ্টির কোনো সম্ভাবনা নেই। বিকালের শান্ত রোদে স্প্রে করা সবচেয়ে নিরাপদ ও কার্যকর।"))
    : (sprayAdvisor?.detail_en || (isHold ? "Heavy rain or strong wind forecast within 24 hours. Wait for dry weather." : isCaution ? "Scattered light showers expected. Avoid morning spraying." : "Optimal weather conditions. Good window for field application.")))
    .replace(/^.*?\s*(এলাকায়|এলাকায়|In\s+[^,]+,\s*)\s*/i, '');

  const audioText = `${fullLoc} এলাকার জন্য সতর্কতা: ${title}। ${cleanDetail}`;

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

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 relative z-10">
        <div className="flex items-start space-x-3.5 flex-1 min-w-0">
          <div className={`p-2.5 rounded-xl mt-0.5 sm:mt-0 flex-shrink-0 shadow-2xs ${
            isHold ? 'bg-rose-100 text-rose-600 border border-rose-200' :
            isCaution ? 'bg-amber-100 text-amber-700 border border-amber-200' :
            'bg-emerald-100 text-emerald-700 border border-emerald-200'
          }`}>
            {isHold ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : 
             isCaution ? <Info className="w-6 h-6" /> : 
             <ShieldCheck className="w-6 h-6" />}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Header Tags & Explicit Profile Location Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isHold ? 'bg-rose-200/70 text-rose-800 border border-rose-300' :
                isCaution ? 'bg-amber-200/70 text-amber-800 border border-amber-300' :
                'bg-emerald-200/70 text-emerald-800 border border-emerald-300'
              }`}>
                {t.topAlert?.tag || "আজকের জরুরি সতর্কতা"}
              </span>

              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                {t.topAlert?.sourceNASA || "নাসা ও আবহাওয়া পূর্বাভাস সমন্বিত"}
              </span>

              {/* Exact Location Pill with Click-to-Edit */}
              {onNavigateSettings ? (
                <button
                  type="button"
                  onClick={onNavigateSettings}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 hover:bg-white text-slate-800 hover:text-emerald-700 text-xs font-semibold border border-slate-300 shadow-2xs transition-all cursor-pointer group"
                  title={lang === 'bn' ? 'প্রোফাইল সেটিংস ও অবস্থান পরিবর্তন করুন' : 'View or change saved profile location'}
                >
                  <MapPin className="w-3 h-3 text-rose-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-700 truncate max-w-[220px]">
                    {fullLoc}
                  </span>
                  {coordsStr && (
                    <span className="text-[10px] text-slate-400 font-mono hidden md:inline border-l border-slate-200 pl-1.5">
                      {toBanglaDigits(coordsStr, lang)}
                    </span>
                  )}
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-medium ml-0.5">
                    {t.topAlert?.changeLocation || (lang === 'bn' ? 'পরিবর্তন' : 'Change')}
                  </span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 text-slate-800 text-xs font-semibold border border-slate-200 shadow-2xs">
                  <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
                  <span className="text-[11px] font-bold text-slate-700">{fullLoc}</span>
                </div>
              )}
            </div>

            {/* Alert Title */}
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>

            {/* Alert Detailed Advisory Message */}
            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed max-w-3xl">
              {cleanDetail}
            </p>

            {/* Live Weather Metrics Chips for this exact Location */}
            <div className="flex items-center gap-2 pt-1.5 text-xs text-slate-600 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/90 text-slate-700 font-medium text-[11px] shadow-2xs">
                <CloudRain className="w-3 h-3 text-sky-500" />
                <span>{t.topAlert?.rainMetric || (lang === 'bn' ? 'বৃষ্টি' : 'Rain')}:</span>
                <span className="font-bold text-slate-900">{toBanglaDigits(sprayAdvisor?.rain_today_mm ?? 0, lang)} {t.weather?.unitMm || 'মিমি'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/90 text-slate-700 font-medium text-[11px] shadow-2xs">
                <Wind className="w-3 h-3 text-emerald-600" />
                <span>{t.topAlert?.windMetric || (lang === 'bn' ? 'বাতাস' : 'Wind')}:</span>
                <span className="font-bold text-slate-900">{toBanglaDigits(sprayAdvisor?.wind_today_kmh ?? 8, lang)} {t.weather?.unitSpeed || 'কিমি/ঘণ্টা'}</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal hidden lg:inline">
                {lang === 'bn' ? '• আপনার প্রোফাইল জিপিএস ও নাসা আর্থ সায়েন্স ডেটাসেট ভিত্তিক পূর্বাভাস' : '• Verified with your profile GPS grid & NASA earth science telemetry'}
              </span>
            </div>
          </div>
        </div>

        {/* Audio Speaker for illiterate farmers */}
        <div className="flex items-center space-x-2 self-end sm:self-start flex-shrink-0 pt-1">
          <span className="text-xs text-slate-600 hidden md:inline font-medium">{t.topAlert?.readAloud || 'পড়ে শুনুন:'}</span>
          <AudioSpeakerButton 
            text={audioText} 
            size={20} 
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm" 
          />
        </div>
      </div>
    </div>
  );
};
export default TopAlertBanner;
