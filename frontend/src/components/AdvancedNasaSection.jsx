import React, { useState, useEffect } from 'react';
import { 
  Droplets, Waves, ShieldAlert, Award, FileText, ChevronRight, 
  MapPin, AlertCircle, ArrowUpRight, DollarSign, Sparkles, Loader2, Gauge
} from 'lucide-react';
import { fetchIrrigationAdvisor, fetchFlashFloodWarning, fetchPestRadar } from '../utils/api';
import { toBanglaDigits, formatBDT } from '../utils/banglaNumbers';
import { InsuranceCertificateModal } from './InsuranceCertificateModal';
import { useLanguage } from '../contexts/LanguageContext';

export const AdvancedNasaSection = ({ farmerProfile, plotData, onNavigateToMedicine }) => {
  const { lang, t } = useLanguage();
  const [irrigation, setIrrigation] = useState(null);
  const [floodAlert, setFloodAlert] = useState(null);
  const [pestRadar, setPestRadar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false);

  useEffect(() => {
    const loadNasaFeatures = async () => {
      try {
        const [irrData, floodData, radarData] = await Promise.all([
          fetchIrrigationAdvisor('aman_rice', plotData?.area_value || 3.5),
          fetchFlashFloodWarning('haor'),
          fetchPestRadar()
        ]);
        setIrrigation(irrData);
        setFloodAlert(floodData);
        setPestRadar(radarData || []);
      } catch (err) {
        console.error("Advanced NASA features load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadNasaFeatures();
  }, [plotData]);

  if (loading) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section Title with NASA Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            {t.advancedNasa.title}
          </h3>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold">
            {t.advancedNasa.badge}
          </span>
        </div>
        <button
          onClick={() => setInsuranceModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
        >
          <FileText className="w-4 h-4" />
          <span>{t.advancedNasa.insuranceBtn}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. NASA SMAP Smart Irrigation Advisor */}
        {irrigation && (
          <div className="glass-card rounded-2xl p-5 border border-sky-200 bg-sky-50/40 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Droplets className="w-4 h-4 text-sky-600" />
                  {t.advancedNasa.smapTitle}
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                  irrigation.status === 'hold' 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {lang === 'bn' ? irrigation.action_badge : (irrigation.status === 'hold' ? 'Delay Irrigation' : 'Water Needed')}
                </span>
              </div>

              <div className="flex items-baseline space-x-2 pt-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {toBanglaDigits(irrigation.soil_moisture_pct, lang)}%
                </span>
                <span className="text-xs text-sky-800 font-medium">
                  {t.advancedNasa.soilMoisture} ({lang === 'bn' ? irrigation.moisture_status_bn : 'Moist Root Zone'})
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {lang === 'bn' ? irrigation.recommendation_bn : (irrigation.recommendation_en || "Soil moisture in root zone is at 38%. Rainfall forecast within 48h will supply adequate water, saving diesel irrigation costs.")}
              </p>
            </div>

            {/* Diesel Savings Badge */}
            {irrigation.savings?.money_bdt > 0 && (
              <div className="mt-2 p-2.5 rounded-xl bg-white border border-sky-200 flex items-center justify-between text-xs shadow-xs">
                <span className="text-slate-600 flex items-center gap-1 font-medium">
                  {t.advancedNasa.dieselSavings}
                </span>
                <span className="font-extrabold text-emerald-700">
                  {toBanglaDigits(irrigation.savings.diesel_liters, lang)} {lang === 'bn' ? 'লিটার' : 'L'} ({formatBDT(irrigation.savings.money_bdt, lang)})
                </span>
              </div>
            )}
          </div>
        )}

        {/* 2. NASA GPM Haor/Char Flash Flood Early Warning */}
        {floodAlert && (
          <div className="glass-card rounded-2xl p-5 border border-amber-200 bg-amber-50/40 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Waves className="w-4 h-4 text-amber-600" />
                  {t.advancedNasa.gpmTitle}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {lang === 'bn' ? floodAlert.alert_level : 'Low Risk'}
                </span>
              </div>

              <div className="text-xs text-slate-700 pt-1">
                {lang === 'bn' ? 'উজান আসাম/মেঘালয়ে ৩ দিনের বৃষ্টি:' : '3-Day Upstream Rain (Assam/Meghalaya):'} <strong className="text-slate-900 font-mono">{toBanglaDigits(floodAlert.upstream_rainfall_mm, lang)} {t.weather.unitMm}</strong>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {lang === 'bn' ? floodAlert.action_advice_bn : (floodAlert.action_advice_en || t.advancedNasa.floodForecastSafe)}
              </p>
            </div>

            <div className="mt-2 p-2.5 rounded-xl bg-white border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between shadow-xs">
              <span className="font-medium text-slate-600">{lang === 'bn' ? 'সম্ভাব্য সময়সীমা:' : 'Projected Lead Time:'}</span>
              <span className="font-bold text-slate-900 font-mono">
                {toBanglaDigits(floodAlert.projected_lead_time_days, lang)} {lang === 'bn' ? 'দিনের লিড টাইম' : 'Days Lead Time'}
              </span>
            </div>
          </div>
        )}

        {/* 3. Community Crowdsourced Pest & Outbreak Radar */}
        <div className="glass-card rounded-2xl p-5 border border-rose-200 bg-rose-50/30 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                {t.advancedNasa.radarTitle}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200">
                {lang === 'bn' ? '৩টি স্থানীয় রিপোর্ট' : '3 Local Reports'}
              </span>
            </div>

            <p className="text-xs text-slate-600">
              {lang === 'bn' 
                ? 'আপনার আশেপাশের ৫ কিমি সীমানায় কৃষকদের দ্বারা রিপোর্টকৃত রোগের লাইভ ট্র্যাক:' 
                : 'Live localized outbreak reports from farms within 5km radius:'}
            </p>

            <div className="space-y-2 pt-1">
              {pestRadar.slice(0, 2).map((rep) => (
                <div key={rep.id} className="p-2.5 rounded-xl bg-white border border-rose-100 text-xs space-y-1 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{rep.pest_or_disease}</span>
                    <span className="text-[10px] text-rose-700 font-mono font-semibold">
                      {lang === 'bn' ? `দূরত্ব: ${toBanglaDigits(rep.distance_km, 'bn')} কিমি` : `Distance: ${rep.distance_km} km`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lang === 'bn' ? `গ্রাম: ${rep.village} (${rep.reported_ago})` : `Village: ${rep.village} (reported recently)`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onNavigateToMedicine}
            className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center justify-center space-x-1 transition-all"
          >
            <span>{t.advancedNasa.remedyBtn}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Insurance Certificate Modal */}
      <InsuranceCertificateModal 
        isOpen={insuranceModalOpen}
        onClose={() => setInsuranceModalOpen(false)}
        farmerProfile={farmerProfile}
        plotData={plotData}
      />
    </div>
  );
};
export default AdvancedNasaSection;
