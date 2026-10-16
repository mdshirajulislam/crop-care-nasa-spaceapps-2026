import React, { useState, useEffect } from 'react';
import { fetchProfile, updateProfile } from '../utils/api';
import { 
  Settings, Globe, MapPin, Phone, Database, Check, ShieldCheck, 
  User, Edit3, Save, Loader2, Navigation, Compass, Crosshair, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { InteractiveLocationPicker } from '../components/InteractiveLocationPicker';
import { toBanglaDigits } from '../utils/banglaNumbers';

import { 
  DISTRICTS_DATA, 
  WARDS_LIST, 
  POURASHAVA_WARDS_LIST,
  CITY_WARDS_LIST,
  AREA_TYPES,
  getGeoCoordinates, 
  reverseGeocodeCoordinates
} from '../utils/bangladeshGeoData';

export const SettingsPage = () => {
  const { lang, setLang, t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [geoDetecting, setGeoDetecting] = useState(false);
  const [geoDetectMsg, setGeoDetectMsg] = useState('');
  const [customUpazilaMode, setCustomUpazilaMode] = useState(false);
  const [customUnionMode, setCustomUnionMode] = useState(false);

  const [formData, setFormData] = useState({
    name: 'মোঃ সিরাজুল ইসলাম',
    phone: '01712345678',
    area_type: 'union', // union, pourashava, city_corporation
    village: 'চর নিলক্ষীয়া',
    union_name: 'চর নিলক্ষীয়া',
    ward: 'ওয়ার্ড ১',
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
            area_type: data.area_type || (data.district === 'ঢাকা' ? 'city_corporation' : 'union'),
            village: data.village || (lang === 'bn' ? 'চর নিলক্ষীয়া' : 'Char Nilakshia'),
            union_name: data.union_name || (lang === 'bn' ? 'চর নিলক্ষীয়া' : 'Char Nilakshia'),
            ward: data.ward || (lang === 'bn' ? 'ওয়ার্ড ১' : 'Ward 1'),
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

  // When farmer toggles or changes administrative tier (গ্রাম/পৌরসভা/সিটি কর্পোরেশন)
  const handleAreaTypeChange = (newType) => {
    let defaultUnion = formData.union_name;
    if (newType === 'city_corporation') {
      defaultUnion = formData.district.includes('ঢাকা') ? 'ঢাকা উত্তর সিটি কর্পোরেশন' : `${formData.district} সিটি কর্পোরেশন`;
    } else if (newType === 'pourashava') {
      defaultUnion = `${formData.upazila} পৌরসভা`;
    } else {
      const uList = DISTRICTS_DATA[formData.district]?.upazilas?.[formData.upazila]?.unions || [];
      defaultUnion = uList[0] || `${formData.upazila} সদর ইউনিয়ন`;
    }

    setFormData(prev => ({
      ...prev,
      area_type: newType,
      union_name: defaultUnion
    }));
  };

  // When farmer selects a district: cascade to first upazila, first union, and update coordinates
  const handleDistrictChange = (distName) => {
    const upazilaObj = DISTRICTS_DATA[distName]?.upazilas || {};
    const upazilas = Object.keys(upazilaObj);
    const newUpazila = upazilas[0] || (lang === 'bn' ? 'সদর' : 'Sadar');
    const upMeta = upazilaObj[newUpazila] || {};
    
    // Auto-detect tier based on district or upazila type
    const detectedType = upMeta.type || (distName === 'ঢাকা' ? 'city_corporation' : 'union');
    const unions = upMeta.unions || [];
    const newUnion = detectedType === 'city_corporation' 
      ? (upMeta.city_corp || (distName.includes('ঢাকা') ? 'ঢাকা উত্তর সিটি কর্পোরেশন' : `${distName} সিটি কর্পোরেশন`))
      : (detectedType === 'pourashava' ? `${newUpazila} পৌরসভা` : (unions[0] || 'সদর ইউনিয়ন'));
    
    const [newLat, newLon] = getGeoCoordinates(distName, newUpazila, newUnion, formData.ward, formData.village);

    setCustomUpazilaMode(false);
    setCustomUnionMode(false);
    setFormData(prev => ({
      ...prev,
      district: distName,
      upazila: newUpazila,
      area_type: detectedType,
      union_name: newUnion,
      lat: newLat,
      lon: newLon
    }));
  };

  // When farmer selects an upazila: cascade to union and update coordinates
  const handleUpazilaChange = (upName) => {
    if (upName === '__custom__') {
      setCustomUpazilaMode(true);
      return;
    }
    setCustomUpazilaMode(false);
    const upMeta = DISTRICTS_DATA[formData.district]?.upazilas?.[upName] || {};
    const upType = upMeta.type || (formData.district === 'ঢাকা' ? 'city_corporation' : formData.area_type);
    const unions = upMeta.unions || [];
    const newUnion = upType === 'city_corporation'
      ? (upMeta.city_corp || `${formData.district} সিটি কর্পোরেশন`)
      : (upType === 'pourashava' ? `${upName} পৌরসভা` : (unions[0] || 'সদর ইউনিয়ন'));
    
    const [newLat, newLon] = getGeoCoordinates(formData.district, upName, newUnion, formData.ward, formData.village);

    setCustomUnionMode(false);
    setFormData(prev => ({
      ...prev,
      upazila: upName,
      area_type: upType,
      union_name: newUnion,
      lat: newLat,
      lon: newLon
    }));
  };

  // When farmer selects a union
  const handleUnionChange = (unionVal) => {
    if (unionVal === '__custom__') {
      setCustomUnionMode(true);
      return;
    }
    setCustomUnionMode(false);
    const [newLat, newLon] = getGeoCoordinates(formData.district, formData.upazila, unionVal, formData.ward, formData.village);
    setFormData(prev => ({
      ...prev,
      union_name: unionVal,
      lat: newLat,
      lon: newLon
    }));
  };

  // When farmer selects a ward
  const handleWardChange = (wardVal) => {
    const [newLat, newLon] = getGeoCoordinates(formData.district, formData.upazila, formData.union_name, wardVal, formData.village);
    setFormData(prev => ({
      ...prev,
      ward: wardVal,
      lat: newLat,
      lon: newLon
    }));
  };

  // When user types or edits village name: auto-recalculate coordinates and fly map
  const handleVillageChange = (val) => {
    const [newLat, newLon] = getGeoCoordinates(formData.district, formData.upazila, formData.union_name, formData.ward, val);
    setFormData(prev => ({
      ...prev,
      village: val,
      lat: newLat,
      lon: newLon
    }));
  };

  const handleVillageBlur = (villageVal) => {
    if (!villageVal || !villageVal.trim()) return;
    const [newLat, newLon] = getGeoCoordinates(formData.district, formData.upazila, formData.union_name, formData.ward, villageVal.trim());
    setFormData(prev => ({
      ...prev,
      village: villageVal.trim(),
      lat: newLat,
      lon: newLon
    }));
  };

  // When user clicks or drags marker on map OR searches an address OR clicks "Current GPS"
  const handleLocationSelect = async (newLat, newLon, directDetails = null) => {
    setFormData(prev => ({
      ...prev,
      lat: parseFloat(newLat.toFixed(5)),
      lon: parseFloat(newLon.toFixed(5))
    }));

    // If direct details are provided from Smart Address Search / Geocoder
    if (directDetails && directDetails.district) {
      setCustomUpazilaMode(false);
      setCustomUnionMode(false);
      const detectedAreaType = directDetails.area_type || (directDetails.district === 'ঢাকা' ? 'city_corporation' : 'union');

      setFormData(prev => ({
        ...prev,
        district: directDetails.district,
        upazila: directDetails.upazila,
        area_type: detectedAreaType,
        union_name: directDetails.union_name,
        ward: directDetails.ward || prev.ward,
        village: directDetails.village || prev.village,
        lat: parseFloat(newLat.toFixed(5)),
        lon: parseFloat(newLon.toFixed(5))
      }));

      const leader = detectedAreaType === 'union' ? 'চেয়ারম্যান' : 'মেয়র';
      const typeBadge = directDetails.area_type_label_bn ? ` [${directDetails.area_type_label_bn} • ${leader}]` : '';
      const msg = lang === 'bn' 
        ? `📍 ঠিকানা থেকে মানচিত্র সফলভাবে সিঙ্ক হয়েছে: ${directDetails.display_name}${typeBadge}!`
        : `📍 Synced to Map: ${directDetails.display_name}!`;
      setGeoDetectMsg(msg);
      setTimeout(() => setGeoDetectMsg(''), 7000);
      return;
    }

    setGeoDetecting(true);
    try {
      const geo = await reverseGeocodeCoordinates(newLat, newLon);
      if (geo && geo.district) {
        setCustomUpazilaMode(false);
        setCustomUnionMode(false);
        const detectedAreaType = geo.area_type || (geo.district === 'ঢাকা' ? 'city_corporation' : 'union');

        setFormData(prev => ({
          ...prev,
          district: geo.district || prev.district,
          upazila: geo.upazila || prev.upazila,
          area_type: detectedAreaType,
          union_name: geo.union_name || prev.union_name,
          ward: geo.ward || prev.ward,
          village: geo.village || prev.village,
          lat: parseFloat(newLat.toFixed(5)),
          lon: parseFloat(newLon.toFixed(5))
        }));

        const leader = detectedAreaType === 'union' ? 'চেয়ারম্যান' : 'মেয়র';
        const typeBadge = geo.area_type_label_bn ? ` [${geo.area_type_label_bn} • ${leader}]` : '';
        const msg = lang === 'bn' 
          ? `📍 জিপিএস / মানচিত্র থেকে নির্ভুলভাবে সনাক্ত: ${geo.village ? geo.village + ', ' : ''}${geo.ward ? geo.ward + ', ' : ''}${geo.union_name ? geo.union_name + ', ' : ''}${geo.upazila}, ${geo.district}${typeBadge}!`
          : `📍 GPS Detected: ${geo.village ? geo.village + ', ' : ''}${geo.upazila}, ${geo.district}${typeBadge}!`;
        setGeoDetectMsg(msg);
        setTimeout(() => setGeoDetectMsg(''), 7000);
      }
    } catch (e) {
      console.warn("Geo reverse error:", e);
    } finally {
      setGeoDetecting(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Keep precise GPS pin coordinates if selected/dragged on map, otherwise compute from administrative hierarchy
      const hasValidPin = 
        typeof formData.lat === 'number' && 
        typeof formData.lon === 'number' && 
        formData.lat >= 20.0 && formData.lat <= 27.0 && 
        formData.lon >= 88.0 && formData.lon <= 93.5;

      const [computedLat, computedLon] = getGeoCoordinates(
        formData.district,
        formData.upazila,
        formData.union_name,
        formData.ward,
        formData.village
      );

      const finalLat = hasValidPin ? formData.lat : computedLat;
      const finalLon = hasValidPin ? formData.lon : computedLon;

      const payload = {
        ...formData,
        lat: finalLat,
        lon: finalLon
      };

      setFormData(payload);
      const res = await updateProfile(payload);
      if (res.user) {
        setProfile(res.user);
      }
      setIsEditing(false);
      setSaveSuccess(true);

      const locName = `${payload.village ? payload.village + ', ' : ''}${payload.ward ? payload.ward + ', ' : ''}${payload.union_name ? payload.union_name + ', ' : ''}${payload.upazila}, ${payload.district}`;
      setGeoDetectMsg(
        lang === 'bn' 
          ? `📍 সংরক্ষিত অবস্থান সফলভাবে মানচিত্রে দেখানো হচ্ছে: ${locName}` 
          : `📍 Saved location shown on map: ${locName}`
      );

      setTimeout(() => setSaveSuccess(false), 5000);
      setTimeout(() => setGeoDetectMsg(''), 8000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Available upazilas and unions for current district/upazila with fallback & custom persistence
  const currentUpazilas = Object.keys(DISTRICTS_DATA[formData.district]?.upazilas || {});
  const upazilaOptions = Array.from(new Set([formData.upazila, ...currentUpazilas])).filter(Boolean);

  const currentUnions = DISTRICTS_DATA[formData.district]?.upazilas?.[formData.upazila]?.unions || [];
  
  let baseUnionOptions = [];
  if (formData.area_type === 'city_corporation') {
    const metroPresets = [
      "ঢাকা উত্তর সিটি কর্পোরেশন",
      "ঢাকা দক্ষিণ সিটি কর্পোরেশন",
      "চট্টগ্রাম সিটি কর্পোরেশন",
      "রাজশাহী সিটি কর্পোরেশন",
      "খুলনা সিটি কর্পোরেশন",
      "সিলেট সিটি কর্পোরেশন",
      "বরিশাল সিটি কর্পোরেশন",
      "রংপুর সিটি কর্পোরেশন",
      "ময়মনসিংহ সিটি কর্পোরেশন",
      "গাজীপুর সিটি কর্পোরেশন",
      "নারায়ণগঞ্জ সিটি কর্পোরেশন",
      "কুমিল্লা সিটি কর্পোরেশন"
    ];
    const distMetro = metroPresets.filter(m => m.includes(formData.district));
    baseUnionOptions = [
      ...(distMetro.length > 0 ? distMetro : [`${formData.district} সিটি কর্পোরেশন`]),
      ...currentUnions
    ];
  } else if (formData.area_type === 'pourashava') {
    baseUnionOptions = [
      `${formData.upazila} পৌরসভা`,
      `${formData.district} পৌরসভা`,
      ...currentUnions
    ];
  } else {
    baseUnionOptions = currentUnions;
  }
  const unionOptions = Array.from(new Set([formData.union_name, ...baseUnionOptions])).filter(Boolean);

  const activeWardsList = formData.area_type === 'city_corporation'
    ? CITY_WARDS_LIST
    : (formData.area_type === 'pourashava' ? POURASHAVA_WARDS_LIST : WARDS_LIST);
  const wardOptions = Array.from(new Set([formData.ward, ...activeWardsList])).filter(Boolean);

  // Dynamic Labels and Leadership Info based on 3-tier local administrative structure
  const getLabels = () => {
    if (formData.area_type === 'city_corporation') {
      return {
        upazila: lang === 'bn' ? 'থানা / মেট্রোপলিটন জোন' : 'Thana / Metro Zone',
        union: lang === 'bn' ? 'সিটি কর্পোরেশন' : 'City Corporation',
        ward: lang === 'bn' ? 'সিটি ওয়ার্ড নম্বর' : 'City Ward Number',
        village: lang === 'bn' ? 'সেক্টর / ব্লক / এলাকা' : 'Sector / Block / Area',
        villagePlaceholder: lang === 'bn' ? 'যেমন: সেক্টর ১০, ব্লক বি, রোড ৫' : 'e.g. Sector 10, Block B',
        leaderTitle: lang === 'bn' ? 'মেয়র' : 'Mayor',
        tierName: lang === 'bn' ? 'বড় মহানগর (সিটি কর্পোরেশন)' : 'Metropolitan (City Corporation)',
        icon: '🏙️'
      };
    }
    if (formData.area_type === 'pourashava') {
      return {
        upazila: lang === 'bn' ? 'উপজেলা / পৌর শহর' : 'Upazila / Town',
        union: lang === 'bn' ? 'পৌরসভা' : 'Municipality (Pourashava)',
        ward: lang === 'bn' ? 'পৌর ওয়ার্ড নম্বর' : 'Pourashava Ward Number',
        village: lang === 'bn' ? 'মহল্লা / সড়ক / পাড়া' : 'Mohalla / Road / Para',
        villagePlaceholder: lang === 'bn' ? 'যেমন: কলেজ রোড, পূর্বপাড়া' : 'e.g. College Road, Purba Para',
        leaderTitle: lang === 'bn' ? 'মেয়র' : 'Mayor',
        tierName: lang === 'bn' ? 'ছোট/মাঝারি শহর (পৌরসভা)' : 'Municipality (Pourashava)',
        icon: '🏢'
      };
    }
    return {
      upazila: lang === 'bn' ? 'উপজেলা' : 'Upazila',
      union: lang === 'bn' ? 'ইউনিয়ন পরিষদ' : 'Union Parishad',
      ward: lang === 'bn' ? 'ইউনিয়ন ওয়ার্ড নম্বর (১-৯)' : 'Ward Number (1-9)',
      village: lang === 'bn' ? 'গ্রাম / পাড়া / এলাকা' : 'Village / Para / Area',
      villagePlaceholder: lang === 'bn' ? 'যেমন: কুমারিয়াবাড়ি, চর নিলক্ষীয়া' : 'e.g. Kumariabari, Char Nilakshia',
      leaderTitle: lang === 'bn' ? 'চেয়ারম্যান' : 'Chairman',
      tierName: lang === 'bn' ? 'গ্রাম (ইউনিয়ন পরিষদ)' : 'Rural (Union Parishad)',
      icon: '🌾'
    };
  };
  const labels = getLabels();

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
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">{formData.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  {lang === 'bn' ? 'ভেরিফাইড কৃষক' : 'Verified Farmer'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold flex items-center gap-1">
                  <span>{labels.icon}</span>
                  <span>{labels.tierName}</span>
                  <span className="font-bold text-blue-900">({lang === 'bn' ? `নেতৃত্ব: ${labels.leaderTitle}` : labels.leaderTitle})</span>
                </span>
              </div>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">
                {lang === 'bn' ? 'মোবাইল: ' : 'Mobile: '}{formData.phone}
              </p>
              <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 font-medium flex-wrap">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-slate-800">
                  {formData.village ? `${formData.village}, ` : ''}
                  {formData.ward ? `${formData.ward}, ` : ''}
                  {formData.union_name ? `${formData.union_name}, ` : ''}
                  {formData.upazila}, {formData.district}
                </span>
                <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] border border-emerald-200">
                  {formData.lat?.toFixed(4)}° N, {formData.lon?.toFixed(4)}° E
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
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

        {/* Map Auto-detect notification badge */}
        {geoDetectMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn font-semibold shadow-xs">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{geoDetectMsg}</span>
          </div>
        )}

        {geoDetecting && (
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2 animate-pulse font-medium">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
            <span>{lang === 'bn' ? 'মানচিত্র ও জিপিএস থেকে পূর্ণাঙ্গ ঠিকানা সনাক্ত হচ্ছে...' : 'Detecting administrative location info from map...'}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              {/* Name */}
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

              {/* Mobile */}
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

              {/* 3-Tier Local Administrative Governance Selector */}
              <div className="col-span-1 sm:col-span-2 space-y-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">{labels.icon}</span>
                    <label className="text-slate-800 text-xs sm:text-sm font-bold">
                      {lang === 'bn' ? 'স্থানীয় সরকার প্রশাসনিক কাঠামো নির্বাচন:' : 'Local Administrative Governance Tier:'}
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-xs">
                    <span>{lang === 'bn' ? `প্রশাসনিক প্রধান:` : `Administrative Head:`}</span>
                    <span className="underline decoration-emerald-500 font-extrabold">{labels.leaderTitle}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {AREA_TYPES.map((type) => {
                    const isSelected = formData.area_type === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleAreaTypeChange(type.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/25 shadow-sm'
                            : 'bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xl">{type.icon}</span>
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                              ✓
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-300" />
                          )}
                        </div>
                        <div className="mt-2">
                          <div className={`font-bold text-xs sm:text-sm ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                            {lang === 'bn' ? type.label_bn : type.label_en}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between border-t border-slate-100 pt-1">
                            <span>{lang === 'bn' ? type.sub_unit_title_bn : type.id}</span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {lang === 'bn' ? `নেতৃত্ব: ${type.leader_bn}` : `Head: ${type.leader_bn}`}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Constitutional reference explanation */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 font-medium">
                  <span className="text-amber-600 font-bold">ℹ️ নিয়মাবলী:</span>
                  <span>
                    {lang === 'bn' 
                      ? 'গ্রামাঞ্চলে ইউনিয়ন পরিষদ (চেয়ারম্যান), শহর এলাকায় পৌরসভা (মেয়র) এবং ঢাকা সহ বড় মহানগরে সিটি কর্পোরেশন (মেয়র) কার্যকর থাকে।'
                      : 'Rural areas have Union Parishads (Chairman), urban towns have Municipalities (Mayor), and Metropolitans have City Corporations (Mayor).'}
                  </span>
                </div>
              </div>

              {/* District (জেলা) */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{t.settings.district} (District):</label>
                <select
                  value={formData.district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none font-medium cursor-pointer"
                >
                  {Object.keys(DISTRICTS_DATA).map((d) => (
                    <option key={d} value={d} className="bg-white text-slate-800">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upazila / Thana (উপজেলা / থানা) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">{labels.upazila}:</label>
                  <button
                    type="button"
                    onClick={() => setCustomUpazilaMode(!customUpazilaMode)}
                    className="text-[11px] text-emerald-700 hover:underline font-medium cursor-pointer"
                  >
                    {customUpazilaMode ? (lang === 'bn' ? 'তালিকায় ফিরুন' : 'Back to list') : (lang === 'bn' ? 'কাস্টম লিখুন' : 'Custom type')}
                  </button>
                </div>
                {customUpazilaMode ? (
                  <input
                    type="text"
                    value={formData.upazila}
                    onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
                    placeholder={lang === 'bn' ? `${labels.upazila}র নাম লিখুন` : `Enter ${labels.upazila}`}
                    className="w-full bg-slate-50 text-slate-900 border border-emerald-300 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none font-medium"
                  />
                ) : (
                  <select
                    value={formData.upazila}
                    onChange={(e) => handleUpazilaChange(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none font-medium cursor-pointer"
                  >
                    {upazilaOptions.map((u) => (
                      <option key={u} value={u} className="bg-white text-slate-800">
                        {u}
                      </option>
                    ))}
                    <option value="__custom__" className="text-emerald-700 font-semibold">
                      ➕ {lang === 'bn' ? 'অন্যান্য উপজেলা/থানা লিখুন...' : 'Other custom upazila/thana...'}
                    </option>
                  </select>
                )}
              </div>

              {/* Union / Pourashava / City Corp (ইউনিয়ন / পৌরসভা / সিটি কর্পোরেশন) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">{labels.union}:</label>
                  <button
                    type="button"
                    onClick={() => setCustomUnionMode(!customUnionMode)}
                    className="text-[11px] text-emerald-700 hover:underline font-medium cursor-pointer"
                  >
                    {customUnionMode ? (lang === 'bn' ? 'তালিকায় ফিরুন' : 'Back to list') : (lang === 'bn' ? 'কাস্টম লিখুন' : 'Custom type')}
                  </button>
                </div>
                {customUnionMode || unionOptions.length === 0 ? (
                  <input
                    type="text"
                    value={formData.union_name}
                    onChange={(e) => setFormData({ ...formData, union_name: e.target.value })}
                    placeholder={lang === 'bn' ? `${labels.union}র নাম লিখুন` : `Enter ${labels.union}`}
                    className="w-full bg-slate-50 text-slate-900 border border-emerald-300 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none font-medium"
                  />
                ) : (
                  <select
                    value={formData.union_name}
                    onChange={(e) => handleUnionChange(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none font-medium cursor-pointer"
                  >
                    {unionOptions.map((un) => (
                      <option key={un} value={un} className="bg-white text-slate-800">
                        {un}
                      </option>
                    ))}
                    <option value="__custom__" className="text-emerald-700 font-semibold">
                      ➕ {lang === 'bn' ? 'অন্যান্য নাম লিখুন...' : 'Other custom...'}
                    </option>
                  </select>
                )}
              </div>

              {/* Ward (ওয়ার্ড নম্বর) */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{labels.ward}:</label>
                <select
                  value={formData.ward}
                  onChange={(e) => handleWardChange(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none font-medium cursor-pointer"
                >
                  {wardOptions.map((w) => (
                    <option key={w} value={w} className="bg-white text-slate-800">
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* Village / Area (গ্রাম / পাড়া / মহল্লা / সেক্টর) */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{labels.village}:</label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => handleVillageChange(e.target.value)}
                  onBlur={(e) => handleVillageBlur(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleVillageBlur(e.target.value); } }}
                  placeholder={labels.villagePlaceholder}
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none font-medium"
                />
                <span className="text-[10px] text-emerald-700 font-medium block mt-1">
                  {lang === 'bn' ? '💡 সেভ করার পর মানচিত্র স্বয়ংক্রিয়ভাবে আপনার এই গ্রামে অবস্থান করবে।' : '💡 After saving, the map will automatically show this exact village.'}
                </span>
              </div>

              {/* Preferred Land Unit */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{t.settings.defaultLandUnit}:</label>
                <select
                  value={formData.preferred_land_unit}
                  onChange={(e) => setFormData({ ...formData, preferred_land_unit: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-emerald-500 focus:outline-none font-medium cursor-pointer"
                >
                  <option value="bigha">{lang === 'bn' ? 'বিঘা (Bigha - ৩৩ শতক)' : 'Bigha (33 Decimals)'}</option>
                  <option value="decimal">{lang === 'bn' ? 'শতক / শতাংশ (Decimal)' : 'Decimal / Shatak'}</option>
                  <option value="katha">{lang === 'bn' ? 'কাঠা (Katha)' : 'Katha'}</option>
                  <option value="acre">{lang === 'bn' ? 'একর (Acre)' : 'Acre'}</option>
                </select>
              </div>
            </div>

            {/* Google Satellite Style Interactive Map Picker with 2-way sync */}
            <div className="pt-2">
              <InteractiveLocationPicker
                initialLat={formData.lat}
                initialLon={formData.lon}
                locationTitle={`${formData.village ? formData.village + ', ' : ''}${formData.ward ? formData.ward + ', ' : ''}${formData.union_name ? formData.union_name + ', ' : ''}${formData.upazila}, ${formData.district}`}
                onLocationSelect={handleLocationSelect}
              />
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                {t.common?.cancel || (lang === 'bn' ? 'বাতিল' : 'Cancel')}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">{t.settings.district}</span>
                <span className="font-bold text-slate-900 text-sm truncate block">{formData.district}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">{labels.upazila}</span>
                <span className="font-bold text-slate-900 text-sm truncate block">{formData.upazila}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">{labels.union}</span>
                <span className="font-bold text-slate-900 text-sm truncate block">{formData.union_name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">{labels.ward}</span>
                <span className="font-bold text-emerald-700 text-sm truncate block">{formData.ward}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">{labels.village}</span>
                <span className="font-bold text-slate-900 text-sm truncate block">{formData.village}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">{lang === 'bn' ? 'প্রশাসনিক নেতৃত্ব' : 'Leadership'}</span>
                <span className="font-bold text-emerald-800 text-xs flex items-center gap-1 mt-0.5">
                  <span>{labels.icon}</span>
                  <span>{labels.leaderTitle}</span>
                </span>
              </div>
            </div>

            {/* Readonly Map Preview */}
            <div className="pt-2">
              <InteractiveLocationPicker
                initialLat={formData.lat}
                initialLon={formData.lon}
                locationTitle={`${formData.village ? formData.village + ', ' : ''}${formData.ward ? formData.ward + ', ' : ''}${formData.union_name ? formData.union_name + ', ' : ''}${formData.upazila}, ${formData.district}`}
                onLocationSelect={(lat, lon) => {
                  handleLocationSelect(lat, lon);
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
