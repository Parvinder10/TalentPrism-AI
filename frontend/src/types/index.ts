export interface User {
  name: string;
  email: string;
  role: string;
  organization: string;
  badge?: string;
  avatar?: string;
  department?: string;
}

export interface JobRequirement {
  id: string;
  name: string;
  category: 'REQUIRED' | 'PREFERRED' | 'BONUS';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  weight: number;
  description?: string;
  canonical_skill?: string;
}

export interface JobRole {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: JobRequirement[];
}

export interface ScoringWeights {
  required_skills: number;
  relevant_experience: number;
  evidence_strength: number;
  recency: number;
  preferred_skills: number;
}

export interface RankedCandidate {
  id: string;
  name: string;
  email: string;
  current_title: string;
  current_company?: string;
  rank: number;
  previous_rank?: number;
  rank_delta: number;
  overall_match: number;
  required_coverage: number;
  preferred_coverage: number;
  evidence_strength: number;
  required_ratio: string;
  preferred_ratio: string;
  major_gap?: string;
  has_talent_lens_alert: boolean;
  talent_lens_badge?: string;
  is_suppressed?: boolean;
  profile_archetype: string;
  resume_language: string;
  years_of_experience: number;
}

export interface EvidenceItem {
  id: string;
  candidate_id: string;
  skill_name: string;
  source_type: string;
  source_title: string;
  source_text: string;
  original_language?: string;
  translated_or_normalized?: string;
  confidence_score: number;
  classification: 'CLAIMED' | 'CONTEXTUALLY_SUPPORTED' | 'ARTIFACT_SUPPORTED' | 'COMPANY_VALIDATED';
  evidence_strength: number;
  evidence_strength_level: 'HIGH' | 'MODERATE' | 'LIMITED' | 'NOT_DETECTED';
  start_year?: number;
  end_year?: number;
  is_recent: boolean;
  context_signals: string[];
  missing_context: string[];
}

export interface CandidateSkillEval {
  skill_name: string;
  category: string;
  priority: string;
  detection_status: string;
  evidence_strength: number;
  evidence_gap: number;
  is_semantic_match: boolean;
  semantic_bridge_note?: string;
  supporting_evidence_count: number;
  why_explanation: string[];
  primary_source?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  animated?: boolean;
  strength?: number;
}

export interface SkillGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TimelineYearGroup {
  year: number;
  skills: string[];
  experiences: any[];
  projects: any[];
}

export interface TalentLensInsight {
  is_suppressed: boolean;
  archetype: string;
  headline: string;
  summary: string;
  primary_suppressors: Array<{
    skill: string;
    candidate_score: number;
    pool_average: number;
    difference: number;
  }>;
  core_strengths: Array<{
    skill: string;
    candidate_score: number;
    pool_average: number;
    difference: number;
  }>;
  pool_comparison: Array<{
    skill: string;
    candidate_score: number;
    pool_average: number;
    difference: number;
    is_outperforming: boolean;
    is_underperforming: boolean;
  }>;
  estimated_score_penalty?: number;
  potential_recovered_score?: number;
  potential_recovered_rank?: number;
  recruiter_strategy?: string;
  interview_validation_focus?: string[];
  profile_distribution_description?: string;
}

export interface TeamMatchAnalysis {
  role_match_score: number;
  team_complement_score: number;
  distinctive_capabilities: string[];
  overlapping_capabilities: string[];
  remaining_team_gaps: string[];
  analysis_text: string;
}

export interface PassportVersion {
  version: string;
  timestamp: string;
  author: string;
  summary: string;
  status: string;
}

export interface CandidatePassport {
  candidate_id: string;
  candidate_name: string;
  applied_role: string;
  current_version: string;
  versions: PassportVersion[];
  overall_match: number;
  required_coverage: number;
  preferred_coverage: number;
  evidence_strength: number;
  core_evidence: Record<string, string>;
  talent_lens_summary: string;
  team_complement_summary: string;
  interview_focus: string[];
  notes: Array<{ author: string; text: string }>;
}

export interface InterviewQuestion {
  id: string;
  priority: string;
  skill_target: string;
  question: string;
  follow_up: string;
  why_ask_this: string;
  evidence_context: string;
}

export interface InterviewPlan {
  candidate_id: string;
  candidate_name: string;
  job_title: string;
  high_priority_verification: InterviewQuestion[];
  medium_priority_verification: InterviewQuestion[];
  project_deep_dives: InterviewQuestion[];
  technical_challenges: InterviewQuestion[];
  behavioral_evidence: InterviewQuestion[];
  low_priority_to_reverify: Array<{ skill: string; reason: string }>;
}

export interface RankingAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  old_config: Record<string, any>;
  new_config: Record<string, any>;
  affected_rankings: Array<{
    candidate_id: string;
    name: string;
    old_rank: number;
    new_rank: number;
    delta: number;
  }>;
  reason: string;
}
