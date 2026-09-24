import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  Briefcase,
  Layers,
  Check,
  Building2,
  Code2,
  Cpu,
  Smartphone,
  Shield,
  Database,
  Cloud,
} from 'lucide-react';
import { api } from '../api/client';
import { JobRequirement, JobRole, RankedCandidate } from '../types';

interface ManualAddJDModalProps {
  onClose: () => void;
  onRoleCreated: (newRole: JobRole, updatedCandidates?: RankedCandidate[]) => void;
}

export const ManualAddJDModal: React.FC<ManualAddJDModalProps> = ({
  onClose,
  onRoleCreated,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<string>('backend');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering & Product');
  const [description, setDescription] = useState('');

  // Initial requirements
  const [requirements, setRequirements] = useState<JobRequirement[]>([
    { id: 'req_1', name: 'Python', category: 'REQUIRED', priority: 'Critical', weight: 1.3, canonical_skill: 'Python' },
    { id: 'req_2', name: 'Docker', category: 'REQUIRED', priority: 'High', weight: 1.1, canonical_skill: 'Docker' },
  ]);

  // Custom skill input state
  const [customSkillName, setCustomSkillName] = useState('');
  const [customCategory, setCustomCategory] = useState<'REQUIRED' | 'PREFERRED' | 'BONUS'>('REQUIRED');
  const [customPriority, setCustomPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');

  const [saving, setSaving] = useState(false);

  // Track definitions with icons & curated suggestions
  const careerTracks: {
    id: string;
    label: string;
    icon: any;
    defaultDept: string;
    suggestions: string[];
  }[] = [
    {
      id: 'backend',
      label: 'Backend & Systems',
      icon: Cpu,
      defaultDept: 'Core Platform & Infrastructure',
      suggestions: ['Python', 'FastAPI', 'Go', 'Java', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes', 'gRPC', 'SQL', 'CI/CD'],
    },
    {
      id: 'frontend',
      label: 'Frontend & Full Stack',
      icon: Code2,
      defaultDept: 'Product Engineering',
      suggestions: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js', 'GraphQL', 'Redux', 'HTML5', 'REST APIs', 'Playwright', 'Vite'],
    },
    {
      id: 'data_ai',
      label: 'Data Platform & AI',
      icon: Database,
      defaultDept: 'Data & Applied AI',
      suggestions: ['Python', 'Apache Spark', 'Airflow', 'SQL', 'Kafka', 'dbt', 'Snowflake', 'PyTorch', 'Databricks', 'LangChain', 'Pandas'],
    },
    {
      id: 'devops',
      label: 'DevOps & Cloud Infra',
      icon: Cloud,
      defaultDept: 'Cloud & Infrastructure Operations',
      suggestions: ['Kubernetes', 'Terraform', 'Docker', 'AWS', 'CI/CD', 'Linux', 'Helm', 'Prometheus', 'ArgoCD', 'Ansible', 'GCP'],
    },
    {
      id: 'mobile',
      label: 'Mobile Engineering',
      icon: Smartphone,
      defaultDept: 'Mobile Platform',
      suggestions: ['Swift', 'SwiftUI', 'Kotlin', 'React Native', 'iOS SDK', 'Android SDK', 'Flutter', 'Mobile CI/CD', 'Objective-C', 'REST APIs'],
    },
    {
      id: 'security',
      label: 'Security & Trust',
      icon: Shield,
      defaultDept: 'Information Security & Compliance',
      suggestions: ['Application Security', 'SOC2', 'Penetration Testing', 'IAM', 'OWASP', 'Zero Trust', 'Cryptography', 'Cloud Security', 'Linux'],
    },
    {
      id: 'custom',
      label: 'Custom Role Track',
      icon: Briefcase,
      defaultDept: 'Technology & Operations',
      suggestions: ['Python', 'SQL', 'Docker', 'AWS', 'TypeScript', 'Project Leadership', 'System Architecture', 'Agile Delivery'],
    },
  ];

  const currentTrackObj = careerTracks.find((t) => t.id === selectedTrack) || careerTracks[0];

  const handleSelectTrack = (trackId: string) => {
    setSelectedTrack(trackId);
    const track = careerTracks.find((t) => t.id === trackId);
    if (track) {
      setDepartment(track.defaultDept);
      // Auto-suggest first 3 skills
      const initialSkills: JobRequirement[] = track.suggestions.slice(0, 3).map((sk, idx) => ({
        id: `req_init_${idx}_${Date.now()}`,
        name: sk,
        category: idx === 0 ? 'REQUIRED' : 'REQUIRED',
        priority: idx === 0 ? 'Critical' : 'High',
        weight: idx === 0 ? 1.3 : 1.1,
        canonical_skill: sk,
      }));
      setRequirements(initialSkills);
    }
  };

  const isSkillAdded = (skillName: string) => {
    return requirements.some((r) => r.name.toLowerCase() === skillName.toLowerCase());
  };

  const toggleSuggestedSkill = (skillName: string) => {
    if (isSkillAdded(skillName)) {
      setRequirements(requirements.filter((r) => r.name.toLowerCase() !== skillName.toLowerCase()));
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

  const handleAddCustomSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSkillName.trim();
    if (!trimmed || isSkillAdded(trimmed)) return;

    const newReq: JobRequirement = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      category: customCategory,
      priority: customPriority,
      weight: customPriority === 'Critical' ? 1.3 : customPriority === 'High' ? 1.1 : customPriority === 'Medium' ? 0.8 : 0.5,
      canonical_skill: trimmed,
    };
    setRequirements([...requirements, newReq]);
    setCustomSkillName('');
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || requirements.length === 0) return;

    try {
      setSaving(true);
      const res = await api.createJob({
        title: title.trim(),
        department: department.trim(),
        description: description.trim() || `${title.trim()} responsible for scalable delivery and engineering excellence.`,
        requirements,
      });

      if (res.job) {
        onRoleCreated(res.job, res.ranked_candidates);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create manual JD role:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-cyan-500/40 p-6 shadow-2xl space-y-5 bg-[#090d16] relative max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono">
                Manual Role Creator
              </span>
              <span className="text-xs text-slate-400 font-mono">
                TalentPrism Job Specification Engine
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Add Custom Job Description (JD)</h2>
            <p className="text-xs text-slate-400">
              Create a custom JD role belonging to any career category, select curated skills, and instantly evaluate candidates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Step 1: Career Track Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              1. Select Career Category / Track:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {careerTracks.map((track) => {
                const Icon = track.icon;
                const isSelected = selectedTrack === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handleSelectTrack(track.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/10'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold truncate">{track.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Role Details Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-white/5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Job Title <span className="text-cyan-400">*</span>:
              </label>
              <input
                type="text"
                placeholder="e.g. Lead iOS Engineer, Staff ML Architect..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Department:
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Role Brief / Objectives:
              </label>
              <input
                type="text"
                placeholder="Key focus areas, core deliverables, and architecture requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Step 3: Dynamic Curated Suggestions for this Category */}
          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-cyan-500/20">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Curated Suggestions for {currentTrackObj.label} (Click to toggle)</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">1-Click Add / Remove</span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentTrackObj.suggestions.map((skill) => {
                const added = isSkillAdded(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSuggestedSkill(skill)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 border ${
                      added
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-sm'
                        : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-cyan-400/40 hover:text-white'
                    }`}
                  >
                    {added ? (
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

          {/* Step 4: Custom Skill Builder */}
          <div className="space-y-2 bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
            <label className="text-xs font-semibold text-slate-300 block">
              Add Additional Custom Skill:
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Type custom skill..."
                value={customSkillName}
                onChange={(e) => setCustomSkillName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSkill()}
                className="flex-1 w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as any)}
                  className="px-2.5 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
                >
                  <option value="REQUIRED">Required</option>
                  <option value="PREFERRED">Preferred</option>
                  <option value="BONUS">Bonus</option>
                </select>

                <select
                  value={customPriority}
                  onChange={(e) => setCustomPriority(e.target.value as any)}
                  className="px-2.5 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Critical">Critical (1.3x)</option>
                  <option value="High">High (1.1x)</option>
                  <option value="Medium">Medium (0.8x)</option>
                  <option value="Low">Low (0.5x)</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 5: Active Requirements Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-1 text-slate-400">
              <span className="font-semibold text-slate-300">
                Configured Requirements ({requirements.length}):{' '}
                <span className="text-cyan-400 font-bold">
                  {requirements.filter((r) => r.category === 'REQUIRED').length} Required
                </span> •{' '}
                <span className="text-purple-400 font-bold">
                  {requirements.filter((r) => r.category === 'PREFERRED').length} Preferred
                </span>
              </span>
              <span className="text-[10px] font-mono">Will Recalibrate Live Pool</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
              {requirements.map((req, idx) => (
                <div
                  key={req.id}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-bold text-white font-mono truncate">{req.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        req.category === 'REQUIRED'
                          ? 'bg-blue-500/20 text-cyan-300 border border-cyan-400/30'
                          : req.category === 'PREFERRED'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {req.priority}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition cursor-pointer"
                    title={`Remove ${req.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !title.trim() || requirements.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition cursor-pointer flex items-center space-x-2 disabled:opacity-50"
          >
            <span>{saving ? 'Creating & Calibrating Pool...' : 'Create Role & Activate Pool'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
