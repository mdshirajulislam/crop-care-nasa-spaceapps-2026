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
    <div className="glass-card rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-slate-900">
              {t.weather.title}
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              {lang === 'bn' ? 'ময়মনসিংহ সদর' : 'Mymensingh Sadar'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {weatherData?.source_label || "Open-Meteo Forecast"} • {weatherData?.verification_source || "NASA Climatology"}
          </p>
        </div>

        {/* Current Snapshot */}
        <div className="flex items-center space-x-4 self-start sm:self-auto bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-1.5">
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-lg font-extrabold text-slate-900">
              {toBanglaDigits(current.temperature || 29, lang)}°C
            </span>
          </div>
          <div className="text-xs text-slate-600 border-l border-slate-200 pl-3">
            <p className="font-semibold text-emerald-700">
              {lang === 'bn' ? (current.condition_bn || "পরিষ্কার আকাশ") : (current.condition_en || "Clear Sky")}
            </p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Wind className="w-3 h-3 text-emerald-600" />
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
              className={`notranslate flex flex-col items-center justify-between p-3 rounded-xl border transition-all ${
                isToday
                  ? 'bg-emerald-50/80 border-emerald-300 shadow-sm ring-1 ring-emerald-400/30'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
              }`}
            >
              {/* Day Name */}
              <span className={`text-xs font-bold notranslate ${isToday ? 'text-emerald-800' : 'text-slate-800'}`}>
                {dayLabel}
              </span>
              <span className="text-[10px] text-slate-500 mb-1.5 notranslate">
                {dateLabel}
              </span>

              {/* Icon */}
              <div className="my-1.5 p-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                {getWeatherIcon(day.icon, "w-6 h-6")}
              </div>

              {/* Weather Condition */}
              <span className="text-[11px] font-medium text-slate-700 text-center line-clamp-1">
                {weatherDesc}
              </span>

              {/* Temps */}
              <div className="flex items-center space-x-1.5 mt-2 text-xs">
                <span className="font-bold text-slate-900">{toBanglaDigits(day.temp_max, lang)}°</span>
                <span className="text-slate-500 text-[11px]">{toBanglaDigits(day.temp_min, lang)}°</span>
              </div>

              {/* Rain mm */}
              <div className="flex items-center space-x-1 mt-1.5 text-[11px] text-sky-700 font-medium">
                <Droplets className="w-3 h-3 text-sky-600" />
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
