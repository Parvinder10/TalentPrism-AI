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
  Zap,
  Award,
  Target,
  ChevronRight,
  Check,
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
  // Filter candidates flagged with Talent Lens alert (rank suppressed high-potential)
  const alertCandidates = candidates.filter((c) => c.has_talent_lens_alert);
  const [filterMode, setFilterMode] = useState<'suppressed' | 'all'>('suppressed');

  // Candidate pool to display based on mode
  const activePool = filterMode === 'suppressed' && alertCandidates.length > 0
    ? alertCandidates
    : candidates;

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(() => {
    if (alertCandidates.length > 0) return alertCandidates[0].id;
    return candidates[0]?.id || '';
  });

  const [lensData, setLensData] = useState<TalentLensInsight | null>(null);
  const [loading, setLoading] = useState(false);

  // Automatically ensure a valid candidate is selected when pool changes or candidate deleted
  useEffect(() => {
    if (activePool.length > 0 && (!selectedCandidateId || !candidates.some((c) => c.id === selectedCandidateId))) {
      setSelectedCandidateId(activePool[0].id);
    }
  }, [activePool, candidates, selectedCandidateId]);

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
      console.error('Failed to load Talent Lens data:', e);
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
          <span className="text-xs text-slate-400 font-mono">Rank Suppression & De-Averaging Architecture</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Talent Lens: See What Aggregate Scores Are Hiding
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Standard ATS algorithms collapse multi-dimensional engineering talent into a single flat percentage, artificially
          penalizing exceptional specialists for unverified secondary keywords. Talent Lens de-averages aggregate scores to isolate
          and rescue high-potential talent whose true rank is suppressed.
        </p>
      </div>

      {/* Candidate Selector Bar */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => {
                setFilterMode('suppressed');
                if (alertCandidates.length > 0) setSelectedCandidateId(alertCandidates[0].id);
              }}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                filterMode === 'suppressed'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3 text-purple-300" />
              <span>Suppressed Talent ({alertCandidates.length})</span>
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All Candidates ({candidates.length})</span>
            </button>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {activePool.slice(0, 7).map((c) => (
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
                {c.has_talent_lens_alert && <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>}
              </button>
            ))}

            {activePool.length > 7 && (
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {activePool.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (#{c.rank}) {c.has_talent_lens_alert ? '★ Suppressed Talent' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <button
          onClick={() => onOpenSimulator(selectedCandidateId)}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-indigo-600/20"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Simulate Skill Scenario</span>
        </button>
      </div>

      {/* Main Talent Lens Deep Dive Panel */}
      {loading || !lensData ? (
        <div className="p-16 glass-panel rounded-xl flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">Analyzing applicant evidence distribution against pool benchmarks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Candidate vs Pool Benchmark */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-purple-500/20 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white">{currentCandidate?.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      lensData.is_suppressed
                        ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
                    }`}>
                      {lensData.archetype}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Current Rank: <span className="font-bold text-white font-mono">#{currentCandidate?.rank}</span> • Aggregate Match:{' '}
                    <span className="font-bold text-cyan-400 font-mono">{currentCandidate?.overall_match}%</span>
                    {lensData.is_suppressed && lensData.potential_recovered_score && (
                      <span className="text-emerald-400 ml-2 font-mono">
                        (Potential: {lensData.potential_recovered_score}% • Top #{lensData.potential_recovered_rank})
                      </span>
                    )}
                  </p>
                </div>

                <div className={`p-3 rounded-lg text-xs border ${
                  lensData.is_suppressed
                    ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                    : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                }`}>
                  <div className="flex items-center space-x-1.5 font-bold">
                    {lensData.is_suppressed ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{lensData.headline}</span>
                  </div>
                  <span className="text-[11px] opacity-80 block mt-0.5">
                    {lensData.is_suppressed
                      ? `Concentrated Gap Suppressing Rank (~${lensData.estimated_score_penalty || 12.5} pts)`
                      : 'Consistent Evidence Across Requirements'}
                  </span>
                </div>
              </div>

              {/* Lens Explanation Quote */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
                <p className="text-xs text-slate-200 leading-relaxed italic">“{lensData.summary}”</p>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>
                    Philosophy: A single unverified resume keyword does not imply lack of foundational engineering ability.
                  </span>
                </div>
              </div>

              {/* Requirement Comparison Bars: Candidate vs Applicant Pool Average */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-white uppercase text-[11px] tracking-wider">
                    Evidence Strength vs Applicant Pool Benchmark
                  </span>
                  <div className="flex items-center space-x-4 text-[10px]">
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
                    const isOutperforming = item.difference >= 6;
                    const isSuppressor = item.difference <= -10;

                    return (
                      <div key={item.skill} className="space-y-1.5 p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white font-mono">{item.skill}</span>
                            {isOutperforming && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Top Tier (+{item.difference}%)
                              </span>
                            )}
                            {isSuppressor && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Primary Rank Suppressor ({item.difference}%)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 font-mono text-xs">
                            <span className={`font-bold ${isSuppressor ? 'text-rose-400' : 'text-cyan-300'}`}>
                              {item.candidate_score}%
                            </span>
                            <span className="text-slate-500">vs</span>
                            <span className="text-slate-400">{item.pool_average}% avg</span>
                          </div>
                        </div>

                        {/* Comparative Visual Bar */}
                        <div className="space-y-1">
                          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                            {/* Pool Average Marker */}
                            <div
                              className="absolute top-0 bottom-0 w-1 bg-white/70 z-10 rounded-full"
                              style={{ left: `${item.pool_average}%` }}
                              title={`Pool Average: ${item.pool_average}%`}
                            />
                            {/* Candidate Fill */}
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isSuppressor
                                  ? 'bg-rose-500'
                                  : isOutperforming
                                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-500'
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
            {/* Concentrated Gap Card or Competency Diagnosis */}
            {lensData.is_suppressed ? (
              <div className="glass-panel p-5 rounded-xl border border-rose-500/30 bg-rose-950/10 space-y-4">
                <div className="flex items-center space-x-2 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">Rank Suppression Diagnosis</h4>
                </div>

                <div className="space-y-3 text-xs">
                  {lensData.primary_suppressors.map((sup) => (
                    <div key={sup.skill} className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-200">{sup.skill}</span>
                        <span className="font-mono text-rose-300">{sup.candidate_score}% (Pool: {sup.pool_average}%)</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Unverified in primary work experience. Suppresses overall composite score by{' '}
                        <span className="text-rose-300 font-semibold font-mono">
                          ~{Math.round((80 - sup.candidate_score) * 0.22 * 10) / 10} pts
                        </span>.
                      </p>
                    </div>
                  ))}

                  {/* Simulated Recovery Box */}
                  {lensData.potential_recovered_score && (
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                      <div className="flex items-center space-x-1.5 text-emerald-300 font-bold text-[11px]">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Simulated Verification Recovery</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        If validated at $\ge 80\%$, candidate match rises from{' '}
                        <span className="font-mono font-bold text-white">{currentCandidate?.overall_match}%</span> $\rightarrow${' '}
                        <span className="font-mono font-bold text-emerald-300">{lensData.potential_recovered_score}%</span>, advancing to{' '}
                        <span className="font-mono font-bold text-cyan-300">Top #{lensData.potential_recovered_rank}</span>!
                      </p>
                    </div>
                  )}

                  {/* Recruiter Strategy */}
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 space-y-1">
                    <span className="text-[11px] font-bold text-purple-300 block">Recruiter Strategy</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {lensData.recruiter_strategy || (
                        <>
                          Do not reject this candidate. {currentCandidate?.name} demonstrates superior core fundamentals.
                          Instead, utilize the <span className="text-white font-semibold">AI Interview Intelligence</span> module
                          to test unverified secondary requirements directly.
                        </>
                      )}
                    </p>
                  </div>

                  {/* Interview Validation Prompts */}
                  {lensData.interview_validation_focus && lensData.interview_validation_focus.length > 0 && (
                    <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
                      <span className="text-[11px] font-bold text-indigo-300 flex items-center space-x-1">
                        <Target className="w-3.5 h-3.5" />
                        <span>Targeted Interview Focus</span>
                      </span>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {lensData.interview_validation_focus.map((q, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5">
                            <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
            ) : (
              <div className="glass-panel p-5 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-4">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">Competency Alignment Diagnosis</h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                    <span className="font-bold text-emerald-200">Balanced Evidence Distribution</span>
                    <p className="text-[11px] text-slate-300">
                      No concentrated gaps detected. Candidate evidence distribution closely matches or exceeds pool benchmarks across competencies.
                    </p>
                  </div>

                  {/* Recruiter Strategy */}
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 space-y-1">
                    <span className="text-[11px] font-bold text-cyan-300 block">Recruiter Strategy</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {lensData.recruiter_strategy || (
                        <>
                          {currentCandidate?.name} presents a dependable, well-distributed candidate profile across requirements.
                          Advance through standard technical screening with a focus on system scalability and leadership.
                        </>
                      )}
                    </p>
                  </div>

                  {/* Interview Validation Prompts */}
                  {lensData.interview_validation_focus && lensData.interview_validation_focus.length > 0 && (
                    <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
                      <span className="text-[11px] font-bold text-indigo-300 flex items-center space-x-1">
                        <Target className="w-3.5 h-3.5" />
                        <span>Recommended Interview Probes</span>
                      </span>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {lensData.interview_validation_focus.map((q, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5">
                            <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
            )}

            {/* Specialist vs Balanced Profile Card */}
            <div className="glass-panel p-5 rounded-xl border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
                Profile Distribution Shape
              </h4>
              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-white/5 space-y-2">
                <span className="text-xs font-bold text-purple-300">{lensData.archetype}</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {lensData.profile_distribution_description || (
                    lensData.is_suppressed
                      ? 'Demonstrates sharp domain specialization. Strong in core technical requirements with high capability depth.'
                      : 'Maintains balanced, dependable coverage matching general applicant pool expectations with steady execution potential.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
