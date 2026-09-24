import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Briefcase,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Share2,
} from 'lucide-react';
import { api } from '../api/client';

interface TalentRescueViewProps {
  onSelectCandidate: (candidateId: string) => void;
}

export const TalentRescueView: React.FC<TalentRescueViewProps> = ({ onSelectCandidate }) => {
  const [rescueData, setRescueData] = useState<any>(null);
  const [activeMode, setActiveMode] = useState<'within_role' | 'cross_role'>('within_role');
  const [loading, setLoading] = useState(true);
  const [movedCandidates, setMovedCandidates] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRescueData();
  }, []);

  const loadRescueData = async () => {
    try {
      setLoading(true);
      const data = await api.getTalentRescue();
      setRescueData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToPipeline = (candidateId: string, roleTitle: string) => {
    setMovedCandidates((prev) => ({
      ...prev,
      [candidateId]: roleTitle,
    }));
  };

  if (loading || !rescueData) {
    return (
      <div className="flex items-center justify-center p-20 glass-panel rounded-xl">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { within_role_rescue, cross_role_rescue } = rescueData;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900/80 shadow-2xl space-y-2">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dual-Mode Talent Rescue</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">Philosophy: Rescue Before Rejecting</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Talent Rescue: Recover High-Potential Candidates
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Before clicking "reject" on applicants with lower overall rankings, Talent Rescue analyzes whether
          candidates possess high core capability with concentrated uncertainty (Within-Role) or excel at other active
          openings across your organization (Cross-Role).
        </p>

        {/* Mode Selector Tabs */}
        <div className="pt-4 flex items-center space-x-2">
          <button
            onClick={() => setActiveMode('within_role')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-2 ${
              activeMode === 'within_role'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Mode A: Within-Role Rescue ({within_role_rescue.length})</span>
          </button>
          <button
            onClick={() => setActiveMode('cross_role')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-2 ${
              activeMode === 'cross_role'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Mode B: Cross-Role Rescue ({cross_role_rescue.length})</span>
          </button>
        </div>
      </div>

      {/* Mode A: Within-Role Rescue */}
      {activeMode === 'within_role' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Identified candidates with strong core evidence suppressed by a concentrated gap:</span>
            <span className="text-cyan-400 font-semibold">{within_role_rescue.length} candidates need human review</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {within_role_rescue.map((item: any) => {
              const c = item.candidate;
              const lens = item.lens;

              return (
                <div
                  key={c.id}
                  className="glass-panel p-5 rounded-xl border border-cyan-500/20 hover:border-cyan-400/40 transition space-y-4 shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-white">{c.name}</h3>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                          Rank #{c.rank}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{c.current_title}</p>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      Hidden Core Strength
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-white/5 space-y-1.5 text-xs">
                    <span className="font-semibold text-cyan-300">Rescue Recommendation:</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">“{item.rescue_note}”</p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Core Capabilities:</span>
                      <span className="text-emerald-400 font-mono font-bold">Top 5% of Applicant Pool</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Suppressing Uncertainty:</span>
                      <span className="text-rose-400 font-mono font-bold">
                        {lens.primary_suppressors.map((s: any) => s.skill).join(', ') || 'Docker'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => onSelectCandidate(c.id)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Open Candidate Intelligence Passport</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode B: Cross-Role Rescue */}
      {activeMode === 'cross_role' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Candidates whose passports align strongly with other currently open company roles:</span>
            <span className="text-purple-400 font-semibold">{cross_role_rescue.length} cross-role opportunities</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cross_role_rescue.map((item: any) => {
              const c = item.candidate;
              const bestRole = item.best_alternative_role;
              const isMoved = movedCandidates[c.id];

              return (
                <div
                  key={c.id}
                  className="glass-panel p-5 rounded-xl border border-purple-500/20 hover:border-purple-400/40 transition space-y-4 shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{c.name}</h3>
                      <p className="text-xs text-slate-400">Applied For: Senior Backend Engineer ({c.overall_match}%)</p>
                    </div>

                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {bestRole.fit_percentage}% Fit
                    </span>
                  </div>

                  {/* Target Alternative Role */}
                  <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-purple-300 font-bold">
                      <Briefcase className="w-4 h-4" />
                      <span>{bestRole.role_title} ({bestRole.department})</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Strong matching capabilities: <span className="font-semibold text-white">{bestRole.matched_skills.join(', ')}</span>
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => onSelectCandidate(c.id)}
                      className="text-xs text-slate-300 hover:text-white font-medium cursor-pointer"
                    >
                      View Alternative Evidence
                    </button>

                    {isMoved ? (
                      <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Queued for {isMoved}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMoveToPipeline(c.id, bestRole.role_title)}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition cursor-pointer shadow-md shadow-purple-600/20"
                      >
                        Move to Review Pipeline
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
