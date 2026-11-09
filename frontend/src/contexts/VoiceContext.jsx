import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState(null);
  const [voicePersona, setVoicePersona] = useState('bn-BD-PradeepNeural'); // 'bn-BD-PradeepNeural' (Male) or 'bn-BD-NabanitaNeural' (Female)
  const audioRef = useRef(null);

  // Stop any playing audio when component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const stopSpeaking = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {
        // ignore
      }
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCurrentText(null);
  };

  const speak = (text, lang = 'bn') => {
    if (!text || !text.trim()) return;

    // If currently speaking this exact text, toggle off
    if (isSpeaking && currentText === text) {
      stopSpeaking();
      return;
    }

    stopSpeaking();
    setCurrentText(text);

    // Primary Engine: Microsoft Edge-TTS Neural Audio Stream
    const targetVoice = voicePersona;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const ttsUrl = `${baseUrl}/api/v1/chat/tts?text=${encodeURIComponent(text.trim())}&voice=${targetVoice}`;

    try {
      const audio = new Audio(ttsUrl);
      audioRef.current = audio;
      setIsSpeaking(true);

      audio.play().catch((err) => {
        console.warn('Edge-TTS stream error, trying fallback:', err);
        fallbackSpeechSynthesis(text, lang);
      });

      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentText(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        console.warn('Edge-TTS playback error, trying fallback');
        fallbackSpeechSynthesis(text, lang);
      };
    } catch (e) {
      fallbackSpeechSynthesis(text, lang);
    }
  };

  const fallbackSpeechSynthesis = (text, lang) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false);
      setCurrentText(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'bn-BD';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentText(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentText(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <VoiceContext.Provider 
      value={{ 
        speak, 
        stopSpeaking, 
        isSpeaking, 
        currentText,
        voicePersona, 
        setVoicePersona 
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => useContext(VoiceContext);
