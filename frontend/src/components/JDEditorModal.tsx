import React, { useState } from 'react';
import {
  X,
  Sliders,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Layers,
  Check,
  XCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { JobRequirement } from '../types';

interface JDEditorModalProps {
  currentRequirements: JobRequirement[];
  currentRoleId?: string;
  currentRoleTitle?: string;
  onClose: () => void;
  onRequirementsUpdated: (newReqs: JobRequirement[]) => void;
  onDisconnectJD?: () => void;
  onDeleteRole?: (roleId: string) => void;
}

export const JDEditorModal: React.FC<JDEditorModalProps> = ({
  currentRequirements,
  currentRoleId = 'job_backend_core',
  currentRoleTitle = 'Senior Backend Engineer',
  onClose,
  onRequirementsUpdated,
  onDisconnectJD,
  onDeleteRole,
}) => {
  const [requirements, setRequirements] = useState<JobRequirement[]>(
    JSON.parse(JSON.stringify(currentRequirements))
  );
  const [newSkillName, setNewSkillName] = useState('');
  const [newCategory, setNewCategory] = useState<'REQUIRED' | 'PREFERRED' | 'BONUS'>('REQUIRED');
  const [newPriority, setNewPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [saving, setSaving] = useState(false);

  // Role-specific curated suggestions
  const suggestedSkillCatalog: Record<string, string[]> = {
    job_backend_core: [
      'Redis',
      'Kafka',
      'Docker',
      'Kubernetes',
      'PostgreSQL',
      'GraphQL',
      'gRPC',
      'RabbitMQ',
      'Elasticsearch',
      'CI/CD',
    ],
    job_fullstack: [
      'Next.js',
      'Tailwind CSS',
      'TypeScript',
      'React',
      'GraphQL',
      'Node.js',
      'Redux',
      'Playwright',
      'Vite',
      'REST APIs',
    ],
    job_data_eng: [
      'Apache Spark',
      'Airflow',
      'dbt',
      'Snowflake',
      'Kafka',
      'Databricks',
      'BigQuery',
      'SQL',
      'Python',
      'Flink',
    ],
    job_devops_infra: [
      'Terraform',
      'Kubernetes',
      'Helm',
      'ArgoCD',
      'Prometheus',
      'Grafana',
      'Docker',
      'AWS',
      'CI/CD',
      'Linux',
    ],
    job_ml_eng: [
      'PyTorch',
      'LangChain',
      'TensorRT',
      'vLLM',
      'HuggingFace',
      'RAG Architecture',
      'Vector Databases',
      'Python',
      'FastAPI',
      'Docker',
    ],
  };

  const suggestedSkills = suggestedSkillCatalog[currentRoleId] || suggestedSkillCatalog.job_backend_core;

  const isSkillInRequirements = (skillName: string) => {
    return requirements.some(
      (r) => r.name.toLowerCase() === skillName.toLowerCase()
    );
  };

  // Toggle suggestion (Add if missing, remove if present)
  const handleToggleSuggestedSkill = (skillName: string) => {
    if (isSkillInRequirements(skillName)) {
      handleRemoveSkillByName(skillName);
    } else {
      const newReq: JobRequirement = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: skillName,
        category: 'REQUIRED',
        priority: 'High',
        weight: 1.1,
        canonical_skill: skillName,
      };
      setRequirements([...requirements, newReq]);
    }
  };

  const handleCategoryChange = (index: number, newCat: 'REQUIRED' | 'PREFERRED' | 'BONUS') => {
    const updated = [...requirements];
    updated[index].category = newCat;
    setRequirements(updated);
  };

  const handlePriorityChange = (index: number, newPri: 'Critical' | 'High' | 'Medium' | 'Low') => {
    const updated = [...requirements];
    updated[index].priority = newPri;
    updated[index].weight = newPri === 'Critical' ? 1.3 : newPri === 'High' ? 1.1 : newPri === 'Medium' ? 0.8 : 0.5;
    setRequirements(updated);
  };

  const handleRemoveSkill = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleRemoveSkillByName = (name: string) => {
    setRequirements(requirements.filter((r) => r.name.toLowerCase() !== name.toLowerCase()));
  };

  const handleAddManualSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    if (isSkillInRequirements(trimmed)) return;

    const newReq: JobRequirement = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      category: newCategory,
      priority: newPriority,
      weight: newPriority === 'Critical' ? 1.3 : newPriority === 'High' ? 1.1 : newPriority === 'Medium' ? 0.8 : 0.5,
      canonical_skill: trimmed,
    };
    setRequirements([...requirements, newReq]);
    setNewSkillName('');
  };

  const handleConfirm = async () => {
    try {
      setSaving(true);
      await api.updateJobRequirements(currentRoleId, requirements);
      onRequirementsUpdated(requirements);
      onClose();
    } catch (e) {
      console.error('Failed to update job requirements:', e);
    } finally {
      setSaving(false);
    }
  };

  const requiredCount = requirements.filter((r) => r.category === 'REQUIRED').length;
  const preferredCount = requirements.filter((r) => r.category === 'PREFERRED').length;
  const bonusCount = requirements.filter((r) => r.category === 'BONUS').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-cyan-500/40 p-6 shadow-2xl space-y-5 bg-[#090d16] relative max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono">
                Job Criteria Editor
              </span>
              <span className="text-xs text-slate-400 font-mono truncate max-w-[280px]">
                {currentRoleTitle}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">Calibrate Criteria & Requirements</h2>
            <p className="text-xs text-slate-400">
              Manually add or remove skills, toggle suggested role criteria, and set priorities.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {onDisconnectJD && currentRoleId && currentRoleId !== 'none' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDisconnectJD();
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
                title="Disconnect this JD so no job criteria execute"
              >
                <XCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Clear / Disconnect JD</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section 1: Curated JD Suggestions (Add or Remove chips) */}
        <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-cyan-500/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Suggested Role Requirements (Click to Add or Remove)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Role Curated</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestedSkills.map((skill) => {
              const active = isSkillInRequirements(skill);
              return (
                <button
                  key={skill}
                  onClick={() => handleToggleSuggestedSkill(skill)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 border ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40 shadow-sm shadow-cyan-500/10 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-500/40'
                      : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-cyan-400/40 hover:text-white'
                  }`}
                  title={active ? `Click to remove ${skill}` : `Click to add ${skill} to JD`}
                >
                  {active ? (
                    <>
                      <Check className="w-3 h-3 text-cyan-400" />
                      <span>{skill}</span>
                      <X className="w-3 h-3 text-slate-400 hover:text-rose-400 ml-0.5" />
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 text-slate-400" />
                      <span>{skill}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Manual Custom Requirement Adder */}
        <form onSubmit={handleAddManualSkill} className="space-y-2 bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
          <label className="text-xs font-semibold text-slate-300 block">
            Add Custom Skill or Requirement:
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="e.g. GraphQL, Snowflake, Terraform, Microservices..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="flex-1 w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="px-2.5 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
              >
                <option value="REQUIRED">Required</option>
                <option value="PREFERRED">Preferred</option>
                <option value="BONUS">Bonus</option>
              </select>

              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="px-2.5 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
              >
                <option value="Critical">Critical (1.3x)</option>
                <option value="High">High (1.1x)</option>
                <option value="Medium">Medium (0.8x)</option>
                <option value="Low">Low (0.5x)</option>
              </select>

              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer flex items-center space-x-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>

        {/* Section 3: Active Requirements Table / List */}
        <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between text-xs px-1 text-slate-400">
            <span className="font-semibold text-slate-300">
              Active Criteria ({requirements.length}):{' '}
              <span className="text-cyan-400 font-bold">{requiredCount} Required</span> •{' '}
              <span className="text-purple-400 font-bold">{preferredCount} Preferred</span> •{' '}
              <span className="text-amber-400 font-bold">{bonusCount} Bonus</span>
            </span>
            <span className="text-[10px] font-mono">Live Recalculation</span>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[220px]">
            {requirements.map((req, idx) => (
              <div
                key={req.id}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 hover:border-white/10 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="font-bold text-white font-mono truncate">{req.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      req.category === 'REQUIRED'
                        ? 'bg-blue-500/20 text-cyan-300 border border-cyan-400/30'
                        : req.category === 'PREFERRED'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {req.category}
                  </span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {/* Category Select */}
                  <select
                    value={req.category}
                    onChange={(e) => handleCategoryChange(idx, e.target.value as any)}
                    className="px-2 py-1 bg-slate-950 border border-white/10 rounded text-[11px] text-slate-200 focus:outline-none"
                  >
                    <option value="REQUIRED">Required</option>
                    <option value="PREFERRED">Preferred</option>
                    <option value="BONUS">Bonus</option>
                  </select>

                  {/* Priority Select */}
                  <select
                    value={req.priority}
                    onChange={(e) => handlePriorityChange(idx, e.target.value as any)}
                    className="px-2 py-1 bg-slate-950 border border-white/10 rounded text-[11px] text-slate-200 focus:outline-none"
                  >
                    <option value="Critical">Critical (1.3x)</option>
                    <option value="High">High (1.1x)</option>
                    <option value="Medium">Medium (0.8x)</option>
                    <option value="Low">Low (0.5x)</option>
                  </select>

                  {/* Manual Remove Button */}
                  <button
                    onClick={() => handleRemoveSkill(idx)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                    title={`Remove ${req.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {requirements.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active criteria. Click suggested skills above or manually add requirements.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || requirements.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition cursor-pointer flex items-center space-x-2 disabled:opacity-50"
          >
            <span>{saving ? 'Calibrating Pool...' : 'Save & Recalibrate Pool'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
