import {
  RankedCandidate, JobRequirement, JobRole, ScoringWeights,
  TalentLensInsight, TeamMatchAnalysis, CandidatePassport,
  InterviewPlan, RankingAuditEntry, SkillGraphData, TimelineYearGroup,
  EvidenceItem, CandidateSkillEval, User
} from '../types';

const API_BASE = '/api';

async function handleResponse<T = any>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let detail = '';
    try {
      const data = JSON.parse(text);
      detail = data.detail || data.message || data.error;
    } catch {
      // Not JSON
    }
    throw new Error(detail || text || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Health & Auth
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  login: async (credentials: { name?: string; email?: string; role?: string; organization?: string; password?: string }) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  getAuthorizedAccounts: async () => {
    const res = await fetch(`${API_BASE}/auth/authorized-accounts`);
    return handleResponse(res);
  },

  // Jobs & Roles
  getRoles: async (): Promise<JobRole[]> => {
    const res = await fetch(`${API_BASE}/jobs/roles`);
    return handleResponse(res);
  },

  selectRole: async (roleId: string, roleData?: JobRole) => {
    const res = await fetch(`${API_BASE}/jobs/select-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: roleId, role_data: roleData }),
    });
    return handleResponse(res);
  },

  syncState: async (payload: {
    active_role_id?: string;
    custom_roles?: JobRole[];
    removed_candidate_ids?: string[];
    custom_requirements?: JobRequirement[];
    scoring_weights?: ScoringWeights;
    uploaded_candidates?: any[];
  }) => {
    const res = await fetch(`${API_BASE}/sync/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  resetDemoData: async () => {
    const res = await fetch(`${API_BASE}/reset/demo-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  getJobs: async () => {
    const res = await fetch(`${API_BASE}/jobs`);
    return handleResponse(res);
  },

  getJob: async (id: string = 'current') => {
    const res = await fetch(`${API_BASE}/jobs/${id}`);
    return handleResponse(res);
  },

  parseJobText: async (id: string, text: string) => {
    const res = await fetch(`${API_BASE}/jobs/${id}/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return handleResponse(res);
  },

  uploadJD: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/jobs/upload-jd`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  parseJDText: async (text: string) => {
    const res = await fetch(`${API_BASE}/jobs/parse-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return handleResponse(res);
  },

  createJob: async (jobData: {
    title: string;
    department: string;
    description: string;
    requirements: JobRequirement[];
  }) => {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    });
    return handleResponse(res);
  },

  updateJobRequirements: async (id: string, requirements: JobRequirement[]) => {
    const res = await fetch(`${API_BASE}/jobs/${id}/requirements`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirements }),
    });
    return handleResponse(res);
  },

  // Candidates & Ranking
  getCandidates: async (): Promise<RankedCandidate[]> => {
    const res = await fetch(`${API_BASE}/candidates`);
    return handleResponse(res);
  },

  deleteCandidate: async (candidateId: string) => {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  getCandidate: async (id: string) => {
    const res = await fetch(`${API_BASE}/candidates/${id}`);
    return handleResponse(res);
  },

  getCandidateSkills: async (id: string): Promise<CandidateSkillEval[]> => {
    const res = await fetch(`${API_BASE}/candidates/${id}/skills`);
    return handleResponse(res);
  },

  getCandidateGraph: async (id: string): Promise<SkillGraphData> => {
    const res = await fetch(`${API_BASE}/candidates/${id}/graph`);
    return handleResponse(res);
  },

  getCandidateTimeline: async (id: string): Promise<TimelineYearGroup[]> => {
    const res = await fetch(`${API_BASE}/candidates/${id}/timeline`);
    return handleResponse(res);
  },

  getCandidateEvidence: async (id: string): Promise<EvidenceItem[]> => {
    const res = await fetch(`${API_BASE}/candidates/${id}/evidence`);
    return handleResponse(res);
  },

  getCandidatePassport: async (id: string): Promise<CandidatePassport> => {
    const res = await fetch(`${API_BASE}/candidates/${id}/passport`);
    return handleResponse(res);
  },

  getRanking: async (jobId: string = 'job_backend_core') => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/ranking`);
    return handleResponse(res);
  },

  recalculateRanking: async (
    jobId: string = 'job_backend_core',
    weights?: ScoringWeights,
    requirements?: JobRequirement[],
    reason?: string
  ) => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/ranking/recalculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weights, requirements, reason }),
    });
    return handleResponse(res);
  },

  // Why / Why Not
  getWhyCandidate: async (id: string) => {
    const res = await fetch(`${API_BASE}/candidates/${id}/why`);
    return handleResponse(res);
  },

  getWhyNotHigher: async (id: string) => {
    const res = await fetch(`${API_BASE}/candidates/${id}/why-not`);
    return handleResponse(res);
  },

  // Talent Lens & Rescue
  getTalentLens: async (id: string): Promise<TalentLensInsight> => {
    const res = await fetch(`${API_BASE}/candidates/${id}/talent-lens`);
    return handleResponse(res);
  },

  getTalentRescue: async (jobId: string = 'job_backend_core') => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/talent-rescue`);
    return handleResponse(res);
  },

  // Simulation
  simulatePriority: async (jobId: string = 'job_backend_core', weights: ScoringWeights) => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weights }),
    });
    return handleResponse(res);
  },

  simulateSkillScenario: async (candidateId: string, skillName: string, strength: number) => {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}/skill-scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_id: candidateId,
        skill_name: skillName,
        simulated_evidence_strength: strength,
      }),
    });
    return handleResponse(res);
  },

  poolBySkills: async (jobId: string = 'job_backend_core', skills: string[]) => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/pool-by-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills }),
    });
    return handleResponse(res);
  },

  // Team & Interview
  getTeamSkills: async (teamId: string = 'backend_team') => {
    const res = await fetch(`${API_BASE}/teams/${teamId}/skills`);
    return handleResponse(res);
  },

  getCandidateTeamMatch: async (candidateId: string): Promise<TeamMatchAnalysis> => {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}/team-match`);
    return handleResponse(res);
  },

  createInterviewPlan: async (candidateId: string): Promise<InterviewPlan> => {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}/interview-plan`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Pool Analytics, Matrix, Audit
  getPoolIntelligence: async (jobId: string = 'job_backend_core') => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/pool-intelligence`);
    return handleResponse(res);
  },

  getEvidenceMatrix: async (jobId: string = 'job_backend_core') => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/evidence-matrix`);
    return handleResponse(res);
  },

  getRankingHistory: async (jobId: string = 'job_backend_core'): Promise<RankingAuditEntry[]> => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/ranking-history`);
    return handleResponse(res);
  },

  // Resume Upload
  uploadResumeFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/resumes/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  uploadResumeFiles: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const res = await fetch(`${API_BASE}/resumes/upload-batch`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },
};
