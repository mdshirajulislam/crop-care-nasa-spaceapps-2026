import React, { useState, useRef, useEffect } from 'react';
import { askAiAssistant } from '../utils/api';
import { MessageSquare, Send, Mic, MicOff, Volume2, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';
import { useLanguage } from '../contexts/LanguageContext';

export const ExpertChatPage = () => {
  const { lang, t } = useLanguage();
  const { speak } = useVoice();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: lang === 'bn'
        ? 'আসসালামু আলাইকুম সিরাজুল ভাই! আমি আপনার কৃষি বন্ধু এআই সহকারী। আপনার ৩.৫ বিঘা আমন ধানের জমি, আবহাওয়া, রোগবালাই বা সার প্রয়োগ সম্পর্কিত যে কোনো প্রশ্ন বাংলায় মুখে বলুন বা লিখে জানান।'
        : 'Hello Sirajul! I am your AI Agriculture Advisor. Feel free to speak or type any questions regarding your 3.5 bigha Aman rice field, weather, diseases, or fertilizer schedules.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim()) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await askAiAssistant(textToSend);
      const botMsg = { sender: 'bot', text: res.reply_bn };
      setMessages((prev) => [...prev, botMsg]);
      // Speak the answer aloud for audio accessibility
      speak(res.reply_bn, lang === 'bn' ? 'bn-BD' : 'en-US');
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { 
          sender: 'bot', 
          text: lang === 'bn' 
            ? 'দুঃখিত, সংযোগে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Sorry, temporary connection issue. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(lang === 'bn' 
        ? 'আপনার ব্রাউজারে ভয়েস রিকগনিশন সমর্থন করে না। অনুগ্রহ করে ক্রোম ব্রাউজার ব্যবহার করুন।'
        : 'Voice recognition is not supported in your browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };

    recognition.start();
  };

  const quickPromptsBn = [
    "আমন ধানে ইউরিয়া সার কবে দেব?",
    "ব্লাস্ট রোগের আক্রমণ হলে কী ওষুধ দেব?",
    "আজ কি জমিতে সেচ দেওয়ার প্রয়োজন আছে?",
    "হাওরে কি আগাম বন্যার কোনো ঝুঁকি আছে?",
    "ফসল ক্ষতির নাসা বীমা সনদ কীভাবে পাব?"
  ];

  const quickPromptsEn = [
    "When should I apply urea fertilizer to Aman rice?",
    "What medicine should I use for blast disease?",
    "Is irrigation needed on my field today?",
    "Is there any flash flood risk in Haor?",
    "How can I get a NASA satellite crop insurance certificate?"
  ];

  const quickPrompts = lang === 'bn' ? quickPromptsBn : quickPromptsEn;

  return (
    <div className="space-y-4 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-2 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              {t.chat.title}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {t.chat.subtitle}
            </p>
          </div>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-600" />
          {lang === 'bn' ? 'ভয়েস ইনপুট ও অডিও সক্রিয়' : 'Voice Input & Audio Enabled'}
        </span>
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-medium flex-shrink-0">
          {lang === 'bn' ? 'দ্রুত প্রশ্ন:' : 'Quick Prompts:'}
        </span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex-shrink-0 transition-all text-xs shadow-xs font-medium"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 h-[420px] sm:h-[480px] overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-purple-600 text-white shadow-sm'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none shadow-sm'
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
              {msg.sender === 'bot' && (
                <button
                  onClick={() => speak(msg.text, lang === 'bn' ? 'bn-BD' : 'en-US')}
                  className="mt-2 text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'পুনরায় শুনুন' : 'Re-listen'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 pl-11">
            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            <span>{lang === 'bn' ? 'কৃষি এআই উত্তর প্রস্তুত করছে...' : 'AI Advisor is preparing answer...'}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleVoiceInput}
          className={`p-3 rounded-xl border transition-all ${
            isRecording
              ? 'bg-red-600 text-white border-red-500 animate-pulse'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
          }`}
          title={lang === 'bn' ? "বাংলায় মুখে বলুন" : "Speak voice input"}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-600" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t.chat.placeholder}
          className="flex-1 bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm placeholder:text-slate-400"
        />

        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-all shadow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
