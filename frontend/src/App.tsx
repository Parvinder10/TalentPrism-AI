import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { RecruiterDashboard } from './components/RecruiterDashboard';
import { CandidateRankingTable } from './components/CandidateRankingTable';
import { EvidenceMatrixView } from './components/EvidenceMatrixView';
import { TalentLensView } from './components/TalentLensView';
import { TalentRescueView } from './components/TalentRescueView';
import { TeamMatchingView } from './components/TeamMatchingView';
import { WhatIfSimulatorView } from './components/WhatIfSimulatorView';
import { PoolIntelligenceView } from './components/PoolIntelligenceView';
import { RankingAuditTrailView } from './components/RankingAuditTrailView';
import { CandidateExplorerModal } from './components/CandidateExplorerModal';
import { UploadModal } from './components/UploadModal';
import { JDEditorModal } from './components/JDEditorModal';
import { DemoTourModal } from './components/DemoTourModal';
import { ManualAddJDModal } from './components/ManualAddJDModal';
import { api } from './api/client';
import { RankedCandidate, JobRequirement, JobRole, User } from './types';

export function App() {
  // Authentication State - default to null so login page is always the very first page
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('talentprism_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
  const [requirements, setRequirements] = useState<JobRequirement[]>([]);
  const [availableRoles, setAvailableRoles] = useState<JobRole[]>([]);
  const [currentRoleId, setCurrentRoleId] = useState<string>('job_backend_core');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [candidateInitialTab, setCandidateInitialTab] = useState<string>('overview');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isJDEditorOpen, setIsJDEditorOpen] = useState<boolean>(false);
  const [isManualAddJDOpen, setIsManualAddJDOpen] = useState<boolean>(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState<boolean>(false);
  const [simulatorCandidateId, setSimulatorCandidateId] = useState<string>('cand_elena');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [candData, jobData, rolesData] = await Promise.all([
        api.getCandidates(),
        api.getJob('current'),
        api.getRoles(),
      ]);
      setCandidates(candData);
      setRequirements(jobData.requirements || []);
      setAvailableRoles(rolesData || []);
      if (jobData.id) {
        setCurrentRoleId(jobData.id);
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('talentprism_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('talentprism_user');
  };

  const handleSelectRole = async (roleId: string) => {
    try {
      setLoading(true);
      setCurrentRoleId(roleId);
      const res = await api.selectRole(roleId);
      if (res.job) {
        setRequirements(res.job.requirements || []);
      }
      if (res.ranked_candidates) {
        setCandidates(res.ranked_candidates);
      } else {
        const freshCandidates = await api.getCandidates();
        setCandidates(freshCandidates);
      }
    } catch (e) {
      console.error('Failed to switch job role:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidateId: string, initialTab: string = 'overview') => {
    setSelectedCandidateId(candidateId);
    setCandidateInitialTab(initialTab);
  };

  const handleOpenSimulator = (candidateId?: string) => {
    if (candidateId) setSimulatorCandidateId(candidateId);
    setActiveTab('what_if');
  };

  const handleRequirementsUpdated = async (newReqs: JobRequirement[]) => {
    setRequirements(newReqs);
    const updatedCandidates = await api.getCandidates();
    setCandidates(updatedCandidates);
  };

  const handleUploadSuccess = async () => {
    const updatedCandidates = await api.getCandidates();
    setCandidates(updatedCandidates);
  };

  const handleRoleCreated = (newRole: JobRole, updatedCandidates?: RankedCandidate[]) => {
    setAvailableRoles((prev) => {
      if (prev.some((r) => r.id === newRole.id)) return prev;
      return [...prev, newRole];
    });
    setCurrentRoleId(newRole.id);
    setRequirements(newRole.requirements || []);
    if (updatedCandidates) {
      setCandidates(updatedCandidates);
    }
  };

  const handleRemoveCandidate = async (candidateId: string, candidateName: string) => {
    try {
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      const res = await api.deleteCandidate(candidateId);
      if (res.remaining_candidates) {
        setCandidates(res.remaining_candidates);
      }
    } catch (err) {
      console.error('Failed to remove candidate:', err);
    }
  };

  // If not logged in, render the login page as the very first screen
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b11] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-white font-mono">TalentPrism AI</p>
          <p className="text-xs text-slate-400">Loading Candidate Intelligence & Evidence Graphs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col antialiased">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenJDEditor={() => setIsJDEditorOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onStartDemoTour={() => setIsDemoTourOpen(true)}
        applicantCount={candidates.length}
        availableRoles={availableRoles}
        currentRoleId={currentRoleId}
        onSelectRole={handleSelectRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenManualAddJD={() => setIsManualAddJDOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <RecruiterDashboard
            candidates={candidates}
            requirements={requirements}
            onSelectCandidate={handleSelectCandidate}
            onNavigateTab={setActiveTab}
            onStartDemoTour={() => setIsDemoTourOpen(true)}
            onOpenJDEditor={() => setIsJDEditorOpen(true)}
            currentRoleTitle={availableRoles.find((r) => r.id === currentRoleId)?.title || 'Senior Backend Engineer'}
            onRemoveCandidate={handleRemoveCandidate}
          />
        )}

        {activeTab === 'ranking' && (
          <CandidateRankingTable
            candidates={candidates}
            onSelectCandidate={handleSelectCandidate}
            onOpenSimulator={() => handleOpenSimulator()}
          />
        )}

        {activeTab === 'matrix' && (
          <EvidenceMatrixView onSelectCandidate={handleSelectCandidate} />
        )}

        {activeTab === 'talent_lens' && (
          <TalentLensView
            candidates={candidates}
            onSelectCandidate={handleSelectCandidate}
            onOpenSimulator={handleOpenSimulator}
          />
        )}

        {activeTab === 'talent_rescue' && (
          <TalentRescueView onSelectCandidate={handleSelectCandidate} />
        )}

        {activeTab === 'team_match' && (
          <TeamMatchingView
            candidates={candidates}
            onSelectCandidate={handleSelectCandidate}
          />
        )}

        {activeTab === 'what_if' && (
          <WhatIfSimulatorView
            candidates={candidates}
            onSelectCandidate={handleSelectCandidate}
            initialCandidateId={simulatorCandidateId}
            onRankingApplied={loadInitialData}
            currentRoleId={currentRoleId}
          />
        )}

        {activeTab === 'pool_intel' && <PoolIntelligenceView />}

        {activeTab === 'audit_trail' && <RankingAuditTrailView />}
      </main>

      {/* Candidate Explorer Modal */}
      {selectedCandidateId && (
        <CandidateExplorerModal
          candidateId={selectedCandidateId}
          initialTab={candidateInitialTab}
          onClose={() => setSelectedCandidateId(null)}
          onOpenSimulator={handleOpenSimulator}
        />
      )}

      {/* Upload Resumes Modal */}
      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Job Criteria / Requirements Modal */}
      {isJDEditorOpen && (
        <JDEditorModal
          currentRequirements={requirements}
          currentRoleId={currentRoleId}
          currentRoleTitle={availableRoles.find((r) => r.id === currentRoleId)?.title || 'Senior Backend Engineer'}
          onClose={() => setIsJDEditorOpen(false)}
          onRequirementsUpdated={handleRequirementsUpdated}
        />
      )}

      {/* Demo Tour Modal */}
      {isDemoTourOpen && (
        <DemoTourModal
          onClose={() => setIsDemoTourOpen(false)}
          onSelectCandidate={handleSelectCandidate}
          onNavigateTab={setActiveTab}
          onOpenSimulator={handleOpenSimulator}
        />
      )}

      {/* Manual Add Custom JD Modal */}
      {isManualAddJDOpen && (
        <ManualAddJDModal
          onClose={() => setIsManualAddJDOpen(false)}
          onRoleCreated={handleRoleCreated}
        />
      )}
    </div>
  );
}

export default App;
