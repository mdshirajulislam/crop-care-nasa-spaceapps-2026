import React from 'react';
import { Camera, Calendar, PlusCircle, MessageSquareQuote, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const QuickActionGrid = ({ onNavigate }) => {
  const { lang, t } = useLanguage();

  const actions = [
    {
      id: 'diagnosis',
      title: t.quickActions.takePhoto,
      subtitle: lang === 'bn' ? 'পাতার ছবি তুলে এআই রোগ নির্ণয় ও সমাধান' : 'Diagnose plant disease via AI image scan',
      icon: Camera,
      color: 'from-emerald-600 to-teal-500',
      shadowColor: 'shadow-emerald-900/40',
      badge: lang === 'bn' ? 'এআই ডক্টর' : 'AI Doctor'
    },
    {
      id: 'advisor',
      title: t.quickActions.plantingAdvice,
      subtitle: lang === 'bn' ? 'নাসা ২০ বছরের তথ্যে রোপণের সেরা সময়' : 'NASA 20-Yr Climatology planting guide',
      icon: Calendar,
      color: 'from-amber-600 to-yellow-500',
      shadowColor: 'shadow-amber-900/40',
      badge: lang === 'bn' ? 'নাসা গাইড' : 'NASA Guide'
    },
    {
      id: 'diary',
      title: t.quickActions.logActivity,
      subtitle: lang === 'bn' ? 'সার, ওষুধ, শ্রমিক খরচ ও লাভের হিসাব' : 'Track expenses, activities & profit/loss',
      icon: PlusCircle,
      color: 'from-blue-600 to-cyan-500',
      shadowColor: 'shadow-blue-900/40',
      badge: lang === 'bn' ? 'কৃষি ডায়েরি' : 'Farm Diary'
    },
    {
      id: 'chat',
      title: t.quickActions.expertHelp,
      subtitle: lang === 'bn' ? 'মুখে বাংলায় বলুন বা চ্যাট করুন' : 'Voice/Text AI agro expert in Bangla',
      icon: MessageSquareQuote,
      color: 'from-purple-600 to-indigo-500',
      shadowColor: 'shadow-purple-900/40',
      badge: lang === 'bn' ? 'ভয়েস সহকারী' : 'Voice Assistant'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">
          {t.quickActions.sectionTitle}
        </h3>
        <span className="text-xs text-slate-500 font-medium">{t.quickActions.sectionSubtitle}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => onNavigate(act.id)}
              className="glass-card-hover group relative overflow-hidden rounded-2xl p-4 text-left border border-slate-200/90 bg-white flex flex-col justify-between h-40 transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${act.color} text-white shadow-md ${act.shadowColor} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  {act.badge}
                </span>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {act.title}
                </h4>
                <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-1 leading-snug">
                  {act.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
