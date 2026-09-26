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
import {
  storage,
  PROTECTED_PRESET_IDS,
  DEFAULT_PRESET_ROLES,
  broadcastTabSync,
  subscribeTabSync,
} from './utils/storage';

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
    if (roleId === 'none') return [];
    const calibrated = storage.getCalibratedRequirements(roleId);
    if (calibrated && calibrated.length > 0) return calibrated;
    const preset = DEFAULT_PRESET_ROLES.find((r) => r.id === roleId);
    return preset?.requirements || [];
  });

  const [availableRoles, setAvailableRoles] = useState<JobRole[]>(() => {
    return storage.getAllAvailableRoles();
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
  const [manualAddJDMode, setManualAddJDMode] = useState<'upload' | 'manual'>('upload');
  const [isDemoTourOpen, setIsDemoTourOpen] = useState<boolean>(false);
  const [simulatorCandidateId, setSimulatorCandidateId] = useState<string>(() => candidates[0]?.id || '');

  // Keep simulatorCandidateId aligned with active candidates
  useEffect(() => {
    if (candidates.length > 0 && (!simulatorCandidateId || !candidates.some((c) => c.id === simulatorCandidateId))) {
      setSimulatorCandidateId(candidates[0].id);
    }
  }, [candidates, simulatorCandidateId]);

  const handleOpenManualAddJD = (mode: 'upload' | 'manual' = 'upload') => {
    setManualAddJDMode(mode);
    setIsManualAddJDOpen(true);
  };

  useEffect(() => {
    loadInitialData();

    // 1. Instant cross-tab real-time sync via BroadcastChannel & storage events
    const unsubscribe = subscribeTabSync((msg) => {
      if (!msg || !msg.type) return;
      switch (msg.type) {
        case 'ROLE_CHANGED':
          if (msg.payload?.roleId !== undefined) {
            setCurrentRoleIdState(msg.payload.roleId);
            if (msg.payload.requirements) setRequirements(msg.payload.requirements);
            if (msg.payload.candidates) setCandidates(msg.payload.candidates);
          }
          break;
        case 'ROLE_CREATED':
          if (msg.payload?.role) {
            setAvailableRoles((prev) => {
              const map = new Map<string, JobRole>();
              prev.forEach((r) => map.set(r.id, r));
              map.set(msg.payload.role.id, msg.payload.role);
              return Array.from(map.values());
            });
            if (msg.payload.active) {
              setCurrentRoleIdState(msg.payload.role.id);
              if (msg.payload.role.requirements) setRequirements(msg.payload.role.requirements);
              if (msg.payload.candidates) setCandidates(msg.payload.candidates);
            }
          }
          break;
        case 'ROLE_DELETED':
          if (msg.payload?.roleId) {
            setAvailableRoles((prev) => prev.filter((r) => r.id !== msg.payload.roleId));
            if (msg.payload.nextRoleId) {
              setCurrentRoleIdState(msg.payload.nextRoleId);
            }
          }
          break;
        case 'CANDIDATE_REMOVED':
          if (msg.payload?.candidateId) {
            setCandidates((prev) => prev.filter((c) => c.id !== msg.payload.candidateId));
          }
          break;
        case 'AUTH_CHANGED':
          setCurrentUser(msg.payload?.user || null);
          break;
        case 'CANDIDATE_ADDED':
        case 'STORAGE_CHANGE':
        case 'FULL_SYNC':
          loadInitialData(true);
          break;
      }
    });

    // 2. Cross-browser focus sync (e.g. switching between Chrome & Edge)
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        loadInitialData(true);
      }
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    // 3. Periodic background sync every 12s for side-by-side browser windows
    const intervalTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadInitialData(true);
      }
    }, 12000);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
      clearInterval(intervalTimer);
    };
  }, []);

  const loadInitialData = async (silent: boolean = false) => {
    try {
      if (!silent && candidates.length === 0) {
        setLoading(true);
      }
      let storedRoleId = storage.getCurrentRoleId('job_backend_core');
      const customRoles = storage.getCustomRoles();
      const deletedRoleIds = storage.getDeletedRoleIds();
      const removedIds = storage.getRemovedCandidateIds();
      const calibratedReqs = storage.getCalibratedRequirements(storedRoleId);
      const weights = storage.getScoringWeights();

      // Synchronize browser persistent state with the backend Python worker
      let syncRes: any = null;
      try {
        syncRes = await api.syncState({
          custom_roles: customRoles,
          deleted_role_ids: deletedRoleIds,
          active_role_id: storedRoleId,
          removed_candidate_ids: removedIds,
          custom_requirements: calibratedReqs || undefined,
          scoring_weights: weights || undefined,
          uploaded_candidates: storage.getUploadedCandidates(),
          is_initial_load: true,
        });
      } catch (syncErr) {
        console.warn('Backend state sync warning:', syncErr);
      }

      if (syncRes) {
        if (syncRes.custom_roles && Array.isArray(syncRes.custom_roles) && syncRes.custom_roles.length > 0) {
          storage.saveCustomRoles(syncRes.custom_roles);
        }
        if (syncRes.uploaded_candidates && Array.isArray(syncRes.uploaded_candidates) && syncRes.uploaded_candidates.length > 0) {
          storage.saveUploadedCandidates(syncRes.uploaded_candidates);
        }
        // Adopt server active_role_id if local was default or not explicitly set
        const explicitLocalRoleId = localStorage.getItem('talentprism_current_role_id');
        if (syncRes.active_role_id && (!explicitLocalRoleId || storedRoleId === 'job_backend_core')) {
          if (syncRes.active_role_id !== storedRoleId) {
            storedRoleId = syncRes.active_role_id;
            storage.setCurrentRoleId(syncRes.active_role_id);
          }
        }
      }

      // Fetch current candidates, job specs, and role catalog
      const isDisconnected = storedRoleId === 'none';
      const [candData, jobData, rolesData] = await Promise.all([
        api.getCandidates(),
        isDisconnected
          ? Promise.resolve({ id: 'none', title: 'No Active JD (Disconnected)', requirements: [] })
          : api.getJob(storedRoleId).catch(() => api.getJob('current')),
        api.getRoles(),
      ]);

      // Merge factory presets + backend roles + custom roles, filtering out deleted ones
      const mergedRolesMap = new Map<string, JobRole>();
      DEFAULT_PRESET_ROLES.forEach((r) => {
        if (!deletedRoleIds.includes(r.id)) mergedRolesMap.set(r.id, r);
      });
      (rolesData || []).forEach((r) => {
        if (!deletedRoleIds.includes(r.id)) mergedRolesMap.set(r.id, r);
      });
      storage.getCustomRoles().forEach((r) => {
        if (!deletedRoleIds.includes(r.id)) mergedRolesMap.set(r.id, r);
      });
      const mergedRoles = Array.from(mergedRolesMap.values());
      setAvailableRoles(mergedRoles);

      // If storedRoleId was deleted, select the first available role (unless 'none')
      let effectiveRoleId = storedRoleId;
      if (effectiveRoleId !== 'none' && deletedRoleIds.includes(effectiveRoleId) && mergedRoles.length > 0) {
        effectiveRoleId = mergedRoles[0].id;
        storage.setCurrentRoleId(effectiveRoleId);
      }

      // Filter out any candidates dismissed by the recruiter
      const filteredCandidates = (candData || []).filter((c) => !removedIds.includes(c.id));
      setCandidates(filteredCandidates);
      storage.saveCachedCandidates(effectiveRoleId, filteredCandidates);

      // Priority for requirements: calibrated user edits > jobData from API > available role fallback (empty when 'none')
      if (effectiveRoleId === 'none') {
        setRequirements([]);
      } else if (calibratedReqs && calibratedReqs.length > 0) {
        setRequirements(calibratedReqs);
      } else if (jobData?.requirements && jobData.requirements.length > 0) {
        setRequirements(jobData.requirements);
      } else {
        const foundRole = mergedRoles.find((r) => r.id === effectiveRoleId);
        if (foundRole?.requirements && foundRole.requirements.length > 0) {
          setRequirements(foundRole.requirements);
        }
      }

      setCurrentRoleId(effectiveRoleId);
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('talentprism_user', JSON.stringify(user));
    broadcastTabSync({ type: 'AUTH_CHANGED', payload: { user } });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('talentprism_user');
    broadcastTabSync({ type: 'AUTH_CHANGED', payload: { user: null } });
  };

  const handleDisconnectJD = async () => {
    try {
      setLoading(true);
      setCurrentRoleId('none');
      storage.setCurrentRoleId('none');
      setRequirements([]);

      const res = await api.disconnectJD();
      const removedIds = storage.getRemovedCandidateIds();
      let newCandidates: RankedCandidate[] = [];
      if (res.ranked_candidates) {
        newCandidates = res.ranked_candidates.filter((c: RankedCandidate) => !removedIds.includes(c.id));
      } else {
        const fresh = await api.getCandidates();
        newCandidates = fresh.filter((c: RankedCandidate) => !removedIds.includes(c.id));
      }
      setCandidates(newCandidates);
      storage.saveCachedCandidates('none', newCandidates);
      broadcastTabSync({
        type: 'ROLE_CHANGED',
        payload: { roleId: 'none', requirements: [], candidates: newCandidates },
      });
    } catch (err) {
      console.error('Failed to disconnect JD:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = async (roleId: string) => {
    if (roleId === 'none') {
      return handleDisconnectJD();
    }
    try {
      setLoading(true);
      setCurrentRoleId(roleId);
      storage.setCurrentRoleId(roleId);

      const targetRole = availableRoles.find((r) => r.id === roleId);
      const removedIds = storage.getRemovedCandidateIds();

      const res = await api.selectRole(roleId, targetRole);

      let effectiveReqs: JobRequirement[] = [];
      const storedReqs = storage.getCalibratedRequirements(roleId);
      if (storedReqs && storedReqs.length > 0) {
        effectiveReqs = storedReqs;
        setRequirements(storedReqs);
      } else if (res.job) {
        effectiveReqs = res.job.requirements || [];
        setRequirements(effectiveReqs);
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
      broadcastTabSync({
        type: 'ROLE_CHANGED',
        payload: { roleId, requirements: effectiveReqs, candidates: newCandidates },
      });
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
    if (candidateId && candidates.some((c) => c.id === candidateId)) {
      setSimulatorCandidateId(candidateId);
    } else if (candidates.length > 0) {
      setSimulatorCandidateId(candidates[0].id);
    }
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
    broadcastTabSync({
      type: 'ROLE_CHANGED',
      payload: { roleId: currentRoleId, requirements: newReqs, candidates: filtered },
    });
  };

  const handleUploadSuccess = async (newUploads?: any) => {
    if (newUploads) {
      const list = Array.isArray(newUploads) ? newUploads : [newUploads];
      storage.saveUploadedCandidates(list);
    }
    const updatedCandidates = await api.getCandidates();
    const removedIds = storage.getRemovedCandidateIds();
    const filtered = updatedCandidates.filter((c: RankedCandidate) => !removedIds.includes(c.id));
    setCandidates(filtered);
    storage.saveCachedCandidates(currentRoleId, filtered);
    broadcastTabSync({
      type: 'CANDIDATE_ADDED',
      payload: { newUploads },
    });
  };

  const handleRoleCreated = (
    newRole: JobRole,
    updatedCandidates?: RankedCandidate[],
    activate: boolean = true
  ) => {
    storage.saveCustomRole(newRole);
    storage.saveCalibratedRequirements(newRole.id, newRole.requirements || []);

    setAvailableRoles((prev) => {
      const exists = prev.some((r) => r.id === newRole.id);
      return exists ? prev.map((r) => (r.id === newRole.id ? newRole : r)) : [...prev, newRole];
    });

    let finalCandidates = updatedCandidates;
    if (activate) {
      storage.setCurrentRoleId(newRole.id);
      setCurrentRoleId(newRole.id);
      setRequirements(newRole.requirements || []);

      if (updatedCandidates) {
        const removedIds = storage.getRemovedCandidateIds();
        const filtered = updatedCandidates.filter((c: RankedCandidate) => !removedIds.includes(c.id));
        setCandidates(filtered);
        storage.saveCachedCandidates(newRole.id, filtered);
        finalCandidates = filtered;
      }
    }

    broadcastTabSync({
      type: 'ROLE_CREATED',
      payload: { role: newRole, active: activate, candidates: finalCandidates },
    });
  };

  const handleRemoveCandidate = async (candidateId: string, candidateName: string) => {
    try {
      storage.addRemovedCandidateId(candidateId);
      setCandidates((prev) => {
        const updated = prev.filter((c) => c.id !== candidateId);
        storage.saveCachedCandidates(currentRoleId, updated);
        if (simulatorCandidateId === candidateId) {
          setSimulatorCandidateId(updated[0]?.id || '');
        }
        return updated;
      });
      broadcastTabSync({
        type: 'CANDIDATE_REMOVED',
        payload: { candidateId },
      });
      await api.deleteCandidate(candidateId);
    } catch (err) {
      console.error('Failed to remove candidate:', err);
    }
  };

  const handleDeleteRole = async (roleIdToDelete: string) => {
    if (PROTECTED_PRESET_IDS.has(roleIdToDelete)) {
      alert('Default system preset roles cannot be removed.');
      return;
    }

    if (availableRoles.length <= 1) {
      alert('Cannot remove the only remaining Job Description role. At least one JD role must remain.');
      return;
    }

    const targetRole = availableRoles.find((r) => r.id === roleIdToDelete);
    const roleTitle = targetRole?.title || 'this Job Description';

    if (
      !window.confirm(
        `Are you sure you want to remove the JD for "${roleTitle}"? This will delete the role specification and recalibrate rankings.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      storage.addDeletedRoleId(roleIdToDelete);

      const remainingRoles = availableRoles.filter((r) => r.id !== roleIdToDelete);
      setAvailableRoles(remainingRoles);

      if (currentRoleId === roleIdToDelete && remainingRoles.length > 0) {
        const nextRole = remainingRoles[0];
        setCurrentRoleId(nextRole.id);
        storage.setCurrentRoleId(nextRole.id);

        const res = await api.selectRole(nextRole.id, nextRole);
        const storedReqs = storage.getCalibratedRequirements(nextRole.id);
        if (storedReqs && storedReqs.length > 0) {
          setRequirements(storedReqs);
        } else if (res.job) {
          setRequirements(res.job.requirements || []);
        }

        let newCandidates: RankedCandidate[] = [];
        const removedIds = storage.getRemovedCandidateIds();
        if (res.ranked_candidates) {
          newCandidates = res.ranked_candidates.filter((c: RankedCandidate) => !removedIds.includes(c.id));
        } else {
          const freshCandidates = await api.getCandidates();
          newCandidates = freshCandidates.filter((c: RankedCandidate) => !removedIds.includes(c.id));
        }
        setCandidates(newCandidates);
        storage.saveCachedCandidates(nextRole.id, newCandidates);
      }

      broadcastTabSync({
        type: 'ROLE_DELETED',
        payload: { roleId: roleIdToDelete, nextRoleId: remainingRoles[0]?.id },
      });

      await api.deleteRole(roleIdToDelete).catch((err) => {
        console.warn('Backend delete role notice:', err);
      });
    } catch (e) {
      console.error('Failed to remove JD role:', e);
    } finally {
      setLoading(false);
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
        broadcastTabSync({ type: 'FULL_SYNC' });
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
        onOpenManualAddJD={handleOpenManualAddJD}
        onResetDemoData={handleResetDemoData}
        onDisconnectJD={handleDisconnectJD}
        onDeleteRole={handleDeleteRole}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <RecruiterDashboard
            candidates={candidates}
            requirements={
              currentRoleId === 'none'
                ? []
                : (requirements && requirements.length > 0
                    ? requirements
                    : (availableRoles.find((r) => r.id === currentRoleId)?.requirements || []))
            }
            onSelectCandidate={handleSelectCandidate}
            onNavigateTab={setActiveTab}
            onStartDemoTour={() => setIsDemoTourOpen(true)}
            onOpenJDEditor={() => setIsJDEditorOpen(true)}
            onOpenUploadJD={() => handleOpenManualAddJD('upload')}
            currentRoleTitle={
              currentRoleId === 'none'
                ? 'No Active JD (Disconnected)'
                : (availableRoles.find((r) => r.id === currentRoleId)?.title || 'No JD Connected')
            }
            currentRoleId={currentRoleId}
            onDisconnectJD={handleDisconnectJD}
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
          initialCandidate={candidates.find((c) => c.id === selectedCandidateId)}
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
          currentRoleTitle={
            currentRoleId === 'none'
              ? 'No Active JD (Disconnected)'
              : (availableRoles.find((r) => r.id === currentRoleId)?.title || 'No JD Connected')
          }
          onClose={() => setIsJDEditorOpen(false)}
          onRequirementsUpdated={handleRequirementsUpdated}
          onDisconnectJD={handleDisconnectJD}
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
          initialMode={manualAddJDMode}
          onClose={() => setIsManualAddJDOpen(false)}
          onRoleCreated={handleRoleCreated}
        />
      )}
    </div>
  );
}

export default App;
