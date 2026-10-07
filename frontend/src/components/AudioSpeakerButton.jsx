import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';
import { useLanguage } from '../contexts/LanguageContext';

export const AudioSpeakerButton = ({ text, className = "", size = 18 }) => {
  const { speak, stopSpeaking, isSpeaking } = useVoice();
  const { lang } = useLanguage();

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(text, lang === 'en' ? 'en' : 'bn');
    }
  };

  return (
    <button
      onClick={handleToggle}
      title={lang === 'bn' ? "পড়ে শুনুন" : "Listen aloud"}
      aria-label="Voice Readout"
      className={`p-1.5 rounded-full bg-agro-600/30 hover:bg-agro-500/50 text-agro-300 border border-agro-500/30 transition-all ${className}`}
    >
      {isSpeaking ? <VolumeX size={size} className="text-red-400 animate-pulse" /> : <Volume2 size={size} />}
    </button>
  );
};
