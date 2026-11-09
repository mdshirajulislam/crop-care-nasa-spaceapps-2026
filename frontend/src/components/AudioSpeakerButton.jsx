import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';
import { useLanguage } from '../contexts/LanguageContext';

export const AudioSpeakerButton = ({ text, className = "", size = 18 }) => {
  const { speak, stopSpeaking, isSpeaking, currentText } = useVoice();
  const { lang } = useLanguage();

  const isCurrentPlaying = isSpeaking && currentText === text;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isCurrentPlaying) {
      stopSpeaking();
    } else {
      speak(text, lang === 'en' ? 'en' : 'bn');
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={isCurrentPlaying ? (lang === 'bn' ? "ভয়েস থামান" : "Stop listening") : (lang === 'bn' ? "ন্যাচারাল ভয়েসে শুনুন" : "Listen aloud")}
      aria-label="Voice Readout"
      className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
        isCurrentPlaying
          ? 'bg-rose-500/20 text-rose-500 border border-rose-400/40 ring-2 ring-rose-400/30 animate-pulse'
          : 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 border border-emerald-500/30'
      } ${className}`}
    >
      {isCurrentPlaying ? <VolumeX size={size} className="text-rose-500" /> : <Volume2 size={size} />}
    </button>
  );
};
