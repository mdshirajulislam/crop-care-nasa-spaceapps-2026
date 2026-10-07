import React from 'react';
import { Sun, Cloud, CloudRain, CloudDrizzle, CloudLightning, Wind, Droplets, Info } from 'lucide-react';
import { toBanglaDigits } from '../utils/banglaNumbers';
import { useLanguage } from '../contexts/LanguageContext';

export const WeatherCard = ({ weatherData }) => {
  const { lang, t } = useLanguage();

  const forecast = weatherData?.forecast || [];
  const current = weatherData?.current || {};

  const getWeatherIcon = (iconName, className = "w-6 h-6") => {
    switch (iconName) {
      case 'sunny':
      case 'mostly_sunny':
        return <Sun className={`${className} text-amber-400`} />;
      case 'partly_cloudy':
      case 'cloudy':
      case 'fog':
        return <Cloud className={`${className} text-slate-300`} />;
      case 'drizzle':
        return <CloudDrizzle className={`${className} text-sky-400`} />;
      case 'rain_light':
      case 'rain_moderate':
      case 'rain_heavy':
        return <CloudRain className={`${className} text-blue-400`} />;
      case 'thunderstorm':
        return <CloudLightning className={`${className} text-yellow-400`} />;
      default:
        return <Sun className={`${className} text-amber-400`} />;
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4 bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {t.weather.title}
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold">
              {lang === 'bn' ? 'ময়মনসিংহ সদর' : 'Mymensingh Sadar'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {weatherData?.source_label || "Open-Meteo High-Resolution"} • {weatherData?.verification_source || "NASA POWER Baseline"}
          </p>
        </div>

        {/* Current Snapshot */}
        <div className="flex items-center space-x-4 self-start sm:self-auto bg-slate-100/90 px-4 py-2.5 rounded-2xl border-2 border-slate-300 shadow-xs">
          <div className="flex items-center space-x-2">
            <Sun className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {toBanglaDigits(current.temperature || 29, lang)}°C
            </span>
          </div>
          <div className="text-xs text-slate-800 border-l-2 border-slate-300 pl-3.5">
            <p className="font-extrabold text-emerald-900 text-sm">
              {lang === 'bn' ? (current.condition_bn || "পরিষ্কার আকাশ") : (current.condition_en || "Clear Sky")}
            </p>
            <p className="text-xs text-slate-600 font-bold flex items-center gap-1 mt-0.5">
              <Wind className="w-3.5 h-3.5 text-emerald-700" />
              {toBanglaDigits(current.windspeed || 8, lang)} {t.weather.unitSpeed}
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-1 notranslate" translate="no">
        {forecast.map((day, idx) => {
          const isToday = day.is_today;
          
          const engDaysMap = {
            0: "Mon",
            1: "Tue",
            2: "Wed",
            3: "Thu",
            4: "Fri",
            5: "Sat",
            6: "Sun"
          };
          const bngDaysMap = {
            0: "সোম",
            1: "মঙ্গল",
            2: "বুধ",
            3: "বৃহস্পতি",
            4: "শুক্র",
            5: "শনি",
            6: "রবি"
          };

          const dateObj = new Date(day.date);
          const weekdayIdx = dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1;

          const dayLabel = isToday
            ? (lang === 'bn' ? 'আজ' : 'Today')
            : (lang === 'bn' 
                ? (day.day_name_short_bn || bngDaysMap[weekdayIdx] || 'দিন') 
                : (engDaysMap[weekdayIdx] || day.day_name_en?.substring(0, 3) || 'Day'));

          const dateNum = day.date ? day.date.split('-')[2] : '';
          const dateLabel = lang === 'bn' 
            ? `${toBanglaDigits(dateNum, 'bn')} তারিখ` 
            : `${toBanglaDigits(dateNum, 'en')}`;

          const weatherDesc = lang === 'bn' 
            ? (day.weather_desc_bn || "পরিষ্কার আকাশ")
            : (day.weather_desc_en || "Clear Sky");

              return (
            <div
              key={idx}
              translate="no"
              className={`notranslate flex flex-col items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                isToday
                  ? 'bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-slate-50/70 hover:bg-white border-slate-300 hover:border-emerald-400 shadow-xs'
              }`}
            >
              {/* Day & Date Header with clean tag */}
              <div className="flex flex-col items-center w-full border-b border-slate-200/80 pb-2 mb-1.5">
                <span className={`text-sm font-extrabold tracking-tight notranslate ${isToday ? 'text-emerald-950 font-black' : 'text-slate-900'}`}>
                  {dayLabel}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md mt-0.5 notranslate ${
                  isToday ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {dateLabel}
                </span>
              </div>

              {/* Weather Icon in rounded highlight circle */}
              <div className={`my-2 p-2 rounded-2xl border flex items-center justify-center shadow-xs ${
                isToday ? 'bg-white border-emerald-300' : 'bg-white border-slate-200'
              }`}>
                {getWeatherIcon(day.icon, "w-7 h-7")}
              </div>

              {/* Weather Condition */}
              <span className={`text-xs font-bold text-center line-clamp-1 mb-2 px-1 ${
                isToday ? 'text-emerald-900' : 'text-slate-800'
              }`}>
                {weatherDesc}
              </span>

              {/* Temperature Badge (Max & Min) */}
              <div className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-sm font-black text-slate-900">
                  {toBanglaDigits(day.temp_max, lang)}°
                </span>
                <span className="text-xs font-bold text-slate-500">
                  / {toBanglaDigits(day.temp_min, lang)}°
                </span>
              </div>

              {/* Rain Badge */}
              <div className={`w-full mt-2 py-1 px-1.5 rounded-xl flex items-center justify-center gap-1 text-[11px] font-extrabold border ${
                day.precip_mm > 0 
                  ? 'bg-sky-50 text-sky-800 border-sky-300' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                <Droplets className={`w-3.5 h-3.5 ${day.precip_mm > 0 ? 'text-sky-600' : 'text-slate-400'}`} />
                <span>{toBanglaDigits(day.precip_mm, lang)} {t.weather.unitMm}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Footnote */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-emerald-600" />
          {t.weather.verifiedBy}
        </span>
        <span className="text-emerald-700 font-semibold">{t.weather.autoUpdate}</span>
      </div>
    </div>
  );
};
