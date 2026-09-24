import {
  RankedCandidate, JobRequirement, JobRole, ScoringWeights,
  TalentLensInsight, TeamMatchAnalysis, CandidatePassport,
  InterviewPlan, RankingAuditEntry, SkillGraphData, TimelineYearGroup,
  EvidenceItem, CandidateSkillEval, User
} from '../types';

const API_BASE = '/api';

export const api = {
  // Health & Auth
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  login: async (credentials: { name?: string; email?: string; role?: string; organization?: string; password?: string }) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return res.json();
  },

  // Jobs & Roles
  getRoles: async (): Promise<JobRole[]> => {
    const res = await fetch(`${API_BASE}/jobs/roles`);
    return res.json();
  },

  selectRole: async (roleId: string, roleData?: JobRole) => {
    const res = await fetch(`${API_BASE}/jobs/select-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: roleId, role_data: roleData }),
    });
    return res.json();
  },

  syncState: async (payload: {
    active_role_id?: string;
    custom_roles?: JobRole[];
    removed_candidate_ids?: string[];
    custom_requirements?: JobRequirement[];
    scoring_weights?: ScoringWeights;
  }) => {
    const res = await fetch(`${API_BASE}/sync/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  resetDemoData: async () => {
    const res = await fetch(`${API_BASE}/reset/demo-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  getJobs: async () => {
    const res = await fetch(`${API_BASE}/jobs`);
    return res.json();
  },

  getJob: async (id: string = 'current') => {
    const res = await fetch(`${API_BASE}/jobs/${id}`);
    return res.json();
  },

  parseJobText: async (id: string, text: string) => {
    const res = await fetch(`${API_BASE}/jobs/${id}/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  uploadJD: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/jobs/upload-jd`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  parseJDText: async (text: string) => {
    const res = await fetch(`${API_BASE}/jobs/parse-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
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
    return res.json();
  },

  updateJobRequirements: async (id: string, requirements: JobRequirement[]) => {
    const res = await fetch(`${API_BASE}/jobs/${id}/requirements`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirements }),
    });
    return res.json();
  },

  // Candidates & Ranking
  getCandidates: async (): Promise<RankedCandidate[]> => {
    const res = await fetch(`${API_BASE}/candidates`);
    return res.json();
  },

  deleteCandidate: async (candidateId: string) => {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  getCandidate: async (id: string) => {
    const res = await fetch(`${API_BASE}/candidates/${id}`);
    return res.json();
  },

  getCandidateSkills: async (id: string): Promise<CandidateSkillEval[]> => {
    const res = await fetch(`${API_BASE}/candidates/${id}/skills`);
    return res.json();
  },

  getCandidateGraph: async (id: string): Promise<SkillGraphData> => {
    const res = await fetch(`${API_BASE}/candidates/${id}/graph`);
    return res.json();
  },

  getCandidateTimeline: async (id: string): Promise<TimelineYearGroup[]> => {
    const res = await fetch(`${API_BASE}/candidates/${id}/timeline`);
    return res.json();
  },

  getCandidateEvidence: async (id: string): Promise<EvidenceItem[]> => {
    const res = await fetch(`${API_BASE}/candidates/${id}/evidence`);
    return res.json();
  },

  getCandidatePassport: async (id: string): Promise<CandidatePassport> => {
    const res = await fetch(`${API_BASE}/candidates/${id}/passport`);
    return res.json();
  },

  getRanking: async (jobId: string = 'job_backend_core') => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/ranking`);
    return res.json();
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
    return res.json();
  },

  // Why / Why Not
  getWhyCandidate: async (id: string) => {
    const res = await fetch(`${API_BASE}/candidates/${id}/why`);
    return res.json();
  },

  getWhyNotHigher: async (id: string) => {
    const res = await fetch(`${API_BASE}/candidates/${id}/why-not`);
    return res.json();
  },

  // Talent Lens & Rescue
  getTalentLens: async (id: string): Promise<TalentLensInsight> => {
    const res = await fetch(`${API_BASE}/candidates/${id}/talent-lens`);
    return res.json();
  },

  getTalentRescue: async (jobId: string = 'job_backend_core') => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/talent-rescue`);
    return res.json();
  },

  // Simulation
  simulatePriority: async (jobId: string = 'job_backend_core', weights: ScoringWeights) => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weights }),
    });
    return res.json();
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
    return res.json();
  },

  poolBySkills: async (jobId: string = 'job_backend_core', skills: string[]) => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/pool-by-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills }),
    });
    return res.json();
  },

  // Team & Interview
  getTeamSkills: async (teamId: string = 'backend_team') => {
    const res = await fetch(`${API_BASE}/teams/${teamId}/skills`);
    return res.json();
  },

  getCandidateTeamMatch: async (candidateId: string): Promise<TeamMatchAnalysis> => {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}/team-match`);
    return res.json();
  },

  createInterviewPlan: async (candidateId: string): Promise<InterviewPlan> => {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}/interview-plan`, {
      method: 'POST',
    });
    return res.json();
  },

  // Pool Analytics, Matrix, Audit
  getPoolIntelligence: async (jobId: string = 'job_backend_core') => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/pool-intelligence`);
    return res.json();
  },

  getEvidenceMatrix: async (jobId: string = 'job_backend_core') => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/evidence-matrix`);
    return res.json();
  },

  getRankingHistory: async (jobId: string = 'job_backend_core'): Promise<RankingAuditEntry[]> => {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/ranking-history`);
    return res.json();
  },

  // Resume Upload
  uploadResumeFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/resumes/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  uploadResumeFiles: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const res = await fetch(`${API_BASE}/resumes/upload-batch`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },
};
