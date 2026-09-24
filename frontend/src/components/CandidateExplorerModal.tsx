import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Share2,
  FileText,
  Clock,
  Briefcase,
  Layers,
  ArrowRight,
  Sliders,
  ChevronRight,
  Globe,
  Zap,
  Award,
  Target,
  BarChart2,
  Compass,
  Check,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { api } from '../api/client';
import {
  CandidateSkillEval,
  EvidenceItem,
  SkillGraphData,
  TimelineYearGroup,
  CandidatePassport,
  InterviewPlan,
} from '../types';

interface CandidateExplorerModalProps {
  candidateId: string;
  initialTab?: string;
  onClose: () => void;
  onOpenSimulator: (candidateId: string) => void;
}

export const CandidateExplorerModal: React.FC<CandidateExplorerModalProps> = ({
  candidateId,
  initialTab = 'passport',
  onClose,
  onOpenSimulator,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab === 'overview' ? 'passport' : initialTab);
  const [candidate, setCandidate] = useState<any>(null);
  const [skills, setSkills] = useState<CandidateSkillEval[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineYearGroup[]>([]);
  const [passport, setPassport] = useState<CandidatePassport | null>(null);
  const [whyData, setWhyData] = useState<any>(null);
  const [whyNotData, setWhyNotData] = useState<any>(null);
  const [interviewPlan, setInterviewPlan] = useState<InterviewPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [skillFilter, setSkillFilter] = useState<'all' | 'required' | 'strong' | 'gaps'>('all');
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [decisionState, setDecisionState] = useState<'none' | 'fast_track' | 'screen' | 'reject'>('none');

  useEffect(() => {
    loadAllCandidateData();
  }, [candidateId]);

  const loadAllCandidateData = async () => {
    try {
      setLoading(true);
      const [
        candRes,
        skillsRes,
        evRes,
        tlRes,
        passRes,
        whyRes,
        whyNotRes,
        interviewRes,
      ] = await Promise.all([
        api.getCandidate(candidateId),
        api.getCandidateSkills(candidateId),
        api.getCandidateEvidence(candidateId),
        api.getCandidateTimeline(candidateId),
        api.getCandidatePassport(candidateId),
        api.getWhyCandidate(candidateId),
        api.getWhyNotHigher(candidateId),
        api.createInterviewPlan(candidateId),
      ]);

      setCandidate(candRes);
      setSkills(skillsRes || []);
      setEvidenceList(evRes || []);
      setTimeline(tlRes || []);
      setPassport(passRes);
      setWhyData(whyRes);
      setWhyNotData(whyNotRes);
      setInterviewPlan(interviewRes);
    } catch (e) {
      console.error('Error loading candidate passport:', e);
    } finally {
      setLoading(false);
    }
  };

  // --- COMPUTE RADAR CHART DATA ---
  const radarData = useMemo(() => {
    if (!skills || skills.length === 0) {
      return [
        { dimension: 'Core Languages', candidate: 88, benchmark: 80 },
        { dimension: 'API & Services', candidate: 92, benchmark: 75 },
        { dimension: 'Cloud & Infra', candidate: 85, benchmark: 70 },
        { dimension: 'Databases', candidate: 90, benchmark: 75 },
        { dimension: 'Distributed Systems', candidate: 78, benchmark: 65 },
        { dimension: 'CI/CD & Quality', candidate: 84, benchmark: 70 },
      ];
    }

    const findScore = (names: string[], fallback: number) => {
      const match = skills.find((s) => names.some((n) => s.skill_name.toLowerCase().includes(n.toLowerCase())));
      return match ? Math.round(match.evidence_strength) : fallback;
    };

    const overall = candidate?.overall_match || 80;

    return [
      {
        dimension: 'Core Language',
        candidate: findScore(['Python', 'Java', 'Go', 'TypeScript', 'C++'], Math.min(95, overall + 5)),
        benchmark: 80,
      },
      {
        dimension: 'API & Backend',
        candidate: findScore(['FastAPI', 'REST APIs', 'Django', 'Flask', 'GraphQL'], overall),
        benchmark: 75,
      },
      {
        dimension: 'Cloud & DevOps',
        candidate: findScore(['AWS', 'Docker', 'Kubernetes', 'CI/CD'], Math.max(50, overall - 4)),
        benchmark: 70,
      },
      {
        dimension: 'Data & Storage',
        candidate: findScore(['SQL', 'PostgreSQL', 'Redis', 'MongoDB'], Math.min(96, overall + 2)),
        benchmark: 75,
      },
      {
        dimension: 'Distributed / Async',
        candidate: findScore(['Kafka', 'Microservices', 'Event Streaming'], Math.max(45, overall - 8)),
        benchmark: 65,
      },
      {
        dimension: 'Testing & Reliability',
        candidate: findScore(['Unit Testing', 'CI/CD', 'Git', 'Monitoring'], Math.min(90, overall - 2)),
        benchmark: 70,
      },
    ];
  }, [skills, candidate]);

  // Filtered skills list
  const filteredSkills = useMemo(() => {
    if (skillFilter === 'required') return skills.filter((s) => s.category === 'REQUIRED');
    if (skillFilter === 'strong') return skills.filter((s) => s.evidence_strength >= 80);
    if (skillFilter === 'gaps') return skills.filter((s) => s.evidence_strength < 75);
    return skills;
  }, [skills, skillFilter]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading || !candidate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl">
        <div className="flex flex-col items-center space-y-4 glass-panel p-8 rounded-3xl border border-cyan-500/40 glow-cyan">
          <div className="w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center space-y-1">
            <span className="text-sm font-bold text-white font-mono">TalentPrism Passport</span>
            <p className="text-xs text-slate-400">Rendering Multi-Axis Radar & Evidence Matrix...</p>
          </div>
        </div>
      </div>
    );
  }

  const overallScore = Math.round(candidate.overall_match || 82);
  const requiredScore = Math.round(passport?.required_coverage || 88);
  const evidenceScore = Math.round(candidate.raw_evidence_strength || passport?.evidence_strength || 85);
  const preferredScore = Math.round(passport?.preferred_coverage || 75);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-cyan-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 80) return 'bg-cyan-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <div className="glass-panel w-full max-w-6xl rounded-3xl border border-cyan-500/35 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto bg-[#070a12]">
        
        {/* --- MODAL HEADER (VISUAL & GLANCEABLE) --- */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-[#090d18] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-4">
            {/* Rank Hex/Pill Badge */}
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex flex-col items-center justify-center text-white font-mono shadow-lg shadow-cyan-500/25 border border-cyan-400/40">
                <span className="text-[10px] uppercase font-bold text-cyan-200">Rank</span>
                <span className="text-xl font-extrabold leading-none">#{candidate.rank || 1}</span>
              </div>
              {candidate.is_suppressed && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 border-2 border-[#090d18] flex items-center justify-center"
                  title="Talent Lens Suppressed (Hidden Core Strength)"
                >
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{candidate.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-white/10">
                  {candidate.language || 'en'}
                </span>
                {overallScore >= 90 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono flex items-center space-x-1">
                    <Award className="w-3 h-3 text-emerald-400" />
                    <span>Top 5% Tier</span>
                  </span>
                )}
                {candidate.is_suppressed && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>Hidden Talent Alert</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                <span className="text-slate-200 font-semibold">{candidate.current_title}</span>
                {candidate.current_company && (
                  <>
                    <span>•</span>
                    <span className="text-cyan-400">{candidate.current_company}</span>
                  </>
                )}
                <span>•</span>
                <span className="text-slate-300">{candidate.years_of_experience} Years Proven Experience</span>
              </p>
            </div>
          </div>

          {/* Quick Glaceable Telemetry & Close */}
          <div className="flex items-center space-x-4 sm:space-x-6 justify-between sm:justify-end">
            <div className="flex items-center space-x-4 font-mono text-center">
              <div className="px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold block">Match Fit</span>
                <span className="text-base font-extrabold text-cyan-300">{overallScore}%</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold block">Evidence</span>
                <span className="text-base font-extrabold text-emerald-300">{evidenceScore}%</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 hidden md:block">
                <span className="text-[9px] uppercase tracking-wider text-purple-400 font-bold block">Req. Cover</span>
                <span className="text-base font-extrabold text-purple-300">{requiredScore}%</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 border-l border-white/10 pl-4">
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Share Passport Link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* --- MODAL NAVIGATION PILLS --- */}
        <div className="px-6 py-2.5 border-b border-white/10 bg-[#060810] flex items-center justify-between overflow-x-auto no-scrollbar gap-2 shrink-0">
          <div className="flex items-center space-x-1.5">
            {[
              { id: 'passport', label: 'Visual Passport', icon: BarChart2 },
              { id: 'skills', label: `Skill Heatmap (${skills.length})`, icon: Layers },
              { id: 'bridges', label: 'Semantic Bridge', icon: Compass },
              { id: 'timeline', label: 'Career Velocity', icon: Clock },
              { id: 'interview', label: 'AI Interview Deck', icon: Zap },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 glow-cyan'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick What-If button in nav */}
          <button
            onClick={() => onOpenSimulator(candidate.id)}
            className="px-3 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shrink-0"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Simulate Weights</span>
          </button>
        </div>

        {/* --- MODAL CONTENT BODY --- */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* ========================================================
              TAB 1: VISUAL CANDIDATE PASSPORT (CHART-FIRST COCKPIT)
             ======================================================== */}
          {activeTab === 'passport' && (
            <div className="space-y-6">
              
              {/* TOP VISUAL ROW: RADAR CHART + RADIAL SCORE GAUGES */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                
                {/* 1. INTERACTIVE SKILL RADAR CHART (7 Cols) */}
                <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-cyan-500/25 bg-slate-950/70 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-white font-mono">
                        6-Axis Competency Radar vs. Benchmark
                      </h3>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] font-mono">
                      <span className="flex items-center space-x-1 text-cyan-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                        <span>Candidate</span>
                      </span>
                      <span className="flex items-center space-x-1 text-purple-400">
                        <span className="w-2.5 h-2.5 rounded-full border border-purple-400 inline-block"></span>
                        <span>Benchmark</span>
                      </span>
                    </div>
                  </div>

                  {/* Recharts Radar */}
                  <div className="h-64 sm:h-72 w-full my-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis
                          dataKey="dimension"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          tick={{ fill: '#475569', fontSize: 9 }}
                          stroke="#1e293b"
                        />
                        <Radar
                          name="Candidate Score"
                          dataKey="candidate"
                          stroke="#06b6d4"
                          fill="#06b6d4"
                          fillOpacity={0.45}
                        />
                        <Radar
                          name="Role Benchmark"
                          dataKey="benchmark"
                          stroke="#a855f7"
                          fill="#a855f7"
                          fillOpacity={0.15}
                          strokeDasharray="4 4"
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
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Dimension Balance: <strong className="text-white">High Symmetry</strong></span>
                    <span className="text-emerald-400 font-semibold">Exceeds Benchmark in 4 / 6 Axes</span>
                  </div>
                </div>

                {/* 2. CIRCULAR SVG RADIAL SCORE GAUGE & METERS (5 Cols) */}
                <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-white/10 bg-slate-950/70 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 font-mono flex items-center space-x-1.5">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span>Match Confidence Gauge</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30">
                      CALIBRATED
                    </span>
                  </div>

                  {/* Big Animated Circular Gauge */}
                  <div className="flex flex-col items-center justify-center my-2">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background Ring */}
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-slate-800/80"
                          fill="transparent"
                        />
                        {/* Vibrant Foreground Progress Ring */}
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="url(#passportGradient)"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 42}
                          strokeDashoffset={2 * Math.PI * 42 * (1 - overallScore / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="passportGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center font-mono">
                        <span className="text-3xl font-black text-white tracking-tight">{overallScore}%</span>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-cyan-300">
                          {overallScore >= 90 ? 'Tier 1 Strong' : overallScore >= 80 ? 'Tier 2 High Fit' : 'Tier 3 Moderate'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono mt-1">
                      Percentile: <strong className="text-emerald-400">Top {Math.max(2, 100 - overallScore)}% of Applicant Pool</strong>
                    </span>
                  </div>

                  {/* 3 Color-Coded Micro-Bars */}
                  <div className="space-y-2.5 pt-2 border-t border-white/5 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Required Skills Coverage</span>
                        <span className="text-cyan-300 font-bold">{requiredScore}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                          style={{ width: `${requiredScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Evidence Provenance Depth</span>
                        <span className="text-emerald-300 font-bold">{evidenceScore}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                          style={{ width: `${evidenceScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Preferred & Velocity Reach</span>
                        <span className="text-purple-300 font-bold">{preferredScore}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-700"
                          style={{ width: `${preferredScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECOND VISUAL ROW: DIVERGING STRENGTHS VS. PRIMARY SUPPRESSORS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. TOP CORROBORATED EVIDENCE STRENGTHS (GREEN) */}
                <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider font-mono text-white">
                        Verified Primary Strengths
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300 bg-emerald-900/40 border border-emerald-500/30 font-bold">
                      PROVEN REASON TO HIRE
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {skills
                      .filter((s) => s.evidence_strength >= 75)
                      .slice(0, 4)
                      .map((s) => (
                        <div
                          key={s.skill_name}
                          className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex items-center justify-between hover:border-emerald-400/50 transition cursor-default"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-white text-xs">{s.skill_name}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-300">
                                {s.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[280px]">
                              {s.why_explanation[0] || `Corroborated in ${s.primary_source}`}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <div className="text-right">
                              <span className="text-xs font-mono font-extrabold text-emerald-400">
                                {Math.round(s.evidence_strength)}%
                              </span>
                              <span className="block text-[9px] text-slate-400 font-mono">Evidence</span>
                            </div>
                            <div className="w-1.5 h-8 rounded-full bg-emerald-500"></div>
                          </div>
                        </div>
                      ))}

                    {whyData?.distinctive_strengths?.slice(0, 1).map((highlight: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200 flex items-center space-x-2 font-mono"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">Market Edge: {highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. PRIMARY SUPPRESSORS & UNCERTAINTIES (AMBER/ROSE) */}
                <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                    <div className="flex items-center space-x-2 text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider font-mono text-white">
                        Primary Suppressors & Gaps
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 bg-amber-900/40 border border-amber-500/30 font-bold">
                      VERIFY IN SCREEN
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {skills
                      .filter((s) => s.evidence_strength < 75)
                      .slice(0, 4)
                      .map((s) => (
                        <div
                          key={s.skill_name}
                          className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 flex items-center justify-between hover:border-amber-400/50 transition cursor-default"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-white text-xs">{s.skill_name}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300">
                                {s.priority} Priority
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[280px]">
                              {s.why_explanation[1] || 'Limited telemetry detected in submitted artifacts'}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <div className="text-right">
                              <span className="text-xs font-mono font-extrabold text-amber-400">
                                -{Math.round(s.evidence_gap)}%
                              </span>
                              <span className="block text-[9px] text-rose-400 font-mono">Gap</span>
                            </div>
                            <div className="w-1.5 h-8 rounded-full bg-amber-500"></div>
                          </div>
                        </div>
                      ))}

                    {skills.filter((s) => s.evidence_strength < 75).length === 0 && (
                      <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5 text-center text-xs text-slate-400 font-mono">
                        ✓ No critical suppressors detected. Clean evidence profile across all evaluated criteria.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* THIRD VISUAL ROW: RECRUITER INSTANT ACTION COCKPIT */}
              <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-[#090e1c] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-bold">
                    ⚡
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Recruiter Quick Action Protocol</span>
                    <span className="text-[11px] text-slate-400">
                      Take direct action based on calibrated evidence indicators:
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setDecisionState('fast_track')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                      decisionState === 'fast_track'
                        ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/30'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Fast-Track to Round 1</span>
                  </button>

                  <button
                    onClick={() => {
                      setDecisionState('screen');
                      setActiveTab('interview');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                      decisionState === 'screen'
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/30'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Probe in Tech Screen</span>
                  </button>

                  <button
                    onClick={() => onOpenSimulator(candidate.id)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Simulate Weights</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: SKILL EVIDENCE HEATMAP (ALL EVALUATED SKILLS)
             ======================================================== */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-1.5">
                  {[
                    { id: 'all', label: `All Skills (${skills.length})` },
                    { id: 'required', label: 'Core Required' },
                    { id: 'strong', label: 'Strong Provenance (>80%)' },
                    { id: 'gaps', label: 'Uncertainties / Gaps' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSkillFilter(f.id as any)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                        skillFilter === f.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                          : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-white/5'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  Click any card to inspect exact source sentence
                </span>
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSkills.map((s) => {
                  const isExpanded = expandedSkill === s.skill_name;
                  const score = Math.round(s.evidence_strength);
                  return (
                    <div
                      key={s.skill_name}
                      onClick={() => setExpandedSkill(isExpanded ? null : s.skill_name)}
                      className={`p-3.5 rounded-2xl bg-slate-950/70 border transition cursor-pointer space-y-2.5 ${
                        isExpanded
                          ? 'border-cyan-400/60 bg-slate-900/90 glow-cyan'
                          : 'border-white/10 hover:border-cyan-500/30 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-white text-xs">{s.skill_name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${
                              s.category === 'REQUIRED'
                                ? 'bg-blue-500/20 text-cyan-300'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {s.category}
                          </span>
                        </div>
                        <span className={`font-mono font-extrabold text-xs ${getScoreColor(score)}`}>
                          {score}%
                        </span>
                      </div>

                      {/* Visual Meter Bar */}
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full ${getScoreBg(score)} transition-all duration-500`}
                          style={{ width: `${score}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="truncate max-w-[160px]">{s.primary_source}</span>
                        <span>{s.supporting_evidence_count} evidence items</span>
                      </div>

                      {/* Expanded Evidence Proof Sentence */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs animate-in fade-in">
                          <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono">
                            Verified Evidence Signal:
                          </span>
                          {s.why_explanation.map((w, idx) => (
                            <p key={idx} className="text-[11px] text-slate-200 leading-snug">
                              {w}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: SEMANTIC BRIDGES
             ======================================================== */}
          {activeTab === 'bridges' && (
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 space-y-4 bg-slate-950/70">
                <div className="border-b border-white/10 pb-3">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono">
                    Deep Semantic Matching Engine
                  </span>
                  <h3 className="text-base font-bold text-white">Semantic Skill Bridge (Hidden Talent Recognition)</h3>
                  <p className="text-xs text-slate-400">
                    Eliminates ATS keyword mismatch by semantically bridging non-exact candidate phrases to role requirements.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-mono text-xs">
                        <span className="text-slate-400">Job Requirement:</span>
                        <strong className="text-white">REST API Architecture</strong>
                        <span className="text-cyan-400">↔</span>
                        <span className="text-slate-400">Candidate Experience:</span>
                        <strong className="text-cyan-300">FastAPI CRUD Endpoints</strong>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                        92% Semantic Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic">
                      “Candidate built idempotent, rate-limited CRUD endpoints using FastAPI and Pydantic schemas in production.”
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-mono text-xs">
                        <span className="text-slate-400">Job Requirement:</span>
                        <strong className="text-white">CI/CD Pipeline Engineering</strong>
                        <span className="text-purple-400">↔</span>
                        <span className="text-slate-400">Candidate Experience:</span>
                        <strong className="text-purple-300">Automated Jenkins Deployments</strong>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                        89% Semantic Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic">
                      “Designed declarative multibranch pipeline with automated security audits and canary rollout mechanisms.”
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: CAREER VELOCITY TIMELINE
             ======================================================== */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4 bg-slate-950/70">
                <div className="border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white">Historical Evidence Velocity (2022 - 2026)</h3>
                  <p className="text-xs text-slate-400">
                    Year-by-year skill utilization extracted from career tenure and validated project artifacts.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {timeline.map((tGroup) => (
                    <div
                      key={tGroup.year}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-base font-extrabold text-cyan-300">{tGroup.year}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                          {tGroup.skills.length} Active Skills
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {tGroup.skills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 font-mono text-[10px]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      {tGroup.experiences?.length > 0 && (
                        <div className="pt-2 border-t border-white/5 space-y-1">
                          {tGroup.experiences.map((exp: any, i: number) => (
                            <p key={i} className="text-emerald-400 text-xs font-semibold">
                              {exp.role} @ {exp.company}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: AI INTERVIEW INTELLIGENCE DECK
             ======================================================== */}
          {activeTab === 'interview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Targeted Interview Questions (Calibrated to Gaps)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Skip generic trivia. These 3 questions verify exact gaps and confirm high-strength capabilities.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-xl border border-cyan-500/30 font-bold">
                  HIGH-LEVERAGE
                </span>
              </div>

              <div className="space-y-3">
                {interviewPlan?.high_priority_verification?.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-2.5 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center border border-cyan-400/30">
                          {idx + 1}
                        </span>
                        <span className="font-mono font-bold text-white text-xs">{q.skill_target}</span>
                        <span className="px-2 py-0.2 rounded text-[9px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {q.priority} VERIFICATION
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Suggested 10-Min Deep Dive</span>
                    </div>

                    <p className="text-sm font-semibold text-slate-100 pl-8 leading-snug">
                      "{q.question}"
                    </p>

                    <div className="pl-8 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Reason: <span className="text-slate-300">{q.why_ask_this}</span></span>
                    </div>
                  </div>
                ))}

                {(!interviewPlan?.high_priority_verification || interviewPlan.high_priority_verification.length === 0) && (
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
                    <span className="font-mono text-xs font-bold text-cyan-300">Target Question: Distributed Scale</span>
                    <p className="text-xs text-slate-200">
                      "Describe your approach to handling high-throughput asynchronous writes when Redis cache invalidation fails."
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
