import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Compass,
  CheckCircle,
  HelpCircle,
  Sliders,
} from 'lucide-react';
import { api } from '../api/client';
import { RankedCandidate, TalentLensInsight } from '../types';

interface TalentLensViewProps {
  candidates: RankedCandidate[];
  onSelectCandidate: (candidateId: string) => void;
  onOpenSimulator: (candidateId?: string) => void;
}

export const TalentLensView: React.FC<TalentLensViewProps> = ({
  candidates,
  onSelectCandidate,
  onOpenSimulator,
}) => {
  // Candidates with Talent Lens alerts (fallback to first candidates if none flagged)
  const alertCandidates = candidates.filter((c) => c.has_talent_lens_alert);
  const displayPool = alertCandidates.length > 0 ? alertCandidates : candidates.slice(0, 6);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(() => displayPool[0]?.id || '');
  const [lensData, setLensData] = useState<TalentLensInsight | null>(null);
  const [loading, setLoading] = useState(false);

  // Automatically ensure a valid candidate is selected when pool changes or candidate deleted
  useEffect(() => {
    if (displayPool.length > 0 && (!selectedCandidateId || !candidates.some((c) => c.id === selectedCandidateId))) {
      setSelectedCandidateId(displayPool[0].id);
    }
  }, [displayPool, candidates, selectedCandidateId]);

  const currentCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  useEffect(() => {
    if (selectedCandidateId) {
      loadLensData(selectedCandidateId);
    }
  }, [selectedCandidateId]);

  const loadLensData = async (cid: string) => {
    if (!cid) return;
    try {
      setLoading(true);
      const data = await api.getTalentLens(cid);
      setLensData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner / Philosophy */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900/80 shadow-2xl space-y-2">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Signature Talent Intelligence</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">Rank Suppression & Lens Architecture</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Talent Lens: See What Aggregate Scores Are Hiding
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Standard ATS algorithms collapse complex human capabilities into a single flat percentage. Talent Lens isolates
          profiles with exceptional core capabilities whose rank is suppressed by one or two unverified secondary requirements.
        </p>
      </div>

      {/* Candidate Selector Bar */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Suppressed Talent Pool:</span>
          <div className="flex flex-wrap items-center gap-2">
            {alertCandidates.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCandidateId(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 ${
                  selectedCandidateId === c.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/10'
                }`}
              >
                <span>{c.name}</span>
                <span className="font-mono text-[10px] opacity-75">#{c.rank}</span>
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onOpenSimulator(selectedCandidateId)}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Simulate Skill Scenario</span>
        </button>
      </div>

      {/* Main Talent Lens Deep Dive Panel */}
      {loading || !lensData ? (
        <div className="p-16 glass-panel rounded-xl flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Candidate vs Pool Benchmark */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-purple-500/20 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white">{currentCandidate?.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      {lensData.archetype}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Current Rank: <span className="font-bold text-white">#{currentCandidate?.rank}</span> • Aggregate Match:{' '}
                    <span className="font-bold text-cyan-400">{currentCandidate?.overall_match}%</span>
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/30 text-xs">
                  <span className="font-bold text-purple-300 block">{lensData.headline}</span>
                  <span className="text-[11px] text-slate-300">Concentrated Gap Detected</span>
                </div>
              </div>

              {/* Lens Explanation Quote */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
                <p className="text-xs text-slate-200 leading-relaxed italic">“{lensData.summary}”</p>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    Philosophy: Lack of resume evidence in one skill does not imply lack of general technical ability.
                  </span>
                </div>
              </div>

              {/* Requirement Comparison Bars: Candidate vs Applicant Pool Average */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-white uppercase text-[11px] tracking-wider">
                    Evidence Strength vs Applicant Pool Benchmark
                  </span>
                  <div className="flex items-center space-x-3 text-[10px]">
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                      <span>Candidate Score</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                      <span>Pool Average</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {lensData.pool_comparison.map((item) => {
                    const isOutperforming = item.difference > 10;
                    const isSuppressor = item.difference < -15;

                    return (
                      <div key={item.skill} className="space-y-1 p-2 rounded-lg bg-slate-900/40 border border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white font-mono">{item.skill}</span>
                            {isOutperforming && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300">
                                Top Tier (+{item.difference}%)
                              </span>
                            )}
                            {isSuppressor && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300">
                                Primary Rank Suppressor ({item.difference}%)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 font-mono text-xs">
                            <span className="font-bold text-cyan-300">{item.candidate_score}%</span>
                            <span className="text-slate-500">vs</span>
                            <span className="text-slate-400">{item.pool_average}% avg</span>
                          </div>
                        </div>

                        {/* Comparative Visual Bar */}
                        <div className="space-y-1">
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                            {/* Pool Average Marker */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                              style={{ left: `${item.pool_average}%` }}
                              title={`Pool Average: ${item.pool_average}%`}
                            />
                            {/* Candidate Fill */}
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isSuppressor
                                  ? 'bg-rose-500'
                                  : isOutperforming
                                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                                  : 'bg-indigo-500'
                              }`}
                              style={{ width: `${item.candidate_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Rank Suppression Analysis & Next Steps */}
          <div className="space-y-6">
            {/* Concentrated Gap Card */}
            <div className="glass-panel p-5 rounded-xl border border-rose-500/30 space-y-4">
              <div className="flex items-center space-x-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="text-sm font-bold text-white">Rank Suppression Diagnosis</h4>
              </div>

              <div className="space-y-3 text-xs">
                {lensData.primary_suppressors.map((sup) => (
                  <div key={sup.skill} className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-200">{sup.skill}</span>
                      <span className="font-mono text-rose-300">{sup.candidate_score}% (Pool: {sup.pool_average}%)</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Unverified in resume work experience. Pulls down overall score by ~15.2 points.
                    </p>
                  </div>
                ))}

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Recruiter Strategy: Do not reject this candidate. {currentCandidate?.name || 'This applicant'} demonstrates superior core fundamentals. Instead,
                  use the <span className="text-white font-semibold">AI Interview Intelligence</span> module to test
                  unverified secondary requirements directly.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <button
                  onClick={() => onSelectCandidate(selectedCandidateId)}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <span>Inspect Evidence Timeline & Graph</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Specialist vs Balanced Profile Card */}
            <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
                Profile Distribution Shape
              </h4>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 space-y-1.5">
                <span className="text-xs font-bold text-purple-300">{lensData.archetype}</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Demonstrates sharp domain specialization. Strong in async engineering and databases, requiring minimal
                  ramp-up for heavy backend throughput.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
