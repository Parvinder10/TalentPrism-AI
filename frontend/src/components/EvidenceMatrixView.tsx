import React, { useState, useEffect } from 'react';
import {
  FileText,
  Filter,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  X,
  Sparkles,
  Zap,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/client';
import { storage } from '../utils/storage';

interface EvidenceMatrixProps {
  onSelectCandidate: (candidateId: string) => void;
}

export const EvidenceMatrixView: React.FC<EvidenceMatrixProps> = ({ onSelectCandidate }) => {
  const [matrixData, setMatrixData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [columnFilter, setColumnFilter] = useState<'all' | 'required' | 'preferred'>('all');
  const [selectedCell, setSelectedCell] = useState<{
    candidateName: string;
    candidateId: string;
    skill: string;
    detail: any;
  } | null>(null);

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = async () => {
    try {
      setLoading(true);
      const data = await api.getEvidenceMatrix();
      setMatrixData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !matrixData) {
    return (
      <div className="flex items-center justify-center p-20 glass-panel rounded-xl">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">Loading Evidence Matrix Heatmap...</span>
        </div>
      </div>
    );
  }

  const { columns, rows } = matrixData;
  const showRequired = columnFilter === 'all' || columnFilter === 'required';
  const showPreferred = columnFilter === 'all' || columnFilter === 'preferred';

  const removedCandidateIds = storage.getRemovedCandidateIds();
  const filteredRows = rows.filter(
    (r: any) =>
      !removedCandidateIds.includes(r.candidate_id) &&
      r.candidate_name.toLowerCase().includes(search.toLowerCase())
  );

  // PROFESSIONALLY VIBRANT AND LOUD COLOR FUNCTION
  const getVibrantHeatmapStyle = (score: number) => {
    if (score >= 90) {
      return 'bg-gradient-to-br from-cyan-400 to-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-400/40 border border-cyan-200 ring-1 ring-cyan-300 hover:scale-105';
    }
    if (score >= 75) {
      return 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-400/30 border border-emerald-200 ring-1 ring-emerald-300 hover:scale-105';
    }
    if (score >= 50) {
      return 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/25 border border-blue-300 hover:scale-105';
    }
    if (score >= 30) {
      return 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black shadow-md shadow-amber-400/35 border border-amber-200 ring-1 ring-amber-300 hover:scale-105';
    }
    if (score > 0) {
      return 'bg-gradient-to-br from-rose-500 to-red-600 text-white font-black shadow-md shadow-rose-500/35 border border-rose-300 ring-1 ring-rose-400 hover:scale-105';
    }
    return 'bg-slate-900/80 text-slate-500 border border-white/5 hover:border-slate-600';
  };

  // Recruiter decisive metrics at top
  const eliteCandidates = filteredRows.filter((r: any) => {
    if (!columns?.required || columns.required.length === 0) return false;
    return columns.required.every((req: string) => (r.required_scores[req] || 0) >= 85);
  });

  const suppressedProfiles = filteredRows.filter((r: any) => {
    const pythonScore = r.required_scores['Python'] || 0;
    const fastApiScore = r.required_scores['FastAPI'] || 0;
    const dockerScore = r.preferred_scores['Docker'] || 0;
    return (pythonScore >= 90 || fastApiScore >= 90) && dockerScore < 45;
  });

  return (
    <div className="space-y-6">
      {/* 1. TOP RECRUITER DECISIVE CONTROL & VIBRANT LEGEND BAR (ABOVE TABLE) */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-slate-950 via-blue-950/40 to-slate-950 shadow-2xl space-y-4">
        {/* Title and Decisive Metrics Grid */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono">
                Decisive Candidate Matrix
              </span>
              <span className="text-xs text-slate-400">• Click Any Cell for Live Verification Evidence</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Evidence Matrix & Decisive Skill Heatmap
            </h2>
          </div>

          {/* Quick Decisive Summary Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-300 block">Elite Core Evidence</span>
                <span className="text-xs font-bold text-white">{eliteCandidates.length} Candidates (&gt;85% All Required)</span>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-300 block">Concentrated Gap Flag</span>
                <span className="text-xs font-bold text-white">{suppressedProfiles.length} Profiles Suppressed (e.g. Elena #14)</span>
              </div>
            </div>
          </div>
        </div>

        {/* PROFESSIONALLY VIBRANT & LOUD COLOR SCALE (PROMINENTLY AT TOP) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-white uppercase text-[11px] tracking-wider pr-1">Evidence Heatmap Scale:</span>
            
            <div className="flex items-center space-x-1.5">
              <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/30">
                90-100% Elite
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/30">
                75-89% Strong
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-600/30">
                50-74% Moderate
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/30">
                30-49% Uncertain Gap
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-xs shadow-md shadow-rose-500/30">
                1-29% Limited
              </span>
            </div>
          </div>

          {/* Search & Column Filters */}
          <div className="flex items-center space-x-2">
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-white/10">
              <button
                onClick={() => setColumnFilter('all')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                  columnFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setColumnFilter('required')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                  columnFilter === 'required' ? 'bg-blue-500/20 text-blue-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Required
              </button>
              <button
                onClick={() => setColumnFilter('preferred')}
                className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                  columnFilter === 'preferred' ? 'bg-purple-500/20 text-purple-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Preferred
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEATMAP MATRIX TABLE */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-slate-950/80">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              {/* Category Grouping Header */}
              <tr className="bg-slate-950 border-b border-white/10 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-3 px-4 text-left w-52 text-slate-300 bg-slate-950 sticky left-0 z-20">Candidate & Title</th>
                <th className="py-3 px-3 text-slate-300 w-16">Rank</th>
                {showRequired && (
                  <th
                    colSpan={columns.required.length}
                    className="py-2.5 px-3 text-cyan-300 bg-blue-950/60 border-x border-white/10 text-center font-bold tracking-wide"
                  >
                    REQUIRED MUST-HAVE CAPABILITIES (Core 40% Weight)
                  </th>
                )}
                {showPreferred && (
                  <th
                    colSpan={columns.preferred.length}
                    className="py-2.5 px-3 text-purple-300 bg-purple-950/60 text-center font-bold tracking-wide"
                  >
                    PREFERRED SECONDARY CAPABILITIES (10% Weight)
                  </th>
                )}
              </tr>

              {/* Requirement Columns Header */}
              <tr className="bg-slate-900/90 border-b border-white/10 text-xs font-semibold text-slate-200">
                <th className="py-2.5 px-4 text-left bg-slate-950 sticky left-0 z-20 font-sans text-slate-400">
                  Applicant Pool ({filteredRows.length})
                </th>
                <th className="py-2.5 px-3 font-mono">Overall</th>
                {showRequired &&
                  columns.required.map((req: string) => (
                    <th key={req} className="py-2.5 px-3 min-w-[85px] text-cyan-200 font-mono font-bold">
                      {req}
                    </th>
                  ))}
                {showPreferred &&
                  columns.preferred.map((pref: string) => (
                    <th key={pref} className="py-2.5 px-3 min-w-[85px] text-purple-200 font-mono font-bold">
                      {pref}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredRows.map((row: any) => {
                const isElena = row.candidate_id === 'cand_elena';

                return (
                  <tr
                    key={row.candidate_id}
                    className={`hover:bg-slate-800/60 transition-colors ${
                      isElena ? 'bg-purple-950/25 border-l-4 border-l-purple-500' : ''
                    }`}
                  >
                    {/* Candidate Name & Title */}
                    <td className="py-2.5 px-4 text-left font-sans bg-slate-950/90 sticky left-0 z-10 border-r border-white/10">
                      <div
                        className="cursor-pointer hover:text-cyan-300 transition"
                        onClick={() => onSelectCandidate(row.candidate_id)}
                      >
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white text-xs">{row.candidate_name}</span>
                          {isElena && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 text-[9px] font-bold">
                              Talent Lens
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-bold text-slate-200">#{row.rank}</td>

                    {/* Required Columns */}
                    {showRequired &&
                      columns.required.map((req: string) => {
                        const score = row.required_scores[req] || 0;
                        const detail = row.evidence_details[req];
                        return (
                          <td key={req} className="py-1.5 px-1.5">
                            <button
                              onClick={() =>
                                setSelectedCell({
                                  candidateName: row.candidate_name,
                                  candidateId: row.candidate_id,
                                  skill: req,
                                  detail: detail,
                                })
                              }
                              className={`w-full py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer ${getVibrantHeatmapStyle(
                                score
                              )}`}
                              title={`Click to inspect verifiable evidence for ${req}`}
                            >
                              {score > 0 ? `${score}%` : '—'}
                            </button>
                          </td>
                        );
                      })}

                    {/* Preferred Columns */}
                    {showPreferred &&
                      columns.preferred.map((pref: string) => {
                        const score = row.preferred_scores[pref] || 0;
                        const detail = row.evidence_details[pref];
                        return (
                          <td key={pref} className="py-1.5 px-1.5">
                            <button
                              onClick={() =>
                                setSelectedCell({
                                  candidateName: row.candidate_name,
                                  candidateId: row.candidate_id,
                                  skill: pref,
                                  detail: detail,
                                })
                              }
                              className={`w-full py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer ${getVibrantHeatmapStyle(
                                score
                              )}`}
                              title={`Click to inspect verifiable evidence for ${pref}`}
                            >
                              {score > 0 ? `${score}%` : '—'}
                            </button>
                          </td>
                        );
                      })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drilldown Evidence Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-cyan-500/50 p-6 shadow-2xl relative space-y-4 bg-slate-950">
            <button
              onClick={() => setSelectedCell(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                Granular Evidence Cell Verification
              </span>
              <h3 className="text-lg font-bold text-white">
                {selectedCell.candidateName} • {selectedCell.skill}
              </h3>
              <p className="text-xs text-slate-400">
                Requirement Category: <span className="font-semibold text-slate-200">{selectedCell.detail.category}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Verified Evidence Strength</span>
                <p className="text-3xl font-black font-mono text-cyan-300">{selectedCell.detail.score}%</p>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  selectedCell.detail.score >= 80
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : selectedCell.detail.score >= 50
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {selectedCell.detail.status}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">Why this score? (Explainable NLP signals):</span>
              <div className="space-y-1.5">
                {selectedCell.detail.why &&
                  selectedCell.detail.why.map((reason: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs text-slate-300"
                    >
                      {reason}
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2 border-t border-white/10">
              <button
                onClick={() => {
                  const cId = selectedCell.candidateId;
                  setSelectedCell(null);
                  onSelectCandidate(cId);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center space-x-1.5"
              >
                <span>Inspect Full Intelligence Passport</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
