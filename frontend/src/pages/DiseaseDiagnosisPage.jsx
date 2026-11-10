import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, ShieldCheck, Sparkles, DollarSign, PhoneCall, Loader2, RefreshCw, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';
import { diagnoseDisease } from '../utils/api';
import { AudioSpeakerButton } from '../components/AudioSpeakerButton';
import { toBanglaDigits, formatBDT } from '../utils/banglaNumbers';
import { useLanguage } from '../contexts/LanguageContext';

export const DiseaseDiagnosisPage = () => {
  const { lang, t } = useLanguage();
  const [imagePreview, setImagePreview] = useState('/leaf.svg');
  const [landArea, setLandArea] = useState(3.5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const sampleLeaves = [
    {
      label: lang === 'bn' ? 'ধানের ব্লাস্ট পাতার নমুনা' : 'Rice Blast Sample',
      crop: 'ধান',
      // SVG data URL of a green leaf with brown spindle blast lesion
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%232e7d32"/><path d="M50 250 C100 150 200 80 250 50 C220 150 150 220 50 250 Z" fill="%234caf50"/><ellipse cx="160" cy="140" rx="35" ry="14" fill="%23795548" transform="rotate(-35 160 140)"/><ellipse cx="160" cy="140" rx="20" ry="7" fill="%239e9e9e" transform="rotate(-35 160 140)"/><ellipse cx="120" cy="180" rx="22" ry="10" fill="%23795548" transform="rotate(-35 120 180)"/></svg>'
    },
    {
      label: lang === 'bn' ? 'আলুর লেট ব্লাইট পাতার নমুনা' : 'Potato Late Blight Sample',
      crop: 'আলু',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%231b5e20"/><circle cx="150" cy="150" r="100" fill="%23388e3c"/><path d="M80 80 Q140 120 120 170 Q70 160 80 80 Z" fill="%23212121"/><path d="M180 180 Q240 200 230 240 Q170 230 180 180 Z" fill="%233e2723"/></svg>'
    },
    {
      label: lang === 'bn' ? 'গমের হলুদ মরিচা পাতার নমুনা' : 'Wheat Yellow Rust Sample',
      crop: 'গম',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%232e7d32"/><rect x="120" y="20" width="60" height="260" rx="20" fill="%2381c784"/><line x1="135" y1="50" x2="135" y2="240" stroke="%23fbc02d" stroke-width="6" stroke-dasharray="10 5"/><line x1="150" y1="40" x2="150" y2="250" stroke="%23f57f17" stroke-width="6" stroke-dasharray="14 6"/><line x1="165" y1="60" x2="165" y2="230" stroke="%23fbc02d" stroke-width="6" stroke-dasharray="8 5"/></svg>'
    }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setResult(null); // Reset previous diagnosis for fresh scan
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadSample = (sample) => {
    setImagePreview(sample.data);
    setResult(null);
  };

  const handleDiagnose = async () => {
    setLoading(true);
    try {
      const res = await diagnoseDisease({
        image_base64: imagePreview,
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
              {lang === 'bn' ? 'এআই ডিজিটাল ক্রপ ডক্টর' : 'AI Digital Crop Doctor'}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              {lang === 'bn' ? 'স্বয়ংক্রিয় ছবি বিশ্লেষণ' : 'Vision AI Auto Diagnosis'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {lang === 'bn'
              ? 'ফসলের আক্রান্ত পাতার ছবি তুলুন বা আপলোড করুন — এআই নিজে থেকেই রোগ শনাক্ত করে প্রেসক্রিপশন প্রদান করবে।'
              : 'Snap or upload a photo of an infected leaf — AI automatically detects the disease and delivers a complete treatment plan.'}
          </p>
        </div>

        {result && result.is_crop_leaf !== false && (
          <AudioSpeakerButton 
            text={`${result.crop_name}-এর রোগ: ${result.disease_name_bn}। ${result.symptoms_bn}। প্রতিকার: ${result.treatment.organic_home_remedy} এবং রাসায়নিক ওষুধ: ${result.treatment.chemical_medicine}। মাত্রা: ${result.treatment.dosage_per_bigha}`}
            size={22}
            className="p-2.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          />
        )}
      </div>

      {/* Main Grid: Upload on Left, Diagnostic Results on Right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Image & Inputs */}
        <div className="md:col-span-1 space-y-4">
          {/* Image Upload Box */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative group border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all overflow-hidden ${
              imagePreview && imagePreview !== '/leaf.svg'
                ? 'border-emerald-500 bg-emerald-50/20' 
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
              <div className="relative w-full h-52 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 flex items-center justify-center">
                <img 
                  src={imagePreview} 
                  alt="Crop Leaf" 
                  className="object-contain w-full h-full p-2 transition-transform duration-300 group-hover:scale-105" 
                />

                {/* Scanning Animation while loading */}
                {loading && (
                  <div className="absolute inset-0 bg-emerald-600/10 backdrop-blur-[1px] flex flex-col items-center justify-center">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-bounce" />
                    <span className="mt-2 text-xs font-bold text-emerald-900 bg-white/90 px-3 py-1 rounded-full shadow-sm">
                      {lang === 'bn' ? 'পাতা স্ক্যান ও বিশ্লেষণ হচ্ছে...' : 'Scanning leaf foliar cues...'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 pt-1">
                <Camera className="w-4 h-4" />
                <span>{lang === 'bn' ? 'ছবি তুলুন বা আপলোড করুন' : 'Take photo or upload'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'ক্লিক করে আপনার ফোনের ক্যামেরা বা গ্যালারি থেকে পাতার ছবি দিন' : 'Click to select an infected leaf picture'}
              </p>
            </div>
          </div>

          {/* Quick Leaf Presets for One-Click Testing */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              {lang === 'bn' ? 'দ্রুত টেস্ট নমুনা (Sample Leaves):' : 'Quick Test Leaf Samples:'}
            </span>
            <div className="flex flex-col gap-1.5">
              {sampleLeaves.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  className="text-left px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 transition-colors flex items-center justify-between"
                >
                  <span>{sample.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Land Size for Dosage */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              {t.diagnosis.landAreaBigha}:
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-bold"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                {lang === 'bn' ? 'বিঘা' : 'Bigha'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              {toBanglaDigits(landArea, lang)} {lang === 'bn' ? 'বিঘা' : 'Bigha'} = {toBanglaDigits(Math.round(landArea * 33 * 10) / 10, lang)} {lang === 'bn' ? 'শতক' : 'Decimals'}
            </span>
          </div>

          {/* Big Action Button */}
          <button
            onClick={handleDiagnose}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{lang === 'bn' ? 'এআই রোগ নির্ণয় করছে...' : 'AI Analyzing image...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{lang === 'bn' ? 'ছবি স্ক্যান ও রোগ নির্ণয় করুন' : 'Scan & Diagnose Disease'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Diagnostic Prescription Display */}
        <div className="md:col-span-2 space-y-4">
          {!result ? (
            <div className="glass-card rounded-2xl p-8 border border-slate-200 bg-white text-center flex flex-col items-center justify-center min-h-[400px] space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {lang === 'bn' ? 'আক্রান্ত পাতার ছবি দিয়ে রোগ নির্ণয় করুন' : 'Diagnose Plant Pathology from Photo'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
                {lang === 'bn' 
                  ? "বাম পাশের বক্সে আপনার ফসলের আক্রান্ত পাতার ছবি আপলোড করুন অথবা ক্যামেরা দিয়ে ছবি তুলুন। এরপর 'ছবি স্ক্যান ও রোগ নির্ণয় করুন' বাটনে ক্লিক করলেই স্বয়ংক্রিয়ভাবে রোগ ও সঠিক ঔষধের প্রেসক্রিপশন পাওয়া যাবে।"
                  : "Upload or take a photo of an infected crop leaf on the left. AI Vision will automatically detect the disease and calculate the required medicine dosage."}
              </p>
            </div>
          ) : result.is_crop_leaf === false ? (
            /* Warning Display for Non-Crop Photos */
            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-amber-300 bg-amber-50/70 space-y-4 shadow-sm animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-900">
                    {lang === 'bn' ? result.warning_title_bn || 'ফসলের পাতা শনাক্ত হয়নি' : 'Not a Plant Leaf Photo'}
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
                    {result.warning_message_bn}
                  </p>
                </div>
              </div>

              {result.tips_bn && (
                <div className="bg-white/80 rounded-xl p-4 border border-amber-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    {lang === 'bn' ? 'সঠিক ছবি তোলার টিপস:' : 'Tips for a good photo:'}
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
                    {result.tips_bn.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'অন্য ছবি দিন' : 'Try another photo'}</span>
                </button>
                <span className="text-[11px] text-slate-500">
                  {lang === 'bn' ? 'অথবা বামে দেওয়া স্যাম্পল পাতায় ক্লিক করে টেস্ট করুন' : 'Or click any sample leaf on the left'}
                </span>
              </div>
            </div>
          ) : (
            /* Valid Diagnosis Display */
            <div className="space-y-4 animate-fadeIn">
              {/* Top Result Card */}
              <div className="glass-card rounded-2xl p-5 border border-emerald-200 bg-emerald-50/70 space-y-3 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {lang === 'bn' ? 'শনাক্তকরণ নিশ্চয়তা: ' : 'AI Confidence: '}
                      {toBanglaDigits(result.confidence_percentage, lang)}
                    </span>
                    <span className="text-xs font-semibold text-amber-800 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-200">
                      {lang === 'bn' ? 'তীব্রতা: ' : 'Severity: '}{result.severity}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold shadow-xs">
                    {result.diagnosis_source}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {lang === 'bn' ? result.disease_name_bn : result.disease_name_en}
                  </h2>
                  <p className="text-xs text-slate-600 italic font-medium mt-0.5">
                    Scientific: {result.disease_name_en} | {lang === 'bn' ? 'শনাক্তকৃত ফসল: ' : 'Detected Crop: '}<strong className="text-emerald-800">{result.crop_name}</strong>
                  </p>
                </div>
              </div>

              {/* NASA Earth Science Climate Cross-Validation Card */}
              {result.nasa_climate_validation && (
                <div className="glass-card rounded-2xl p-4 sm:p-5 border border-cyan-200 bg-cyan-50/60 space-y-2.5 shadow-sm">
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
