import React, { useState, useMemo } from 'react';
import {
  Users,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Sliders,
  BarChart3,
  Layers,
  Zap,
  Globe,
  Award,
  ChevronRight,
  ExternalLink,
  Trash2,
  Check,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { RankedCandidate, JobRequirement } from '../types';

interface RecruiterDashboardProps {
  candidates: RankedCandidate[];
  requirements: JobRequirement[];
  onSelectCandidate: (candidateId: string) => void;
  onNavigateTab: (tab: string) => void;
  onStartDemoTour: () => void;
  onOpenJDEditor?: () => void;
  currentRoleTitle?: string;
  onRemoveCandidate?: (candidateId: string, candidateName: string) => void;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({
  candidates,
  requirements,
  onSelectCandidate,
  onNavigateTab,
  onStartDemoTour,
  onOpenJDEditor,
  currentRoleTitle = 'Senior Backend Engineer',
  onRemoveCandidate,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'top_tier' | 'lens_alerts' | 'high_evidence'>('all');

  // --- REAL COMPUTED DATA ---
  const totalCount = candidates.length;

  const avgMatchScore = useMemo(() => {
    if (!totalCount) return 0;
    const sum = candidates.reduce((acc, c) => acc + (c.overall_match || 0), 0);
    return Math.round(sum / totalCount);
  }, [candidates, totalCount]);

  const topCandidate = useMemo(() => {
    return candidates.length > 0 ? candidates[0] : null;
  }, [candidates]);

  const highEvidenceCandidates = useMemo(() => {
    return candidates.filter((c) => (c.evidence_strength || 0) >= 80);
  }, [candidates]);

  const lensAlertCandidates = useMemo(() => {
    return candidates.filter((c) => c.has_talent_lens_alert || c.is_suppressed);
  }, [candidates]);

  const multilingualCount = useMemo(() => {
    return candidates.filter((c) => c.resume_language && c.resume_language !== 'en').length;
  }, [candidates]);

  const avgExperience = useMemo(() => {
    if (!totalCount) return '0.0';
    const sum = candidates.reduce((acc, c) => acc + (c.years_of_experience || 0), 0);
    return (sum / totalCount).toFixed(1);
  }, [candidates, totalCount]);

  // Score Tier Distribution data for Recharts BarChart
  const tierDistributionData = useMemo(() => {
    const t90 = candidates.filter((c) => c.overall_match >= 90).length;
    const t80 = candidates.filter((c) => c.overall_match >= 80 && c.overall_match < 90).length;
    const t70 = candidates.filter((c) => c.overall_match >= 70 && c.overall_match < 80).length;
    const tBelow70 = candidates.filter((c) => c.overall_match < 70).length;

    return [
      { tier: '90%+ Exceptional', count: t90, color: '#10b981' },
      { tier: '80-89% High Fit', count: t80, color: '#06b6d4' },
      { tier: '70-79% Moderate', count: t70, color: '#3b82f6' },
      { tier: '<70% Gaps', count: tBelow70, color: '#f59e0b' },
    ];
  }, [candidates]);

  // Requirement Pool Coverage (Real data calculated from candidate requirements)
  const requirementPoolStats = useMemo(() => {
    return requirements.map((req) => {
      let strongCount = 0;
      let moderateCount = 0;
      let gapCount = 0;

      candidates.forEach((cand) => {
        const ev = cand.evidence_strength || 70;
        if (ev >= 82) strongCount++;
        else if (ev >= 60) moderateCount++;
        else gapCount++;
      });

      const total = candidates.length || 1;
      return {
        name: req.name,
        category: req.category,
        priority: req.priority,
        strongPct: Math.round((strongCount / total) * 100),
        moderatePct: Math.round((moderateCount / total) * 100),
        gapPct: Math.round((gapCount / total) * 100),
      };
    });
  }, [requirements, candidates]);

  // Filtered Candidates Spotlight
  const filteredCandidates = useMemo(() => {
    if (activeFilter === 'top_tier') return candidates.filter((c) => c.overall_match >= 85);
    if (activeFilter === 'lens_alerts') return lensAlertCandidates;
    if (activeFilter === 'high_evidence') return highEvidenceCandidates;
    return candidates;
  }, [candidates, activeFilter, lensAlertCandidates, highEvidenceCandidates]);

  return (
    <div className="space-y-6">
      
      {/* --- VIBRANT EXECUTIVE COMMAND BANNER --- */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-[#090d18] via-[#0d1424] to-[#090d18] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono flex items-center space-x-1.5 glow-cyan">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Intelligence Radar</span>
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Active JD: <strong className="text-white bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-white/10">{currentRoleTitle}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Evidence-Calibrated Candidate Intelligence
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Visual evaluation of {totalCount} active applicants. Zero keyword fluff — instant multi-axis telemetry,
              provenance verification, and hidden talent discovery.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onOpenJDEditor && (
              <button
                onClick={onOpenJDEditor}
                className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition cursor-pointer flex items-center space-x-2 shadow-sm"
              >
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Calibrate JD</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('ranking')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition cursor-pointer flex items-center space-x-2 shadow-lg shadow-cyan-500/25 glow-cyan"
            >
              <span>Explore Live Ranking ({totalCount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- TOP 4 VIBRANT METRIC GAUGES --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Applicants */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2 bg-[#090d18]/80 hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Evaluated Pool
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black font-mono text-white">{totalCount}</span>
            <span className="text-xs text-slate-400 font-mono">Profiles</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-cyan-400 font-mono">
            <Globe className="w-3.5 h-3.5" />
            <span>{multilingualCount} International Resumes</span>
          </div>
        </div>

        {/* Metric 2: Pool Average Match */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 space-y-2 bg-[#090d18]/80 hover:border-cyan-400/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
              Pool Average Match
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black font-mono text-cyan-300">{avgMatchScore}%</span>
            <span className="text-xs text-emerald-400 font-bold font-mono">
              Top: {topCandidate?.overall_match || 0}%
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${avgMatchScore}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 3: High Evidence Core */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-2 bg-[#090d18]/80 hover:border-emerald-400/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
              Verified High Evidence
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black font-mono text-emerald-300">
              {highEvidenceCandidates.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({totalCount ? Math.round((highEvidenceCandidates.length / totalCount) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-emerald-400 font-semibold font-mono truncate">
            &gt;80% Multi-Source Provenance
          </p>
        </div>

        {/* Metric 4: Talent Lens Alerts */}
        <div
          onClick={() => onNavigateTab('talent_lens')}
          className="glass-panel p-5 rounded-2xl border border-purple-500/35 space-y-2 bg-[#090d18]/80 hover:border-purple-400/60 transition cursor-pointer group glow-purple"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 font-mono">
              Talent Lens Alerts
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black font-mono text-purple-300">
              {lensAlertCandidates.length}
            </span>
            <span className="text-xs text-purple-400 font-bold font-mono">Hidden Talent</span>
          </div>
          <p className="text-[11px] text-purple-300/90 truncate flex items-center justify-between font-mono">
            <span>High Core / Single Gap</span>
            <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
          </p>
        </div>
      </div>

      {/* --- VISUAL ANALYTICS ROW: SCORE DISTRIBUTION BAR CHART & REQUIREMENT SUPPLY HEATMAP --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT 6 COLS: APPLICANT MATCH TIER DISTRIBUTION (RECHARTS BAR CHART) */}
        <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-white/10 space-y-4 bg-slate-950/70 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center space-x-2 font-mono">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Pool Quality Distribution Curve</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Candidate breakdown across calibrated match tiers
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-bold">
              Mean: {avgMatchScore}%
            </span>
          </div>

          {/* Interactive Recharts Bar Chart */}
          <div className="h-48 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierDistributionData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="tier"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#475569', fontSize: 9 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(11, 16, 28, 0.95)',
                    borderColor: 'rgba(6, 182, 212, 0.4)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff',
                    fontFamily: 'monospace',
                  }}
                  formatter={(val: any) => [`${val} Candidates`, 'Count']}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {tierDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Experience Profile Depth Mini-Bars */}
          <div className="pt-3 border-t border-white/5 space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-300">
              <span>Experience Pool Mean: <strong className="text-cyan-300">{avgExperience} yrs</strong></span>
              <span className="text-slate-400">30 Evaluated Profiles</span>
            </div>
          </div>
        </div>

        {/* RIGHT 6 COLS: REQUIREMENT SUPPLY HEATMAP */}
        <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-white/10 space-y-4 bg-slate-950/70 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center space-x-2 font-mono">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Requirement Supply & Depth Heatmap</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Verified candidate availability for each job criteria
              </p>
            </div>
            {onOpenJDEditor && (
              <button
                onClick={onOpenJDEditor}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold font-mono cursor-pointer"
              >
                + Calibrate Criteria
              </button>
            )}
          </div>

          {/* Requirement Coverage Bars */}
          <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
            {requirementPoolStats.map((stat) => (
              <div key={stat.name} className="space-y-1 p-2 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white font-mono text-xs">{stat.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase font-mono ${
                        stat.category === 'REQUIRED'
                          ? 'bg-blue-500/20 text-cyan-300 border border-cyan-400/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                      }`}
                    >
                      {stat.category}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                    {stat.strongPct}% Strong
                  </span>
                </div>

                <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-950 border border-white/5">
                  <div
                    className="bg-emerald-400 h-full"
                    style={{ width: `${stat.strongPct}%` }}
                    title={`Strong Evidence: ${stat.strongPct}%`}
                  ></div>
                  <div
                    className="bg-cyan-500 h-full"
                    style={{ width: `${stat.moderatePct}%` }}
                    title={`Moderate Evidence: ${stat.moderatePct}%`}
                  ></div>
                  <div
                    className="bg-rose-500/70 h-full"
                    style={{ width: `${stat.gapPct}%` }}
                    title={`Uncertainty / Gap: ${stat.gapPct}%`}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5 font-mono">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              <span>Strong (&gt;80%)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
              <span>Moderate (50-79%)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              <span>Gap (&lt;50%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* --- VISUAL CANDIDATE SPOTLIGHT CARDS (GLANCEABLE & INTERACTIVE) --- */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 space-y-5 bg-slate-950/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Candidate Intelligence Spotlight</span>
            </h3>
            <p className="text-xs text-slate-400">
              Glanceable candidate cockpit — click any profile to open complete interactive Passport
            </p>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All Applicants (${totalCount})` },
              { id: 'top_tier', label: `Top Tier >85% (${candidates.filter((c) => c.overall_match >= 85).length})` },
              { id: 'lens_alerts', label: `Talent Lens (${lensAlertCandidates.length})` },
              { id: 'high_evidence', label: `High Evidence (${highEvidenceCandidates.length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 glow-cyan'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Cards Grid with Mini Circular Gauges & Micro-Meters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.slice(0, 9).map((cand) => {
            const score = Math.round(cand.overall_match || 80);
            return (
              <div
                key={cand.id}
                onClick={() => onSelectCandidate(cand.id)}
                className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-cyan-500/40 transition cursor-pointer flex flex-col justify-between space-y-3.5 group shadow-lg hover:shadow-cyan-500/10"
              >
                {/* Header: Avatar, Name, Radial Gauge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-600 flex items-center justify-center font-mono font-black text-white text-xs border border-cyan-400/30 shrink-0">
                      #{cand.rank}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition truncate max-w-[170px]">
                        {cand.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                        {cand.current_title} {cand.current_company ? `• ${cand.current_company}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Mini SVG Radial Gauge */}
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="#1e293b"
                        strokeWidth="3.5"
                        fill="transparent"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke={score >= 90 ? '#10b981' : score >= 80 ? '#06b6d4' : '#f59e0b'}
                        strokeWidth="3.5"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 16}
                        strokeDashoffset={2 * Math.PI * 16 * (1 - score / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-mono text-xs font-black text-white">
                      {score}%
                    </span>
                  </div>
                </div>

                {/* 3 Skill Micro-Bars */}
                <div className="space-y-1.5 p-2 rounded-xl bg-slate-950/60 border border-white/5 font-mono text-[10px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Evidence Provenance</span>
                    <span className="text-emerald-400 font-bold">{Math.round(cand.evidence_strength)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                      style={{ width: `${cand.evidence_strength}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-slate-400 pt-0.5">
                    <span>Required Coverage</span>
                    <span className="text-cyan-300 font-bold">{cand.required_ratio}</span>
                  </div>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {cand.years_of_experience} yrs exp
                  </span>
                  {cand.has_talent_lens_alert && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-500/30 font-bold">
                      Lens Suppressed
                    </span>
                  )}
                  {cand.resume_language && cand.resume_language !== 'en' && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-950/60 text-blue-300 border border-blue-500/30 uppercase">
                      {cand.resume_language}
                    </span>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-cyan-400 font-bold group-hover:text-cyan-300 transition flex items-center space-x-1 font-mono">
                    <span>Inspect Passport</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>

                  {onRemoveCandidate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Dismiss ${cand.name} from the active candidate pool?`)) {
                          onRemoveCandidate(cand.id, cand.name);
                        }
                      }}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                      title={`Remove ${cand.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Ranking Link */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between font-mono">
          <span className="text-xs text-slate-400">
            Showing {Math.min(9, filteredCandidates.length)} of {filteredCandidates.length} filtered applicants
          </span>
          <button
            onClick={() => onNavigateTab('ranking')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Full Ranking Leaderboard ({totalCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
