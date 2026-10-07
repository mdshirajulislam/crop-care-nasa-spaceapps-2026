import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, ShieldCheck, Sparkles, DollarSign, PhoneCall, Loader2, RefreshCw, Layers } from 'lucide-react';
import { diagnoseDisease, fetchDiseaseLibrary } from '../utils/api';
import { AudioSpeakerButton } from '../components/AudioSpeakerButton';
import { toBanglaDigits, formatBDT } from '../utils/banglaNumbers';
import { useLanguage } from '../contexts/LanguageContext';

export const DiseaseDiagnosisPage = () => {
  const { lang, t } = useLanguage();
  const [diseaseLibrary, setDiseaseLibrary] = useState([]);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState('rice_blast');
  const [imagePreview, setImagePreview] = useState('/leaf.svg');
  const [cropHint, setCropHint] = useState('আমন ধান');
  const [landArea, setLandArea] = useState(3.5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDiseaseLibrary()
      .then((data) => {
        setDiseaseLibrary(data || []);
      })
      .catch(console.error);
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPredefined = (diseaseId) => {
    setSelectedDiseaseId(diseaseId);
    const found = diseaseLibrary.find(d => d.id === diseaseId);
    if (found) {
      setCropHint(found.crop_name);
    }
  };

  const handleDiagnose = async () => {
    setLoading(true);
    try {
      const res = await diagnoseDisease({
        image_base64: imagePreview,
        crop_hint: cropHint,
        disease_id: selectedDiseaseId,
        land_area_bigha: parseFloat(landArea) || 3.5
      });
      setResult(res);
    } catch (e) {
      console.error("Diagnosis error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t.diagnosis.title}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              AI Vision & Agro DB
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {t.diagnosis.subtitle}
          </p>
        </div>

        {result && (
          <AudioSpeakerButton 
            text={`${result.crop_name}-এর রোগ: ${result.disease_name_bn}। ${result.symptoms_bn}। প্রতিকার: ${result.treatment.organic_home_remedy} এবং রাসায়নিক ওষুধ: ${result.treatment.chemical_medicine}। মাত্রা: ${result.treatment.dosage_per_bigha}`}
            size={22}
            className="p-2.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          />
        )}
      </div>

      {/* Upload Box & Crop Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Image & Inputs */}
        <div className="md:col-span-1 space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              imagePreview 
                ? 'border-emerald-400 bg-emerald-50/30' 
                : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-slate-50'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />

            <div className="space-y-2 w-full">
              <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center">
                <img src={imagePreview} alt="Crop Leaf" className="object-contain w-full h-full p-2" />
              </div>
              <p className="text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" />
                {lang === 'bn' ? 'ছবি পরিবর্তন করতে ক্লিক করুন' : 'Click to change photo'}
              </p>
            </div>
          </div>

          {/* Disease/Symptom Selector (Deterministic input) */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              {t.diagnosis.selectDisease}:
            </label>
            <select
              value={selectedDiseaseId}
              onChange={(e) => handleSelectPredefined(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
            >
              {diseaseLibrary.map((d) => (
                <option key={d.id} value={d.id}>
                  {lang === 'bn' ? d.disease_name_bn : d.disease_name_en} ({d.crop_name})
                </option>
              ))}
            </select>
          </div>

          {/* Land Size for Dosage */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              {t.diagnosis.landAreaBigha}:
            </label>
            <input
              type="number"
              step="0.1"
              value={landArea}
              onChange={(e) => setLandArea(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-bold"
            />
            <span className="text-[11px] text-slate-500">
              {toBanglaDigits(landArea, lang)} {lang === 'bn' ? 'বিঘা' : 'Bigha'} = {toBanglaDigits(Math.round(landArea * 33 * 10) / 10, lang)} {lang === 'bn' ? 'শতক' : 'Decimals'}
            </span>
          </div>

          {/* Diagnose Action Button */}
          <button
            onClick={handleDiagnose}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{lang === 'bn' ? 'প্রেসক্রিপশন প্রস্তুত হচ্ছে...' : 'Generating prescription...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{t.diagnosis.diagnoseButton}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Prescription Result Display */}
        <div className="md:col-span-2 space-y-4">
          {!result ? (
            <div className="glass-card rounded-2xl p-8 border border-slate-200 bg-white text-center flex flex-col items-center justify-center min-h-[350px] space-y-3 shadow-sm">
              <ShieldCheck className="w-12 h-12 text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">
                {lang === 'bn' ? 'প্রেসক্রিপশন দেখতে বাটনে চাপ দিন' : 'Click the button to see diagnosis'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                {lang === 'bn' 
                  ? "বাম পাশের প্যানেল থেকে আপনার জমির পরিমাণ নিশ্চিত করে 'রোগ নির্ণয় ও চিকিৎসা দেখুন' বাটনে চাপ দিন।"
                  : "Select your disease/symptoms and confirm land area on the left, then click 'Analyze Disease & Remedies'."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              {/* Top Result Badge */}
              <div className="glass-card rounded-2xl p-5 border border-emerald-200 bg-emerald-50/60 space-y-3 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {lang === 'bn' ? 'শনাক্তকরণ (নিশ্চয়তা: ' : 'Confidence: '}
                      {toBanglaDigits(result.confidence_percentage, lang)}
                      {lang === 'bn' ? ')' : ''}
                    </span>
                    <span className="text-xs font-semibold text-amber-800 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-200">
                      {lang === 'bn' ? 'তীব্রতা: ' : 'Severity: '}{result.severity}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold shadow-xs">
                    {result.diagnosis_source || "AI Vision & Agro Engine"}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {lang === 'bn' ? result.disease_name_bn : result.disease_name_en}
                </h2>
                <p className="text-xs text-slate-600 italic font-sans font-medium">
                  Scientific: {result.disease_name_en} | {lang === 'bn' ? 'ফসল: ' : 'Crop: '}{result.crop_name}
                </p>
              </div>

              {/* NASA Earth Science Climate Cross-Validation Card */}
              {result.nasa_climate_validation && (
                <div className="glass-card rounded-2xl p-4 sm:p-5 border border-cyan-200 bg-cyan-50/50 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-cyan-600" />
                      <h4 className="text-xs sm:text-sm font-bold text-cyan-800 uppercase tracking-wider">
                        {lang === 'bn' 
                          ? 'নাসা আর্থ সায়েন্স জলবায়ু যাচাইকরণ (NASA Earth Observation Validation)' 
                          : 'NASA Earth Observation Climate Cross-Validation'}
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                      {result.nasa_climate_validation.outbreak_risk_level}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {result.nasa_climate_validation.climatological_rationale}
                  </p>
                  <div className="text-[11px] text-cyan-800 flex items-center gap-1.5 pt-1 border-t border-cyan-100 font-mono font-medium">
                    <span>🛰️ {lang === 'bn' ? 'ব্যবহৃত স্যাটেলাইট সূচক:' : 'Satellite Indicator:'}</span>
                    <span className="text-slate-900 font-semibold">{result.nasa_climate_validation.satellite_indicator}</span>
                  </div>
                </div>
              )}

              {/* Symptoms & Causes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-4 border border-slate-200 bg-white space-y-1.5 shadow-sm">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-emerald-600" />
                    {t.diagnosis.symptoms}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {result.symptoms_bn}
                  </p>
                </div>

                <div className="glass-card rounded-xl p-4 border border-slate-200 bg-white space-y-1.5 shadow-sm">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    {lang === 'bn' ? 'আক্রমণের অনুকূল কারণ' : 'Outbreak Favorable Conditions'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {result.causes_bn}
                  </p>
                </div>
              </div>

              {/* Treatment: Organic / Homemade Remedy FIRST */}
              <div className="glass-card rounded-2xl p-4 sm:p-5 border border-emerald-200 bg-white space-y-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm sm:text-base font-bold text-emerald-800">
                    {t.diagnosis.organicRemedy}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed pl-7">
                  {result.treatment.organic_home_remedy}
                </p>
              </div>

              {/* Treatment: Chemical Medicine & Precise Dosage */}
              <div className="glass-card rounded-2xl p-4 sm:p-5 border border-blue-200 bg-white space-y-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm sm:text-base font-bold text-blue-800">
                    {t.diagnosis.chemicalRemedy}
                  </h3>
                </div>

                <div className="space-y-2 pl-7 text-xs sm:text-sm text-slate-700">
                  <p><strong>{lang === 'bn' ? 'ওষুধের জেনেরিক নাম / গ্রুপ:' : 'Generic Name / Group:'}</strong> {result.treatment.chemical_medicine}</p>
                  <p className="text-amber-800 font-semibold"><strong>{t.diagnosis.dosage}:</strong> {result.treatment.dosage_per_bigha}</p>
                  <p className="text-slate-500 text-xs"><strong>{lang === 'bn' ? 'সতর্কতা:' : 'Safety Precaution:'}</strong> {result.treatment.safety_guideline}</p>
                </div>

                {/* Auto Calculated Land Cost */}
                <div className="mt-3 p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs text-slate-700">
                        {lang === 'bn' 
                          ? <>আপনার <strong className="text-slate-900">{toBanglaDigits(landArea, lang)} বিঘা</strong> জমির জন্য মোট আনুমানিক ঔষধ খরচ:</>
                          : <>Estimated medicine cost for your <strong className="text-slate-900">{landArea} Bigha</strong>:</>
                        }
                      </p>
                      <p className="text-xs text-slate-500">
                        {lang === 'bn'
                          ? `প্রতি বিঘায় প্রায় ${formatBDT(result.treatment.calculated_cost_for_land.cost_per_bigha_bdt, lang)}`
                          : `Approx ${formatBDT(result.treatment.calculated_cost_for_land.cost_per_bigha_bdt, lang)} per bigha`}
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-extrabold text-emerald-700">
                    {formatBDT(result.treatment.calculated_cost_for_land.total_estimated_bdt, lang)}
                  </span>
                </div>
              </div>

              {/* Official Disclaimer & Upazila Helpline */}
              <div className="rounded-xl p-3.5 bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2 shadow-xs">
                <p className="max-w-xl">
                  {result.disclaimer}
                </p>
                <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  <span>{result.upazila_helpline.krishi_call_center}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
