import React, { useState, useEffect } from 'react';
import { fetchDiseaseLibrary } from '../utils/api';
import { Layers, Search, ShieldCheck, AlertTriangle, Droplets, Info, Loader2 } from 'lucide-react';
import { AudioSpeakerButton } from '../components/AudioSpeakerButton';
import { toBanglaDigits, formatBDT } from '../utils/banglaNumbers';
import { useLanguage } from '../contexts/LanguageContext';

export const MedicineGuidePage = () => {
  const { lang, t } = useLanguage();
  const [library, setLibrary] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiseaseLibrary()
      .then((data) => setLibrary(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = library.filter((item) => {
    const matchesSearch =
      item.disease_name_bn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.disease_name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symptoms_bn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.crop_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCrop = selectedCrop === 'all' || item.crop_name.includes(selectedCrop);
    return matchesSearch && matchesCrop;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {t.medicine.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {t.medicine.subtitle}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center gap-3 bg-white">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={t.medicine.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 text-slate-800 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="all">{lang === 'bn' ? 'সব ফসল' : 'All Crops'}</option>
            <option value="ধান">{lang === 'bn' ? 'ধান' : 'Rice'}</option>
            <option value="আলু">{lang === 'bn' ? 'আলু' : 'Potato'}</option>
            <option value="সরিষা">{lang === 'bn' ? 'সরিষা' : 'Mustard'}</option>
            <option value="ভুট্টা">{lang === 'bn' ? 'ভুট্টা' : 'Maize'}</option>
          </select>
        </div>
      </div>

      {/* Library Items Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-2xl p-5 border border-slate-200 bg-white space-y-3.5 flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {item.crop_name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">{item.severity}</span>
                    <AudioSpeakerButton 
                      text={`${item.disease_name_bn}। লক্ষণ: ${item.symptoms_bn}। জৈব প্রতিকার: ${item.organic_treatment_bn}। রাসায়নিক ঔষধ: ${item.chemical_treatment_bn}। মাত্রা: ${item.dosage_per_bigha}`}
                      size={18}
                      className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'bn' ? item.disease_name_bn : item.disease_name_en}
                </h3>
                <p className="text-xs text-slate-500 italic font-sans">{item.disease_name_en}</p>

                {/* Symptoms */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-700">{lang === 'bn' ? 'লক্ষণ:' : 'Symptoms:'}</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.symptoms_bn}</p>
                </div>

                {/* Organic Treatment */}
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-xs font-bold text-emerald-800">
                    {lang === 'bn' ? 'জৈব / ঘরোয়া প্রতিকার:' : 'Organic / Home Remedy:'}
                  </span>
                  <p className="text-xs text-emerald-900 leading-relaxed whitespace-pre-line">{item.organic_treatment_bn}</p>
                </div>

                {/* Chemical Medicine & Dosage */}
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1">
                  <span className="text-xs font-bold text-blue-800">
                    {lang === 'bn' ? 'রাসায়নিক ঔষধ ও প্রয়োগের মাত্রা:' : 'Chemical Medicine & Dosage:'}
                  </span>
                  <p className="text-xs text-slate-700 font-medium">
                    <strong>{lang === 'bn' ? 'গ্রুপ:' : 'Group:'}</strong> {item.chemical_treatment_bn}
                  </p>
                  <p className="text-xs text-amber-800 font-semibold mt-1">
                    <strong>{lang === 'bn' ? 'বিঘাপ্রতি মাত্রা:' : 'Dosage/Bigha:'}</strong> {item.dosage_per_bigha}
                  </p>
                </div>
              </div>

              {/* Safety Footnote */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{item.safety_precautions_bn}</span>
                <span className="font-bold text-emerald-700 ml-2">
                  {lang === 'bn' ? 'খরচ: ' : 'Cost: '}{formatBDT(item.estimated_cost_bdt, lang)}/{lang === 'bn' ? 'বিঘা' : 'Bigha'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
