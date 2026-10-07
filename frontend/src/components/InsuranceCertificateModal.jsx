import React, { useState } from 'react';
import { 
  FileText, Download, ShieldCheck, CheckCircle2, AlertTriangle, 
  Sparkles, ExternalLink, RefreshCw, Printer, Award, FileCheck
} from 'lucide-react';
import { generateInsuranceCertificate } from '../utils/api';
import { toBanglaDigits, formatBDT } from '../utils/banglaNumbers';
import { useLanguage } from '../contexts/LanguageContext';

export const InsuranceCertificateModal = ({ isOpen, onClose, farmerProfile, plotData }) => {
  const { lang, t } = useLanguage();
  const [hazardType, setHazardType] = useState('excess_rain');
  const [certificate, setCertificate] = useState(null);
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateInsuranceCertificate({
        farmer_name: farmerProfile?.name || (lang === 'bn' ? "মোঃ সিরাজুল ইসলাম" : "Md. Sirajul Islam"),
        plot_name: plotData?.name || (lang === 'bn' ? "পূর্বের মাঠ (প্লট ১)" : "East Field (Plot 1)"),
        crop_name: plotData?.crop_name || (lang === 'bn' ? "আমন ধান" : "Aman Rice"),
        land_bigha: plotData?.area_value || 3.5,
        hazard_type: hazardType
      });
      setCertificate(res);
    } catch (e) {
      console.error("Insurance generation error:", e);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const hazardOptions = [
    { 
      id: 'excess_rain', 
      title: lang === 'bn' ? '🌧️ অতিবৃষ্টি ও বন্যা' : '🌧️ Excess Rain & Flood', 
      desc: lang === 'bn' ? 'টানা বর্ষণে চারা নিমজ্জিত বা পচন' : 'Submerged seedlings and rot due to rainfall' 
    },
    { 
      id: 'drought', 
      title: lang === 'bn' ? '☀️ খরা ও উচ্চ তাপমাত্রা' : '☀️ Drought & Heat Shock', 
      desc: lang === 'bn' ? 'বৃষ্টির অভাবে মাটি ফেটে যাওয়া ও হিট শক' : 'Soil cracking and heat shock during flowering' 
    },
    { 
      id: 'storm', 
      title: lang === 'bn' ? '⚡ শিলাবৃষ্টি ও কালবৈশাখী' : '⚡ Hailstorm & Nor’wester', 
      desc: lang === 'bn' ? 'ঝড়ো বাতাসে গাছ ভেঙে পড়া ও ক্ষতি' : 'Crop lodging and physical storm damage' 
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {t.insurance.title}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                  Parametric Loss Certificate
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {t.insurance.subtitle}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Hazard Selector */}
        {!certificate ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                {lang === 'bn' ? 'ক্ষতির ধরন নির্বাচন করুন:' : 'Select Hazard Type:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {hazardOptions.map((hz) => (
                  <button
                    key={hz.id}
                    onClick={() => setHazardType(hz.id)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      hazardType === hz.id 
                        ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">{hz.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{hz.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'bn' ? 'কীভাবে কাজ করে?' : 'How does it work?'}
              </div>
              <p className="leading-relaxed text-slate-600">
                {lang === 'bn'
                  ? 'নাসা আর্থ সায়েন্সের ২০ বছরের ঐতিহাসিক আবহাওয়া ডেটার সাথে আপনার নির্বাচিত প্লটের গত ৭ দিনের বৃষ্টিপাত ও স্যাটেলাইট সয়েল ময়েশ্চার মিলিয়ে একটি নন-ট্যাম্পারেবল (অপরিবর্তনযোগ্য) ডিজিটাল সনদ তৈরি করা হবে।'
                  : 'A tamper-proof digital parametric certificate verified against NASA Earth Science 20-year climatology and 7-day soil moisture satellite telemetry.'}
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{lang === 'bn' ? 'নাসা স্যাটেলাইট ডেটা ভেরিফাই হচ্ছে...' : 'Verifying NASA satellite data...'}</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>{t.insurance.generateButton}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Printable Certificate Layout */
          <div className="space-y-5 animate-fadeIn">
            {/* The Certificate Paper Box */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-emerald-600/40 shadow-lg relative overflow-hidden font-sans text-slate-800 space-y-5">
              {/* Watermark Logo */}
              <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none text-9xl font-black text-slate-900">
                NASA
              </div>

              {/* Header inside Certificate */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-emerald-500/30 pb-4 gap-2">
                <div>
                  <div className="text-xs font-mono font-bold tracking-widest text-emerald-700 uppercase">
                    NASA EARTH OBSERVATION AUDIT CERTIFICATE
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    {lang === 'bn' 
                      ? 'প্যারামেট্রিক জলবায়ু ক্ষতি ও ফসল বীমা সনদপত্র' 
                      : 'Parametric Climate Crop Loss Audit Certificate'}
                  </h4>
                  <div className="text-[11px] text-slate-500">
                    {lang === 'bn' ? 'সনদ নম্বর: ' : 'Certificate ID: '}
                    <span className="font-mono text-emerald-700 font-semibold">{certificate.certificate_id}</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold">
                    ✓ SATELLITE VERIFIED
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {lang === 'bn' ? 'ইস্যুর তারিখ: ' : 'Issue Date: '}{certificate.issue_date}
                  </div>
                </div>
              </div>

              {/* Farmer and Plot Info */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium block">
                    {lang === 'bn' ? 'কৃষকের তথ্য:' : 'Farmer Details:'}
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{certificate.farmer.name}</div>
                  <div className="text-slate-700">
                    {lang === 'bn' ? 'মোবাইল: ' : 'Mobile: '}{certificate.farmer.phone}
                  </div>
                  <div className="text-slate-500">{certificate.farmer.upazila}, {certificate.farmer.district}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">
                    {lang === 'bn' ? 'জমির বিবরণ:' : 'Farm Land Details:'}
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{certificate.farm_details.plot_name}</div>
                  <div className="text-slate-700">
                    {lang === 'bn' ? 'ফসল: ' : 'Crop: '}{certificate.farm_details.crop} | {lang === 'bn' ? 'আয়তন: ' : 'Area: '}
                    {toBanglaDigits(certificate.farm_details.area_bigha, lang)} {lang === 'bn' ? 'বিঘা' : 'Bigha'}
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    GPS: {certificate.farm_details.coordinates}
                  </div>
                </div>
              </div>

              {/* Satellite Evidence Findings */}
              <div className="space-y-2 text-xs">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  {lang === 'bn' 
                    ? 'স্যাটেলাইট অডিট ও ক্ষয়ক্ষতি বিশ্লেষণ (Satellite Findings):' 
                    : 'Satellite Audit & Damage Assessment:'}
                </span>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">
                      {lang === 'bn' ? 'পর্যবেক্ষিত দুর্যোগ:' : 'Observed Hazard Event:'}
                    </span>
                    <span className="font-bold text-amber-700">{certificate.satellite_evidence.observed_event}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">
                      {lang === 'bn' ? 'স্যাটেলাইট টেলিমেট্রি:' : 'Satellite Telemetry:'}
                    </span>
                    <span className="font-mono text-slate-800 text-[11px]">{certificate.satellite_evidence.satellite_telemetry}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-600">
                      {lang === 'bn' ? 'আনুমানিক ফসল ক্ষতির মাত্রা:' : 'Estimated Crop Loss:'}
                    </span>
                    <span className="font-bold text-rose-600 text-sm">
                      {toBanglaDigits(certificate.satellite_evidence.damage_estimate_percent, lang)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">
                      {lang === 'bn' ? 'দাবিকৃত ক্ষতিপূরণ মূল্যমান:' : 'Calculated Claim Value:'}
                    </span>
                    <span className="font-extrabold text-emerald-700 text-base">
                      {formatBDT(certificate.satellite_evidence.estimated_financial_loss_bdt, lang)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Note & Signature */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-500">
                <p className="max-w-md leading-relaxed">
                  {certificate.purpose_note}
                </p>
                <div className="text-right">
                  <div className="font-mono text-emerald-700 font-bold">{certificate.authorized_signature}</div>
                  <div className="text-[9px] text-slate-400">Digital Cryptographic Stamp</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setCertificate(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                {lang === 'bn' ? 'পুনরায় তৈরি করুন' : 'Regenerate'}
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'bn' ? 'প্রিন্ট / PDF ডাউনলোড' : 'Print / Download PDF'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
