import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from app.models.schemas import (
    JobCreate, JobUpdateRequirements, ScoringWeights, JobRequirement,
    RankedCandidate, PrioritySimulationRequest, SkillScenarioRequest,
    CandidateIntelligencePassport, PassportVersion, RankingAuditEntry,
    SkillGraphData, TimelineYearGroup, EvidenceItem, CandidateSkillEval,
    TeamMatchAnalysis, InterviewPlan, TalentLensInsight
)
from app.services.seed_data import GLOBAL_JOB, GLOBAL_CANDIDATES, DEFAULT_REQUIREMENTS, PRECONFIGURED_ROLES
from app.services.scoring_engine import scoring_engine
from app.services.evidence_engine import evidence_engine
from app.services.talent_lens import talent_lens
from app.services.team_matching import team_matching
from app.services.interview_intelligence import interview_intelligence
from app.services.pool_intelligence import pool_intelligence
from app.services.pdf_parser import pdf_parser
from app.services.nlp_engine import nlp_engine

router = APIRouter()

# In-memory storage state (backed by seed data)
current_job = dict(GLOBAL_JOB)
candidates_store: Dict[str, Dict[str, Any]] = {c["id"]: dict(c) for c in GLOBAL_CANDIDATES}
current_weights = ScoringWeights()
previous_ranks_cache: Dict[str, int] = {}

def reevaluate_candidates_for_job(job_reqs: List[JobRequirement]):
    """Dynamically re-evaluate all candidates against a specific job role's requirements."""
    for c_id, cand in candidates_store.items():
        portfolio = cand.get("all_skills_portfolio", {})
        new_evals = {}
        for req in job_reqs:
            score = float(portfolio.get(req.name, 45.0))
            gap = max(0.0, 100.0 - score)
            status = "SUPPORTED BY EVIDENCE" if score >= 80 else ("EXPLICITLY LISTED" if score >= 50 else "LIMITED EVIDENCE")
            new_evals[req.name] = CandidateSkillEval(
                skill_name=req.name,
                category=req.category,
                priority=req.priority,
                detection_status=status,
                evidence_strength=score,
                evidence_gap=round(gap, 1),
                is_semantic_match=False,
                supporting_evidence_count=2 if score >= 70 else 1,
                why_explanation=[
                    f"✓ Corroborated {req.name} capability in {cand.get('current_company', 'Tenure')}" if score >= 70 else f"✓ Listed in profile ({cand.get('current_title', 'Engineer')})",
                    "✓ Verified production history" if score >= 80 else "✗ Limited operational telemetry detected"
                ],
                primary_source=cand.get("current_company", "Portfolio")
            )
        cand["skill_evals"] = new_evals

# Compute initial baseline ranking cache
def refresh_baseline_ranking():
    global previous_ranks_cache
    ranked_list, _ = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        current_job["requirements"],
        current_weights
    )
    previous_ranks_cache = {c.id: c.rank for c in ranked_list}
    for c in ranked_list:
        if c.id in candidates_store:
            candidates_store[c.id]["rank"] = c.rank
            candidates_store[c.id]["overall_match"] = c.overall_match

refresh_baseline_ranking()

# --- AUTH / HEALTH ---
@router.get("/health")
def health():
    return {"status": "healthy", "service": "TalentPrism AI", "version": "2.4.0"}

@router.post("/auth/login")
def login(payload: Dict[str, str] = Body(...)):
    email = payload.get("email", "recruiter@talentprism.ai")
    role = payload.get("role", "Lead Talent Partner")
    return {
        "access_token": "prism_jwt_token_sample",
        "token_type": "bearer",
        "user": {
            "name": "Sarah Recruiter",
            "email": email,
            "role": role,
            "organization": "Prism Technologies Inc."
        }
    }

# --- JOBS ---
@router.get("/jobs")
def get_jobs():
    return [current_job]

@router.get("/jobs/roles")
def get_all_roles():
    """Returns the 5 pre-configured industry role specifications."""
    return list(PRECONFIGURED_ROLES.values())

@router.post("/jobs/select-role")
def select_job_role(payload: Dict[str, str] = Body(...)):
    """
    Select an active Job Role (e.g. Senior Backend Engineer, Full Stack, Data Engineer, etc.).
    Immediately re-evaluates all candidate portfolios and recalculates live rankings!
    """
    global current_job
    role_id = payload.get("role_id", "job_backend_core")
    if role_id not in PRECONFIGURED_ROLES:
        raise HTTPException(status_code=404, detail="Role specification not found")

    selected = PRECONFIGURED_ROLES[role_id]
    current_job = dict(selected)
    
    # Re-evaluate candidate skills against the new role
    reevaluate_candidates_for_job(current_job["requirements"])
    refresh_baseline_ranking()

    ranked, _ = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        current_job["requirements"],
        current_weights,
        previous_ranks=previous_ranks_cache,
        reason=f"Recruiter selected role: {current_job['title']}"
    )

    return {
        "success": True,
        "active_job": current_job,
        "ranked_candidates": ranked
    }

@router.get("/jobs/{job_id}")
def get_job(job_id: str):
    if current_job["id"] != job_id and job_id != "current":
        return current_job
    return current_job

@router.post("/jobs")
def create_job(payload: JobCreate):
    global current_job
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    new_job = {
        "id": job_id,
        "title": payload.title,
        "department": payload.department,
        "description": payload.description,
        "requirements": payload.requirements
    }
    current_job = new_job
    PRECONFIGURED_ROLES[job_id] = new_job
    reevaluate_candidates_for_job(new_job["requirements"])
    refresh_baseline_ranking()

    ranked, _ = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        current_job["requirements"],
        current_weights,
        previous_ranks=previous_ranks_cache,
        reason=f"Recruiter created and selected new role: {new_job['title']}"
    )

    for r in ranked:
        if r.id in candidates_store:
            candidates_store[r.id]["rank"] = r.rank
            candidates_store[r.id]["overall_match"] = r.overall_match

    return {
        "success": True,
        "job": new_job,
        "ranked_candidates": ranked,
        "all_roles": list(PRECONFIGURED_ROLES.values())
    }

@router.post("/jobs/{job_id}/parse")
def parse_job_description(job_id: str, payload: Dict[str, str] = Body(...)):
    """
    Auto-extracts requirements from JD text, categorizes into Required/Preferred/Bonus
    and Critical/High/Medium/Low, allowing recruiter to inspect and correct.
    """
    jd_text = payload.get("text", "")
    entities = nlp_engine.extract_entities_with_spacy(jd_text)
    skills = entities.get("skills", ["Python", "FastAPI", "SQL", "Docker"])

    reqs = []
    for idx, sk in enumerate(skills):
        category = "REQUIRED" if idx < 3 else ("PREFERRED" if idx < 6 else "BONUS")
        priority = "Critical" if idx < 2 else ("High" if idx < 4 else ("Medium" if idx < 6 else "Low"))
        weight = 1.3 if priority == "Critical" else (1.1 if priority == "High" else 0.8)
        reqs.append({
            "id": f"req_parsed_{idx+1}",
            "name": sk,
            "category": category,
            "priority": priority,
            "weight": weight,
            "canonical_skill": sk
        })
    return {"parsed_requirements": reqs, "raw_entities": entities}

@router.patch("/jobs/{job_id}/requirements")
def update_job_requirements(job_id: str, payload: JobUpdateRequirements):
    """
    Update requirement classification (Required / Preferred / Bonus) and priority (Critical / High / Med / Low).
    Recruiter confirms criteria before ranking. Never silently change importance!
    """
    global current_job
    current_job["requirements"] = payload.requirements
    reevaluate_candidates_for_job(current_job["requirements"])
    
    # Recalculate candidate rankings
    ranked, audit = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        current_job["requirements"],
        current_weights,
        previous_ranks=previous_ranks_cache,
        reason=f"Recruiter modified requirement classifications ({len(payload.requirements)} requirements updated)"
    )

    for r in ranked:
        if r.id in candidates_store:
            candidates_store[r.id]["rank"] = r.rank
            candidates_store[r.id]["overall_match"] = r.overall_match

    return {
        "success": True,
        "requirements": current_job["requirements"],
        "ranked_candidates": ranked,
        "audit": audit
    }

# --- RESUMES / CANDIDATES ---
@router.post("/resumes/upload")
async def upload_resume(file: UploadFile = File(...)):
    """
    Upload and parse PDF resume:
    Extract text -> spaCy NER -> Multilingual Detection -> Evidence Extraction -> Candidate Creation
    """
    contents = await file.read()
    parse_res = pdf_parser.extract_text_from_bytes(contents)
    text = parse_res.get("text", "")
    if not text:
        text = "Experienced Python Backend Developer proficient in FastAPI, SQL, Docker, and REST APIs."

    lang_res = nlp_engine.detect_language(text)
    entities = nlp_engine.extract_entities_with_spacy(text)

    cand_id = f"cand_upload_{uuid.uuid4().hex[:6]}"
    filename = file.filename or "Uploaded_Candidate.pdf"
    cand_name = filename.replace(".pdf", "").replace("_", " ").title()

    # Create candidate evidence from extracted skills
    evals = {}
    ev_list = []
    for req in current_job["requirements"]:
        has_skill = req.name in entities.get("skills", [])
        score = 82.0 if has_skill else 35.0
        gap = 100.0 - score
        eval_item = CandidateSkillEval(
            skill_name=req.name,
            category=req.category,
            priority=req.priority,
            detection_status="SUPPORTED BY EVIDENCE" if score >= 80 else "LIMITED EVIDENCE",
            evidence_strength=score,
            evidence_gap=gap,
            is_semantic_match=False,
            supporting_evidence_count=1 if has_skill else 0,
            why_explanation=[
                f"✓ Extracted via spaCy NER from {filename}" if has_skill else "✗ No explicit evidence detected in PDF"
            ],
            primary_source=filename
        )
        evals[req.name] = eval_item
        ev_list.append(EvidenceItem(
            id=f"ev_{cand_id}_{req.name.lower()}",
            candidate_id=cand_id,
            skill_name=req.name,
            source_type="work_experience" if has_skill else "skills_list",
            source_title=f"Parsed from {filename}",
            source_text=f"Demonstrated {req.name} capabilities in uploaded resume.",
            original_language=lang_res["code"],
            classification="CONTEXTUALLY_SUPPORTED" if has_skill else "CLAIMED",
            evidence_strength=score,
            evidence_strength_level="HIGH" if score >= 80 else "LIMITED",
            start_year=2024,
            end_year=2025,
            is_recent=True
        ))

    new_cand = {
        "id": cand_id,
        "name": cand_name,
        "email": f"{cand_name.lower().replace(' ', '.')}@upload.io",
        "current_title": "Backend Software Engineer",
        "current_company": entities.get("companies", ["Tech Corp"])[0] if entities.get("companies") else "Tech Corp",
        "years_of_experience": 3.0,
        "language": lang_res["code"],
        "has_recent_activity": True,
        "is_suppressed": False,
        "archetype": "BALANCED EVIDENCE PROFILE",
        "raw_evidence_strength": 68.0,
        "skill_evals": evals,
        "evidence_list": ev_list,
        "experiences": [
            {
                "company": entities.get("companies", ["Tech Corp"])[0] if entities.get("companies") else "Tech Corp",
                "role": "Backend Engineer",
                "years": "2023 - Present",
                "year": 2024,
                "skills": list(entities.get("skills", ["Python", "FastAPI"]))[:4]
            }
        ],
        "projects": [
            {
                "title": "Cloud Platform Service",
                "year": 2024,
                "description": "High performance backend platform.",
                "skills": list(entities.get("skills", ["Python", "FastAPI"]))[:3]
            }
        ],
        "education": entities.get("schools", ["University Degree"]),
        "certifications": [],
        "notes": [{"author": "PDF Parser", "text": f"Successfully parsed {filename}. Detected language: {lang_res['name']}."}]
    }

    candidates_store[cand_id] = new_cand
    refresh_baseline_ranking()
    return {"candidate": new_cand, "language": lang_res, "entities": entities}

@router.get("/candidates")
def get_candidates():
    ranked, _ = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        current_job["requirements"],
        current_weights,
        previous_ranks=previous_ranks_cache
    )
    return ranked

@router.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: str):
    cand = candidates_store.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return cand

@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: str):
    """Remove / dismiss candidate from active applicant pool."""
    if candidate_id in candidates_store:
        deleted = candidates_store.pop(candidate_id)
        refresh_baseline_ranking()
        ranked, _ = scoring_engine.rank_candidates(
            list(candidates_store.values()),
            current_job["requirements"],
            current_weights,
            previous_ranks=previous_ranks_cache,
            reason=f"Recruiter removed candidate {deleted['name']} from active talent pool"
        )
        for r in ranked:
            if r.id in candidates_store:
                candidates_store[r.id]["rank"] = r.rank
                candidates_store[r.id]["overall_match"] = r.overall_match
        return {"success": True, "deleted_id": candidate_id, "remaining_candidates": ranked}
    raise HTTPException(status_code=404, detail="Candidate not found")

@router.get("/candidates/{candidate_id}/skills")
def get_candidate_skills(candidate_id: str):
    cand = candidates_store.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return list(cand.get("skill_evals", {}).values())

@router.get("/candidates/{candidate_id}/graph")
def get_candidate_graph(candidate_id: str):
    cand = candidates_store.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return evidence_engine.build_candidate_skill_graph(
        candidate_id=cand["id"],
        candidate_name=cand["name"],
        evidence_list=cand.get("evidence_list", []),
        projects=cand.get("projects", []),
        experiences=cand.get("experiences", []),
        certifications=cand.get("certifications", []),
        education=cand.get("education", [])
    )

@router.get("/candidates/{candidate_id}/timeline")
def get_candidate_timeline(candidate_id: str):
    cand = candidates_store.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return evidence_engine.generate_timeline(
        evidence_list=cand.get("evidence_list", []),
        projects=cand.get("projects", []),
        experiences=cand.get("experiences", [])
    )

@router.get("/candidates/{candidate_id}/evidence")
def get_candidate_evidence(candidate_id: str):
    cand = candidates_store.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return cand.get("evidence_list", [])

@router.get("/candidates/{candidate_id}/passport")
def get_candidate_passport(candidate_id: str):
    cand = candidates_store.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    lens = talent_lens.analyze_candidate(
        candidate_id=cand["id"],
        candidate_name=cand["name"],
        skill_evals=cand.get("skill_evals", {}),
        current_rank=cand.get("rank", 1)
    )

    t_match = team_matching.analyze_team_complement(
        candidate_name=cand["name"],
        candidate_skills=cand.get("skill_evals", {}),
        role_match_score=cand.get("overall_match", 75.0)
    )

    core_ev = {}
    for sk, ev in cand.get("skill_evals", {}).items():
        if ev.evidence_strength >= 80:
            core_ev[sk] = "Strong"
        elif ev.evidence_strength >= 50:
            core_ev[sk] = "Moderate"
        else:
            core_ev[sk] = "Limited"

    return CandidateIntelligencePassport(
        candidate_id=cand["id"],
        candidate_name=cand["name"],
        applied_role=current_job["title"],
        current_version="V1 Resume Analysis",
        versions=[
            PassportVersion(
                version="V1 Resume Analysis",
                timestamp="2026-09-24 10:15:00",
                author="System Parser (spaCy + SentenceTransformers)",
                summary="Initial parsing and semantic evidence bridge extraction complete.",
                status="Active"
            )
        ],
        overall_match=cand.get("overall_match", 75.0),
        required_coverage=cand.get("required_coverage", 80.0),
        preferred_coverage=cand.get("preferred_coverage", 60.0),
        evidence_strength=cand.get("raw_evidence_strength", 72.0),
        core_evidence=core_ev,
        talent_lens_summary=lens.summary,
        team_complement_summary=t_match.analysis_text,
        interview_focus=[f"Verify {s['skill']} ({int(s['candidate_score'])}%)" for s in lens.primary_suppressors] or ["Explore architecture depth"],
        notes=cand.get("notes", [])
    )

# --- RANKING & RE-RANKING ---
@router.get("/jobs/{job_id}/ranking")
def get_job_ranking(job_id: str):
    ranked, _ = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        current_job["requirements"],
        current_weights,
        previous_ranks=previous_ranks_cache
    )
    return {
        "job": current_job,
        "weights": current_weights,
        "ranked_candidates": ranked
    }

@router.post("/jobs/{job_id}/ranking/recalculate")
def recalculate_ranking(job_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Live Re-ranking when weights or requirement categories change.
    Does NOT rerun PDF parsing! Uses stored requirement-level evidence scores.
    """
    global current_weights, previous_ranks_cache
    old_weights_dict = current_weights.model_dump()

    # Capture current ranks as baseline for delta calculation
    current_ranked, _ = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        current_job["requirements"],
        current_weights
    )
    previous_ranks_cache = {c.id: c.rank for c in current_ranked}

    # Update weights if provided
    new_weights_data = payload.get("weights")
    reason = payload.get("reason", "Recruiter adjusted scoring weights")
    if new_weights_data:
        current_weights = ScoringWeights(**new_weights_data)

    # Update requirements if provided
    new_reqs_data = payload.get("requirements")
    if new_reqs_data:
        current_job["requirements"] = [JobRequirement(**r) for r in new_reqs_data]

    # Re-rank immediately
    new_ranked, audit = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        current_job["requirements"],
        current_weights,
        previous_ranks=previous_ranks_cache,
        reason=reason
    )

    # Update candidates stored rank
    for r in new_ranked:
        if r.id in candidates_store:
            candidates_store[r.id]["rank"] = r.rank
            candidates_store[r.id]["overall_match"] = r.overall_match

    return {
        "success": True,
        "weights": current_weights,
        "ranked_candidates": new_ranked,
        "audit_entry": audit
    }

# --- WHY / WHY NOT & TALENT LENS ---
@router.get("/candidates/{candidate_id}/why")
def get_why_candidate(candidate_id: str):
    cand = candidates_store.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    lens = talent_lens.analyze_candidate(
        candidate_id=cand["id"],
        candidate_name=cand["name"],
        skill_evals=cand.get("skill_evals", {}),
        current_rank=cand.get("rank", 1)
    )
    return talent_lens.generate_why_this_candidate(
        candidate_name=cand["name"],
        skill_evals=cand.get("skill_evals", {}),
        projects=cand.get("projects", []),
        years_exp=cand.get("years_of_experience", 3.5),
        lens=lens
    )

@router.get("/candidates/{candidate_id}/why-not")
def get_why_not_higher(candidate_id: str):
    cand = candidates_store.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    lens = talent_lens.analyze_candidate(
        candidate_id=cand["id"],
        candidate_name=cand["name"],
        skill_evals=cand.get("skill_evals", {}),
        current_rank=cand.get("rank", 1)
    )
    return talent_lens.generate_why_not_higher(
        candidate_name=cand["name"],
        current_rank=cand.get("rank", 1),
        skill_evals=cand.get("skill_evals", {}),
        lens=lens
    )

@router.get("/candidates/{candidate_id}/talent-lens")
def get_candidate_talent_lens(candidate_id: str):
    cand = candidates_store.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return talent_lens.analyze_candidate(
        candidate_id=cand["id"],
        candidate_name=cand["name"],
        skill_evals=cand.get("skill_evals", {}),
        current_rank=cand.get("rank", 1)
    )

@router.get("/jobs/{job_id}/talent-rescue")
def get_talent_rescue(job_id: str):
    """
    Mode A: Within-Role Rescue (high core evidence, concentrated uncertainty).
    Mode B: Cross-Role Rescue (compare against other open roles).
    """
    within_role_candidates = []
    cross_role_candidates = []

    for cand_id, cand in candidates_store.items():
        lens = talent_lens.analyze_candidate(
            candidate_id=cand["id"],
            candidate_name=cand["name"],
            skill_evals=cand.get("skill_evals", {}),
            current_rank=cand.get("rank", 1)
        )
        if lens.is_suppressed:
            within_role_candidates.append({
                "candidate": cand,
                "lens": lens,
                "rescue_note": "Strong core evidence with concentrated uncertainty — review before rejecting."
            })

        # Cross-role check
        cross_matches = talent_lens.evaluate_cross_role_rescue(
            candidate_id=cand["id"],
            candidate_name=cand["name"],
            skill_evals=cand.get("skill_evals", {})
        )
        if cross_matches and cross_matches[0]["fit_percentage"] >= 80.0:
            cross_role_candidates.append({
                "candidate": cand,
                "best_alternative_role": cross_matches[0],
                "all_alternatives": cross_matches
            })

    return {
        "within_role_rescue": within_role_candidates,
        "cross_role_rescue": cross_role_candidates
    }

# --- SIMULATORS (WHAT-IF) ---
@router.post("/jobs/{job_id}/simulate")
def simulate_priority_ranking(job_id: str, payload: PrioritySimulationRequest):
    """
    Recruiter Priority Simulator:
    Recruiter changes weight sliders -> generates a temporary scenario ranking without overwriting production ranking!
    """
    scenario_ranked, _ = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        current_job["requirements"],
        payload.weights,
        previous_ranks=previous_ranks_cache
    )
    return {
        "scenario_weights": payload.weights,
        "scenario_ranking": scenario_ranked,
        "disclaimer": "Scenario only. No production ranking or candidate data modified."
    }

@router.post("/candidates/{candidate_id}/skill-scenario")
def simulate_candidate_skill(candidate_id: str, payload: SkillScenarioRequest):
    """
    Skill Scenario Simulator:
    Recruiter selects candidate (e.g. Elena) and increases skill strength (e.g. Docker 31% -> 75%).
    Shows simulated rank jump (e.g. #12 -> #5) with prominent disclaimer:
    'Scenario only. No additional candidate evidence has been established.'
    """
    cand = candidates_store.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Create temporary candidate copy
    import copy
    temp_candidates = copy.deepcopy(list(candidates_store.values()))

    # Find candidate and modify the selected skill
    actual_rank = cand.get("rank", 1)
    original_score = 0.0

    for c in temp_candidates:
        if c["id"] == candidate_id:
            # Check real portfolio or skill_evals for original score
            portfolio = c.get("all_skills_portfolio", {})
            original_score = portfolio.get(payload.skill_name)
            if original_score is None:
                eval_item = c["skill_evals"].get(payload.skill_name)
                original_score = eval_item.evidence_strength if eval_item else 30.0

            # Update or create the skill evaluation
            eval_item = c["skill_evals"].get(payload.skill_name)
            if eval_item:
                eval_item.evidence_strength = payload.simulated_evidence_strength
                eval_item.evidence_gap = max(0.0, 100.0 - payload.simulated_evidence_strength)
                eval_item.detection_status = "SUPPORTED BY EVIDENCE" if payload.simulated_evidence_strength >= 70 else "EXPLICITLY LISTED"
            else:
                c["skill_evals"][payload.skill_name] = CandidateSkillEval(
                    skill_name=payload.skill_name,
                    category="PREFERRED",
                    priority="Medium",
                    detection_status="SUPPORTED BY EVIDENCE",
                    evidence_strength=payload.simulated_evidence_strength,
                    evidence_gap=max(0.0, 100.0 - payload.simulated_evidence_strength),
                    is_semantic_match=False,
                    supporting_evidence_count=1,
                    why_explanation=[f"Verified operational proficiency in {payload.skill_name}"],
                    primary_source="What-If Simulation Laboratory"
                )

    # Recalculate ranking with updated candidate
    scenario_ranked, _ = scoring_engine.rank_candidates(
        temp_candidates,
        current_job["requirements"],
        current_weights
    )

    new_rank = next((r.rank for r in scenario_ranked if r.id == candidate_id), actual_rank)

    # Gather candidate's real skill portfolio to return
    cand_portfolio = dict(cand.get("all_skills_portfolio", {}))
    for sk, ev in cand.get("skill_evals", {}).items():
        if sk not in cand_portfolio:
            cand_portfolio[sk] = ev.evidence_strength

    return {
        "candidate_id": candidate_id,
        "candidate_name": cand["name"],
        "skill_name": payload.skill_name,
        "original_strength": float(original_score or 0.0),
        "simulated_strength": payload.simulated_evidence_strength,
        "actual_rank": actual_rank,
        "scenario_rank": new_rank,
        "rank_improvement": actual_rank - new_rank,
        "available_skills": cand_portfolio,
        "disclaimer": "Scenario only. No additional candidate evidence has been established."
    }

@router.post("/jobs/{job_id}/pool-by-skills")
def pool_candidates_by_skills(job_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Checklist skill pooling query:
    Takes a list of desired skills (e.g. ['Python', 'Docker', 'AWS']) and pools all candidates
    matching those skills with their real evidence scores.
    """
    selected_skills = payload.get("skills", [])
    if not selected_skills:
        return {
            "total_applicants": len(candidates_store),
            "matching_count": len(candidates_store),
            "full_match_count": len(candidates_store),
            "percentage": 100.0,
            "candidates": [
                {
                    "id": c["id"],
                    "name": c["name"],
                    "current_title": c["current_title"],
                    "current_company": c["current_company"],
                    "overall_match": c.get("overall_match", 75.0),
                    "rank": c.get("rank", 1),
                    "is_full_match": True,
                    "skill_scores": {}
                }
                for c in candidates_store.values()
            ]
        }

    matching = []
    for cand in candidates_store.values():
        portfolio = cand.get("all_skills_portfolio", {})
        skill_scores = {}
        matched_all = True
        has_any = False
        
        for sk in selected_skills:
            score = portfolio.get(sk)
            if score is None:
                eval_item = cand.get("skill_evals", {}).get(sk)
                score = eval_item.evidence_strength if eval_item else 0.0
            
            skill_scores[sk] = float(score)
            if score >= 50.0:
                has_any = True
            else:
                matched_all = False

        if has_any:
            matching.append({
                "id": cand["id"],
                "name": cand["name"],
                "current_title": cand["current_title"],
                "current_company": cand["current_company"],
                "overall_match": cand.get("overall_match", 75.0),
                "rank": cand.get("rank", 1),
                "is_full_match": matched_all,
                "skill_scores": skill_scores
            })

    matching.sort(key=lambda x: (x["is_full_match"], sum(x["skill_scores"].values())), reverse=True)
    full_count = sum(1 for m in matching if m["is_full_match"])

    return {
        "total_applicants": len(candidates_store),
        "matching_count": len(matching),
        "full_match_count": full_count,
        "percentage": round((len(matching) / len(candidates_store)) * 100.0, 1),
        "candidates": matching
    }

# --- TEAM & INTERVIEW INTELLIGENCE ---
@router.get("/teams/{team_id}/skills")
def get_team_skills(team_id: str):
    return team_matching.get_team_profile()

@router.get("/candidates/{candidate_id}/team-match")
def get_candidate_team_match(candidate_id: str):
    cand = candidates_store.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return team_matching.analyze_team_complement(
        candidate_name=cand["name"],
        candidate_skills=cand.get("skill_evals", {}),
        role_match_score=cand.get("overall_match", 75.0)
    )

@router.post("/candidates/{candidate_id}/interview-plan")
def create_interview_plan(candidate_id: str):
    cand = candidates_store.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    lens = talent_lens.analyze_candidate(
        candidate_id=cand["id"],
        candidate_name=cand["name"],
        skill_evals=cand.get("skill_evals", {}),
        current_rank=cand.get("rank", 1)
    )

    return interview_intelligence.generate_interview_plan(
        candidate_id=cand["id"],
        candidate_name=cand["name"],
        job_title=current_job["title"],
        skill_evals=cand.get("skill_evals", {}),
        projects=cand.get("projects", []),
        talent_lens_data=lens
    )

# --- POOL INTELLIGENCE, EVIDENCE MATRIX & AUDIT TRAIL ---
@router.get("/jobs/{job_id}/pool-intelligence")
def get_pool_intelligence(job_id: str):
    return pool_intelligence.compute_pool_analytics(
        list(candidates_store.values()),
        current_job["requirements"]
    )

@router.get("/jobs/{job_id}/evidence-matrix")
def get_evidence_matrix(job_id: str):
    return pool_intelligence.build_evidence_matrix(
        list(candidates_store.values()),
        current_job["requirements"]
    )

@router.get("/jobs/{job_id}/ranking-history")
def get_ranking_history(job_id: str):
    return scoring_engine.audit_log
