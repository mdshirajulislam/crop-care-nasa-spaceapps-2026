import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, VolumeX, Sparkles, X, 
  Send, Bot, User, Radio, ArrowRight, CornerDownLeft, Loader2, Music
} from 'lucide-react';
import { askVoiceAgent } from '../utils/api';

const QUICK_PROMPTS = [
  "কালকে কি সার দেওয়া যাবে?",
  "আমার জমিতে কি পানি লাগবে?",
  "গাছের জ্বর বা তাপমাত্রা কেমন?",
  "আগামী ৩ দিন কি বৃষ্টির সম্ভাবনা আছে?",
  "ধানের ব্লাস্ট বা পোকা দমনে কি ওষুধ দেব?"
];

export const VoiceAgroAssistantModal = ({ isOpen, onClose, currentPlot, farmerProfile }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState('bn-BD-PradeepNeural'); // 'bn-BD-PradeepNeural' or 'bn-BD-NabanitaNeural'

  const [messages, setMessages] = useState([
    {
      id: 'init',
      sender: 'bot',
      text: `আসসালামু আলাইকুম! আমি আপনার 'কৃষি বন্ধু' ভয়েস সহকারী। আপনার ${currentPlot?.crop_name || 'আমন ধান'} ফসলের সার, সেচ, গাছের তাপমাত্রা বা আবহাওয়া নিয়ে যেকোনো প্রশ্ন মুখে বলতে পারেন।`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      audio_url: `/api/v1/chat/tts?text=${encodeURIComponent("আসসালামু আলাইকুম! আমি আপনার কৃষি বন্ধু ভয়েস সহকারী। আপনার ফসলের সার, সেচ, গাছের তাপমাত্রা বা আবহাওয়া নিয়ে যেকোনো প্রশ্ন মুখে বলতে পারেন।")}&voice=bn-BD-PradeepNeural`
    }
  ]);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Cleanup audio when unmounted or closed
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Initialize Web Speech Recognition (for voice input)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'bn-BD'; // Bengali (Bangladesh)

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        setInputText(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("আপনার ব্রাউজারে স্পিচ রিকগনিশন সমর্থন করে না। আপনি নিচে লিখেও প্রশ্ন করতে পারেন।");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Recognition start error:", e);
      }
    }
  };

  const playAudio = (audioUrl, text, messageId = null) => {
    stopSpeaking();

    // Use Edge-TTS endpoint if audioUrl not directly passed
    const targetUrl = audioUrl || `/api/v1/chat/tts?text=${encodeURIComponent(text)}&voice=${selectedVoice}`;

    try {
      const audio = new Audio(targetUrl);
      audioRef.current = audio;
      setIsSpeaking(true);
      if (messageId) setCurrentPlayingId(messageId);

      audio.play().catch(err => {
        console.warn("Audio autoplay blocked or failed, falling back to speech synthesis:", err);
        speakTextFallback(text);
      });

      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentPlayingId(null);
      };

      audio.onerror = () => {
        console.warn("Audio stream error, falling back to speech synthesis");
        setIsSpeaking(false);
        setCurrentPlayingId(null);
        speakTextFallback(text);
      };
    } catch (e) {
      console.error("Audio playback error:", e);
      speakTextFallback(text);
    }
  };

  const speakTextFallback = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentPlayingId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentPlayingId(null);
    };
    window.speechSynthesis.speak(utterance);
  };

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
    setCurrentPlayingId(null);
  };

  const handleSendMessage = async (queryText) => {
    const query = (queryText || inputText).trim();
    if (!query || isProcessing) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    stopSpeaking();

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setTranscript('');
    setIsProcessing(true);

    try {
      const lat = farmerProfile?.lat ?? 24.7471;
      const lon = farmerProfile?.lon ?? 90.4203;
      const res = await askVoiceAgent({
        message: query,
        plot_name: currentPlot?.name || "প্লট ১",
        crop_name: currentPlot?.crop_name || "আমন ধান",
        lat: lat,
        lon: lon,
        land_bigha: currentPlot?.area_value || 3.5,
        voice: selectedVoice
      });

      const botReply = res.spoken_text_bn || res.reply_bn || "ধন্যবাদ! আপনার প্রশ্নটি পেয়েছি।";
      const newMsgId = (Date.now() + 1).toString();
      const botMsg = {
        id: newMsgId,
        sender: 'bot',
        text: botReply,
        source: res.source,
        audio_url: res.audio_url,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      playAudio(res.audio_url, botReply, newMsgId);
    } catch (err) {
      console.error("Voice Agent Query Error:", err);
      const errMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "দুঃখিত চাচা, নাসার স্যাটেলাইট সার্ভারের সাথে সংযোগে সামান্য বিঘ্ন ঘটেছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">কৃষি বন্ধু ভয়েস সহকারী</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 font-mono">
                  Edge-TTS Neural
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5 flex items-center gap-1.5">
                <span>{currentPlot?.name || 'পূর্বের মাঠ'}</span>
                <span>•</span>
                <span>{currentPlot?.crop_name || 'আমন ধান'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Voice Persona Switcher */}
            <div className="hidden sm:flex items-center bg-black/20 p-1 rounded-xl text-xs gap-1 border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedVoice('bn-BD-PradeepNeural')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                  selectedVoice === 'bn-BD-PradeepNeural'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
                title="প্রদীপ ভাই (পুরুষ কণ্ঠ)"
              >
                👨‍🌾 প্রদীপ
              </button>
              <button
                type="button"
                onClick={() => setSelectedVoice('bn-BD-NabanitaNeural')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                  selectedVoice === 'bn-BD-NabanitaNeural'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
                title="নবনিতা আপা (মহিলা কণ্ঠ)"
              >
                👩‍🌾 নবনিতা
              </button>
            </div>

            {isSpeaking && (
              <button 
                onClick={stopSpeaking}
                className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                title="ভয়েস বন্ধ করুন"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}

            <button 
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-2 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Neural Voice Status Pill */}
        {isSpeaking && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between text-xs text-emerald-800 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                <span className="w-1.5 h-3 bg-emerald-600 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-4 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-1.5 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.3s]"></span>
              </span>
              <span className="font-medium">
                {selectedVoice === 'bn-BD-PradeepNeural' ? 'প্রদীপ ভাই' : 'নবনিতা আপা'} প্রাকৃতিক বাংলায় কথা বলছেন...
              </span>
            </div>
            <button
              onClick={stopSpeaking}
              className="text-[11px] text-rose-600 font-bold hover:underline"
            >
              থামান
            </button>
          </div>
        )}

        {/* Chat / Transcript Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70">
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                m.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[84%] rounded-2xl p-3.5 shadow-2xs text-sm leading-relaxed ${
                m.sender === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
              }`}>
                <p>{m.text}</p>
                
                <div className={`flex items-center justify-between gap-2 mt-2 pt-1.5 border-t ${
                  m.sender === 'user' ? 'border-emerald-500/50 text-emerald-200' : 'border-slate-100 text-slate-400'
                } text-[10px]`}>
                  <div className="flex items-center gap-1.5">
                    <span>{m.timestamp}</span>
                    {m.source && (
                      <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                        {m.source}
                      </span>
                    )}
                  </div>

                  {m.sender === 'bot' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isSpeaking && currentPlayingId === m.id) {
                          stopSpeaking();
                        } else {
                          playAudio(m.audio_url, m.text, m.id);
                        }
                      }}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                        isSpeaking && currentPlayingId === m.id
                          ? 'bg-emerald-100 text-emerald-700 font-bold'
                          : 'hover:bg-slate-100 text-slate-500'
                      }`}
                      title="পুনরায় শুনুন"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isSpeaking && currentPlayingId === m.id ? 'শুনছেন...' : 'শুনুন'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>নাসার লাইভ স্যাটেলাইট ও কৃষি ডাটা বিশ্লেষণ করে উত্তর প্রস্তুত হচ্ছে...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 flex-shrink-0">দ্রুত প্রশ্ন:</span>
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 whitespace-nowrap transition-colors border border-slate-200/70"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Large Voice Microphone & Input Section */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col items-center gap-3">
          
          {/* Pulsating Voice Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={toggleListening}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                isListening 
                  ? 'bg-rose-500 text-white ring-8 ring-rose-200 animate-pulse scale-110' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              }`}
              title={isListening ? "রেকর্ডিং থামাতে চাপুন" : "কথা বলতে চাপুন"}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <span className="text-xs font-semibold mt-2 text-slate-600">
              {isListening ? "🔴 আপনার কথা শুনছি... (বাংলায় বলুন)" : "কথা বলতে মাইকে চাপ দিন"}
            </span>
          </div>

          {/* Fallback Text Input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="w-full flex items-center gap-2 mt-1"
          >
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="অথবা এখানে যেকোনো প্রশ্ন বাংলায় লিখুন..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
