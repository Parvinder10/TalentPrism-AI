import React, { useState } from 'react';
import {
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  Search,
  Filter,
  Eye,
  HelpCircle,
  AlertTriangle,
  Globe,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { RankedCandidate } from '../types';

interface CandidateRankingTableProps {
  candidates: RankedCandidate[];
  onSelectCandidate: (candidateId: string, initialTab?: string) => void;
  onOpenSimulator: () => void;
}

export const CandidateRankingTable: React.FC<CandidateRankingTableProps> = ({
  candidates,
  onSelectCandidate,
  onOpenSimulator,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'talent_lens' | 'high_evidence' | 'multilingual'>('all');

  const filtered = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.current_title.toLowerCase().includes(search.toLowerCase()) ||
      (c.current_company && c.current_company.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'talent_lens') return c.has_talent_lens_alert;
    if (filterType === 'high_evidence') return c.evidence_strength >= 80;
    if (filterType === 'multilingual') return c.resume_language !== 'en';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Table Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate name, role, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-900/60 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                filterType === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({candidates.length})
            </button>
            <button
              onClick={() => setFilterType('talent_lens')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer flex items-center space-x-1 ${
                filterType === 'talent_lens' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-purple-300'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Talent Lens</span>
            </button>
            <button
              onClick={() => setFilterType('high_evidence')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                filterType === 'high_evidence' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              High Evidence (&gt;80%)
            </button>
            <button
              onClick={() => setFilterType('multilingual')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer flex items-center space-x-1 ${
                filterType === 'multilingual' ? 'bg-blue-500/20 text-blue-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Multilingual</span>
            </button>
          </div>
        </div>

        <button
          onClick={onOpenSimulator}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium text-xs border border-indigo-400/30 transition cursor-pointer shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-300" />
          <span>Launch What-If Weight Simulator</span>
        </button>
      </div>

      {/* Main Ranking Table */}
      <div className="glass-panel rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-white/10">
              <tr>
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4 min-w-[200px]">Candidate & Title</th>
                <th className="py-3 px-4 text-center">Language</th>
                <th className="py-3 px-4 text-center">Overall Match</th>
                <th className="py-3 px-4 text-center">Required (40%)</th>
                <th className="py-3 px-4 text-center">Preferred (10%)</th>
                <th className="py-3 px-4 text-center">Evidence Str.</th>
                <th className="py-3 px-4">Major Gap</th>
                <th className="py-3 px-4">Talent Lens Insight</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filtered.map((c) => {
                const isSignature = c.id === 'cand_elena';

                return (
                  <tr
                    key={c.id}
                    className={`transition-colors hover:bg-slate-800/50 group ${
                      isSignature ? 'bg-purple-950/20 border-l-4 border-l-purple-500' : ''
                    }`}
                  >
                    {/* Rank & Movement */}
                    <td className="py-3 px-4 font-mono font-bold text-sm">
                      <div className="flex items-center space-x-1.5">
                        <span className={c.rank <= 3 ? 'text-amber-400' : 'text-slate-300'}>#{c.rank}</span>
                        {c.rank_delta > 0 && (
                          <span className="flex items-center text-[10px] text-emerald-400 font-semibold">
                            <ArrowUp className="w-3 h-3" />
                            {c.rank_delta}
                          </span>
                        )}
                        {c.rank_delta < 0 && (
                          <span className="flex items-center text-[10px] text-rose-400 font-semibold">
                            <ArrowDown className="w-3 h-3" />
                            {Math.abs(c.rank_delta)}
                          </span>
                        )}
                        {c.rank_delta === 0 && (
                          <span className="text-slate-600">
                            <Minus className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Candidate Details */}
                    <td className="py-3 px-4">
                      <div
                        className="cursor-pointer group-hover:text-cyan-300 transition"
                        onClick={() => onSelectCandidate(c.id)}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-xs">{c.name}</span>
                          {c.profile_archetype.includes('SPECIALIST') && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Specialist
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {c.current_title} {c.current_company ? `• ${c.current_company}` : ''}
                        </p>
                      </div>
                    </td>

                    {/* Language */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                          c.resume_language === 'en'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                        }`}
                      >
                        {c.resume_language}
                      </span>
                    </td>

                    {/* Overall Match */}
                    <td className="py-3 px-4 text-center font-mono">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-white">{c.overall_match}%</span>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              c.overall_match >= 80 ? 'bg-cyan-400' : c.overall_match >= 65 ? 'bg-blue-400' : 'bg-slate-500'
                            }`}
                            style={{ width: `${c.overall_match}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Required Coverage */}
                    <td className="py-3 px-4 text-center font-mono">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-slate-200">{c.required_coverage}%</span>
                        <span className="text-[10px] text-slate-400">{c.required_ratio} reqs</span>
                      </div>
                    </td>

                    {/* Preferred Coverage */}
                    <td className="py-3 px-4 text-center font-mono">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-slate-300">{c.preferred_coverage}%</span>
                        <span className="text-[10px] text-slate-400">{c.preferred_ratio} prefs</span>
                      </div>
                    </td>

                    {/* Evidence Strength */}
                    <td className="py-3 px-4 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          c.evidence_strength >= 80
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : c.evidence_strength >= 60
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {c.evidence_strength}%
                      </span>
                    </td>

                    {/* Major Gap */}
                    <td className="py-3 px-4">
                      {c.major_gap ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
                          {c.major_gap}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">None detected</span>
                      )}
                    </td>

                    {/* Talent Lens Badge / Alert */}
                    <td className="py-3 px-4">
                      {c.has_talent_lens_alert ? (
                        <div
                          onClick={() => onSelectCandidate(c.id, 'talent_lens')}
                          className="flex items-center space-x-1.5 px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/40 cursor-pointer transition w-fit"
                        >
                          <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="font-semibold text-[10px]">Hidden Core Strength</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">Standard Profile</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onSelectCandidate(c.id, 'why_not')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition cursor-pointer"
                          title="Explain ranking position"
                        >
                          Why Not Higher?
                        </button>
                        <button
                          onClick={() => onSelectCandidate(c.id)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Passport</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
