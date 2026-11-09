import React, { useState, useEffect } from 'react';
import { 
  Droplets, Waves, ShieldAlert, Award, FileText, ChevronRight, 
  MapPin, AlertCircle, ArrowUpRight, DollarSign, Sparkles, Loader2, Gauge
} from 'lucide-react';
import { fetchIrrigationAdvisor, fetchFlashFloodWarning, fetchPestRadar } from '../utils/api';
import { toBanglaDigits, formatBDT } from '../utils/banglaNumbers';
import { InsuranceCertificateModal } from './InsuranceCertificateModal';
import { FlashFloodHailstormShieldCard } from './FlashFloodHailstormShieldCard';
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
        const lat = farmerProfile?.lat ?? 24.7471;
        const lon = farmerProfile?.lon ?? 90.4203;
        const [irrData, floodData, radarData] = await Promise.all([
          fetchIrrigationAdvisor('aman_rice', plotData?.area_value || 3.5, lat, lon),
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
  }, [farmerProfile, plotData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white rounded-3xl border border-slate-200">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="ml-2.5 text-xs font-semibold text-slate-600">
          নাসার লাইভ স্যাটেলাইট আর্দ্রতা ও পাহাড়ি ঢল ডাটা লোড হচ্ছে...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. NASA GPM Flash Flood & Hailstorm Shield (Interactive Decision Window) */}
      {floodAlert && (
        <FlashFloodHailstormShieldCard 
          floodAlert={floodAlert}
          currentPlot={plotData}
        />
      )}

      {/* Header for Telemetry & Insurance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shadow-xs">
            <Gauge className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
              {t.advancedNasa.title}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              NASA SMAP Root-Zone Moisture & Community Radar
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. NASA SMAP Smart Irrigation Advisor */}
        {irrigation && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md hover:shadow-xl hover:border-sky-400 cursor-pointer transition-all duration-300 space-y-4 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 to-sky-600"></div>
            <div className="space-y-3">
              <div className="flex items-center justify-between mt-1">
                <span className="text-[13px] font-extrabold text-sky-900 flex items-center gap-2 uppercase tracking-wide">
                  <Droplets className="w-5 h-5 text-sky-600" />
                  {t.advancedNasa.smapTitle}
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                  irrigation.status === 'hold' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {lang === 'bn' ? irrigation.action_badge : (irrigation.status === 'hold' ? 'Delay Irrigation' : 'Water Needed')}
                </span>
              </div>

              <div className="flex items-baseline space-x-2 pt-2">
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {toBanglaDigits(irrigation.soil_moisture_pct, lang)}%
                </span>
                <span className="text-[13px] text-slate-600 font-bold">
                  {t.advancedNasa.soilMoisture} ({lang === 'bn' ? irrigation.moisture_status_bn : 'Moist Root Zone'})
                </span>
              </div>

              <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                {lang === 'bn' ? irrigation.recommendation_bn : (irrigation.recommendation_en || "Soil moisture in root zone is at 38%. Rainfall forecast within 48h will supply adequate water, saving diesel irrigation costs.")}
              </p>
            </div>

            {/* Diesel Savings Badge */}
            {irrigation.savings?.money_bdt > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-between text-[13px] shadow-sm">
                <span className="text-slate-800 flex items-center gap-1 font-bold">
                  {t.advancedNasa.dieselSavings}
                </span>
                <span className="font-extrabold text-emerald-800">
                  {toBanglaDigits(irrigation.savings.diesel_liters, lang)} {lang === 'bn' ? 'লিটার' : 'L'} ({formatBDT(irrigation.savings.money_bdt, lang)})
                </span>
              </div>
            )}
          </div>
        )}

        {/* 2. Community Crowdsourced Pest & Outbreak Radar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md hover:shadow-xl hover:border-rose-400 cursor-pointer transition-all duration-300 space-y-4 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-400 to-rose-600"></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between mt-1">
              <span className="text-[13px] font-extrabold text-rose-900 flex items-center gap-2 uppercase tracking-wide">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                {t.advancedNasa.radarTitle}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-900 border border-rose-300">
                {lang === 'bn' ? '৩টি স্থানীয় রিপোর্ট' : '3 Local Reports'}
              </span>
            </div>

            <p className="text-[13px] text-slate-700 font-semibold bg-rose-50/50 p-2 rounded-lg border border-rose-100">
              {lang === 'bn' 
                ? 'আপনার আশেপাশের ৫ কিমি সীমানায় কৃষকদের দ্বারা রিপোর্টকৃত রোগের লাইভ ট্র্যাক:' 
                : 'Live localized outbreak reports from farms within 5km radius:'}
            </p>

            <div className="space-y-2 pt-2">
              {pestRadar.slice(0, 2).map((rep) => (
                <div key={rep.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 shadow-sm hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-[13px]">{rep.pest_or_disease}</span>
                    <span className="text-[11px] text-rose-800 font-mono font-bold bg-white px-2 py-1 rounded-md border border-rose-200 shadow-sm">
                      {lang === 'bn' ? `দূরত্ব: ${toBanglaDigits(rep.distance_km, 'bn')} কিমি` : `Distance: ${rep.distance_km} km`}
                    </span>
                  </div>
                  <div className="text-[12px] text-slate-600 font-medium pt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {lang === 'bn' ? `${rep.village} (${rep.reported_ago})` : `${rep.village} (reported recently)`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onNavigateToMedicine}
            className="w-full mt-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center space-x-1 transition-colors"
          >
            <span>{t.advancedNasa.viewTreatment}</span>
            <ChevronRight className="w-4 h-4" />
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
