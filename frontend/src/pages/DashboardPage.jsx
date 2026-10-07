import React, { useState, useEffect } from 'react';
import { TopAlertBanner } from '../components/TopAlertBanner';
import { WeatherCard } from '../components/WeatherCard';
import { LandHealthCard } from '../components/LandHealthCard';
import { QuickActionGrid } from '../components/QuickActionGrid';
import { AdvancedNasaSection } from '../components/AdvancedNasaSection';
import { fetchWeather, fetchPlots, fetchOutbreakAlerts, fetchProfile } from '../utils/api';
import { AlertOctagon, PhoneCall, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { AudioSpeakerButton } from '../components/AudioSpeakerButton';
import { toBanglaDigits } from '../utils/banglaNumbers';
import { useLanguage } from '../contexts/LanguageContext';

export const DashboardPage = ({ setActiveTab }) => {
  const { lang, t } = useLanguage();
  const [weatherData, setWeatherData] = useState(null);
  const [plotData, setPlotData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [outbreaks, setOutbreaks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [wData, pData, oData, prof] = await Promise.all([
          fetchWeather(),
          fetchPlots(),
          fetchOutbreakAlerts(),
          fetchProfile().catch(() => null)
        ]);
        setWeatherData(wData);
        setPlotData(pData);
        setOutbreaks(oData || []);
        setProfileData(prof);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-10 h-10 text-agro-400 animate-spin" />
        <p className="text-sm text-agro-300 font-medium">নাসা স্যাটেলাইট ও আবহাওয়া তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  const sprayAdvisor = weatherData?.pesticide_spray_advisor;
  const primaryOutbreak = outbreaks[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Welcome & Telemetry Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-slate-700/50 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 w-80 h-full bg-radial-gradient from-emerald-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {lang === 'bn' ? 'নাসা লাইভ কানেক্টেড' : 'NASA Live Telemetry Connected'}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {lang === 'bn' ? 'ময়মনসিংহ সদর • বোরো/আমন মওসুম' : 'Mymensingh Sadar • Season Active'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              {lang === 'bn' ? 'কৃষি ড্যাশবোর্ড ও স্যাটেলাইট মনিটরিং' : 'Agro Command Center & Satellite Telemetry'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {lang === 'bn' 
                ? 'নাসার SMAP মৃত্তিকা আর্দ্রতা ও GPM বৃষ্টিপাত তথ্য দ্বারা আপনার ফসলের মাঠ সরাসরি পর্যবেক্ষণ করা হচ্ছে।'
                : 'Real-time hyper-local soil wetness, climate metrics, and disease surveillance for optimal yield.'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">
                {lang === 'bn' ? 'পরবর্তী সেচ' : 'Next Irrigation'}
              </span>
              <span className="text-sm font-bold text-emerald-300">
                {lang === 'bn' ? '৪ দিন পর' : 'In 4 Days'}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">
                {lang === 'bn' ? 'ফসলের স্বাস্থ্য' : 'Crop Health'}
              </span>
              <span className="text-sm font-bold text-white">
                NDVI 0.68 (উত্তম)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Top Emergency / Spray Advisory Alert */}
      <TopAlertBanner sprayAdvisor={sprayAdvisor} />

      {/* 2. Weather Forecast Card with accurate Bengali days & NASA baseline */}
      <WeatherCard weatherData={weatherData} />

      {/* 3. Advanced NASA Earth Science Innovations (SMAP Irrigation, GPM Flash Flood, Parametric Insurance & Pest Radar) */}
      <AdvancedNasaSection 
        farmerProfile={profileData}
        plotData={plotData}
        onNavigateToMedicine={() => setActiveTab('medicine')}
      />

      {/* 4. Land Health & NDVI Card */}
      <LandHealthCard 
        plotData={plotData} 
        onNavigateToMap={() => setActiveTab('lands')}
        onNavigateToAdvisor={() => setActiveTab('advisor')}
      />

      {/* 4. Outbreak Alert Card (Nearby Farmers Alert) */}
      {primaryOutbreak && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-rose-200 bg-rose-50/50 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    {t.dashboardOutbreak.badge}
                  </span>
                  <span className="text-xs text-slate-600 font-semibold">
                    {primaryOutbreak.upazila}, {primaryOutbreak.district}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-1">
                  {lang === 'bn' ? primaryOutbreak.disease_name : (primaryOutbreak.disease_name_en || primaryOutbreak.disease_name)} — {toBanglaDigits(primaryOutbreak.report_count, lang)} {t.dashboardOutbreak.farmerReports}
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                  {lang === 'bn' ? primaryOutbreak.message_bn : (primaryOutbreak.message_en || "Pest/Disease detected in surrounding paddy fields. High humidity favors fungal spore multiplication.")}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2 flex-shrink-0">
              <AudioSpeakerButton 
                text={lang === 'bn' ? primaryOutbreak.message_bn : (primaryOutbreak.message_en || primaryOutbreak.message_bn)} 
                size={18} 
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50" 
              />
              <button
                onClick={() => setActiveTab('medicine')}
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 underline hidden sm:inline"
              >
                {t.dashboardOutbreak.viewRemedy}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Quick Action Grid */}
      <QuickActionGrid onNavigate={(tab) => setActiveTab(tab)} />

      {/* 6. Emergency Agro Helpline Banner */}
      <div className="rounded-2xl p-4 bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{t.dashboardOutbreak.helplineTitle}</h4>
            <p className="text-xs text-slate-500">{t.dashboardOutbreak.helplineDesc}</p>
          </div>
        </div>
        <a
          href="tel:16123"
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>{t.dashboardOutbreak.callBtn}</span>
        </a>
      </div>
    </div>
  );
};
