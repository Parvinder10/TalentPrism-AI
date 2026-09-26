import React, { useState, useRef } from 'react';
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
  UploadCloud,
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { api } from '../api/client';
import { JobRequirement, JobRole, RankedCandidate } from '../types';

interface ManualAddJDModalProps {
  onClose: () => void;
  onRoleCreated: (newRole: JobRole, updatedCandidates?: RankedCandidate[], activate?: boolean) => void;
  initialMode?: 'upload' | 'manual';
}

export const ManualAddJDModal: React.FC<ManualAddJDModalProps> = ({
  onClose,
  onRoleCreated,
  initialMode = 'upload',
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'manual'>(initialMode);

  // --- UPLOAD STATE ---
  const [uploadMethod, setUploadMethod] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activateImmediately, setActivateImmediately] = useState<boolean>(true);

  // --- MANUAL TRACK STATE ---
  const [selectedTrack, setSelectedTrack] = useState<string>('backend');

  // --- ROLE DETAILS & CRITERIA STATE ---
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering & Technology');
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

  // Career Tracks for Manual Builder
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
      const initialSkills: JobRequirement[] = track.suggestions.slice(0, 3).map((sk, idx) => ({
        id: `req_init_${idx}_${Date.now()}`,
        name: sk,
        category: 'REQUIRED',
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

  const handleRequirementCategoryChange = (index: number, newCat: 'REQUIRED' | 'PREFERRED' | 'BONUS') => {
    setRequirements((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], category: newCat };
      return next;
    });
  };

  const handleRequirementPriorityChange = (index: number, newPri: 'Critical' | 'High' | 'Medium' | 'Low') => {
    setRequirements((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        priority: newPri,
        weight: newPri === 'Critical' ? 1.3 : newPri === 'High' ? 1.1 : newPri === 'Medium' ? 0.8 : 0.5,
      };
      return next;
    });
  };

  // --- FILE HANDLING & EXTRACTION ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setExtractError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setExtractError(null);
    }
  };

  const handleExtractJD = async () => {
    setExtractError(null);
    if (uploadMethod === 'file') {
      if (!selectedFile) {
        setExtractError('Please select or drop a JD document file first.');
        return;
      }
      try {
        setIsExtracting(true);
        const res = await api.uploadJD(selectedFile);
        if (res && res.success) {
          setTitle(res.title || selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_\-]+/g, ' '));
          setDepartment(res.department || 'Core Engineering & Technology');
          setDescription(res.description || '');
          if (res.requirements && res.requirements.length > 0) {
            setRequirements(res.requirements);
          }
          setHasExtracted(true);
        } else {
          setExtractError(res.error || 'Failed to extract requirements from JD document.');
        }
      } catch (err) {
        console.error('JD upload error:', err);
        setExtractError('Failed to process JD document. Please try pasting the JD text directly.');
      } finally {
        setIsExtracting(false);
      }
    } else {
      if (!pastedText.trim()) {
        setExtractError('Please paste JD text into the box above.');
        return;
      }
      try {
        setIsExtracting(true);
        const res = await api.parseJDText(pastedText);
        if (res && res.success) {
          setTitle(res.title || 'Technical Specialist');
          setDepartment(res.department || 'Core Engineering');
          setDescription(res.description || '');
          if (res.requirements && res.requirements.length > 0) {
            setRequirements(res.requirements);
          }
          setHasExtracted(true);
        } else {
          setExtractError(res.error || 'Failed to extract requirements from text.');
        }
      } catch (err) {
        console.error('JD text parse error:', err);
        setExtractError('Failed to process JD text.');
      } finally {
        setIsExtracting(false);
      }
    }
  };

  // --- SUBMIT & CREATE ROLE ---
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || requirements.length === 0) return;

    try {
      setSaving(true);
      const res = await api.createJob({
        title: title.trim(),
        department: department.trim() || 'Core Engineering & Technology',
        description: description.trim() || `${title.trim()} responsible for scalable delivery and engineering excellence.`,
        requirements,
      });

      if (res.job) {
        onRoleCreated(res.job, res.ranked_candidates, activateImmediately);
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
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-cyan-500/40 p-6 shadow-2xl space-y-4 bg-[#090d16] relative max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono">
                Job Specification Studio
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Evidence-Driven Match Engine
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Active JD Specification & Creation</h2>
            <p className="text-xs text-slate-400">
              Upload an existing JD document to auto-extract criteria or configure a custom career track manually.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center space-x-2 bg-slate-950/80 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg font-bold text-xs transition cursor-pointer ${
              activeMode === 'upload'
                ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-cyan-400/60 text-cyan-200 shadow-md shadow-cyan-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span>Upload JD File & Auto-Fetch</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              NLP Engine
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('manual')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg font-bold text-xs transition cursor-pointer ${
              activeMode === 'manual'
                ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-cyan-400/60 text-cyan-200 shadow-md shadow-cyan-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Manual Track & Skill Builder</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* ========================================================= */}
          {/* MODE 1: UPLOAD JD FILE & AUTO-FETCH */}
          {/* ========================================================= */}
          {activeMode === 'upload' && (
            <div className="space-y-3">
              {/* Method Toggle: File vs Text */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Choose Input Source:</span>
                </span>
                <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => setUploadMethod('file')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                      uploadMethod === 'file'
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Upload Document (PDF / DOCX)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod('text')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                      uploadMethod === 'text'
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paste JD Text
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              {uploadMethod === 'file' && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2 ${
                    dragOver
                      ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01]'
                      : selectedFile
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-white/15 bg-slate-950/70 hover:border-cyan-400/50 hover:bg-slate-900/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.docx,.md,.doc"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  {selectedFile ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center space-x-2 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{selectedFile.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready to extract
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        Drag and drop your Job Description file here, or{' '}
                        <span className="text-cyan-400 underline underline-offset-2">browse computer</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Supports PDF, TXT, DOCX, and Markdown format
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Paste Text Area */}
              {uploadMethod === 'text' && (
                <div className="space-y-1">
                  <textarea
                    rows={4}
                    placeholder="Paste job description text here (from LinkedIn, Greenhouse, Workday, Notion, etc.)..."
                    value={pastedText}
                    onChange={(e) => {
                      setPastedText(e.target.value);
                      setExtractError(null);
                    }}
                    className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono leading-relaxed"
                  />
                </div>
              )}

              {/* Extraction Trigger Button */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExtractJD}
                  disabled={isExtracting || saving || (uploadMethod === 'file' ? !selectedFile : !pastedText.trim())}
                  className="flex-1 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-40"
                >
                  {isExtracting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Extracting Skills & Role Criteria via NLP...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>Extract Job Description & Review Criteria</span>
                    </>
                  )}
                </button>
              </div>

              {/* Extract Error Alert */}
              {extractError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center space-x-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{extractError}</span>
                </div>
              )}

              {/* Extraction Success Notice */}
              {hasExtracted && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center space-x-3 text-emerald-300 text-xs shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-white">
                      ✓ Successfully Extracted: <span className="text-cyan-300">{title}</span> ({department})
                    </p>
                    <p className="text-[11px] text-emerald-300/80">
                      <strong>{requirements.length} skill criteria</strong> detected. Review and adjust requirements below before saving.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* MODE 2: MANUAL TRACK BUILDER */}
          {/* ========================================================= */}
          {activeMode === 'manual' && (
            <div className="space-y-3">
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

              {/* Step 2: Dynamic Curated Suggestions for this Track */}
              <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-cyan-500/20">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Curated Skills for {currentTrackObj.label} (Click to toggle)</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">1-Click Add/Remove</span>
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
            </div>
          )}

          {/* ========================================================= */}
          {/* COMMON SECTION: ROLE METADATA & REQUIREMENTS CALIBRATOR */}
          {/* ========================================================= */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center space-x-1.5 font-mono">
                <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                <span>Role Details & Criteria Calibration</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Editable Specifications</span>
            </div>

            {/* Inputs: Title, Department, Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-white/5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Job Role Title <span className="text-cyan-400">*</span>:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Cloud & Backend Architect..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Department / Team:
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
                  Role Summary / Responsibilities:
                </label>
                <input
                  type="text"
                  placeholder="Core focus areas, distributed architecture responsibilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Add Custom Skill Row */}
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
              <input
                type="text"
                placeholder="Add another skill criteria..."
                value={customSkillName}
                onChange={(e) => setCustomSkillName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSkill()}
                className="flex-1 w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as any)}
                  className="px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
                >
                  <option value="REQUIRED">Required</option>
                  <option value="PREFERRED">Preferred</option>
                  <option value="BONUS">Bonus</option>
                </select>

                <select
                  value={customPriority}
                  onChange={(e) => setCustomPriority(e.target.value as any)}
                  className="px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Critical">Critical (1.3x)</option>
                  <option value="High">High (1.1x)</option>
                  <option value="Medium">Medium (0.8x)</option>
                  <option value="Low">Low (0.5x)</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Configured Criteria Matrix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                <span className="font-semibold text-slate-300">
                  Criteria Portfolio ({requirements.length} skills):{' '}
                  <span className="text-cyan-400 font-bold">
                    {requirements.filter((r) => r.category === 'REQUIRED').length} Required
                  </span>{' '}
                  •{' '}
                  <span className="text-purple-400 font-bold">
                    {requirements.filter((r) => r.category === 'PREFERRED').length} Preferred
                  </span>{' '}
                  •{' '}
                  <span className="text-amber-400 font-bold">
                    {requirements.filter((r) => r.category === 'BONUS').length} Bonus
                  </span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400">Recalibrates Candidates Live</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[170px] overflow-y-auto pr-1">
                {requirements.map((req, idx) => (
                  <div
                    key={req.id}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-bold text-white font-mono truncate">{req.name}</span>
                      
                      {/* Category Switcher Pill */}
                      <select
                        value={req.category}
                        onChange={(e) => handleRequirementCategoryChange(idx, e.target.value as any)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase cursor-pointer border ${
                          req.category === 'REQUIRED'
                            ? 'bg-blue-500/20 text-cyan-300 border-cyan-400/40'
                            : req.category === 'PREFERRED'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-400/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                        }`}
                      >
                        <option value="REQUIRED" className="bg-slate-900 text-white">Required</option>
                        <option value="PREFERRED" className="bg-slate-900 text-white">Preferred</option>
                        <option value="BONUS" className="bg-slate-900 text-white">Bonus</option>
                      </select>

                      {/* Priority Switcher Pill */}
                      <select
                        value={req.priority}
                        onChange={(e) => handleRequirementPriorityChange(idx, e.target.value as any)}
                        className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-slate-800 text-slate-300 border border-white/10 cursor-pointer"
                      >
                        <option value="Critical" className="bg-slate-900 text-white">Critical (1.3x)</option>
                        <option value="High" className="bg-slate-900 text-white">High (1.1x)</option>
                        <option value="Medium" className="bg-slate-900 text-white">Medium (0.8x)</option>
                        <option value="Low" className="bg-slate-900 text-white">Low (0.5x)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition cursor-pointer ml-1"
                      title={`Remove ${req.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activateImmediately}
              onChange={(e) => setActivateImmediately(e.target.checked)}
              className="rounded bg-slate-900 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer w-4 h-4"
            />
            <span>Set as Active Role immediately (re-ranks candidates)</span>
          </label>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center space-x-2 disabled:opacity-40"
            >
              <span>
                {saving
                  ? 'Saving Role...'
                  : activateImmediately
                  ? 'Save & Activate JD Role'
                  : 'Save Role to Catalog'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
