from typing import List, Dict, Optional, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime

class RequirementCategory(str):
    REQUIRED = "REQUIRED"
    PREFERRED = "PREFERRED"
    BONUS = "BONUS"

class RequirementPriority(str):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class EvidenceClassification(str):
    CLAIMED = "CLAIMED"
    CONTEXTUALLY_SUPPORTED = "CONTEXTUALLY_SUPPORTED"
    ARTIFACT_SUPPORTED = "ARTIFACT_SUPPORTED"
    COMPANY_VALIDATED = "COMPANY_VALIDATED"

class DetectionStatus(str):
    EXPLICITLY_LISTED = "EXPLICITLY LISTED"
    SEMANTICALLY_DETECTED = "SEMANTICALLY DETECTED"
    SUPPORTED_BY_EVIDENCE = "SUPPORTED BY EVIDENCE"
    LIMITED_EVIDENCE = "LIMITED EVIDENCE"
    NOT_DETECTED = "NOT DETECTED"

class EvidenceStrengthLevel(str):
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LIMITED = "LIMITED"
    NOT_DETECTED = "NOT DETECTED"

# Job Requirement
class JobRequirement(BaseModel):
    id: str
    name: str
    category: str = "REQUIRED" # REQUIRED, PREFERRED, BONUS
    priority: str = "Critical" # Critical, High, Medium, Low
    weight: float = 1.0 # Dynamic weight multiplier
    description: Optional[str] = None
    canonical_skill: Optional[str] = None

class JobCreate(BaseModel):
    title: str
    department: str = "Engineering"
    description: str
    requirements: List[JobRequirement] = []

class JobUpdateRequirements(BaseModel):
    requirements: List[JobRequirement]

class ScoringWeights(BaseModel):
    required_skills: float = 0.40
    relevant_experience: float = 0.20
    evidence_strength: float = 0.20
    recency: float = 0.10
    preferred_skills: float = 0.10

# Evidence Item
class EvidenceItem(BaseModel):
    id: str
    candidate_id: str
    skill_name: str
    source_type: str # 'project', 'work_experience', 'education', 'certification', 'skills_list'
    source_title: str # e.g. "Senior Backend Engineer at FinTech Labs" or "Distributed Cache Project"
    source_text: str # Original snippet or quote
    original_language: Optional[str] = "en"
    translated_or_normalized: Optional[str] = None
    confidence_score: float = 0.85
    classification: str = "CONTEXTUALLY_SUPPORTED" # CLAIMED, CONTEXTUALLY_SUPPORTED, ARTIFACT_SUPPORTED, COMPANY_VALIDATED
    evidence_strength: float = 85.0 # 0-100
    evidence_strength_level: str = "HIGH" # HIGH, MODERATE, LIMITED, NOT DETECTED
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    is_recent: bool = True
    context_signals: List[str] = [] # e.g. ["Production scale", "Deployment pipeline", "FastAPI endpoints"]
    missing_context: List[str] = [] # e.g. ["No direct production deployment", "Only tutorial reference"]

# Skill Evaluation
class CandidateSkillEval(BaseModel):
    skill_name: str
    category: str # REQUIRED, PREFERRED, BONUS
    priority: str # Critical, High, etc.
    detection_status: str # EXPLICITLY LISTED, SEMANTICALLY DETECTED, etc.
    evidence_strength: float # 0 - 100
    evidence_gap: float # 0 - 100
    is_semantic_match: bool = False
    semantic_bridge_note: Optional[str] = None
    supporting_evidence_count: int = 0
    why_explanation: List[str] = []
    primary_source: Optional[str] = None

# Graph Structures
class GraphNode(BaseModel):
    id: str
    label: str
    type: str # candidate, skill, project, company, role, education, certification
    properties: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str # HAS_SKILL, USED_IN, BUILT, WORKED_AT, WORKED_AS, CERTIFIED_IN, RELATED_TO
    animated: Optional[bool] = False
    strength: Optional[float] = 1.0

class SkillGraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# Timeline
class TimelineYearGroup(BaseModel):
    year: int
    skills: List[str]
    experiences: List[Dict[str, Any]]
    projects: List[Dict[str, Any]]

# Talent Lens
class TalentLensInsight(BaseModel):
    is_suppressed: bool = False
    archetype: str # SPECIALIST_LIKE or BALANCED
    headline: str # e.g. "HIDDEN CORE STRENGTH DETECTED"
    summary: str
    primary_suppressors: List[Dict[str, Any]] # e.g. [{"skill": "Docker", "score": 31, "pool_avg": 76}]
    core_strengths: List[Dict[str, Any]] # e.g. [{"skill": "Python", "score": 94, "pool_avg": 68}]
    pool_comparison: List[Dict[str, Any]] # Candidate vs Pool comparison per skill

# Team Complement
class TeamMatchAnalysis(BaseModel):
    role_match_score: float
    team_complement_score: float
    distinctive_capabilities: List[str] # e.g. ["Kafka", "Kubernetes", "AWS"]
    overlapping_capabilities: List[str] # e.g. ["Python", "FastAPI", "SQL"]
    remaining_team_gaps: List[str] # e.g. ["Elixir", "Terraform"]
    analysis_text: str

# Candidate Passport
class PassportVersion(BaseModel):
    version: str # V1 Resume Analysis, V2 Recruiter Review, etc.
    timestamp: str
    author: str
    summary: str
    status: str

class CandidateIntelligencePassport(BaseModel):
    candidate_id: str
    candidate_name: str
    applied_role: str
    current_version: str = "V1 Resume Analysis"
    versions: List[PassportVersion] = []
    overall_match: float
    required_coverage: float
    preferred_coverage: float
    evidence_strength: float
    core_evidence: Dict[str, str] # e.g. {"Python": "Strong", "FastAPI": "Strong"}
    talent_lens_summary: str
    team_complement_summary: str
    interview_focus: List[str]
    notes: List[Dict[str, str]] = []

# Candidate Summary in Ranking
class RankedCandidate(BaseModel):
    id: str
    name: str
    email: str
    current_title: str
    current_company: Optional[str] = None
    rank: int
    previous_rank: Optional[int] = None
    rank_delta: int = 0 # e.g. +5 or -2
    overall_match: float
    required_coverage: float
    preferred_coverage: float
    evidence_strength: float
    required_ratio: str # e.g. "4/4"
    preferred_ratio: str # e.g. "2/5"
    major_gap: Optional[str] = None
    has_talent_lens_alert: bool = False
    talent_lens_badge: Optional[str] = None # "Hidden Core Strength", "Concentrated Gap"
    profile_archetype: str = "BALANCED" # SPECIALIST_LIKE or BALANCED
    resume_language: str = "en"
    years_of_experience: float = 4.0

class RankingAuditEntry(BaseModel):
    id: str
    timestamp: str
    action: str
    old_config: Dict[str, Any]
    new_config: Dict[str, Any]
    affected_rankings: List[Dict[str, Any]]
    reason: str

# What-If Simulation
class PrioritySimulationRequest(BaseModel):
    weights: ScoringWeights
    requirement_overrides: Optional[Dict[str, Dict[str, str]]] = None # {skill_id: {category: "REQUIRED", priority: "Critical"}}

class SkillScenarioRequest(BaseModel):
    candidate_id: str
    skill_name: str
    simulated_evidence_strength: float # e.g. 75.0

class InterviewQuestion(BaseModel):
    id: str
    priority: str # High-Priority Verification, Medium-Priority Verification, Project Deep Dive, Technical, Behavioral
    skill_target: str
    question: str
    follow_up: str
    why_ask_this: str
    evidence_context: str

class InterviewPlan(BaseModel):
    candidate_id: str
    candidate_name: str
    job_title: str
    high_priority_verification: List[InterviewQuestion]
    medium_priority_verification: List[InterviewQuestion]
    project_deep_dives: List[InterviewQuestion]
    technical_challenges: List[InterviewQuestion]
    behavioral_evidence: List[InterviewQuestion]
    low_priority_to_reverify: List[Dict[str, str]] # e.g. [{"skill": "Python", "reason": "Already supported by 3 high-confidence production projects"}]
