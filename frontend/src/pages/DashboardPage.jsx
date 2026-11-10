import React, { useState, useEffect } from 'react';
import { TopAlertBanner } from '../components/TopAlertBanner';
import { WeatherCard } from '../components/WeatherCard';
import { LandHealthCard } from '../components/LandHealthCard';
import { QuickActionGrid } from '../components/QuickActionGrid';
import { AdvancedNasaSection } from '../components/AdvancedNasaSection';
import { PlantThermalStressCard } from '../components/PlantThermalStressCard';
import { VoiceAgroAssistantModal } from '../components/VoiceAgroAssistantModal';
import { CropCareAdvisoryModal } from '../components/CropCareAdvisoryModal';
import { fetchWeather, fetchPlots, fetchOutbreakAlerts, fetchProfile, fetchThermalStress, fetchIrrigationAdvisor } from '../utils/api';
import { 
  AlertOctagon, PhoneCall, ChevronRight, Sparkles, Loader2, 
  Mic, Thermometer, Droplets, Sun, ShieldAlert, LayoutDashboard, Satellite, Bug
} from 'lucide-react';
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
  
  // Modals state
  const [careModalOpen, setCareModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Clean View Segment Filter: 'overview' | 'nasa' | 'health' | 'all'
  const [viewSegment, setViewSegment] = useState('overview');

  // Mini summary metrics
  const [thermalSummary, setThermalSummary] = useState(null);
  const [irrigationSummary, setIrrigationSummary] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const prof = await fetchProfile().catch(() => null);
        setProfileData(prof);
        const lat = prof?.lat ?? 24.7471;
        const lon = prof?.lon ?? 90.4203;

        const locParts = [
          prof?.village,
          prof?.ward,
          prof?.union_name,
          prof?.upazila,
          prof?.district
        ].filter(Boolean);
        const locName = locParts.length > 0 ? locParts.join(', ') : '';

        const [wData, pData, oData, tData, iData] = await Promise.all([
          fetchWeather(lat, lon, locName).catch(() => null),
          fetchPlots().catch(() => null),
          fetchOutbreakAlerts().catch(() => []),
          fetchThermalStress('aman_rice', 3.5, lat, lon).catch(() => null),
          fetchIrrigationAdvisor('aman_rice', 3.5, lat, lon).catch(() => null)
        ]);

        setWeatherData(wData);
        setPlotData(pData);
        setOutbreaks(oData || []);
        setThermalSummary(tData);
        setIrrigationSummary(iData);
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
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-600 font-medium">নাসা স্যাটেলাইট ও আবহাওয়া তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  const sprayAdvisor = weatherData?.pesticide_spray_advisor;
  const primaryOutbreak = outbreaks[0];

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Clean Hero Executive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-radial-gradient from-emerald-500/15 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {lang === 'bn' ? 'নাসা লাইভ স্যাটেলাইট যুক্ত' : 'NASA Live Telemetry Connected'}
              </span>
              <button
                onClick={() => setActiveTab('settings')}
                className="text-xs text-slate-300 hover:text-emerald-300 font-medium transition-colors cursor-pointer flex items-center gap-1 hover:underline underline-offset-2"
                title={lang === 'bn' ? 'প্রোফাইল ও অবস্থান দেখুন' : 'View Profile & Location'}
              >
                {profileData?.upazila 
                  ? `${profileData.village ? profileData.village + ', ' : ''}${profileData.upazila}, ${profileData.district}`
                  : (lang === 'bn' ? 'ময়মনসিংহ সদর • আমন ও বোরো মওসুম' : 'Mymensingh Sadar • Season Active')}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {lang === 'bn' ? 'কৃষি বন্ধু ড্যাশবোর্ড' : 'Agro Command Center'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {lang === 'bn' 
                ? 'নাসার লাইভ স্যাটেলাইট আর্দ্রতা ও তাপমাত্রা ডাটা দিয়ে আপনার ফসলের মাঠ সার্বক্ষণিক পর্যবেক্ষণ করা হচ্ছে।'
                : 'Real-time hyper-local soil wetness, climate metrics, and plant thermal monitoring for maximum yield.'}
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-purple-400/30"
              title="মুখে বাংলায় কথা বলে পরামর্শ নিন"
            >
              <Mic className="w-4 h-4 animate-pulse text-purple-200" />
              <span>{lang === 'bn' ? 'ভয়েস এআই সহকারী' : 'Voice AI Assistant'}</span>
            </button>

            <button
              onClick={() => setCareModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg hover:shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/30"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>{lang === 'bn' ? 'সার ও স্প্রে শিডিউল' : 'Crop Care Schedule'}</span>
            </button>
          </div>
        </div>

        {/* Mini 3-Card Summary KPIs inside Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          
          {/* KPI 1: Spray Condition */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              sprayAdvisor?.status === 'hold'
                ? 'bg-rose-500/30 text-rose-300'
                : sprayAdvisor?.status === 'caution'
                ? 'bg-amber-500/30 text-amber-300'
                : 'bg-emerald-500/30 text-emerald-300'
            }`}>
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-300 font-medium">
                {lang === 'bn' ? 'আজকের স্প্রে পরামর্শ' : "Today's Spray Advice"}
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  sprayAdvisor?.status === 'hold'
                    ? 'bg-rose-400'
                    : sprayAdvisor?.status === 'caution'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}></span>
                <span>
                  {lang === 'bn'
                    ? (sprayAdvisor?.badge_bn || (sprayAdvisor?.status === 'hold' ? 'আজ স্প্রে স্থগিত রাখুন' : sprayAdvisor?.status === 'caution' ? 'সতর্কতার সাথে স্প্রে করুন' : 'স্প্রে করার অনুকূল দিন'))
                    : (sprayAdvisor?.badge_en || (sprayAdvisor?.status === 'hold' ? 'Hold Spray Today' : sprayAdvisor?.status === 'caution' ? 'Spray with Caution' : 'Optimal Day to Spray'))}
                </span>
              </div>
            </div>
          </div>

          {/* KPI 2: Irrigation Need */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              irrigationSummary?.status === 'hold' 
                ? 'bg-emerald-500/30 text-emerald-300' 
                : 'bg-sky-500/30 text-sky-300'
            }`}>
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-300 font-medium">
                {lang === 'bn' ? 'মাটির আর্দ্রতা ও সেচ' : 'Soil Moisture & Irrigation'}
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  irrigationSummary?.status === 'hold' ? 'bg-emerald-400' : 'bg-sky-400 animate-pulse'
                }`}></span>
                <span>
                  {lang === 'bn'
                    ? (irrigationSummary?.action_badge || (irrigationSummary?.status === 'hold' ? 'সেচ বন্ধ রাখুন (পানি পর্যাপ্ত)' : 'হালকা সেচ প্রদান করুন'))
                    : (irrigationSummary?.action_badge_en || (irrigationSummary?.status === 'hold' ? 'Hold Irrigation' : 'Light Irrigation Needed'))}
                </span>
              </div>
            </div>
          </div>

          {/* KPI 3: Plant Fever (ECOSTRESS) */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              thermalSummary?.stress_status === 'critical_fever'
                ? 'bg-rose-500/30 text-rose-300'
                : thermalSummary?.stress_status === 'mild_thirst'
                ? 'bg-amber-500/30 text-amber-300'
                : 'bg-emerald-500/30 text-emerald-300'
            }`}>
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-300 font-medium">
                {lang === 'bn' ? 'গাছের জ্বর (ECOSTRESS)' : 'Plant Fever (ECOSTRESS)'}
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  thermalSummary?.stress_status === 'critical_fever'
                    ? 'bg-rose-400 animate-ping'
                    : thermalSummary?.stress_status === 'mild_thirst'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}></span>
                <span>
                  {lang === 'bn'
                    ? (thermalSummary?.stress_level_bn || 'গাছ সুস্থ ও সতেজ')
                    : (thermalSummary?.stress_status === 'healthy' ? 'Healthy Canopy' : thermalSummary?.stress_status === 'mild_thirst' ? 'Mild Thirst' : 'Thermal Fever')}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Top Emergency Alert Banner (if spray warning or hazard) */}
      <TopAlertBanner 
        sprayAdvisor={sprayAdvisor} 
        farmerProfile={profileData}
        onNavigateSettings={() => setActiveTab('settings')}
      />

      {/* 3. Clean Category Navigation Segment Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setViewSegment('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            viewSegment === 'overview'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{lang === 'bn' ? 'প্রধান ড্যাশবোর্ড' : 'Overview'}</span>
        </button>

        <button
          onClick={() => setViewSegment('nasa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            viewSegment === 'nasa'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Satellite className="w-4 h-4" />
          <span>{lang === 'bn' ? 'নাসা স্পেস শিল্ড' : 'NASA Space Shield'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">ECOSTRESS</span>
        </button>

        <button
          onClick={() => setViewSegment('health')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            viewSegment === 'health'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bug className="w-4 h-4" />
          <span>{lang === 'bn' ? 'মাঠের স্বাস্থ্য ও রোগ' : 'Field & Health'}</span>
          {outbreaks.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setViewSegment('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            viewSegment === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>{lang === 'bn' ? 'সকল তথ্য একসাথে' : 'View All'}</span>
        </button>
      </div>

      {/* 4. Tab Segment 1: Main Overview (আবহাওয়া + কুইক অ্যাকশন) */}
      {(viewSegment === 'overview' || viewSegment === 'all') && (
        <div className="space-y-6 animate-fade-in">
          {/* Weather Card */}
          <WeatherCard weatherData={weatherData} farmerProfile={profileData} />

          {/* Quick Action 5 Grid */}
          <QuickActionGrid 
            onNavigate={(tab) => {
              if (tab === 'care_schedule') {
                setCareModalOpen(true);
              } else if (tab === 'chat') {
                setVoiceModalOpen(true);
              } else {
                setActiveTab(tab);
              }
            }} 
          />
        </div>
      )}

      {/* 5. Tab Segment 2: NASA Space Shield (গাছের জ্বর + স্মার্ট সেচ + বন্যা) */}
      {(viewSegment === 'nasa' || viewSegment === 'all') && (
        <div className="space-y-6 animate-fade-in">
          {/* NASA ECOSTRESS Plant Thermal Stress & Hidden Thirst Detector */}
          <PlantThermalStressCard 
            plotData={plotData} 
            farmerProfile={profileData} 
          />

          {/* Advanced NASA Earth Science (SMAP Irrigation, GPM Flash Flood, Insurance) */}
          <AdvancedNasaSection 
            farmerProfile={profileData}
            plotData={plotData}
            onNavigateToMedicine={() => setActiveTab('medicine')}
          />
        </div>
      )}

      {/* 6. Tab Segment 3: Field Health & Outbreak Alerts (জমি + রোগ নজরদারি) */}
      {(viewSegment === 'health' || viewSegment === 'all') && (
        <div className="space-y-6 animate-fade-in">
          {/* Land Health & NDVI Card */}
          <LandHealthCard 
            plotData={plotData} 
            onNavigateToMap={() => setActiveTab('lands')}
            onNavigateToAdvisor={() => setActiveTab('advisor')}
          />

          {/* Outbreak Alert Card (Nearby Farmers Alert) */}
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

          {/* Emergency Agro Helpline Banner */}
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
      )}

      {/* Crop Care & Spray Advisory Modal */}
      <CropCareAdvisoryModal
        isOpen={careModalOpen}
        onClose={() => setCareModalOpen(false)}
        onPlotSaved={() => fetchPlots().then(setPlotData).catch(() => null)}
      />

      {/* Two-Way Conversational Voice AI Assistant Modal */}
      <VoiceAgroAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        currentPlot={plotData}
        farmerProfile={profileData}
      />
    </div>
  );
};
