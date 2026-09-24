import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  Sliders,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client';
import { RankingAuditEntry } from '../types';

export const RankingAuditTrailView: React.FC = () => {
  const [auditLog, setAuditLog] = useState<RankingAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    try {
      setLoading(true);
      const data = await api.getRankingHistory();
      setAuditLog(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 glass-panel rounded-xl">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 via-blue-950/20 to-slate-900 shadow-2xl space-y-2">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-cyan-300 border border-blue-400/30 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Immutable Governance Record</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">Transparency & Compliance</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Ranking Audit Trail: Explainable Recalibration History
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Every change in candidate position must answer: <span className="font-semibold text-white">“Why did the rank change?”</span>{' '}
          TalentPrism maintains a granular audit trail of every recruiter criteria modification, weight shift, and affected rank delta.
        </p>
      </div>

      {/* Audit Log Entries List */}
      <div className="space-y-4">
        {auditLog.map((entry) => (
          <div
            key={entry.id}
            className="glass-panel p-5 rounded-xl border border-white/10 space-y-3 hover:border-cyan-500/30 transition shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-xs font-mono">{entry.action}</span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{entry.timestamp}</span>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 font-mono">
                Log ID: {entry.id}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 text-xs text-slate-300 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Trigger Reason:</span>
              <p className="font-medium text-white">{entry.reason}</p>
            </div>

            {/* Affected Rankings */}
            {entry.affected_rankings && entry.affected_rankings.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Affected Rank Movements:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {entry.affected_rankings.map((mv, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-900/40 border border-white/5 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-slate-200 font-sans">{mv.name}</span>
                      <div className="flex items-center space-x-1 font-bold">
                        <span className="text-slate-500">#{mv.old_rank}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-cyan-300">#{mv.new_rank}</span>
                        <span className={mv.delta > 0 ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
                          ({mv.delta > 0 ? `+${mv.delta}` : mv.delta})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
