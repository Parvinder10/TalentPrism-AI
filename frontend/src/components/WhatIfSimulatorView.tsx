import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  CheckSquare,
  Square,
  Plus,
  Users,
  Search,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { api } from '../api/client';
import { RankedCandidate, ScoringWeights } from '../types';
import { storage } from '../utils/storage';

interface WhatIfSimulatorViewProps {
  candidates: RankedCandidate[];
  onSelectCandidate: (candidateId: string) => void;
  initialCandidateId?: string;
  onRankingApplied?: () => void;
  currentRoleId?: string;
}

export const WhatIfSimulatorView: React.FC<WhatIfSimulatorViewProps> = ({
  candidates,
  onSelectCandidate,
  initialCandidateId,
  onRankingApplied,
  currentRoleId = 'job_backend_core',
}) => {
  const [simulationMode, setSimulationMode] = useState<'checklist_pool' | 'skill' | 'weights'>('checklist_pool');

  // --- MODE 1: SKILL CHECKLIST & MERGED POOL INTELLIGENCE ---
  const defaultSkillList = [
    'Python',
    'FastAPI',
    'Docker',
    'AWS',
    'SQL',
    'Redis',
    'Kubernetes',
    'Kafka',
    'REST APIs',
    'PostgreSQL',
    'CI/CD',
    'React',
    'TypeScript',
  ];

  const [availableChecklistSkills, setAvailableChecklistSkills] = useState<string[]>(defaultSkillList);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Python', 'FastAPI', 'Docker']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [poolResults, setPoolResults] = useState<{
    total_applicants: number;
    matching_count: number;
    full_match_count: number;
    percentage: number;
    candidates: any[];
  } | null>(null);
  const [loadingPool, setLoadingPool] = useState(false);

  // --- MODE 2: CANDIDATE SKILL SCENARIO STATE ---
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(() => {
    if (initialCandidateId && candidates.some((c) => c.id === initialCandidateId)) {
      return initialCandidateId;
    }
    return candidates[0]?.id || '';
  });
  const [selectedCandidateSkills, setSelectedCandidateSkills] = useState<Record<string, number>>({});
  const [selectedSkill, setSelectedSkill] = useState<string>('Docker');
  const [simulatedStrength, setSimulatedStrength] = useState<number>(75);
  const [skillScenarioResult, setSkillScenarioResult] = useState<any>(null);
  const [simulatingSkill, setSimulatingSkill] = useState(false);

  // --- MODE 3: RECRUITER PRIORITY WEIGHTS STATE ---
  const [weights, setWeights] = useState<ScoringWeights>(() => {
    return (
      storage.getScoringWeights() || {
        required_skills: 0.40,
        relevant_experience: 0.20,
        evidence_strength: 0.20,
        recency: 0.10,
        preferred_skills: 0.10,
      }
    );
  });
  const [scenarioCandidates, setScenarioCandidates] = useState<RankedCandidate[]>([]);
  const [simulatingWeights, setSimulatingWeights] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(false);

  // Automatically ensure a valid candidate is selected when pool updates or candidate is deleted
  useEffect(() => {
    if (candidates.length > 0 && (!selectedCandidateId || !candidates.some((c) => c.id === selectedCandidateId))) {
      setSelectedCandidateId(candidates[0].id);
    }
  }, [candidates, selectedCandidateId]);

  // Update selected candidate if initialCandidateId changes
  useEffect(() => {
    if (initialCandidateId && candidates.some((c) => c.id === initialCandidateId)) {
      setSelectedCandidateId(initialCandidateId);
    }
  }, [initialCandidateId, candidates]);

  // Load real skills for selected candidate
  useEffect(() => {
    if (selectedCandidateId) {
      loadCandidateRealSkills(selectedCandidateId);
    }
  }, [selectedCandidateId]);

  // Trigger skill scenario simulation when candidate, skill, or strength changes
  useEffect(() => {
    if (selectedCandidateId && selectedSkill) {
      runSkillScenarioSimulation();
    }
  }, [selectedCandidateId, selectedSkill, simulatedStrength]);

  // Trigger weights simulation when weights change
  useEffect(() => {
    runPrioritySimulation();
  }, [weights, currentRoleId]);

  // Trigger pool intelligence query when selected skills change
  useEffect(() => {
    queryPoolIntelligence();
  }, [selectedSkills, currentRoleId]);

  const loadCandidateRealSkills = async (candidateId: string) => {
    try {
      // First try to simulate with current skill to get candidate's real portfolio
      const res = await api.simulateSkillScenario(candidateId, selectedSkill || 'Python', simulatedStrength);
      if (res && res.available_skills) {
        setSelectedCandidateSkills(res.available_skills);
        // If current selectedSkill is not in candidate's skills, pick the first one
        const skillKeys = Object.keys(res.available_skills);
        if (skillKeys.length > 0 && !skillKeys.includes(selectedSkill)) {
          setSelectedSkill(skillKeys[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load candidate real skills:', e);
    }
  };

  const runSkillScenarioSimulation = async () => {
    try {
      setSimulatingSkill(true);
      const res = await api.simulateSkillScenario(selectedCandidateId, selectedSkill, simulatedStrength);
      setSkillScenarioResult(res);
      if (res.available_skills) {
        setSelectedCandidateSkills(res.available_skills);
      }
    } catch (e) {
      console.error('Failed to simulate skill scenario:', e);
    } finally {
      setSimulatingSkill(false);
    }
  };

  const runPrioritySimulation = async () => {
    try {
      setSimulatingWeights(true);
      const res = await api.simulatePriority(currentRoleId, weights);
      setScenarioCandidates(res.scenario_ranking);
    } catch (e) {
      console.error(e);
    } finally {
      setSimulatingWeights(false);
    }
  };

  const queryPoolIntelligence = async () => {
    try {
      setLoadingPool(true);
      const data = await api.poolBySkills(currentRoleId, selectedSkills);
      setPoolResults(data);
    } catch (e) {
      console.error('Failed to pool candidates by skills:', e);
    } finally {
      setLoadingPool(false);
    }
  };

  const toggleSkillInChecklist = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddManualSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (!availableChecklistSkills.includes(trimmed)) {
      setAvailableChecklistSkills([...availableChecklistSkills, trimmed]);
    }
    if (!selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
    setNewSkillInput('');
  };

  const handleSelectAllCore = () => {
    setSelectedSkills(availableChecklistSkills);
  };

  const handleClearAllSkills = () => {
    setSelectedSkills([]);
  };

  const handleApplyWeightsToProduction = async () => {
    try {
      storage.saveScoringWeights(weights);
      await api.recalculateRanking(
        currentRoleId,
        weights,
        undefined,
        'Recruiter applied custom weights simulation to production ranking'
      );
      setAppliedNotice(true);
      if (onRankingApplied) onRankingApplied();
      setTimeout(() => setAppliedNotice(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetWeights = () => {
    const defaultWeights: ScoringWeights = {
      required_skills: 0.40,
      relevant_experience: 0.20,
      evidence_strength: 0.20,
      recency: 0.10,
      preferred_skills: 0.10,
    };
    setWeights(defaultWeights);
    storage.saveScoringWeights(defaultWeights);
  };

  const totalWeight = Math.round(
    (weights.required_skills +
      weights.relevant_experience +
      weights.evidence_strength +
      weights.recency +
      weights.preferred_skills) *
      100
  );

  return (
    <div className="space-y-6">
      {/* Top Laboratory Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/80 shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center space-x-1 font-mono">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Talent Simulation Laboratory</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Evidence-Based What-If Testing</span>
          </div>
          <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-500/30">
            Real Applicant Evidence Data Engine
          </span>
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">
          What-If Simulator & Candidate Pool Intelligence
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Hypothesize hiring criteria changes, test unverified candidate interview outcomes with real evidence data,
          or build custom multi-skill checklists merged directly with real-time pool intelligence.
        </p>

        {/* 3-Way Mode Switcher */}
        <div className="pt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSimulationMode('checklist_pool')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-2 ${
              simulationMode === 'checklist_pool'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-cyan-300" />
            <span>Mode 1: Skill Checklist & Pool Intelligence (Merged)</span>
          </button>

          <button
            onClick={() => setSimulationMode('skill')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-2 ${
              simulationMode === 'skill'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Zap className="w-4 h-4 text-purple-300" />
            <span>Mode 2: Candidate Skill Scenario (Real Data)</span>
          </button>

          <button
            onClick={() => setSimulationMode('weights')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-2 ${
              simulationMode === 'weights'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-300" />
            <span>Mode 3: Recruiter Priority Weights</span>
          </button>
        </div>
      </div>

      {/* MODE 1: SKILL CHECKLIST & MERGED POOL INTELLIGENCE */}
      {simulationMode === 'checklist_pool' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Checklist & Custom Skill Builder (5 cols) */}
          <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-cyan-500/30 space-y-5 bg-slate-950/70">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                  <span>Manual Skill Checklist</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Check desired skills to filter and pool candidates in real time
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[11px] font-bold font-mono">
                {selectedSkills.length} Checked
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Quick Selectors
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAllCore}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={handleClearAllSkills}
                  className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Skills Checklist Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {availableChecklistSkills.map((skill) => {
                const isChecked = selectedSkills.includes(skill);
                return (
                  <label
                    key={skill}
                    onClick={() => toggleSkillInChecklist(skill)}
                    className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition ${
                      isChecked
                        ? 'bg-cyan-950/60 border-cyan-400/50 text-cyan-200 font-bold shadow-sm'
                        : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className="truncate">{skill}</span>
                  </label>
                );
              })}
            </div>

            {/* Manual Custom Skill Input */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Add Custom Skill to Checklist:
              </label>
              <form onSubmit={handleAddManualSkill} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="e.g. Terraform, GraphQL, Go..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  className="flex-1 p-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel: Merged Pool Intelligence Display (7 cols) */}
          <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-blue-500/30 space-y-5 bg-slate-950/70">
            {/* Header & Metrics */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Pool Intelligence: Live Multi-Skill Match</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Real candidate talent pool filtered by selected checklist requirements
                </p>
              </div>

              {loadingPool && (
                <span className="text-[10px] text-cyan-300 animate-pulse font-mono">
                  Calculating Pool...
                </span>
              )}
            </div>

            {/* Prominent High-Velocity Metric Cards */}
            {poolResults && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Matching Pool
                  </span>
                  <p className="text-2xl font-bold font-mono text-cyan-300">
                    {poolResults.matching_count}{' '}
                    <span className="text-xs text-slate-400 font-normal">/ {poolResults.total_applicants}</span>
                  </p>
                  <p className="text-[10px] text-cyan-400 font-semibold">
                    {poolResults.percentage}% of applicant pool
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider">
                    Full Checklist Matches
                  </span>
                  <p className="text-2xl font-bold font-mono text-emerald-300">
                    {poolResults.full_match_count}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold">
                    100% of checked skills verified
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-1">
                  <span className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider">
                    Active Role
                  </span>
                  <p className="text-base font-bold text-purple-200 truncate pt-1">
                    {currentRoleId === 'job_backend_core'
                      ? 'Backend Core'
                      : currentRoleId === 'job_fullstack'
                      ? 'Full Stack'
                      : currentRoleId === 'job_data_eng'
                      ? 'Data Platform'
                      : currentRoleId === 'job_devops_infra'
                      ? 'DevOps & Infra'
                      : 'AI & ML'}
                  </p>
                  <p className="text-[10px] text-purple-400 font-semibold">Live Talent Lens Filter</p>
                </div>
              </div>
            )}

            {/* Candidate Matching List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Matching Candidates ({poolResults?.candidates?.length || 0})</span>
                <span className="text-[10px] font-mono">Real Verified Scores</span>
              </div>

              <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                {poolResults?.candidates?.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/5 hover:border-cyan-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">#{c.rank}</span>
                        <h4
                          onClick={() => onSelectCandidate(c.id)}
                          className="font-bold text-xs text-white hover:text-cyan-300 cursor-pointer flex items-center space-x-1"
                        >
                          <span>{c.name}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </h4>
                        {c.is_full_match ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            Full Match
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            Partial Match
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {c.current_title} • {c.current_company}
                      </p>

                      {/* Individual verified skill badges */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {Object.entries(c.skill_scores || {}).map(([sk, score]) => {
                          const numScore = Number(score);
                          const isHigh = numScore >= 80;
                          const isMed = numScore >= 50 && numScore < 80;
                          return (
                            <span
                              key={sk}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border ${
                                isHigh
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                  : isMed
                                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                                  : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {sk}: {Math.round(numScore)}%
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Overall Match</span>
                        <span className="font-mono text-sm font-bold text-white">
                          {c.overall_match}%
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCandidateId(c.id);
                          setSimulationMode('skill');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-[10px] font-semibold transition cursor-pointer flex items-center space-x-1"
                        title="Simulate skill hypothesis for this candidate"
                      >
                        <Zap className="w-3 h-3 text-purple-300" />
                        <span>Simulate</span>
                      </button>
                    </div>
                  </div>
                ))}

                {poolResults?.candidates?.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No candidates match the checked skills at current thresholds. Try unchecking some skills.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: CANDIDATE SKILL SCENARIO (Section 37 Hackathon Demo - Real Data) */}
      {simulationMode === 'skill' && (
        <div className="space-y-6">
          {/* Prominent Warning/Disclaimer Banner */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center space-x-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-amber-200 leading-relaxed">
              <span className="font-bold">PROMINENT RECRUITER DISCLAIMER:</span> Scenario only. No additional candidate evidence
              has been established. This simulation tests how candidate ranking changes hypothetically if the recruiter
              verifies specific skills in an upcoming interview using real candidate portfolio data.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Simulation Controls */}
            <div className="glass-panel p-6 rounded-xl border border-purple-500/30 space-y-5 bg-slate-950/70">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Interview Hypothesis Simulator</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select candidate and test rank movement with real portfolio scores
                </p>
              </div>

              {/* Candidate Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Select Candidate:</label>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (#{c.rank} • {c.current_title})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Real Skill Picker from Candidate's Real Portfolio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Target Uncertainty / Skill Requirement:
                </label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {Object.keys(selectedCandidateSkills).length > 0 ? (
                    Object.entries(selectedCandidateSkills).map(([sk, score]) => (
                      <option key={sk} value={sk}>
                        {sk} (Current Evidence: {Math.round(score)}%{' '}
                        {score >= 80 ? 'Strong' : score >= 50 ? 'Moderate' : 'Limited'})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Docker">Docker (Current: 31% Limited)</option>
                      <option value="AWS">AWS (Current: 38% Limited)</option>
                      <option value="Redis">Redis (Current: 61% Moderate)</option>
                      <option value="Kubernetes">Kubernetes (Current: 82% Strong)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Strength Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Simulated Evidence Strength:</span>
                  <span className="font-mono font-bold text-purple-300">{simulatedStrength}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  step="5"
                  value={simulatedStrength}
                  onChange={(e) => setSimulatedStrength(Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>30% (Uncertain)</span>
                  <span>75% (Target)</span>
                  <span>100% (Mastery)</span>
                </div>
              </div>
            </div>

            {/* Result Visualizer Card */}
            {skillScenarioResult && (
              <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-purple-500/30 flex flex-col justify-between space-y-6 bg-slate-950/70">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                        Real-Time Scenario Projection
                      </span>
                      <h3 className="text-lg font-bold text-white">
                        {skillScenarioResult.candidate_name}: What if {selectedSkill} is verified at{' '}
                        <span className="text-purple-300 font-mono">{simulatedStrength}%</span>?
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-semibold">
                      Live Hypothesis
                    </span>
                  </div>

                  {/* Impact Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                      <span className="text-xs text-slate-400 font-semibold">Current Actual Rank</span>
                      <p className="text-3xl font-bold font-mono text-slate-300">
                        #{skillScenarioResult.actual_rank}
                      </p>
                      <p className="text-[10px] text-rose-400">
                        With {selectedSkill} at {Math.round(skillScenarioResult.original_strength)}%
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-1">
                      <span className="text-xs text-purple-300 font-semibold">Hypothetical Scenario Rank</span>
                      <p className="text-3xl font-bold font-mono text-purple-200">
                        #{skillScenarioResult.scenario_rank}
                      </p>
                      <p className="text-[10px] text-purple-300">If verified at {simulatedStrength}%</p>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                      <span className="text-xs text-emerald-400 font-semibold">Potential Rank Lift</span>
                      <p className="text-3xl font-bold font-mono text-emerald-300">
                        +{skillScenarioResult.rank_improvement} Positions
                      </p>
                      <p className="text-[10px] text-emerald-400">
                        {skillScenarioResult.rank_improvement > 0
                          ? 'Significant jump in ranking!'
                          : 'Maintains current tier'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold text-xs text-white">Recruiter Intelligence Takeaway:</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Candidate {skillScenarioResult.candidate_name} is ranked #{skillScenarioResult.actual_rank} primarily due to{' '}
                      <span className="text-amber-300 font-semibold">{selectedSkill}</span> gap ({Math.round(skillScenarioResult.original_strength)}%).
                      If technical verification proves operational competency at {simulatedStrength}%, their rank advances to{' '}
                      <span className="text-purple-300 font-bold">#{skillScenarioResult.scenario_rank}</span> (+{skillScenarioResult.rank_improvement} spots).
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => onSelectCandidate(selectedCandidateId)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>View Candidate Intelligence Passport</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 3: RECRUITER PRIORITY SIMULATOR */}
      {simulationMode === 'weights' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sliders Panel */}
          <div className="glass-panel p-6 rounded-xl border border-white/10 space-y-5 bg-slate-950/70">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Scoring Factor Weights</h3>
                <p className="text-xs text-slate-400">
                  Total Weight: <span className={totalWeight === 100 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{totalWeight}%</span>
                </p>
              </div>
              <button
                onClick={handleResetWeights}
                className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                title="Reset to default weights"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Slider 1: Required Skills */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white">Required Skills Coverage</span>
                <span className="font-mono font-bold text-cyan-300">{Math.round(weights.required_skills * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(weights.required_skills * 100)}
                onChange={(e) => setWeights({ ...weights, required_skills: Number(e.target.value) / 100 })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Slider 2: Evidence Strength */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white">Multi-Source Evidence Strength</span>
                <span className="font-mono font-bold text-emerald-300">{Math.round(weights.evidence_strength * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(weights.evidence_strength * 100)}
                onChange={(e) => setWeights({ ...weights, evidence_strength: Number(e.target.value) / 100 })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Slider 3: Relevant Experience */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white">Relevant Work Experience</span>
                <span className="font-mono font-bold text-blue-300">{Math.round(weights.relevant_experience * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(weights.relevant_experience * 100)}
                onChange={(e) => setWeights({ ...weights, relevant_experience: Number(e.target.value) / 100 })}
                className="w-full accent-blue-400 cursor-pointer"
              />
            </div>

            {/* Slider 4: Recency */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white">Evidence Recency (2024-2026)</span>
                <span className="font-mono font-bold text-purple-300">{Math.round(weights.recency * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(weights.recency * 100)}
                onChange={(e) => setWeights({ ...weights, recency: Number(e.target.value) / 100 })}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>

            {/* Slider 5: Preferred Skills */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-white">Preferred Skills Bonus</span>
                <span className="font-mono font-bold text-amber-300">{Math.round(weights.preferred_skills * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(weights.preferred_skills * 100)}
                onChange={(e) => setWeights({ ...weights, preferred_skills: Number(e.target.value) / 100 })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <button
                onClick={handleApplyWeightsToProduction}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Apply Scenario Weights to Production</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {appliedNotice && (
                <p className="text-center text-xs text-emerald-400 font-semibold flex items-center justify-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Production ranking updated & audit logged!</span>
                </p>
              )}
            </div>
          </div>

          {/* Comparison Table: Actual vs Scenario Ranking */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-white/10 space-y-4 bg-slate-950/70">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Simulated Scenario Rankings vs Actual Production</h3>
                <p className="text-xs text-slate-400">Immediate recalculation without re-parsing resumes</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                Scenario Only
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Actual</th>
                    <th className="py-2.5 px-3">Scenario</th>
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3 text-center">Actual Match</th>
                    <th className="py-2.5 px-3 text-center">Scenario Match</th>
                    <th className="py-2.5 px-3 text-right">Movement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {scenarioCandidates.slice(0, 10).map((cand) => {
                    const actualCand = candidates.find((c) => c.id === cand.id);
                    const actualRank = actualCand?.rank || cand.rank;
                    const delta = actualRank - cand.rank;

                    return (
                      <tr key={cand.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 text-slate-400">#{actualRank}</td>
                        <td className="py-2 px-3 font-bold text-cyan-300">#{cand.rank}</td>
                        <td className="py-2 px-3 font-sans font-semibold text-white">
                          <span
                            onClick={() => onSelectCandidate(cand.id)}
                            className="cursor-pointer hover:text-cyan-300"
                          >
                            {cand.name}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-slate-400">{actualCand?.overall_match || 0}%</td>
                        <td className="py-2 px-3 text-center font-bold text-cyan-400">{cand.overall_match}%</td>
                        <td className="py-2 px-3 text-right font-bold">
                          {delta > 0 && <span className="text-emerald-400">↑{delta}</span>}
                          {delta < 0 && <span className="text-rose-400">↓{Math.abs(delta)}</span>}
                          {delta === 0 && <span className="text-slate-500">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
