import { JobRole, JobRequirement, ScoringWeights, RankedCandidate } from '../types';

const PREFIX = 'talentprism_';
const KEYS = {
  ACTIVE_TAB: `${PREFIX}active_tab`,
  CURRENT_ROLE_ID: `${PREFIX}current_role_id`,
  CUSTOM_ROLES: `${PREFIX}custom_roles`,
  REMOVED_CANDIDATE_IDS: `${PREFIX}removed_candidates`,
  CALIBRATED_REQS: `${PREFIX}calibrated_reqs_`,
  WEIGHTS: `${PREFIX}weights`,
  CANDIDATE_CACHE: `${PREFIX}candidate_cache_`,
};

export const storage = {
  // --- Active Tab ---
  getActiveTab(defaultTab: string = 'dashboard'): string {
    try {
      return localStorage.getItem(KEYS.ACTIVE_TAB) || defaultTab;
    } catch {
      return defaultTab;
    }
  },

  setActiveTab(tab: string): void {
    try {
      localStorage.setItem(KEYS.ACTIVE_TAB, tab);
    } catch (e) {
      console.error('Failed to save active tab to localStorage', e);
    }
  },

  // --- Current Role ID ---
  getCurrentRoleId(defaultId: string = 'job_backend_core'): string {
    try {
      return localStorage.getItem(KEYS.CURRENT_ROLE_ID) || defaultId;
    } catch {
      return defaultId;
    }
  },

  setCurrentRoleId(roleId: string): void {
    try {
      localStorage.setItem(KEYS.CURRENT_ROLE_ID, roleId);
    } catch (e) {
      console.error('Failed to save current role ID to localStorage', e);
    }
  },

  // --- Custom Roles (Manually Added JDs) ---
  getCustomRoles(): JobRole[] {
    try {
      const data = localStorage.getItem(KEYS.CUSTOM_ROLES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCustomRole(newRole: JobRole): void {
    try {
      const roles = storage.getCustomRoles();
      const existingIdx = roles.findIndex((r) => r.id === newRole.id);
      if (existingIdx >= 0) {
        roles[existingIdx] = newRole;
      } else {
        roles.push(newRole);
      }
      localStorage.setItem(KEYS.CUSTOM_ROLES, JSON.stringify(roles));

      // If it was previously marked deleted, unmark it
      const deletedIds = storage.getDeletedRoleIds().filter((id) => id !== newRole.id);
      localStorage.setItem(`${PREFIX}deleted_role_ids`, JSON.stringify(deletedIds));
    } catch (e) {
      console.error('Failed to save custom role to localStorage', e);
    }
  },

  // --- Deleted / Removed JD Role IDs ---
  getDeletedRoleIds(): string[] {
    try {
      const data = localStorage.getItem(`${PREFIX}deleted_role_ids`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addDeletedRoleId(roleId: string): void {
    try {
      const ids = new Set(storage.getDeletedRoleIds());
      ids.add(roleId);
      localStorage.setItem(`${PREFIX}deleted_role_ids`, JSON.stringify(Array.from(ids)));

      // Also remove from custom_roles if present
      const custom = storage.getCustomRoles().filter((r) => r.id !== roleId);
      localStorage.setItem(KEYS.CUSTOM_ROLES, JSON.stringify(custom));
    } catch (e) {
      console.error('Failed to save deleted role ID to localStorage', e);
    }
  },

  removeRole(roleId: string): void {
    storage.addDeletedRoleId(roleId);
  },

  // --- Removed / Dismissed Candidate IDs ---
  getRemovedCandidateIds(): string[] {
    try {
      const data = localStorage.getItem(KEYS.REMOVED_CANDIDATE_IDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addRemovedCandidateId(id: string): void {
    try {
      const ids = new Set(storage.getRemovedCandidateIds());
      ids.add(id);
      localStorage.setItem(KEYS.REMOVED_CANDIDATE_IDS, JSON.stringify(Array.from(ids)));
    } catch (e) {
      console.error('Failed to save removed candidate to localStorage', e);
    }
  },

  // --- Calibrated Requirements per Role ---
  getCalibratedRequirements(roleId: string): JobRequirement[] | null {
    try {
      const data = localStorage.getItem(`${KEYS.CALIBRATED_REQS}${roleId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveCalibratedRequirements(roleId: string, reqs: JobRequirement[]): void {
    try {
      localStorage.setItem(`${KEYS.CALIBRATED_REQS}${roleId}`, JSON.stringify(reqs));
    } catch (e) {
      console.error('Failed to save calibrated requirements to localStorage', e);
    }
  },

  // --- Scoring Weights ---
  getScoringWeights(): ScoringWeights | null {
    try {
      const data = localStorage.getItem(KEYS.WEIGHTS);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveScoringWeights(weights: ScoringWeights): void {
    try {
      localStorage.setItem(KEYS.WEIGHTS, JSON.stringify(weights));
    } catch (e) {
      console.error('Failed to save weights to localStorage', e);
    }
  },

  // --- Candidate Rankings Cache ---
  getCachedCandidates(roleId: string): RankedCandidate[] | null {
    try {
      const data = localStorage.getItem(`${KEYS.CANDIDATE_CACHE}${roleId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveCachedCandidates(roleId: string, candidates: RankedCandidate[]): void {
    try {
      localStorage.setItem(`${KEYS.CANDIDATE_CACHE}${roleId}`, JSON.stringify(candidates));
    } catch (e) {
      console.error('Failed to cache candidates to localStorage', e);
    }
  },

  // --- Uploaded Resumes Candidates ---
  getUploadedCandidates(): any[] {
    try {
      const data = localStorage.getItem(`${PREFIX}uploaded_candidates`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveUploadedCandidates(cands: any[]): void {
    try {
      if (!cands || cands.length === 0) return;
      const existing = storage.getUploadedCandidates();
      const map = new Map<string, any>();
      existing.forEach((c) => map.set(c.id, c));
      cands.forEach((c) => {
        if (c && c.id) map.set(c.id, c);
      });
      localStorage.setItem(`${PREFIX}uploaded_candidates`, JSON.stringify(Array.from(map.values())));
    } catch (e) {
      console.error('Failed to save uploaded candidates to localStorage', e);
    }
  },

  // --- Clear / Reset All Data ---
  resetAllState(): void {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(PREFIX) && key !== `${PREFIX}user`) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('Failed to reset state in localStorage', e);
    }
  },
};
