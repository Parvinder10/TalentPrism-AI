import React, { useState, useEffect } from 'react';
import {
  Layers,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { RankedCandidate, TeamMatchAnalysis } from '../types';

interface TeamMatchingViewProps {
  candidates: RankedCandidate[];
  onSelectCandidate: (candidateId: string) => void;
}

export const TeamMatchingView: React.FC<TeamMatchingViewProps> = ({
  candidates,
  onSelectCandidate,
}) => {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(() => candidates[0]?.id || '');
  const [teamProfile, setTeamProfile] = useState<any>(null);
  const [teamMatch, setTeamMatch] = useState<TeamMatchAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  // Automatically ensure a valid candidate is selected when pool updates or candidate deleted
  useEffect(() => {
    if (candidates.length > 0 && (!selectedCandidateId || !candidates.some((c) => c.id === selectedCandidateId))) {
      setSelectedCandidateId(candidates[0].id);
    }
  }, [candidates, selectedCandidateId]);

  const currentCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  useEffect(() => {
    if (selectedCandidateId) {
      loadTeamData();
    }
  }, [selectedCandidateId]);

  const loadTeamData = async () => {
    if (!selectedCandidateId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [profile, match] = await Promise.all([
        api.getTeamSkills('backend_team'),
        api.getCandidateTeamMatch(selectedCandidateId),
      ]);
      setTeamProfile(profile);
      setTeamMatch(match);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl border border-white/10 space-y-3">
        <Users className="w-10 h-10 text-cyan-400 mx-auto opacity-60" />
        <h3 className="text-base font-bold text-white">No Applicants in Active Pool</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          There are currently no active candidates. Upload candidate CVs or select an active Job Description role to evaluate team matching.
        </p>
      </div>
    );
  }

  if (loading || !teamProfile || !teamMatch) {
    return (
      <div className="flex items-center justify-center p-20 glass-panel rounded-xl">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const teamCaps = teamProfile.capabilities;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/80 shadow-2xl space-y-2">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Team Capability Architecture</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">Role Match vs Team Complement</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Team Skill Matching: Optimize Beyond the Solo Role
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          A candidate might have an average score for this specific role, yet provide critical infrastructure
          capabilities that the existing engineering pod currently lacks. TalentPrism analyzes candidate evidence
          against existing team capability density.
        </p>
      </div>

      {/* Candidate Selector */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluate Candidate:</span>
          <div className="flex flex-wrap items-center gap-2">
            {candidates.slice(0, 6).map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCandidateId(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 ${
                  selectedCandidateId === c.id
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/10'
                }`}
              >
                <span>{c.name}</span>
                <span className="font-mono text-[10px] opacity-75">#{c.rank}</span>
              </button>
            ))}
            {candidates.length > 6 && (
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (#{c.rank})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Team: <span className="font-bold text-white">{teamProfile.team_name}</span> ({teamProfile.size} Engineers)
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Team Capability Graph / Bars */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Existing Team Capability Coverage</h3>
                <p className="text-xs text-slate-400">Current strength density across 10 Core Backend Engineers</p>
              </div>
              <span className="text-xs font-mono text-cyan-300">10 Engineers</span>
            </div>

            <div className="space-y-3">
              {Object.entries(teamCaps).map(([skill, data]: [string, any]) => {
                const isDistinctive = teamMatch.distinctive_capabilities.includes(skill);
                const isOverlapping = teamMatch.overlapping_capabilities.includes(skill);

                return (
                  <div key={skill} className="p-3 rounded-lg bg-slate-900/50 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white font-mono">{skill}</span>
                        {isDistinctive && (
                          <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Candidate Complement Advantage
                          </span>
                        )}
                        {isOverlapping && (
                          <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300">
                            Overlapping Core
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 font-mono text-xs">
                        <span className="text-slate-400">{data.headcount}/10 devs ({data.coverage}%)</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            data.level === 'STRONG'
                              ? 'bg-blue-500/20 text-blue-300'
                              : data.level === 'MODERATE'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {data.level}
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          data.coverage >= 80 ? 'bg-cyan-400' : data.coverage >= 50 ? 'bg-indigo-400' : 'bg-amber-500'
                        }`}
                        style={{ width: `${data.coverage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Candidate Complement Analysis */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-xl border border-cyan-500/30 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Team Synthesis</span>
              <h3 className="text-base font-bold text-white">{currentCandidate.name}</h3>
              <p className="text-xs text-slate-400">Role Match: {teamMatch.role_match_score}%</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
              <span className="text-xs text-slate-400">Team Complement Score</span>
              <p className="text-3xl font-bold font-mono text-emerald-400">{teamMatch.team_complement_score}%</p>
              <p className="text-[10px] text-slate-400">Evaluates capabilities candidate brings to deficit areas</p>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-300">Complement Analysis:</span>
              <p className="text-slate-300 text-[11px] leading-relaxed italic bg-slate-900/40 p-3 rounded-lg border border-white/5">
                “{teamMatch.analysis_text}”
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-semibold text-emerald-400">Distinctive Capabilities (Deficit Fillers):</span>
              <div className="flex flex-wrap gap-1.5">
                {teamMatch.distinctive_capabilities.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-semibold text-blue-400">Overlapping Baseline:</span>
              <div className="flex flex-wrap gap-1.5">
                {teamMatch.overlapping_capabilities.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => onSelectCandidate(selectedCandidateId)}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer"
              >
                Inspect Candidate Evidence
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
