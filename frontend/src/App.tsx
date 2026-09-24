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
import { storage } from './utils/storage';

export function App() {
  // Authentication State - default to null so login page is always the very first page
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('talentprism_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Active tab - persisted across refreshes
  const [activeTab, setActiveTabState] = useState<string>(() => storage.getActiveTab('dashboard'));
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    storage.setActiveTab(tab);
  };

  // Active role ID - persisted across refreshes
  const [currentRoleId, setCurrentRoleIdState] = useState<string>(() =>
    storage.getCurrentRoleId('job_backend_core')
  );
  const setCurrentRoleId = (roleId: string) => {
    setCurrentRoleIdState(roleId);
    storage.setCurrentRoleId(roleId);
  };

  // Candidates - initialized from local cache for zero-flicker reload
  const [candidates, setCandidates] = useState<RankedCandidate[]>(() => {
    const roleId = storage.getCurrentRoleId('job_backend_core');
    const cached = storage.getCachedCandidates(roleId);
    const removedIds = storage.getRemovedCandidateIds();
    if (cached && cached.length > 0) {
      return cached.filter((c) => !removedIds.includes(c.id));
    }
    return [];
  });

  const [requirements, setRequirements] = useState<JobRequirement[]>(() => {
    const roleId = storage.getCurrentRoleId('job_backend_core');
    return storage.getCalibratedRequirements(roleId) || [];
  });

  const [availableRoles, setAvailableRoles] = useState<JobRole[]>(() => {
    return storage.getCustomRoles();
  });

  // If cached candidates exist, do not block with full page spinner!
  const [loading, setLoading] = useState<boolean>(() => {
    const roleId = storage.getCurrentRoleId('job_backend_core');
    const cached = storage.getCachedCandidates(roleId);
    return !cached || cached.length === 0;
  });

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
      const storedRoleId = storage.getCurrentRoleId('job_backend_core');
      const customRoles = storage.getCustomRoles();
      const removedIds = storage.getRemovedCandidateIds();
      const calibratedReqs = storage.getCalibratedRequirements(storedRoleId);
      const weights = storage.getScoringWeights();

      // Synchronize browser persistent state with the backend Python worker
      try {
        await api.syncState({
          custom_roles: customRoles,
          active_role_id: storedRoleId,
          removed_candidate_ids: removedIds,
          custom_requirements: calibratedReqs || undefined,
          scoring_weights: weights || undefined,
        });
      } catch (syncErr) {
        console.warn('Backend state sync warning:', syncErr);
      }

      // Fetch current candidates, job specs, and role catalog
      const [candData, jobData, rolesData] = await Promise.all([
        api.getCandidates(),
        api.getJob(storedRoleId).catch(() => api.getJob('current')),
        api.getRoles(),
      ]);

      // Merge backend roles with custom roles stored in browser
      const mergedRolesMap = new Map<string, JobRole>();
      (rolesData || []).forEach((r) => mergedRolesMap.set(r.id, r));
      customRoles.forEach((r) => mergedRolesMap.set(r.id, r));
      const mergedRoles = Array.from(mergedRolesMap.values());
      setAvailableRoles(mergedRoles);

      // Filter out any candidates dismissed by the recruiter
      const filteredCandidates = (candData || []).filter((c) => !removedIds.includes(c.id));
      setCandidates(filteredCandidates);
      storage.saveCachedCandidates(storedRoleId, filteredCandidates);

      // Priority for requirements: calibrated user edits > jobData from API
      if (calibratedReqs && calibratedReqs.length > 0) {
        setRequirements(calibratedReqs);
      } else if (jobData?.requirements) {
        setRequirements(jobData.requirements);
      }

      setCurrentRoleId(storedRoleId);
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

      const targetRole = availableRoles.find((r) => r.id === roleId);
      const removedIds = storage.getRemovedCandidateIds();

      const res = await api.selectRole(roleId, targetRole);

      const storedReqs = storage.getCalibratedRequirements(roleId);
      if (storedReqs && storedReqs.length > 0) {
        setRequirements(storedReqs);
      } else if (res.job) {
        setRequirements(res.job.requirements || []);
      }

      let newCandidates: RankedCandidate[] = [];
      if (res.ranked_candidates) {
        newCandidates = res.ranked_candidates.filter((c: RankedCandidate) => !removedIds.includes(c.id));
      } else {
        const freshCandidates = await api.getCandidates();
        newCandidates = freshCandidates.filter((c: RankedCandidate) => !removedIds.includes(c.id));
      }

      setCandidates(newCandidates);
      storage.saveCachedCandidates(roleId, newCandidates);
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
    storage.saveCalibratedRequirements(currentRoleId, newReqs);
    setRequirements(newReqs);
    const updatedCandidates = await api.getCandidates();
    const removedIds = storage.getRemovedCandidateIds();
    const filtered = updatedCandidates.filter((c: RankedCandidate) => !removedIds.includes(c.id));
    setCandidates(filtered);
    storage.saveCachedCandidates(currentRoleId, filtered);
  };

  const handleUploadSuccess = async () => {
    const updatedCandidates = await api.getCandidates();
    const removedIds = storage.getRemovedCandidateIds();
    const filtered = updatedCandidates.filter((c: RankedCandidate) => !removedIds.includes(c.id));
    setCandidates(filtered);
    storage.saveCachedCandidates(currentRoleId, filtered);
  };

  const handleRoleCreated = (newRole: JobRole, updatedCandidates?: RankedCandidate[]) => {
    storage.saveCustomRole(newRole);
    storage.setCurrentRoleId(newRole.id);

    setAvailableRoles((prev) => {
      const exists = prev.some((r) => r.id === newRole.id);
      return exists ? prev.map((r) => (r.id === newRole.id ? newRole : r)) : [...prev, newRole];
    });

    setCurrentRoleId(newRole.id);
    setRequirements(newRole.requirements || []);

    if (updatedCandidates) {
      const removedIds = storage.getRemovedCandidateIds();
      const filtered = updatedCandidates.filter((c: RankedCandidate) => !removedIds.includes(c.id));
      setCandidates(filtered);
      storage.saveCachedCandidates(newRole.id, filtered);
    }
  };

  const handleRemoveCandidate = async (candidateId: string, candidateName: string) => {
    try {
      storage.addRemovedCandidateId(candidateId);
      setCandidates((prev) => {
        const updated = prev.filter((c) => c.id !== candidateId);
        storage.saveCachedCandidates(currentRoleId, updated);
        return updated;
      });
      await api.deleteCandidate(candidateId);
    } catch (err) {
      console.error('Failed to remove candidate:', err);
    }
  };

  const handleResetDemoData = async () => {
    if (
      window.confirm(
        'Reset all demo data back to default factory state? This will clear custom JDs, re-admit dismissed candidates, and restore default rankings.'
      )
    ) {
      try {
        setLoading(true);
        storage.resetAllState();
        await api.resetDemoData();
        window.location.reload();
      } catch (e) {
        console.error('Failed to reset demo data:', e);
        window.location.reload();
      }
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
        onResetDemoData={handleResetDemoData}
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
