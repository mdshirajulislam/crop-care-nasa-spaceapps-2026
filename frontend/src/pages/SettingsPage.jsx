import React, { useState, useEffect } from 'react';
import { fetchProfile, updateProfile } from '../utils/api';
import { 
  Settings, Globe, MapPin, Phone, Database, Check, ShieldCheck, 
  User, Edit3, Save, Loader2, Navigation, Compass, Crosshair, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { InteractiveLocationPicker } from '../components/InteractiveLocationPicker';
import { toBanglaDigits } from '../utils/banglaNumbers';

// Popular Agricultural Hub Districts in Bangladesh
const BANGLADESH_DISTRICTS = [
  "ময়মনসিংহ", "ঢাকা", "কুমিল্লা", "রংপুর", "দিনাজপুর", "রাজশাহী", 
  "বগুড়া", "যশোর", "সিলেট", "সুনামগঞ্জ", "কিশোরগঞ্জ", "কুড়িগ্রাম", 
  "বরিশাল", "খুলনা", "চট্টগ্রাম", "পাবনা"
];

// District approximate coordinate map for automatic center alignment
const DISTRICT_COORDS = {
  "ময়মনসিংহ": [24.7471, 90.4203],
  "ঢাকা": [23.8103, 90.4125],
  "কুমিল্লা": [23.4682, 91.1788],
  "রংপুর": [25.7439, 89.2752],
  "দিনাজপুর": [25.6217, 88.6355],
  "রাজশাহী": [24.3745, 88.6042],
  "বগুড়া": [24.8465, 89.3770],
  "যশোর": [23.1664, 89.2081],
  "সিলেট": [24.8949, 91.8687],
  "সুনামগঞ্জ": [25.0658, 91.3950],
  "কিশোরগঞ্জ": [24.4260, 90.7760],
  "কুড়িগ্রাম": [25.8054, 89.6362],
  "বরিশাল": [22.7010, 90.3535],
  "খুলনা": [22.8456, 89.5403],
  "চট্টগ্রাম": [22.3569, 91.7832],
  "পাবনা": [24.0064, 89.2372]
};

export const SettingsPage = () => {
  const { lang, setLang, t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: 'মোঃ সিরাজুল ইসলাম',
    phone: '01712345678',
    village: 'চর নিলক্ষীয়া',
    upazila: 'ময়মনসিংহ সদর',
    district: 'ময়মনসিংহ',
    preferred_land_unit: 'bigha',
    lat: 24.7471,
    lon: 90.4203
  });

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        if (data) {
          setProfile(data);
          setFormData({
            name: data.name || (lang === 'bn' ? 'মোঃ সিরাজুল ইসলাম' : 'Md. Sirajul Islam'),
            phone: data.phone || '01712345678',
            village: data.village || (lang === 'bn' ? 'চর নিলক্ষীয়া' : 'Char Nilakshia'),
            upazila: data.upazila || (lang === 'bn' ? 'ময়মনসিংহ সদর' : 'Mymensingh Sadar'),
            district: data.district || (lang === 'bn' ? 'ময়মনসিংহ' : 'Mymensingh'),
            preferred_land_unit: data.preferred_land_unit || 'bigha',
            lat: data.lat || 24.7471,
            lon: data.lon || 90.4203
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // When farmer selects a district, auto-adjust map coordinates
  const handleDistrictChange = (distName) => {
    const coords = DISTRICT_COORDS[distName];
    setFormData(prev => ({
      ...prev,
      district: distName,
      lat: coords ? coords[0] : prev.lat,
      lon: coords ? coords[1] : prev.lon
    }));
  };

  const handleLocationSelect = (newLat, newLon) => {
    setFormData(prev => ({
      ...prev,
      lat: newLat,
      lon: newLon
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile(formData);
      if (res.user) {
        setProfile(res.user);
      }
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t.settings.title}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              NASA Precision GIS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {t.settings.subtitle}
          </p>
        </div>

        {saveSuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn font-semibold shadow-xs">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{t.settings.savedSuccess}</span>
          </div>
        )}
      </div>

      {/* Farmer Profile Card (Interactive Edit Mode) */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200 bg-white shadow-sm space-y-6">
        {/* Top Header Card Info */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md ring-2 ring-emerald-500/20">
              {formData.name.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">{formData.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  {lang === 'bn' ? 'ভেরিফাইড কৃষক' : 'Verified Farmer'}
                </span>
              </div>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">
                {lang === 'bn' ? 'মোবাইল: ' : 'Mobile: '}{formData.phone}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {formData.village}, {formData.upazila}, {formData.district} 
                <span className="font-mono text-slate-400 text-[11px]">({formData.lat?.toFixed(4)}, {formData.lon?.toFixed(4)})</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isEditing 
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>
              {isEditing 
                ? (lang === 'bn' ? 'সম্পাদনা বাতিল' : 'Cancel Edit') 
                : (lang === 'bn' ? 'ঠিকানা ও অবস্থান পরিবর্তন' : 'Edit Profile & Location')
              }
            </span>
          </button>
        </div>

        {/* Profile Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{t.settings.farmerName}:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{t.settings.mobileNumber}:</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{t.settings.district}:</label>
                <select
                  value={formData.district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none font-medium"
                >
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d} value={d} className="bg-white text-slate-800">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{t.settings.upazila}:</label>
                <input
                  type="text"
                  value={formData.upazila}
                  onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{t.settings.village}:</label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{t.settings.defaultLandUnit}:</label>
                <select
                  value={formData.preferred_land_unit}
                  onChange={(e) => setFormData({ ...formData, preferred_land_unit: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none font-medium"
                >
                  <option value="bigha">{lang === 'bn' ? 'বিঘা (Bigha - ৩৩ শতক)' : 'Bigha (33 Decimals)'}</option>
                  <option value="decimal">{lang === 'bn' ? 'শতক / শতাংশ (Decimal)' : 'Decimal / Shatak'}</option>
                  <option value="katha">{lang === 'bn' ? 'কাঠা (Katha)' : 'Katha'}</option>
                  <option value="acre">{lang === 'bn' ? 'একর (Acre)' : 'Acre'}</option>
                </select>
              </div>
            </div>

            {/* Google Satellite Style Interactive Map Picker */}
            <div className="pt-2">
              <InteractiveLocationPicker
                initialLat={formData.lat}
                initialLon={formData.lon}
                onLocationSelect={handleLocationSelect}
              />
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                {t.common?.cancel || (lang === 'bn' ? 'বাতিল' : 'Cancel')}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t.settings.saveButton}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* View Mode Details */
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">{t.settings.district}</span>
                <span className="font-bold text-slate-900 text-sm">{formData.district}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">{t.settings.upazila}</span>
                <span className="font-bold text-slate-900 text-sm">{formData.upazila}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">{t.settings.village}</span>
                <span className="font-bold text-slate-900 text-sm">{formData.village}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">{t.settings.defaultLandUnit}</span>
                <span className="font-bold text-emerald-700 text-sm">{lang === 'bn' ? 'বিঘা (Bigha)' : 'Bigha'}</span>
              </div>
            </div>

            {/* Readonly Map Preview */}
            <div className="pt-2">
              <InteractiveLocationPicker
                initialLat={formData.lat}
                initialLon={formData.lon}
                onLocationSelect={(lat, lon) => {
                  setFormData(prev => ({ ...prev, lat, lon }));
                  setIsEditing(true);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Language Switch */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 bg-white space-y-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">{t.settings.appLanguage}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => setLang('bn')}
            className={`p-3 rounded-xl border text-center font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
              lang === 'bn'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>বাংলা (Bangla)</span>
            {lang === 'bn' && <Check className="w-4 h-4 text-white" />}
          </button>

          <button
            onClick={() => setLang('en')}
            className={`p-3 rounded-xl border text-center font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
              lang === 'en'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>English</span>
            {lang === 'en' && <Check className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Offline Storage Cache */}
      <div className="glass-card rounded-2xl p-5 border border-slate-200 bg-white space-y-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">{t.settings.offlineCache}</h3>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          {lang === 'bn'
            ? 'ইন্টারনেট সংযোগ বিচ্ছিন্ন থাকলেও আগে লোড করা আবহাওয়া, ফসলের ক্যালেন্ডার ও ডায়েরি ডেটা স্বয়ংক্রিয়ভাবে কাজ করবে।'
            : 'Pre-loaded weather, crop calendars, and diary records work seamlessly even when offline.'}
        </p>
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
          <span>{lang === 'bn' ? 'বর্তমান ক্যাশ সাইজ: ২.৪ মেগাবাইট (সংরক্ষিত)' : 'Current Cache Size: 2.4 MB (Stored)'}</span>
          <span className="text-emerald-700 font-bold">{lang === 'bn' ? 'অফলাইনে ব্যবহারের জন্য প্রস্তুত' : 'Ready for Offline Use'}</span>
        </div>
      </div>

      {/* Project Disclaimer */}
      <div className="rounded-2xl p-5 bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center space-x-2 text-slate-900 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'bn' ? 'নাসা স্পেস অ্যাপস চ্যালেঞ্জ ২০২৬ প্রজেক্ট তথ্য' : 'NASA Space Apps Challenge 2026 Project Info'}</span>
        </div>
        <p className="leading-relaxed">
          {lang === 'bn' 
            ? 'এই অ্যাপ্লিকেশনটি নাসার ওপেন সায়েন্স ডেটাবেজ (NASA POWER Climatology, NASA GIBS NDVI ও GPM IMERG) এবং বাংলাদেশের স্থানীয় কৃষি কাঠামোর সমন্বয়ে তৈরি একটি স্বয়ংসম্পূর্ণ প্ল্যাটফর্ম।'
            : 'This application integrates NASA open science datasets (NASA POWER Climatology, NASA GIBS NDVI & GPM IMERG) with Bangladeshi agricultural advisory systems.'}
        </p>
      </div>
    </div>
  );
};
export default SettingsPage;
