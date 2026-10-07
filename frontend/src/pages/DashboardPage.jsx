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
