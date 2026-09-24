import React, { useState } from 'react';
import {
  X,
  PlayCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Sliders,
  Users,
  FileCheck,
} from 'lucide-react';

interface DemoTourModalProps {
  onClose: () => void;
  onSelectCandidate: (candidateId: string, tab?: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenSimulator: (candidateId: string) => void;
}

export const DemoTourModal: React.FC<DemoTourModalProps> = ({
  onClose,
  onSelectCandidate,
  onNavigateTab,
  onOpenSimulator,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      step: 1,
      title: 'The Hidden Talent Dilemma (Candidate #14 Elena Rostova)',
      subtitle: 'Section 37 Signature Candidate Walkthrough',
      description:
        'Elena Rostova applied for Senior Backend Engineer. Her resume has elite evidence in Python (94%), FastAPI (95%), and SQL (92%). However, an aggregate ATS formula ranks her down at #14 (74% match) because of an unverified Docker requirement (31%).',
      actionText: 'Inspect "Why Not Higher?"',
      action: () => {
        onClose();
        onSelectCandidate('cand_elena', 'overview');
      },
    },
    {
      step: 2,
      title: 'Explainable Uncertainty: "Why Not Higher?"',
      subtitle: 'Never declare a candidate incapable based on resume omissions',
      description:
        'Instead of opaque rejection, TalentPrism isolates the exact suppressing factor: Docker. The system shows: ✓ Docker listed, ✓ minor project reference, ✗ no work-context evidence detected, ✗ no deployment evidence detected.',
      actionText: 'Examine Talent Lens Analysis',
      action: () => {
        onClose();
        onNavigateTab('talent_lens');
      },
    },
    {
      step: 3,
      title: 'Talent Lens: Concentrated Gap vs Pool Benchmark',
      subtitle: 'See what the aggregate score is hiding',
      description:
        'Talent Lens plots Elena against applicant pool averages: Python (94% vs 68% avg), FastAPI (95% vs 64% avg), SQL (92% vs 71% avg). The system flags: "CONCENTRATED GAP DETECTED. This is not a generally low-evidence profile."',
      actionText: 'Launch What-If Simulator',
      action: () => {
        onClose();
        onOpenSimulator('cand_elena');
      },
    },
    {
      step: 4,
      title: 'What-If Simulator: Risk-Free Hypothesis Testing',
      subtitle: 'Elena jumps from #14 to #3 (+11 positions!)',
      description:
        'Simulate: "What if Elena proves her Docker skills in an interview?" Increasing Docker from 31% to 75% jumps her simulated rank to #3, without modifying real candidate data.',
      actionText: 'Check Team Capability Complement',
      action: () => {
        onClose();
        onNavigateTab('team_match');
      },
    },
    {
      step: 5,
      title: 'Team Match & Targeted Interview Intelligence',
      subtitle: 'Verify uncertainty rather than re-testing proven skills',
      description:
        'Team Matching reveals Elena brings Kafka (88%) and Kubernetes (82%) where the current team only has 18-22% coverage. Interview Intelligence generates targeted questions specifically for Docker containerization while excluding Python and FastAPI.',
      actionText: 'Open AI Interview Plan for Elena',
      action: () => {
        onClose();
        onSelectCandidate('cand_elena', 'interview');
      },
    },
  ];

  const current = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-cyan-400/50 p-6 shadow-2xl space-y-6 bg-[#0c101d] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center text-xs font-mono font-bold">
              {current.step}/5
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider font-mono">
                Interactive Guided Tour
              </span>
              <p className="text-xs text-slate-400">{current.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === currentStep ? 'w-6 bg-cyan-400' : s < currentStep ? 'w-3 bg-blue-500' : 'w-3 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight leading-snug">{current.title}</h2>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 text-sm text-slate-200 leading-relaxed font-sans">
            {current.description}
          </div>
        </div>

        {/* Tour Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer ${
              currentStep === 1 ? 'opacity-30 cursor-not-allowed text-slate-500' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={current.action}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center space-x-1.5"
            >
              <span>{current.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {currentStep < 5 && (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
              >
                Next Step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
