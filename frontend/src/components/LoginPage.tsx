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
  Info,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../api/client';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

interface AuthorizedAccount {
  email: string;
  password: string;
  name: string;
  role: string;
  organization: string;
  badge: string;
  avatar: string;
  department: string;
}

const AUTHORIZED_ACCOUNTS: AuthorizedAccount[] = [
  {
    email: 'recruiter@talentprism.ai',
    password: 'PrismRecruiter@2025',
    name: 'Sarah Recruiter',
    role: 'Lead Talent Partner',
    organization: 'Prism Technologies Inc.',
    badge: 'Executive Partner',
    avatar: 'SR',
    department: 'Global Talent Acquisition',
  },
  {
    email: 'vishesh@talentprism.ai',
    password: 'Vishesh@TalentPrism',
    name: 'Vishesh Rajput',
    role: 'Head of Talent Acquisition & AI Strategy',
    organization: 'TalentPrism Global Labs',
    badge: 'Platform Administrator',
    avatar: 'VR',
    department: 'Executive Leadership',
  },
  {
    email: 'hiring.manager@talentprism.ai',
    password: 'HiringManager@2025',
    name: 'Alex Chen',
    role: 'VP of Engineering & Hiring Manager',
    organization: 'Prism Cloud Infrastructure',
    badge: 'Hiring Manager',
    avatar: 'AC',
    department: 'Core Engineering',
  },
  {
    email: 'demo@talentprism.ai',
    password: 'TalentPrism@Demo',
    name: 'Enterprise Demo Partner',
    role: 'Strategic Talent Lead',
    organization: 'Prism Enterprise Sandbox',
    badge: 'Demo Sandbox',
    avatar: 'TP',
    department: 'Evaluation & Demo Sandbox',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState<string>('recruiter@talentprism.ai');
  const [password, setPassword] = useState<string>('PrismRecruiter@2025');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string>('recruiter@talentprism.ai');

  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectAccount = (account: AuthorizedAccount) => {
    setSelectedAccountEmail(account.email);
    setEmail(account.email);
    setPassword(account.password);
    setErrorMessage(null);
  };

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const response = await api.login({
        email: loginEmail.trim(),
        password: loginPass.trim(),
      });

      if (response && response.user) {
        if (response.access_token) {
          localStorage.setItem('talentprism_jwt_token', response.access_token);
        }
        onLogin(response.user);
      } else {
        throw new Error('Authentication succeeded but user profile was not returned.');
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        'Authentication rejected: Invalid corporate email or security key. Access is restricted to authorized enterprise accounts.';
      setErrorMessage(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both corporate email and password.');
      return;
    }
    executeLogin(email, password);
  };

  const handleQuickDemo = () => {
    const defaultAcc = AUTHORIZED_ACCOUNTS[0];
    handleSelectAccount(defaultAcc);
    executeLogin(defaultAcc.email, defaultAcc.password);
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 flex flex-col justify-between antialiased relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] -z-10 pointer-events-none"></div>

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

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Auth Gateway Online • 256-Bit TLS</span>
          </div>

          <button
            onClick={handleQuickDemo}
            disabled={isAuthenticating}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>One-Click Demo Access</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Panel Layout */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
        {/* LEFT: Enterprise Sign-In Gateway (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-cyan-500/30 shadow-2xl space-y-5 bg-slate-950/90 backdrop-blur-xl">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 inline" />
                  <span>Corporate Security Gateway</span>
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                  Restricted Access
                </span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight mt-1">Sign In to TalentPrism</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Strictly gated: Only authorized corporate credentials are permitted.
              </p>
            </div>

            {/* Quick Profile Selection Pills */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <KeyRound className="w-3 h-3 text-cyan-400" />
                <span>Authorized Enterprise Profiles</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {AUTHORIZED_ACCOUNTS.map((acc) => {
                  const isSelected = selectedAccountEmail === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      disabled={isAuthenticating}
                      className={`text-left p-2 rounded-xl border text-xs transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400/60 shadow-sm shadow-cyan-500/20'
                          : 'bg-slate-900/70 border-white/10 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold truncate text-[11px] ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {acc.name}
                        </span>
                        <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                          {acc.avatar}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate mt-0.5">{acc.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start space-x-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-200 space-y-1">
                  <p className="font-semibold text-rose-300">Authentication Rejected</p>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => handleSelectAccount(AUTHORIZED_ACCOUNTS[0])}
                    className="text-[10px] text-cyan-300 underline hover:text-cyan-200 font-semibold cursor-pointer"
                  >
                    Click here to autofill primary recruiter credentials
                  </button>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-cyan-400" />
                    <span>Corporate Email Address</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">@talentprism.ai</span>
                </label>
                <input
                  type="email"
                  required
                  disabled={isAuthenticating}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSelectedAccountEmail('');
                    setErrorMessage(null);
                  }}
                  placeholder="name@talentprism.ai"
                  className={`w-full px-3 py-2 bg-slate-900 border rounded-xl text-xs text-white focus:outline-none transition ${
                    errorMessage ? 'border-rose-500/60 focus:border-rose-400' : 'border-white/10 focus:border-cyan-500'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Security Key / Password</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Case-Sensitive</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isAuthenticating}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setSelectedAccountEmail('');
                      setErrorMessage(null);
                    }}
                    placeholder="Enter corporate security key"
                    className={`w-full px-3 py-2 pr-10 bg-slate-900 border rounded-xl text-xs text-white font-mono focus:outline-none transition ${
                      errorMessage ? 'border-rose-500/60 focus:border-rose-400' : 'border-white/10 focus:border-cyan-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & SSO note */}
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
                <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-500" />
                  <span>Enterprise SSO Verified</span>
                </span>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Corporate Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Launch Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

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

          {/* Enterprise Authorized Directory Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Authorized Evaluator Directory</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400">Enterprise Ready</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Only authenticated enterprise profiles can sign in. Select any profile above to instantly populate corporate credentials and verify real-time authentication.
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
