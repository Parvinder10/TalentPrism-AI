import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  Briefcase,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldAlert,
  Copy,
  Check,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../api/client';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const MASTER_ADMIN_KEY = 'PrismAdmin@2025';

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  // Mode: 'signin' for existing or direct admin key login, 'register' for new user creation
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign In State
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // New User / Register State
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regCompany, setRegCompany] = useState<string>('');
  const [regRole, setRegRole] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regAdminKey, setRegAdminKey] = useState<string>(MASTER_ADMIN_KEY);
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Feedback State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(MASTER_ADMIN_KEY);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleUseAdminKeyInSignIn = () => {
    setLoginPassword(MASTER_ADMIN_KEY);
    setErrorMessage(null);
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter both your corporate email/ID and password or admin key.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.login({
        email: loginEmail.trim(),
        password: loginPassword.trim(),
      });

      if (res && res.user) {
        if (res.access_token) {
          localStorage.setItem('talentprism_jwt_token', res.access_token);
        }
        onLogin(res.user);
      } else {
        throw new Error('Authentication succeeded but user record was not returned.');
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          'Authentication failed. Please verify your credentials or use the Enterprise Admin Key (PrismAdmin@2025).'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage('Full name, corporate email/ID, and password are required.');
      return;
    }

    if (!regAdminKey.trim()) {
      setErrorMessage(`Please enter the authorized Enterprise Admin Key (${MASTER_ADMIN_KEY}) to provision your account.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword.trim(),
        admin_key: regAdminKey.trim(),
        role: regRole.trim() || 'Talent Acquisition Admin',
        organization: regCompany.trim() || 'Enterprise Organization',
      });

      if (res && res.user) {
        if (res.access_token) {
          localStorage.setItem('talentprism_jwt_token', res.access_token);
        }
        setSuccessMessage('Admin account provisioned successfully! Launching workspace...');
        setTimeout(() => {
          onLogin(res.user);
        }, 600);
      } else {
        throw new Error('Registration completed but user profile was not returned.');
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          `Registration failed: Invalid Admin Key. Please provide the authorized key: ${MASTER_ADMIN_KEY}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 flex flex-col justify-between antialiased relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/4 w-[520px] h-[520px] bg-blue-600/10 rounded-full blur-[140px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[520px] h-[520px] bg-purple-600/10 rounded-full blur-[140px] -z-10 pointer-events-none"></div>

      {/* Top Bar */}
      <div className="px-6 py-3.5 border-b border-white/5 bg-[#0a0d18]/70 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold tracking-tight text-white font-mono">TalentPrism</span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded font-mono">
                ENTERPRISE AI
              </span>
            </div>
          </div>
        </div>

        {/* Universal Admin Key Pill in Top Bar */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-cyan-950/40 border border-cyan-400/40 text-xs">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-300 hidden sm:inline">Admin Key:</span>
            <code className="text-[11px] font-mono font-bold text-cyan-300 bg-slate-900/80 px-1.5 py-0.5 rounded border border-white/10">
              {MASTER_ADMIN_KEY}
            </code>
            <button
              onClick={handleCopyKey}
              className="text-slate-400 hover:text-cyan-300 p-0.5 transition cursor-pointer"
              title="Copy Master Admin Key"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-[11px] text-slate-400 font-mono pl-2 border-l border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Gateway Online</span>
          </div>
        </div>
      </div>

      {/* Main Dual-Panel Layout */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
        {/* LEFT: Sign In & New User Registration Gateway (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-cyan-500/30 shadow-2xl space-y-4 bg-slate-950/90 backdrop-blur-xl">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 inline" />
                  <span>Enterprise Portal</span>
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                  Role-Based Security
                </span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight mt-1">
                {authMode === 'signin' ? 'Sign In to TalentPrism' : 'New User / Admin Setup'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {authMode === 'signin'
                  ? 'Access your candidate intelligence workspace with your ID or Admin Key.'
                  : 'Provision a new corporate administrator account with the master passkey.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage(null);
                }}
                className={`py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  authMode === 'signin'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Admin Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage(null);
                }}
                className={`py-1.5 px-3 rounded-lg font-semibold transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  authMode === 'register'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New User Access</span>
              </button>
            </div>

            {/* Master Admin Key Callout Card */}
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-300 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Master Admin Password Key</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="text-[10px] text-cyan-400 hover:text-cyan-200 font-mono font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
              <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-white/10 font-mono text-xs">
                <span className="text-cyan-200 font-bold tracking-wide">{MASTER_ADMIN_KEY}</span>
                {authMode === 'signin' ? (
                  <button
                    type="button"
                    onClick={handleUseAdminKeyInSignIn}
                    className="text-[10px] text-cyan-300 hover:text-cyan-100 underline font-sans font-semibold cursor-pointer"
                  >
                    Use as Password
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-sans">Authorized Passkey</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Any administrator can log in with their own email or ID using this key, or use it to authorize new corporate accounts.
              </p>
            </div>

            {/* Feedback Banners */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start space-x-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-200 space-y-1">
                  <p className="font-semibold text-rose-300">Access Notice</p>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-start space-x-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-200">
                  <p className="font-semibold text-emerald-300">{successMessage}</p>
                </div>
              </div>
            )}

            {/* TAB 1: SIGN IN FORM */}
            {authMode === 'signin' ? (
              <form onSubmit={handleSignInSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-cyan-400" />
                    <span>Corporate Email / Admin ID</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="e.g. admin@company.com or your_id"
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Password or Admin Key</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleUseAdminKeyInSignIn}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                    >
                      Fill Admin Key
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      disabled={isLoading}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder={`Enter password or ${MASTER_ADMIN_KEY}`}
                      className="w-full px-3 py-2 pr-10 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      tabIndex={-1}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition"
                      title={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  </div>
                </div>

                {/* Remember session */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-900 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span>Remember session</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                  >
                    Need new account? Register →
                  </button>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60 pt-2.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch Admin Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* TAB 2: REGISTER NEW USER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                    <UserIcon className="w-3 h-3 text-cyan-400" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="e.g. Vishesh Rajput or Alex Hunter"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-cyan-400" />
                    <span>Corporate Email / Admin ID</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="e.g. yourname@company.com"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                      <Building2 className="w-3 h-3 text-purple-400" />
                      <span>Company / Org</span>
                    </label>
                    <input
                      type="text"
                      disabled={isLoading}
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                      <Briefcase className="w-3 h-3 text-purple-400" />
                      <span>Role Title</span>
                    </label>
                    <input
                      type="text"
                      disabled={isLoading}
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      placeholder="e.g. Lead Talent Partner"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Create Custom Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      disabled={isLoading}
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="Create your account password"
                      className="w-full px-3 py-1.5 pr-10 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      tabIndex={-1}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition"
                      title={showRegPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <KeyRound className="w-3 h-3 text-cyan-400" />
                      <span>Enterprise Admin Passkey</span>
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">Authorization Key</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={regAdminKey}
                    onChange={(e) => {
                      setRegAdminKey(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder={`Enter master key: ${MASTER_ADMIN_KEY}`}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-cyan-500/40 rounded-xl text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <p className="text-[10px] text-slate-400">
                    Master key <code className="text-cyan-300">{MASTER_ADMIN_KEY}</code> is required to verify administrator privileges.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60 pt-2.5 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Provisioning Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Provision & Launch Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                  >
                    Already have an account or key? Sign in directly →
                  </button>
                </div>
              </form>
            )}

            {/* Security Compliance Strip */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center space-x-1">
                <ShieldAlert className="w-3 h-3 text-cyan-400" />
                <span>Zero-Mock Audit Trail</span>
              </span>
              <span>SOC-2 Type II Certified</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Visual Side Comparison (7 cols, scannable & non-wordy) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Uniqueness Quote Pill */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs">
            <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 block">Core Philosophy</span>
            <p className="text-slate-200 font-medium italic mt-0.5">
              “A resume tells us what a candidate claims. <span className="text-cyan-300 not-italic font-bold">TalentPrism</span> shows where the evidence comes from, what remains uncertain, and what an aggregate score may be hiding.”
            </p>
          </div>

          {/* Side-by-Side Visual Comparison Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* ATS Limitation Card */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
              <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-xs uppercase tracking-wide">
                <XCircle className="w-4 h-4" />
                <span>Conventional ATS</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-start space-x-1.5">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Keyword-density regex counting</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Black-box 0-100 aggregate score</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Silent rejection on 1 unverified skill</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>Static weights, zero what-if testing</span>
                </li>
              </ul>
            </div>

            {/* TalentPrism Superiority Card */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2.5">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4" />
                <span>TalentPrism AI</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-200">
                <li className="flex items-start space-x-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Multi-source evidence provenance</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Talent Lens rank suppression alerts</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Cross-role & within-role rescue</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Live what-if & skill checklist pooling</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
              <span className="text-base font-bold text-cyan-300">5 Roles</span>
              <span className="text-[10px] text-slate-400 block font-sans">Pre-Configured JDs</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
              <span className="text-base font-bold text-purple-300">Evidence</span>
              <span className="text-[10px] text-slate-400 block font-sans">Proven Graph Roots</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5">
              <span className="text-base font-bold text-emerald-300">Zero Mock</span>
              <span className="text-[10px] text-slate-400 block font-sans">Real Portfolio Data</span>
            </div>
          </div>

          {/* Universal Admin Governance Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Enterprise Access Governance</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400">Admin Control</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every administrator can sign in directly with their corporate email or ID using the master passkey{' '}
              <code className="text-cyan-300 font-mono font-semibold">{MASTER_ADMIN_KEY}</code>, or create their own custom credentials under the New User section.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/5 text-center text-[11px] text-slate-400 font-mono">
        TalentPrism AI • Enterprise Recruitment Intelligence & Talent Lens Architecture
      </div>
    </div>
  );
};
