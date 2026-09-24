import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  PieChart,
  Layers,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { api } from '../api/client';

export const PoolIntelligenceView: React.FC = () => {
  const [poolData, setPoolData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPoolData();
  }, []);

  const loadPoolData = async () => {
    try {
      setLoading(true);
      const data = await api.getPoolIntelligence();
      setPoolData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !poolData) {
    return (
      <div className="flex items-center justify-center p-20 glass-panel rounded-xl">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { skill_availability, rare_combinations, jd_signals, confidence_distribution } = poolData;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900/80 shadow-2xl space-y-2">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center space-x-1">
            <PieChart className="w-3.5 h-3.5 text-cyan-400" />
            <span>Applicant Pool Analytics</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">Macro Hiring Intelligence</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Applicant Pool Intelligence & Market Expectations
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Calibrate your job description against actual applicant pool availability. Detect hyper-rare capability
          intersections and adjust restrictive criteria before starving your pipeline.
        </p>
      </div>

      {/* JD Expectation Signals */}
      {jd_signals && jd_signals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Active JD Expectation Signals</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jd_signals.map((signal: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">{signal.skill}: {signal.signal_type}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 font-mono text-[10px]">
                    Caution
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{signal.message}</p>
                <div className="pt-2 border-t border-white/5 text-[11px] text-cyan-300 flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Suggestion: {signal.action_suggestion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Skill Availability & Rare Combinations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Skill Availability % */}
        <div className="glass-panel p-6 rounded-xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Skill Availability in Pool</h3>
              <p className="text-xs text-slate-400">Supporting evidence rate across {poolData.total_applicants} applicants</p>
            </div>
            <span className="text-xs font-mono text-cyan-300">{poolData.total_applicants} Resumes</span>
          </div>

          <div className="space-y-3">
            {skill_availability.map((item: any) => (
              <div key={item.skill} className="space-y-1 p-2 rounded-lg bg-slate-900/40 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white font-mono">{item.skill}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                        item.rarity === 'High Scarcity'
                          ? 'bg-rose-500/20 text-rose-300'
                          : item.rarity === 'Moderate'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {item.rarity}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-cyan-300">
                    {item.percentage}% ({item.count} candidates)
                  </span>
                </div>

                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.percentage >= 70
                        ? 'bg-cyan-400'
                        : item.percentage >= 40
                        ? 'bg-blue-500'
                        : item.percentage >= 25
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Rare Combinations */}
        <div className="glass-panel p-6 rounded-xl border border-white/10 space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white">Rare Skill Combinations</h3>
            <p className="text-xs text-slate-400">High-value capability intersections</p>
          </div>

          <div className="space-y-3">
            {rare_combinations.map((combo: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs font-mono">{combo.name}</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-xs font-bold">
                    {combo.count} candidates ({combo.percentage}%)
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {combo.candidates.map((name: string, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence Uncertainty Map Notice */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 flex items-start space-x-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="text-white font-semibold">Ethical Intelligence Rule (Section 31):</span> The system categorizes
          evidence into <span className="text-cyan-300">High Confidence</span>, <span className="text-blue-300">Moderate Evidence</span>, <span className="text-amber-300">Limited Evidence</span>, and <span className="text-slate-400">Not Detected</span>. We explicitly avoid derogatory labels such as "unqualified", "bad candidate", or "risky person". The platform assesses verifiable evidence rather than personal worth.
        </p>
      </div>
    </div>
  );
};
