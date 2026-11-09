import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { loginUser, registerUser } from '../utils/api';
import { X, Mail, Lock, User, Sprout, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const { lang } = useLanguage();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError(lang === 'bn' ? 'অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড প্রদান করুন।' : 'Please fill out email and password.');
      return;
    }

    if (!isLoginMode && password.length < 6) {
      setError(lang === 'bn' ? 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLoginMode) {
        result = await loginUser({ email, password });
        setSuccess(lang === 'bn' ? 'সফলভাবে লগইন হয়েছে!' : 'Login successful!');
      } else {
        result = await registerUser({ name: name || 'কৃষক', email, password });
        setSuccess(lang === 'bn' ? 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!' : 'Account created successfully!');
      }

      if (result.token) {
        localStorage.setItem('crop_care_token', result.token);
        localStorage.setItem('crop_care_user', JSON.stringify(result.user || result));
      }

      if (onAuthSuccess) {
        onAuthSuccess(result.user || result);
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || (lang === 'bn' ? 'সার্ভার এরর, পুনরায় চেষ্টা করুন।' : 'Server error, please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Leaf Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-3 shadow-inner">
            <Sprout className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            {isLoginMode
              ? (lang === 'bn' ? 'স্বাগতম!' : 'Welcome Back')
              : (lang === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Account')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isLoginMode
              ? (lang === 'bn' ? 'আপনার ড্যাশবোর্ডে প্রবেশ করতে লগইন করুন।' : 'Sign in to access your dashboard.')
              : (lang === 'bn' ? 'আপনার ফসল সুরক্ষায় আজই যুক্ত হোন।' : 'Join to start protecting your crops today.')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'bn' ? 'মোঃ সিরাজুল ইসলাম' : 'Your name'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sirajul.cpp@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-pulse">
                {isLoginMode ? (lang === 'bn' ? 'প্রবেশ করা হচ্ছে...' : 'Signing In...') : (lang === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating Account...')}
              </span>
            ) : (
              <>
                <span>{isLoginMode ? (lang === 'bn' ? 'লগইন করুন' : 'Sign In') : (lang === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 text-center text-xs text-slate-500">
          {isLoginMode ? (
            <p>
              {lang === 'bn' ? 'অ্যাকাউন্ট নেই?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setIsLoginMode(false); setError(''); setSuccess(''); }}
                className="font-bold text-emerald-600 hover:text-emerald-700 ml-1 underline cursor-pointer"
              >
                {lang === 'bn' ? 'নতুন খুলুন (Sign Up)' : 'Sign Up'}
              </button>
            </p>
          ) : (
            <p>
              {lang === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => { setIsLoginMode(true); setError(''); setSuccess(''); }}
                className="font-bold text-emerald-600 hover:text-emerald-700 ml-1 underline cursor-pointer"
              >
                {lang === 'bn' ? 'লগইন করুন (Log In)' : 'Log In'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
