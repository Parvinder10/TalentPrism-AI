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

export const PROTECTED_PRESET_IDS = new Set([
  'job_backend_core',
  'job_fullstack',
  'job_data_eng',
  'job_devops_infra',
  'job_ml_eng',
]);

// 5 System Pre-configured Industry Roles (Factory defaults)
export const DEFAULT_PRESET_ROLES: JobRole[] = [
  {
    id: 'job_backend_core',
    title: 'Senior Backend Engineer (SDE / Core Systems)',
    department: 'Core Platform & Infrastructure',
    description: 'Architect high-concurrency microservices, optimize distributed data pipelines, design resilient RESTful APIs, and manage database scalability.',
    requirements: [
      { id: 'req_1', name: 'Python', category: 'REQUIRED', priority: 'Critical', weight: 1.3, canonical_skill: 'Python' },
      { id: 'req_2', name: 'FastAPI', category: 'REQUIRED', priority: 'Critical', weight: 1.2, canonical_skill: 'FastAPI' },
      { id: 'req_3', name: 'SQL', category: 'REQUIRED', priority: 'High', weight: 1.0, canonical_skill: 'SQL' },
      { id: 'req_4', name: 'REST APIs', category: 'REQUIRED', priority: 'High', weight: 1.0, canonical_skill: 'REST APIs' },
      { id: 'req_5', name: 'Docker', category: 'PREFERRED', priority: 'Medium', weight: 0.9, canonical_skill: 'Docker' },
      { id: 'req_6', name: 'AWS', category: 'PREFERRED', priority: 'Medium', weight: 0.8, canonical_skill: 'AWS' },
      { id: 'req_7', name: 'Redis', category: 'PREFERRED', priority: 'Medium', weight: 0.7, canonical_skill: 'Redis' },
      { id: 'req_8', name: 'Kubernetes', category: 'BONUS', priority: 'Low', weight: 0.5, canonical_skill: 'Kubernetes' },
      { id: 'req_9', name: 'Kafka', category: 'BONUS', priority: 'Low', weight: 0.5, canonical_skill: 'Kafka' },
    ],
  },
  {
    id: 'job_fullstack',
    title: 'Full Stack & Frontend Engineer (React / TypeScript)',
    department: 'Product Engineering',
    description: 'Build high-performance web applications, interactive design systems, responsive client-side state architectures, and robust API integrations.',
    requirements: [
      { id: 'fs_req_1', name: 'React', category: 'REQUIRED', priority: 'Critical', weight: 1.3, canonical_skill: 'React' },
      { id: 'fs_req_2', name: 'TypeScript', category: 'REQUIRED', priority: 'Critical', weight: 1.2, canonical_skill: 'TypeScript' },
      { id: 'fs_req_3', name: 'REST APIs', category: 'REQUIRED', priority: 'High', weight: 1.0, canonical_skill: 'REST APIs' },
      { id: 'fs_req_4', name: 'Tailwind CSS', category: 'REQUIRED', priority: 'High', weight: 1.0, canonical_skill: 'Tailwind CSS' },
      { id: 'fs_req_5', name: 'Python', category: 'PREFERRED', priority: 'Medium', weight: 0.8, canonical_skill: 'Python' },
      { id: 'fs_req_6', name: 'FastAPI', category: 'PREFERRED', priority: 'Medium', weight: 0.8, canonical_skill: 'FastAPI' },
      { id: 'fs_req_7', name: 'Docker', category: 'PREFERRED', priority: 'Medium', weight: 0.7, canonical_skill: 'Docker' },
      { id: 'fs_req_8', name: 'GraphQL', category: 'BONUS', priority: 'Low', weight: 0.5, canonical_skill: 'GraphQL' },
    ],
  },
  {
    id: 'job_data_eng',
    title: 'Senior Data Platform Engineer',
    department: 'Data Platform & Analytics',
    description: 'Build real-time stream ingestion, maintain petabyte-scale data lakes, orchestrate complex ETL workflows, and tune partitioned relational warehouses.',
    requirements: [
      { id: 'de_req_1', name: 'Python', category: 'REQUIRED', priority: 'Critical', weight: 1.3, canonical_skill: 'Python' },
      { id: 'de_req_2', name: 'SQL', category: 'REQUIRED', priority: 'Critical', weight: 1.3, canonical_skill: 'SQL' },
      { id: 'de_req_3', name: 'Kafka', category: 'REQUIRED', priority: 'High', weight: 1.1, canonical_skill: 'Kafka' },
      { id: 'de_req_4', name: 'PostgreSQL', category: 'REQUIRED', priority: 'High', weight: 1.0, canonical_skill: 'PostgreSQL' },
      { id: 'de_req_5', name: 'AWS', category: 'PREFERRED', priority: 'Medium', weight: 0.8, canonical_skill: 'AWS' },
      { id: 'de_req_6', name: 'Docker', category: 'PREFERRED', priority: 'Medium', weight: 0.8, canonical_skill: 'Docker' },
      { id: 'de_req_7', name: 'Redis', category: 'PREFERRED', priority: 'Medium', weight: 0.7, canonical_skill: 'Redis' },
      { id: 'de_req_8', name: 'Kubernetes', category: 'BONUS', priority: 'Low', weight: 0.5, canonical_skill: 'Kubernetes' },
    ],
  },
  {
    id: 'job_devops_infra',
    title: 'Platform Infrastructure & DevOps Engineer',
    department: 'Cloud & Infrastructure Operations',
    description: 'Architect multi-cloud Kubernetes clusters, streamline GitOps CI/CD delivery pipelines, manage infrastructure-as-code, and ensure high availability.',
    requirements: [
      { id: 'do_req_1', name: 'Docker', category: 'REQUIRED', priority: 'Critical', weight: 1.3, canonical_skill: 'Docker' },
      { id: 'do_req_2', name: 'Kubernetes', category: 'REQUIRED', priority: 'Critical', weight: 1.3, canonical_skill: 'Kubernetes' },
      { id: 'do_req_3', name: 'AWS', category: 'REQUIRED', priority: 'High', weight: 1.1, canonical_skill: 'AWS' },
      { id: 'do_req_4', name: 'CI/CD', category: 'REQUIRED', priority: 'High', weight: 1.0, canonical_skill: 'CI/CD' },
      { id: 'do_req_5', name: 'Python', category: 'PREFERRED', priority: 'Medium', weight: 0.8, canonical_skill: 'Python' },
      { id: 'do_req_6', name: 'Linux', category: 'PREFERRED', priority: 'Medium', weight: 0.8, canonical_skill: 'Linux' },
      { id: 'do_req_7', name: 'Redis', category: 'BONUS', priority: 'Low', weight: 0.5, canonical_skill: 'Redis' },
      { id: 'do_req_8', name: 'Kafka', category: 'BONUS', priority: 'Low', weight: 0.5, canonical_skill: 'Kafka' },
    ],
  },
  {
    id: 'job_ml_eng',
    title: 'Machine Learning & AI Systems Engineer',
    department: 'Applied AI Research',
    description: 'Deploy deep learning models in production, build low-latency inference microservices, scale vector databases, and manage feature pipelines.',
    requirements: [
      { id: 'ml_req_1', name: 'Python', category: 'REQUIRED', priority: 'Critical', weight: 1.3, canonical_skill: 'Python' },
      { id: 'ml_req_2', name: 'PyTorch', category: 'REQUIRED', priority: 'Critical', weight: 1.2, canonical_skill: 'PyTorch' },
      { id: 'ml_req_3', name: 'FastAPI', category: 'REQUIRED', priority: 'High', weight: 1.1, canonical_skill: 'FastAPI' },
      { id: 'ml_req_4', name: 'SQL', category: 'REQUIRED', priority: 'High', weight: 1.0, canonical_skill: 'SQL' },
      { id: 'ml_req_5', name: 'Docker', category: 'PREFERRED', priority: 'Medium', weight: 0.8, canonical_skill: 'Docker' },
      { id: 'ml_req_6', name: 'AWS', category: 'PREFERRED', priority: 'Medium', weight: 0.8, canonical_skill: 'AWS' },
      { id: 'ml_req_7', name: 'Kubernetes', category: 'BONUS', priority: 'Low', weight: 0.5, canonical_skill: 'Kubernetes' },
      { id: 'ml_req_8', name: 'Kafka', category: 'BONUS', priority: 'Low', weight: 0.5, canonical_skill: 'Kafka' },
    ],
  },
];

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
      const val = localStorage.getItem(KEYS.CURRENT_ROLE_ID);
      if (val !== null && val !== '') return val;
      return defaultId;
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

  // --- Custom Roles (Manually Added / Uploaded JDs) ---
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

  saveCustomRoles(newRoles: JobRole[]): void {
    try {
      if (!newRoles || newRoles.length === 0) return;
      const roles = storage.getCustomRoles();
      const map = new Map<string, JobRole>();
      roles.forEach((r) => map.set(r.id, r));
      newRoles.forEach((r) => {
        if (r && r.id && !PROTECTED_PRESET_IDS.has(r.id)) {
          map.set(r.id, r);
        }
      });
      localStorage.setItem(KEYS.CUSTOM_ROLES, JSON.stringify(Array.from(map.values())));
    } catch (e) {
      console.error('Failed to save custom roles to localStorage', e);
    }
  },

  // --- Combined All Available Roles (Presets + Custom, Minus Deleted) ---
  getAllAvailableRoles(): JobRole[] {
    try {
      const deletedIds = storage.getDeletedRoleIds();
      const custom = storage.getCustomRoles();
      const map = new Map<string, JobRole>();
      DEFAULT_PRESET_ROLES.forEach((r) => {
        if (!deletedIds.includes(r.id)) map.set(r.id, r);
      });
      custom.forEach((r) => {
        if (!deletedIds.includes(r.id)) map.set(r.id, r);
      });
      return Array.from(map.values());
    } catch {
      return DEFAULT_PRESET_ROLES;
    }
  },

  // --- Deleted / Removed JD Role IDs ---
  getDeletedRoleIds(): string[] {
    try {
      const data = localStorage.getItem(`${PREFIX}deleted_role_ids`);
      const parsed: string[] = data ? JSON.parse(data) : [];
      // Protect preconfigured presets so they are never filtered out
      return parsed.filter((id) => !PROTECTED_PRESET_IDS.has(id));
    } catch {
      return [];
    }
  },

  addDeletedRoleId(roleId: string): void {
    if (PROTECTED_PRESET_IDS.has(roleId)) {
      return; // Never mark preset roles as deleted
    }
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
      existing.forEach((c) => {
        if (c && c.id) map.set(c.id, c);
      });
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

// --- Real-time Cross-Tab Broadcast Channel ---
let syncBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncBroadcastChannel = new BroadcastChannel('talentprism_sync_channel');
  }
} catch {
  syncBroadcastChannel = null;
}

export function broadcastTabSync(message: { type: string; payload?: any }): void {
  try {
    if (syncBroadcastChannel) {
      syncBroadcastChannel.postMessage({ ...message, timestamp: Date.now() });
    }
  } catch (e) {
    console.warn('Failed to broadcast sync message:', e);
  }
}

export function subscribeTabSync(callback: (message: { type: string; payload?: any; timestamp: number }) => void): () => void {
  const handler = (event: MessageEvent) => {
    if (event && event.data) {
      callback(event.data);
    }
  };
  if (syncBroadcastChannel) {
    syncBroadcastChannel.addEventListener('message', handler);
  }

  return () => {
    if (syncBroadcastChannel) {
      syncBroadcastChannel.removeEventListener('message', handler);
    }
  };
}
