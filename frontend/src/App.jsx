import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { VoiceProvider } from './contexts/VoiceContext';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { PlantingAdvisorPage } from './pages/PlantingAdvisorPage';
import { DiseaseDiagnosisPage } from './pages/DiseaseDiagnosisPage';
import { FarmDiaryPage } from './pages/FarmDiaryPage';
import { SatelliteMapPage } from './pages/SatelliteMapPage';
import { MedicineGuidePage } from './pages/MedicineGuidePage';
import { ExpertChatPage } from './pages/ExpertChatPage';
import { LandManagementPage } from './pages/LandManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { VoiceAgroAssistantModal } from './components/VoiceAgroAssistantModal';
import { Mic, Sparkles } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const { lang, t } = useLanguage();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} />;
      case 'advisor':
        return <PlantingAdvisorPage />;
      case 'diagnosis':
        return <DiseaseDiagnosisPage />;
      case 'diary':
        return <FarmDiaryPage />;
      case 'satellite':
        return <SatelliteMapPage />;
      case 'medicine':
        return <MedicineGuidePage />;
      case 'chat':
        return <ExpertChatPage />;
      case 'lands':
        return <LandManagementPage />;
      case 'settings':
      case 'profile':
        return <SettingsPage />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {renderActivePage()}
      </main>

      {/* Global Sleek Voice Agro Assistant Floating Action Button */}
      <button
        onClick={() => setVoiceModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white shadow-2xl shadow-purple-900/40 border-2 border-white/80 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
        title={lang === 'bn' ? "কৃষি বন্ধুকে মুখে বাংলায় প্রশ্ন করুন" : "Speak to Agro AI Voice Assistant"}
      >
        <Mic className="w-6 h-6 animate-pulse" />
        <span className="text-xs font-bold pr-1 hidden sm:inline">
          {lang === 'bn' ? 'কৃষি বন্ধু ভয়েস' : 'Voice AI'}
        </span>
      </button>

      {/* Global Voice Assistant Modal */}
      <VoiceAgroAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">
          Crop Care (কৃষি বন্ধু) — NASA Space Apps Challenge 2026
        </p>
        <p className="text-[11px] text-slate-400">
          Data Sources: NASA POWER Climatology, NASA GIBS NDVI (MODIS/HLS), Open-Meteo High Resolution Forecast & Agro AI
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <VoiceProvider>
        <AppContent />
      </VoiceProvider>
    </LanguageProvider>
  );
}
