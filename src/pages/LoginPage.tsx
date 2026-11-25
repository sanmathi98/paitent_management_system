import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const HERO_IMG = '/src/assets/images/clinic_reception_interior_1795598547887.jpg';

export function LoginPage() {
  const { state, login, register, setApiMode, clearAuthError } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const validateEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleTabChange = (nextTab: 'login' | 'register') => {
    setTab(nextTab);
    setLocalError(null);
    clearAuthError();
  };

  const handleFillSampleAccount = () => {
    setTab('login');
    setEmail('clinic.admin@careledger.org');
    setPassword('CareClinic2026!');
    setLocalError(null);
    clearAuthError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (tab === 'register' && !name.trim()) {
      setLocalError('Full name is required.');
      return;
    }

    if (!email.trim()) {
      setLocalError('Email address is required.');
      return;
    }

    if (!validateEmail(email)) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setLocalError('Password is required.');
      return;
    }

    if (tab === 'register') {
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }
      const ok = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });
      if (ok) {
        navigate('/dashboard');
      }
    } else {
      const ok = await login({ email: email.trim(), password });
      if (ok) {
        navigate('/dashboard');
      }
    }
  };

  const displayError = localError || state.auth.error;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Clinical Showcase Panel */}
      <div className="lg:w-1/2 relative bg-slate-900 text-white flex flex-col justify-between min-h-[280px] lg:min-h-screen overflow-hidden">
        {!imgFailed ? (
          <img
            src={HERO_IMG}
            alt="Modern clinical reception atrium"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/40" />

        <div className="relative z-10 p-8 sm:p-12">
          <p className="text-xl font-bold tracking-tight font-display">
            CareLedger Clinical
          </p>
        </div>

        <div className="relative z-10 p-8 sm:p-12 max-w-xl">
          <h2 className="text-2xl sm:text-4xl font-semibold leading-tight font-display [text-wrap:balance]">
            Structured patient records, billing, and verified Razorpay settlements.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-200 leading-relaxed">
            Manage outpatient demographics, generate itemized tax invoices, and
            process real-time patient payments through Django REST Framework and
            MySQL.
          </p>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-display">
              {tab === 'login' ? 'Sign in to CareLedger' : 'Create staff account'}
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              {tab === 'login'
                ? 'Access your clinic dashboard, patient registry, and billing ledger.'
                : 'Register a clinic staff account to manage patients and bills.'}
            </p>
          </div>

          {/* Segmented Mode Tabs: Login / Register */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className={`py-2 text-sm font-medium rounded-md transition-colors ${
                tab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`py-2 text-sm font-medium rounded-md transition-colors ${
                tab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* API Mode Switcher */}
          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <p className="text-xs font-medium text-slate-700">Backend Mode</p>
              <p className="text-xs text-slate-500">
                {state.apiMode === 'sandbox'
                  ? 'Browser Sandbox (no local server required)'
                  : 'Django REST API (localhost:8000)'}
              </p>
            </div>
            <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-md shrink-0">
              <button
                type="button"
                onClick={() => setApiMode('sandbox')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  state.apiMode === 'sandbox'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sandbox
              </button>
              <button
                type="button"
                onClick={() => setApiMode('django')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  state.apiMode === 'django'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Django
              </button>
            </div>
          </div>

          {displayError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {tab === 'register' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Priya Sharma"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  required
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@clinic.org"
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                required
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {tab === 'register' && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={state.auth.loading}
              className="w-full py-2.5 px-4 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {state.auth.loading
                ? tab === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : tab === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </form>

          {state.apiMode === 'sandbox' && tab === 'login' && (
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Testing the preview sandbox?
              </p>
              <button
                type="button"
                onClick={handleFillSampleAccount}
                className="text-xs font-medium text-teal-700 hover:text-teal-800 underline underline-offset-2 whitespace-nowrap"
              >
                Use Sample Clinic Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
