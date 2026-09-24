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
  Layers,
  Sliders,
  Filter,
} from 'lucide-react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [name, setName] = useState('Sarah Recruiter');
  const [email, setEmail] = useState('recruiter@talentprism.ai');
  const [organization, setOrganization] = useState('Prism Technologies Inc.');
  const [role, setRole] = useState('Lead Talent Partner');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onLogin({
      name: name.trim(),
      email: email.trim(),
      role: role.trim(),
      organization: organization.trim(),
    });
  };

  const handleQuickDemo = () => {
    onLogin({
      name: 'Sarah Recruiter',
      email: 'recruiter@talentprism.ai',
      role: 'Lead Talent Partner',
      organization: 'Prism Technologies Inc.',
    });
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 flex flex-col justify-between antialiased relative overflow-hidden">
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
                AI PRO
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleQuickDemo}
          className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>One-Click Demo Access</span>
        </button>
      </div>

      {/* Main Dual-Panel Layout */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
        {/* LEFT: Recruiter Sign-in Gateway (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-cyan-500/30 shadow-2xl space-y-5 bg-slate-950/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                Recruiter Portal
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">Sign In to TalentPrism</h1>
              <p className="text-xs text-slate-400">
                Access your evidence-based candidate intelligence workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                  <UserIcon className="w-3 h-3 text-cyan-400" />
                  <span>Recruiter Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                  <Mail className="w-3 h-3 text-cyan-400" />
                  <span>Work Email</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                    <Building2 className="w-3 h-3 text-purple-400" />
                    <span>Company</span>
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                    <Briefcase className="w-3 h-3 text-purple-400" />
                    <span>Role Title</span>
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition cursor-pointer flex items-center justify-center space-x-2 pt-2.5"
              >
                <span>Launch Recruiter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
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
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/5 text-center text-[11px] text-slate-400 font-mono">
        TalentPrism AI • Enterprise Recruitment Intelligence & Talent Lens Architecture
      </div>
    </div>
  );
};
