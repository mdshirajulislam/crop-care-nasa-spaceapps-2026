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
import { MessageSquareQuote, Sparkles } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
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

      {/* Floating AI Voice Assistant Button */}
      {activeTab !== 'chat' && (
        <button
          onClick={() => setActiveTab('chat')}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white shadow-2xl shadow-purple-900/60 border border-purple-400/40 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 group"
          title={lang === 'bn' ? "কৃষি এআই বিশেষজ্ঞের সাথে কথা বলুন" : "Chat with Agro AI Expert"}
        >
          <MessageSquareQuote className="w-6 h-6" />
          <span className="text-xs font-bold pr-1 hidden sm:inline">
            {lang === 'bn' ? 'কৃষি এআই সহায়তা' : 'Agro AI Assistant'}
          </span>
        </button>
      )}

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
