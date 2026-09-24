import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  FileText,
  UploadCloud,
  Sliders,
  PlayCircle,
  ShieldCheck,
  Zap,
  Briefcase,
  ChevronDown,
  LogOut,
  Building2,
  User as UserIcon,
  Plus,
} from 'lucide-react';
import { JobRole, User } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenJDEditor: () => void;
  onOpenUpload: () => void;
  onStartDemoTour: () => void;
  applicantCount: number;
  availableRoles: JobRole[];
  currentRoleId: string;
  onSelectRole: (roleId: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenManualAddJD: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenJDEditor,
  onOpenUpload,
  onStartDemoTour,
  applicantCount,
  availableRoles,
  currentRoleId,
  onSelectRole,
  currentUser,
  onLogout,
  onOpenManualAddJD,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Layers },
    { id: 'ranking', label: 'Live Ranking', icon: Zap },
    { id: 'matrix', label: 'Evidence Matrix', icon: FileText },
    { id: 'talent_lens', label: 'Talent Lens', icon: Sparkles, badge: 'Lens' },
    { id: 'talent_rescue', label: 'Talent Rescue', icon: ShieldCheck },
    { id: 'team_match', label: 'Team Matching', icon: Layers },
    { id: 'what_if', label: 'What-If Lab', icon: Sliders },
    { id: 'pool_intel', label: 'Pool Intelligence', icon: Sparkles },
    { id: 'audit_trail', label: 'Audit Trail', icon: FileText },
  ];

  const currentRole = availableRoles.find((r) => r.id === currentRoleId) || availableRoles[0];

  return (
    <header className="sticky top-0 z-40 bg-[#080c16]/95 backdrop-blur-md border-b border-white/10">
      {/* Sleek Executive Status Bar */}
      <div className="bg-[#0b101e] border-b border-white/5 py-1.5 px-6 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-slate-300 font-medium font-mono text-[11px]">
            TalentPrism Engine: <span className="text-cyan-300 font-semibold">Evidence-Driven Talent Intelligence</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onStartDemoTour}
            className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition cursor-pointer"
          >
            <PlayCircle className="w-3 h-3 text-cyan-400" />
            <span>5-Step Walkthrough</span>
          </button>
          <div className="text-slate-400 border-l border-white/10 pl-3 flex items-center space-x-1.5 text-[11px]">
            <Building2 className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-300 font-semibold">{currentUser?.organization || 'Prism Technologies'}</span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight text-white font-mono">TalentPrism</span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded font-mono">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Candidate Evidence & Dynamic Lens</p>
            </div>
          </div>

          {/* ACTIVE ROLE / JD SELECTOR DROPDOWN & ADD BUTTON */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400/60 transition cursor-pointer text-xs"
              >
                <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-cyan-400 font-mono">
                    Active JD Role
                  </span>
                  <span className="text-white font-bold text-xs truncate max-w-[200px]">
                    {currentRole?.title || 'Senior Backend Engineer'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    roleDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Role Dropdown Menu */}
              {roleDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-84 rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-3 py-1.5 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center justify-between">
                    <span>Select Role JD</span>
                    <span className="text-cyan-400">{availableRoles.length} Available</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {availableRoles.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          onSelectRole(r.id);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition cursor-pointer flex flex-col space-y-0.5 ${
                          currentRoleId === r.id
                            ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-400/30'
                            : 'hover:bg-slate-900 text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-bold">{r.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {r.department} • {r.requirements.length} Skills
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Manual Add JD Role Action inside Dropdown */}
                  <div className="pt-2 border-t border-white/10 mt-1">
                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        onOpenManualAddJD();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>+ Add Manual JD (Any Career Category)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Quick Add JD button in header */}
            <button
              onClick={onOpenManualAddJD}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-semibold transition cursor-pointer"
              title="Manually create and add a new Job Description role"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add JD</span>
            </button>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenJDEditor}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 hover:border-cyan-500/40 text-xs font-medium transition cursor-pointer"
            title="Add or remove criteria, change priorities"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Edit Criteria & Weights</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 text-xs font-semibold transition cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Resumes</span>
          </button>

          {/* Recruiter Avatar & Logout */}
          <div className="flex items-center space-x-2.5 pl-3 border-l border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-purple-400/40">
                {currentUser?.name?.split(' ').map((n) => n[0]).join('') || 'SR'}
              </div>
              <div className="hidden xl:block text-left text-xs leading-tight">
                <p className="font-semibold text-slate-200">{currentUser?.name || 'Sarah Recruiter'}</p>
                <p className="text-[9px] text-slate-400">{currentUser?.role || 'Lead Talent Partner'}</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-white/10 transition cursor-pointer"
              title="Sign Out / Switch Recruiter"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 flex items-center space-x-1 overflow-x-auto no-scrollbar border-t border-white/5 bg-[#0a0f1d]/70">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs transition-all cursor-pointer whitespace-nowrap border-b-2 font-medium ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
