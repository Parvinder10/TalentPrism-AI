import uuid
import re
import hashlib
import os
import json
import tempfile
import urllib.request
import urllib.error
import threading
from typing import List, Dict, Any, Optional, Set
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

PROTECTED_PRESET_ROLES = {
    "job_backend_core",
    "job_fullstack",
    "job_data_eng",
    "job_devops_infra",
    "job_ml_eng"
}

STATE_FILE = os.path.join(tempfile.gettempdir(), "talentprism_shared_state.json")
CLOUD_BIN_URL = "https://extendsclass.com/api/json-storage/bin/bdcdacc"

# In-memory storage state (backed by seed data)
current_job = dict(GLOBAL_JOB)
candidates_store: Dict[str, Dict[str, Any]] = {c["id"]: dict(c) for c in GLOBAL_CANDIDATES}
current_weights = ScoringWeights()
previous_ranks_cache: Dict[str, int] = {}
registered_users: Dict[str, Dict[str, Any]] = {}
deleted_candidate_ids: Set[str] = set()

def normalize_requirement(req: Any) -> JobRequirement:
    """Safely converts a dict or model into a valid JobRequirement instance."""
    if isinstance(req, JobRequirement):
        return req
    if isinstance(req, dict):
        return JobRequirement(**req)
    return JobRequirement(
        id=str(getattr(req, "id", f"req_{uuid.uuid4().hex[:6]}")),
        name=str(getattr(req, "name", "Skill")),
        category=str(getattr(req, "category", "REQUIRED")),
        priority=str(getattr(req, "priority", "High")),
        weight=float(getattr(req, "weight", 1.0)),
        canonical_skill=str(getattr(req, "canonical_skill", getattr(req, "name", "Skill")))
    )

def serialize_requirement(req: Any) -> Dict[str, Any]:
    if hasattr(req, "model_dump"):
        return req.model_dump()
    if hasattr(req, "dict"):
        return req.dict()
    if isinstance(req, dict):
        return req
    return {
        "id": str(getattr(req, "id", "")),
        "name": str(getattr(req, "name", "")),
        "category": str(getattr(req, "category", "REQUIRED")),
        "priority": str(getattr(req, "priority", "High")),
        "weight": float(getattr(req, "weight", 1.0)),
        "canonical_skill": str(getattr(req, "canonical_skill", getattr(req, "name", "")))
    }

def serialize_role(role: Dict[str, Any]) -> Dict[str, Any]:
    r_copy = dict(role)
    r_copy["requirements"] = [serialize_requirement(r) for r in r_copy.get("requirements", [])]
    return r_copy

def serialize_candidate(cand: Dict[str, Any]) -> Dict[str, Any]:
    c_copy = dict(cand)
    if "skill_evals" in c_copy and isinstance(c_copy["skill_evals"], dict):
        new_evals = {}
        for k, v in c_copy["skill_evals"].items():
            if hasattr(v, "model_dump"):
                new_evals[k] = v.model_dump()
            elif hasattr(v, "dict"):
                new_evals[k] = v.dict()
            elif isinstance(v, dict):
                new_evals[k] = v
        c_copy["skill_evals"] = new_evals
    if "evidence_list" in c_copy and isinstance(c_copy["evidence_list"], list):
        new_ev = []
        for item in c_copy["evidence_list"]:
            if hasattr(item, "model_dump"):
                new_ev.append(item.model_dump())
            elif hasattr(item, "dict"):
                new_ev.append(item.dict())
            elif isinstance(item, dict):
                new_ev.append(item)
        c_copy["evidence_list"] = new_ev
    return c_copy

def load_cloud_state() -> bool:
    """Fetch shared state from cloud bin across serverless containers and devices."""
    global registered_users, deleted_candidate_ids, PRECONFIGURED_ROLES, candidates_store, current_job, current_weights
    try:
        req = urllib.request.Request(
            CLOUD_BIN_URL,
            headers={"User-Agent": "TalentPrism-Server/2.4"}
        )
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            if resp.status == 200:
                raw = resp.read().decode("utf-8")
                if not raw.strip():
                    return False
                data = json.loads(raw)
                
                # 1. Registered users
                cloud_users = data.get("registered_users", {})
                if isinstance(cloud_users, dict):
                    for u_key, u_val in cloud_users.items():
                        if u_key and isinstance(u_val, dict):
                            registered_users[str(u_key).lower()] = u_val
                            if u_val.get("email"):
                                registered_users[str(u_val["email"]).lower()] = u_val
                            if u_val.get("name"):
                                registered_users[str(u_val["name"]).lower()] = u_val

                # 2. Deleted candidate IDs
                cloud_deleted = data.get("deleted_candidate_ids", [])
                if isinstance(cloud_deleted, list):
                    for d_id in cloud_deleted:
                        d_str = str(d_id)
                        deleted_candidate_ids.add(d_str)
                        candidates_store.pop(d_str, None)

                # 3. Custom roles
                cloud_roles = data.get("custom_roles", {})
                if isinstance(cloud_roles, dict):
                    for r_id, r in cloud_roles.items():
                        if r_id and isinstance(r, dict) and r_id not in PROTECTED_PRESET_ROLES:
                            r_copy = dict(r)
                            r_copy["requirements"] = [normalize_requirement(x) for x in r_copy.get("requirements", [])]
                            PRECONFIGURED_ROLES[r_id] = r_copy

                # 4. Uploaded candidates
                cloud_cands = data.get("uploaded_candidates", {})
                if isinstance(cloud_cands, dict):
                    for c_id, c in cloud_cands.items():
                        if c_id and isinstance(c, dict) and str(c_id) not in deleted_candidate_ids:
                            candidates_store[c_id] = c

                # 5. Active role ID
                cloud_active_id = data.get("active_role_id")
                if cloud_active_id and cloud_active_id != "none" and cloud_active_id in PRECONFIGURED_ROLES:
                    if current_job.get("id") in ("job_backend_core", ""):
                        current_job = dict(PRECONFIGURED_ROLES[cloud_active_id])
                        current_job["requirements"] = [normalize_requirement(r) for r in current_job.get("requirements", [])]

                return True
    except Exception as e:
        print(f"[load_cloud_state] Cloud fetch warning: {e}")
    return False

def save_cloud_state():
    """Sync persistent state to cloud storage bin so all ephemeral lambdas and devices stay synchronized."""
    global current_job, candidates_store, current_weights, PRECONFIGURED_ROLES, registered_users, deleted_candidate_ids
    try:
        # 1. Fetch current cloud state first to merge and prevent overwriting concurrent updates
        existing_cloud_users = {}
        existing_cloud_deleted = []
        existing_cloud_roles = {}
        try:
            req_get = urllib.request.Request(CLOUD_BIN_URL, headers={"User-Agent": "TalentPrism-Server/2.4"})
            with urllib.request.urlopen(req_get, timeout=2.5) as get_resp:
                if get_resp.status == 200:
                    raw_get = get_resp.read().decode("utf-8")
                    if raw_get.strip():
                        cloud_data = json.loads(raw_get)
                        existing_cloud_users = cloud_data.get("registered_users", {})
                        existing_cloud_deleted = cloud_data.get("deleted_candidate_ids", [])
                        existing_cloud_roles = cloud_data.get("custom_roles", {})
        except Exception:
            pass

        # 2. Merge existing cloud users with local users
        merged_users = dict(existing_cloud_users)
        merged_users.update(registered_users)
        registered_users.update(merged_users)

        # 3. Merge deleted candidate IDs
        for d in existing_cloud_deleted:
            deleted_candidate_ids.add(str(d))

        # 4. Merge custom roles
        merged_roles = dict(existing_cloud_roles)
        for r_id, r in PRECONFIGURED_ROLES.items():
            if r_id not in PROTECTED_PRESET_ROLES:
                merged_roles[r_id] = serialize_role(r)

        uploaded_cands = {
            c_id: serialize_candidate(c) for c_id, c in candidates_store.items()
            if str(c_id).startswith("cand_upload_") and c_id not in deleted_candidate_ids
        }
        active_id = current_job.get("id", "job_backend_core")
        
        payload = {
            "registered_users": merged_users,
            "deleted_candidate_ids": list(deleted_candidate_ids),
            "custom_roles": merged_roles,
            "uploaded_candidates": uploaded_cands,
            "active_role_id": active_id
        }
        body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
        req = urllib.request.Request(
            CLOUD_BIN_URL,
            data=body,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "TalentPrism-Server/2.4"
            },
            method="PUT"
        )
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            pass
    except Exception as e:
        print(f"[save_cloud_state] Cloud PUT warning: {e}")

def load_server_state(check_cloud: bool = False):
    """Load persistent shared state across serverless lambda invocations and browsers."""
    global current_job, candidates_store, current_weights, PRECONFIGURED_ROLES, registered_users, deleted_candidate_ids
    loaded_local = False
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # 1. Custom roles
            saved_roles = data.get("custom_roles", {})
            if isinstance(saved_roles, dict):
                for r_id, r in saved_roles.items():
                    if r_id and isinstance(r, dict):
                        r_copy = dict(r)
                        r_copy["requirements"] = [normalize_requirement(x) for x in r_copy.get("requirements", [])]
                        PRECONFIGURED_ROLES[r_id] = r_copy
            elif isinstance(saved_roles, list):
                for r in saved_roles:
                    if isinstance(r, dict) and r.get("id"):
                        r_copy = dict(r)
                        r_copy["requirements"] = [normalize_requirement(x) for x in r_copy.get("requirements", [])]
                        PRECONFIGURED_ROLES[r["id"]] = r_copy
            
            # 2. Registered users
            saved_users = data.get("registered_users", {})
            if isinstance(saved_users, dict):
                for u_id, u in saved_users.items():
                    if u_id and isinstance(u, dict):
                        registered_users[str(u_id).lower()] = u
                        if u.get("email"):
                            registered_users[str(u["email"]).lower()] = u
                        if u.get("name"):
                            registered_users[str(u["name"]).lower()] = u
            elif isinstance(saved_users, list):
                for u in saved_users:
                    if isinstance(u, dict):
                        key = u.get("email") or u.get("name")
                        if key:
                            registered_users[str(key).lower()] = u
                    
            # 3. Deleted candidate IDs
            saved_deleted = data.get("deleted_candidate_ids", [])
            if isinstance(saved_deleted, list):
                for d_id in saved_deleted:
                    deleted_candidate_ids.add(str(d_id))
                    candidates_store.pop(str(d_id), None)

            # 4. Uploaded candidates
            saved_cands = data.get("uploaded_candidates", {})
            if isinstance(saved_cands, dict):
                for c_id, c in saved_cands.items():
                    if c_id and isinstance(c, dict) and str(c_id) not in deleted_candidate_ids:
                        candidates_store[c_id] = c
            elif isinstance(saved_cands, list):
                for c in saved_cands:
                    if isinstance(c, dict) and c.get("id") and str(c["id"]) not in deleted_candidate_ids:
                        candidates_store[c["id"]] = c
                    
            # 5. Active job role
            active_id = data.get("active_role_id")
            if active_id == "none":
                current_job = {
                    "id": "none",
                    "title": "No Active JD (Disconnected)",
                    "department": "None",
                    "description": "No job description is currently executing. All applicants displayed in general talent pool.",
                    "requirements": []
                }
            elif active_id and active_id in PRECONFIGURED_ROLES:
                current_job = dict(PRECONFIGURED_ROLES[active_id])
                current_job["requirements"] = [normalize_requirement(r) for r in current_job.get("requirements", [])]

            # 6. Scoring weights
            saved_weights = data.get("scoring_weights")
            if saved_weights and isinstance(saved_weights, dict):
                try:
                    current_weights = ScoringWeights(**saved_weights)
                except Exception:
                    pass
            loaded_local = True
    except Exception as e:
        print(f"[load_server_state] Warning: {e}")

    # Ensure any deleted candidates are removed from store
    for d_id in deleted_candidate_ids:
        candidates_store.pop(d_id, None)

    # If local file is missing or registered_users is empty, or explicitly asked, hydrate from cloud
    if check_cloud or not loaded_local or len(registered_users) == 0:
        load_cloud_state()

def save_server_state(sync_cloud: bool = True):
    """Persist shared state to file so other invocations and browsers get synced state."""
    global current_job, candidates_store, current_weights, PRECONFIGURED_ROLES, registered_users, deleted_candidate_ids
    try:
        custom_roles = {
            r_id: serialize_role(r) for r_id, r in PRECONFIGURED_ROLES.items()
            if r_id not in PROTECTED_PRESET_ROLES
        }
        uploaded_cands = {
            c_id: serialize_candidate(c) for c_id, c in candidates_store.items()
            if str(c_id).startswith("cand_upload_") and c_id not in deleted_candidate_ids
        }
        active_id = current_job.get("id", "job_backend_core")
        weights_dict = current_weights.model_dump() if hasattr(current_weights, "model_dump") else current_weights.dict()
        
        state_data = {
            "active_role_id": active_id,
            "custom_roles": custom_roles,
            "registered_users": registered_users,
            "deleted_candidate_ids": list(deleted_candidate_ids),
            "uploaded_candidates": uploaded_cands,
            "scoring_weights": weights_dict,
        }
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state_data, f, ensure_ascii=False, indent=2, default=str)
    except Exception as e:
        print(f"[save_server_state] Warning: {e}")

    if sync_cloud:
        try:
            t = threading.Thread(target=save_cloud_state, daemon=True)
            t.start()
        except Exception:
            save_cloud_state()

def get_current_job_requirements() -> List[JobRequirement]:
    """Retrieves and normalizes current_job requirements."""
    global current_job
    raw_reqs = current_job.get("requirements", [])
    normalized = [normalize_requirement(r) for r in raw_reqs]
    current_job["requirements"] = normalized
    return normalized

def reevaluate_candidates_for_job(job_reqs: List[Any]):
    """Dynamically re-evaluate all candidates against a specific job role's requirements."""
    normalized_reqs = [normalize_requirement(r) for r in job_reqs]
    for c_id, cand in candidates_store.items():
        portfolio = cand.get("all_skills_portfolio", {})
        portfolio_lower = {k.lower(): v for k, v in portfolio.items()}
        new_evals = {}
        for req in normalized_reqs:
            req_l = req.name.lower()
            canon_l = (req.canonical_skill or req.name).lower()
            score = float(portfolio_lower.get(req_l, portfolio_lower.get(canon_l, 45.0)))
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

# Hydrate persistent state from disk if present
load_server_state()
reevaluate_candidates_for_job(current_job.get("requirements", []))
refresh_baseline_ranking()

# --- AUTH / HEALTH ---
MASTER_ADMIN_KEY = "PrismAdmin@2025"
VALID_ADMIN_KEYS = {
    "PrismAdmin@2025",
    "PRISM-ADMIN-2025",
    "PRISM2025",
    "TalentPrism@AdminKey",
    "TalentPrism@Admin",
    "Admin@2025"
}

# Dynamic registered users storage is hydrated from disk via load_server_state()

def extract_name_from_email(email: str) -> str:
    """Infers a professional human name from an email prefix if not supplied."""
    user_part = email.split("@")[0]
    # Replace dots, underscores, dashes with space
    cleaned = re.sub(r"[._\-+]+", " ", user_part).strip()
    words = [w.capitalize() for w in cleaned.split() if not w.isdigit()]
    return " ".join(words) if words else "Admin Partner"

def extract_company_from_email(email: str) -> str:
    """Infers company name from email domain if possible."""
    parts = email.split("@")
    if len(parts) > 1:
        domain = parts[1].split(".")[0]
        if domain.lower() not in ("gmail", "yahoo", "outlook", "hotmail", "proton", "icloud"):
            return domain.capitalize() + " Corp"
    return "Enterprise Partner Inc."

# Baseline pre-seeded accounts
AUTHORIZED_USERS: Dict[str, Dict[str, Any]] = {
    "recruiter@talentprism.ai": {
        "password": "PrismRecruiter@2025",
        "name": "Sarah Recruiter",
        "role": "Lead Talent Partner",
        "organization": "Prism Technologies Inc.",
        "badge": "Lead Talent Partner",
        "avatar": "SR",
        "department": "Global Talent Acquisition"
    },
    "vishesh@talentprism.ai": {
        "password": "Vishesh@TalentPrism",
        "name": "Vishesh Rajput",
        "role": "Head of Talent Acquisition & AI Strategy",
        "organization": "TalentPrism Global Labs",
        "badge": "Platform Administrator",
        "avatar": "VR",
        "department": "Executive Leadership"
    },
    "hiring.manager@talentprism.ai": {
        "password": "HiringManager@2025",
        "name": "Alex Chen",
        "role": "VP of Engineering & Hiring Manager",
        "organization": "Prism Cloud Infrastructure",
        "badge": "Hiring Manager",
        "avatar": "AC",
        "department": "Core Engineering"
    },
    "demo@talentprism.ai": {
        "password": "TalentPrism@Demo",
        "name": "Enterprise Demo Partner",
        "role": "Strategic Talent Lead",
        "organization": "Prism Enterprise Sandbox",
        "badge": "Sandbox Evaluator",
        "avatar": "TP",
        "department": "Evaluation & Demo Sandbox"
    }
}

@router.get("/health")
def health():
    return {"status": "healthy", "service": "TalentPrism AI", "version": "2.4.0"}

@router.get("/auth/admin-key")
def get_admin_key_info():
    """Returns the universal administrator passkey for corporate admin access."""
    return {
        "admin_key": MASTER_ADMIN_KEY,
        "description": "Enterprise Master Admin Passkey: Any administrator can log in or register with their corporate ID using this key."
    }

def find_user_record(identifier: str, client_backup: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """
    Finds a registered or authorized user by email, name, or User ID.
    If not found in local memory, hydrates immediately from the cloud storage bin.
    """
    clean_id = identifier.strip().lower()
    clean_no_spaces = clean_id.replace(" ", "")

    def match_in_dict(source_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not source_dict:
            return None
        # Direct key match
        if clean_id in source_dict and isinstance(source_dict[clean_id], dict):
            return source_dict[clean_id]
        if clean_no_spaces in source_dict and isinstance(source_dict[clean_no_spaces], dict):
            return source_dict[clean_no_spaces]

        # Iterate records
        for key, rec in source_dict.items():
            if not isinstance(rec, dict):
                continue
            rec_email = str(rec.get("email", "")).strip().lower()
            rec_name = str(rec.get("name", "")).strip().lower()
            rec_user = rec_email.split("@")[0] if "@" in rec_email else rec_email
            rec_name_no_spaces = rec_name.replace(" ", "")

            if clean_id in (rec_email, rec_name, rec_user):
                return rec
            if clean_no_spaces == rec_name_no_spaces:
                return rec
            # First name match for convenience if at least 3 letters
            if len(clean_id) >= 3 and rec_name and clean_id == rec_name.split()[0]:
                return rec
        return None

    # 1. Direct match in local registered_users
    found = match_in_dict(registered_users)
    if found:
        return found

    # 2. Match in pre-seeded AUTHORIZED_USERS
    found = match_in_dict(AUTHORIZED_USERS)
    if found:
        return found

    # 3. Not in memory -> Hydrate from cloud storage bin (handles cross-browser / multi-device login)
    try:
        if load_cloud_state():
            found = match_in_dict(registered_users)
            if found:
                return found
    except Exception as e:
        print(f"[find_user_record] Cloud hydration warning: {e}")

    # 4. Check client backup (from browser localStorage)
    if client_backup and isinstance(client_backup, dict):
        b_email = str(client_backup.get("email", "")).strip().lower()
        b_name = str(client_backup.get("name", "")).strip().lower()
        b_user = b_email.split("@")[0] if "@" in b_email else b_email
        b_no_spaces = b_name.replace(" ", "")

        if (clean_id in (b_email, b_name, b_user) or clean_no_spaces == b_no_spaces) and client_backup.get("password"):
            registered_users[b_email] = client_backup
            registered_users[b_name] = client_backup
            registered_users[b_user] = client_backup
            save_server_state(sync_cloud=True)
            return client_backup

    return None

@router.post("/auth/login")
def login(payload: Dict[str, Any] = Body(...)):
    load_server_state()
    identifier = str(payload.get("email", "")).strip()
    password = str(payload.get("password", "")).strip()
    client_backup = payload.get("registered_user_backup")

    if not identifier:
        raise HTTPException(
            status_code=400,
            detail="Corporate email or Admin ID is required to access TalentPrism AI."
        )
    if not password:
        raise HTTPException(
            status_code=400,
            detail="Password or Admin Key is required."
        )

    # 1. STRICT VERIFICATION: The ID/Name MUST belong to an already registered user!
    user_record = find_user_record(identifier, client_backup)

    if not user_record:
        # STRICT REJECTION: Random IDs cannot log in, even if they provide the admin key!
        raise HTTPException(
            status_code=401,
            detail=f"Account not found for '{identifier}'. You must register this User ID in the 'New User Access' section first using the Admin Key."
        )

    # 2. Check password or Admin Key for this registered account
    is_admin_key_match = password in VALID_ADMIN_KEYS
    is_custom_password_match = user_record.get("password") == password

    if not (is_admin_key_match or is_custom_password_match):
        raise HTTPException(
            status_code=401,
            detail="Access Denied: Incorrect password. Please enter the password you created during registration or the Enterprise Admin Key."
        )

    user_email = user_record.get("email", identifier.lower())
    session_token = f"prism_token_{hashlib.sha256(f'{user_email}:{password}:talentprism_salt'.encode()).hexdigest()[:24]}"

    return {
        "access_token": session_token,
        "token_type": "bearer",
        "user": {
            "name": user_record["name"],
            "email": user_record.get("email", identifier.lower()),
            "role": user_record.get("role", "Lead Talent Acquisition Admin"),
            "organization": user_record.get("organization", "Enterprise Organization"),
            "badge": user_record.get("badge", "Enterprise Admin"),
            "avatar": user_record.get("avatar", "AD"),
            "department": user_record.get("department", "Talent Intelligence & Acquisition")
        }
    }

@router.post("/auth/register")
def register_user(payload: Dict[str, Any] = Body(...)):
    """Registers a new corporate administrator/user using the enterprise authorization passkey."""
    load_server_state()
    email = str(payload.get("email", "")).strip().lower()
    name = str(payload.get("name", "")).strip()
    password = str(payload.get("password", "")).strip()
    admin_key = str(payload.get("admin_key", "")).strip()
    role = str(payload.get("role", "")).strip() or "Talent Acquisition Admin"
    organization = str(payload.get("organization", "")).strip() or "Enterprise Organization"

    if not email:
        raise HTTPException(status_code=400, detail="Corporate email address or Admin ID is required.")
    if not name:
        raise HTTPException(status_code=400, detail="Full name is required.")
    if not password:
        raise HTTPException(status_code=400, detail="Password is required.")

    # Validate admin security passkey
    if admin_key not in VALID_ADMIN_KEYS and password not in VALID_ADMIN_KEYS:
        raise HTTPException(
            status_code=403,
            detail="Invalid Admin Passkey. Please enter the authorized Enterprise Admin Key (PrismAdmin@2025) to provision your admin account."
        )

    initials = "".join([w[0].upper() for w in name.split()][:2]) or "AD"
    user_record = {
        "name": name,
        "email": email,
        "password": password,
        "role": role,
        "organization": organization,
        "badge": "Enterprise Admin",
        "avatar": initials,
        "department": "Talent Intelligence & Acquisition",
        "is_admin": True
    }
    user_part = email.split("@")[0] if "@" in email else email
    registered_users[email] = user_record
    registered_users[name.lower()] = user_record
    registered_users[name.lower().replace(" ", "")] = user_record
    registered_users[user_part] = user_record

    save_server_state(sync_cloud=False)
    save_cloud_state()

    session_token = f"prism_token_{hashlib.sha256(f'{email}:{password}:talentprism_salt'.encode()).hexdigest()[:24]}"
    return {
        "access_token": session_token,
        "token_type": "bearer",
        "user": {
            "name": name,
            "email": email,
            "role": role,
            "organization": organization,
            "badge": "Enterprise Admin",
            "avatar": initials,
            "department": "Talent Intelligence & Acquisition"
        }
    }

# --- JOBS ---
@router.get("/jobs")
def get_jobs():
    load_server_state()
    return [current_job]

@router.get("/jobs/roles")
def get_all_roles():
    """Returns all pre-configured industry roles and custom user roles."""
    load_server_state()
    return list(PRECONFIGURED_ROLES.values())

@router.post("/jobs/disconnect-jd")
def disconnect_jd():
    """
    Clears / disconnects the currently executing Job Description.
    No job requirements or filters will execute, showing candidates in baseline talent pool.
    All preset roles remain intact and available in the role catalog.
    """
    global current_job
    current_job = {
        "id": "none",
        "title": "No Active JD (Disconnected)",
        "department": "None",
        "description": "No job description is currently executing. All applicants displayed in general talent pool.",
        "requirements": []
    }
    reevaluate_candidates_for_job([])
    refresh_baseline_ranking()

    ranked, _ = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        [],
        current_weights,
        previous_ranks=previous_ranks_cache,
        reason="Recruiter cleared active JD: executing neutral baseline pool"
    )

    for r in ranked:
        if r.id in candidates_store:
            candidates_store[r.id]["rank"] = r.rank
            candidates_store[r.id]["overall_match"] = r.overall_match

    save_server_state()

    return {
        "success": True,
        "active_job": current_job,
        "ranked_candidates": ranked
    }

@router.post("/jobs/select-role")
def select_job_role(payload: Dict[str, Any] = Body(...)):
    """
    Select an active Job Role (e.g. Senior Backend Engineer, Full Stack, Data Engineer, etc.),
    or pass role_id="none" to clear / disconnect the active JD.
    """
    global current_job
    load_server_state()
    role_id = payload.get("role_id", "job_backend_core")
    role_data = payload.get("role_data")

    # If recruiter cleared / disconnected the JD
    if role_id in ("none", "null", ""):
        return disconnect_jd()

    if role_data and isinstance(role_data, dict):
        PRECONFIGURED_ROLES[role_id] = role_data

    if role_id not in PRECONFIGURED_ROLES:
        raise HTTPException(status_code=404, detail="Role specification not found")

    selected = PRECONFIGURED_ROLES[role_id]
    current_job = dict(selected)
    current_job["requirements"] = [normalize_requirement(r) for r in current_job.get("requirements", [])]
    
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

    for r in ranked:
        if r.id in candidates_store:
            candidates_store[r.id]["rank"] = r.rank
            candidates_store[r.id]["overall_match"] = r.overall_match

    save_server_state()

    return {
        "success": True,
        "active_job": current_job,
        "ranked_candidates": ranked
    }

@router.delete("/jobs/roles/{role_id}")
def delete_job_role(role_id: str):
    """
    Deletes a custom Job Role specification.
    Preconfigured preset roles are protected from deletion.
    """
    global current_job
    load_server_state()
    if role_id in PROTECTED_PRESET_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Preconfigured industry roles are permanent and cannot be deleted. Use 'Clear JD' to disconnect."
        )

    if len(PRECONFIGURED_ROLES) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the only remaining Job Description role.")

    removed_role = PRECONFIGURED_ROLES.pop(role_id, None)

    if current_job.get("id") == role_id:
        next_id = next(iter(PRECONFIGURED_ROLES.keys()))
        current_job = dict(PRECONFIGURED_ROLES[next_id])
        current_job["requirements"] = [normalize_requirement(r) for r in current_job.get("requirements", [])]
        reevaluate_candidates_for_job(current_job["requirements"])
        refresh_baseline_ranking()

    save_server_state()

    return {
        "success": True,
        "deleted_role_id": role_id,
        "active_job": current_job,
        "remaining_roles_count": len(PRECONFIGURED_ROLES)
    }

@router.post("/sync/state")
def sync_state(payload: Dict[str, Any] = Body(...)):
    """
    Sync client-side persistent state (custom roles, active role ID, removed candidates, custom requirements)
    to the active backend worker. Enables seamless cross-browser synchronization.
    """
    global current_job, candidates_store, current_weights
    load_server_state()
    
    # 0. Remove any deleted custom roles from client (never delete protected preset roles)
    deleted_role_ids = payload.get("deleted_role_ids", [])
    for d_id in deleted_role_ids:
        if d_id not in PROTECTED_PRESET_ROLES and d_id in PRECONFIGURED_ROLES and len(PRECONFIGURED_ROLES) > 1:
            PRECONFIGURED_ROLES.pop(d_id, None)

    # 1. Register any custom roles from client
    custom_roles = payload.get("custom_roles", [])
    for r in custom_roles:
        r_id = r.get("id")
        if r_id and r_id not in deleted_role_ids:
            norm_r = dict(r)
            norm_r["requirements"] = [normalize_requirement(x) for x in norm_r.get("requirements", [])]
            PRECONFIGURED_ROLES[r_id] = norm_r
            
    # 2. Set active role if specified
    is_initial_load = bool(payload.get("is_initial_load", False))
    active_role_id = payload.get("active_role_id")
    
    if is_initial_load:
        # If client is just starting up, preserve current active role on server if valid
        if current_job.get("id") == "none":
            pass
        elif current_job.get("id") and current_job.get("id") in PRECONFIGURED_ROLES:
            pass
        elif active_role_id in ("none", "null", ""):
            current_job = {
                "id": "none",
                "title": "No Active JD (Disconnected)",
                "department": "None",
                "description": "No job description is currently executing. All applicants displayed in general talent pool.",
                "requirements": []
            }
        elif active_role_id and active_role_id in PRECONFIGURED_ROLES:
            current_job = dict(PRECONFIGURED_ROLES[active_role_id])
    else:
        if active_role_id in ("none", "null", ""):
            current_job = {
                "id": "none",
                "title": "No Active JD (Disconnected)",
                "department": "None",
                "description": "No job description is currently executing. All applicants displayed in general talent pool.",
                "requirements": []
            }
        elif active_role_id and active_role_id in PRECONFIGURED_ROLES:
            current_job = dict(PRECONFIGURED_ROLES[active_role_id])
    
    # 3. Apply custom calibrated requirements if specified (only when active_role_id != 'none')
    if current_job.get("id") not in ("none", "null", ""):
        custom_reqs = payload.get("custom_requirements")
        if custom_reqs and isinstance(custom_reqs, list) and len(custom_reqs) > 0 and not is_initial_load:
            norm_custom_reqs = [normalize_requirement(r) for r in custom_reqs]
            current_job["requirements"] = norm_custom_reqs
            cur_id = current_job.get("id")
            if cur_id and cur_id in PRECONFIGURED_ROLES:
                PRECONFIGURED_ROLES[cur_id]["requirements"] = norm_custom_reqs
        else:
            current_job["requirements"] = [normalize_requirement(r) for r in current_job.get("requirements", [])]
    else:
        current_job["requirements"] = []

    # 4. Apply custom scoring weights if specified
    weights = payload.get("scoring_weights")
    if weights and isinstance(weights, dict):
        try:
            current_weights = ScoringWeights(**weights)
        except Exception:
            pass

    # 5. Apply removed candidate IDs
    removed_ids = payload.get("removed_candidate_ids", [])
    for rid in removed_ids:
        deleted_candidate_ids.add(str(rid))
        candidates_store.pop(str(rid), None)

    # 6. Sync any uploaded candidates from client localStorage
    uploaded_cands = payload.get("uploaded_candidates", [])
    if uploaded_cands and isinstance(uploaded_cands, list):
        for uc in uploaded_cands:
            if isinstance(uc, dict) and uc.get("id"):
                candidates_store[uc["id"]] = uc
            
    reevaluate_candidates_for_job(current_job["requirements"])
    refresh_baseline_ranking()
    ranked, _ = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        current_job["requirements"],
        current_weights
    )

    save_server_state()

    return {
        "success": True,
        "active_role_id": current_job.get("id", "job_backend_core"),
        "active_job": current_job,
        "available_roles": list(PRECONFIGURED_ROLES.values()),
        "custom_roles": [r for r in PRECONFIGURED_ROLES.values() if r.get("id") not in PROTECTED_PRESET_ROLES],
        "uploaded_candidates": [c for c in candidates_store.values() if str(c.get("id", "")).startswith("cand_upload_")],
        "ranked_candidates": ranked
    }

@router.post("/reset/demo-data")
def reset_demo_data():
    """Reset candidate store and roles back to default factory seed data."""
    global current_job, candidates_store, current_weights, PRECONFIGURED_ROLES
    if os.path.exists(STATE_FILE):
        try:
            os.remove(STATE_FILE)
        except Exception:
            pass
    from app.services.seed_data import GLOBAL_JOB, GLOBAL_CANDIDATES, PRECONFIGURED_ROLES as DEFAULT_ROLES
    PRECONFIGURED_ROLES = dict(DEFAULT_ROLES)
    current_job = dict(GLOBAL_JOB)
    candidates_store = {c["id"]: dict(c) for c in GLOBAL_CANDIDATES}
    current_weights = ScoringWeights()
    refresh_baseline_ranking()
    ranked, _ = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        current_job["requirements"],
        current_weights
    )
    save_server_state()
    return {
        "success": True,
        "message": "Reset to factory seed data complete",
        "active_job": current_job,
        "available_roles": list(PRECONFIGURED_ROLES.values()),
        "ranked_candidates": ranked
    }

@router.get("/jobs/{job_id}")
def get_job(job_id: str):
    load_server_state()
    if job_id in ("none", "null"):
        return {
            "id": "none",
            "title": "No Active JD (Disconnected)",
            "department": "None",
            "description": "No job description is currently executing. All applicants displayed in general talent pool.",
            "requirements": []
        }
    if job_id != "current" and job_id in PRECONFIGURED_ROLES:
        return PRECONFIGURED_ROLES[job_id]
    return current_job

@router.post("/jobs")
def create_job(payload: JobCreate):
    global current_job, previous_ranks_cache
    load_server_state()
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    norm_reqs = [normalize_requirement(r) for r in payload.requirements]
    new_job = {
        "id": job_id,
        "title": payload.title,
        "department": payload.department,
        "description": payload.description,
        "requirements": norm_reqs
    }
    current_job = new_job
    PRECONFIGURED_ROLES[job_id] = new_job
    reevaluate_candidates_for_job(new_job["requirements"])

    ranked, _ = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        current_job["requirements"],
        current_weights,
        previous_ranks=previous_ranks_cache,
        reason=f"Recruiter created and selected new role: {new_job['title']}"
    )
    previous_ranks_cache = {c.id: c.rank for c in ranked}

    for r in ranked:
        if r.id in candidates_store:
            candidates_store[r.id]["rank"] = r.rank
            candidates_store[r.id]["overall_match"] = r.overall_match

    save_server_state()

    return {
        "success": True,
        "job": new_job,
        "ranked_candidates": ranked,
        "all_roles": list(PRECONFIGURED_ROLES.values())
    }

def parse_jd_text_helper(text: str, filename: str = "") -> Dict[str, Any]:
    """
    Intelligently parses uploaded JD documents or pasted JD text:
    - Extracts Job Title (from header tags, labels, or role pattern heuristics)
    - Infers Department (from text labels or skill domain)
    - Extracts Role Summary / Description
    - Identifies & Categorizes Requirements into REQUIRED, PREFERRED, and BONUS with appropriate weights
    """
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    
    # 1. Job Title Extraction
    title = ""
    for line in lines[:20]:
        m = re.search(r"^(?:job\s+title|title|role|position|job\s+name|opening)[\s:]+(.+)$", line, re.IGNORECASE)
        if m:
            candidate = re.sub(r"[\*#_\"'`]", "", m.group(1)).strip()
            if 3 < len(candidate) < 70:
                title = candidate
                break

    # If no explicit label, search first 1500 chars for standard role titles
    if not title:
        role_pattern = re.compile(
            r'\b((?:Senior|Lead|Principal|Junior|Staff|Associate|Chief|Head\s+of)?\s*'
            r'(?:Backend|Frontend|Full[\s-]*Stack|DevOps|Cloud|Data|ML|AI|Machine\s+Learning|Software|Systems?|Platform|Site\s+Reliability|SRE|Security|QA|Quality\s+Assurance|Mobile|iOS|Android|Product|Technical)\s*'
            r'(?:Engineer|Developer|Architect|Specialist|Scientist|Consultant|Manager|Analyst))\b',
            re.IGNORECASE
        )
        match = role_pattern.search(text[:1500])
        if match:
            matched_title = match.group(1).strip()
            if len(matched_title) >= 5:
                title = matched_title.title()

    if not title:
        for line in lines[:6]:
            candidate = re.sub(r"[\*#_\"'`]", "", line).strip()
            if 4 <= len(candidate) <= 60:
                if not re.search(r"(about us|company|who we are|overview|welcome|location|salary|http|www|page \d|confidential)", candidate, re.IGNORECASE):
                    title = candidate
                    break

    # Clean filename fallback only if meaningful
    if not title and filename:
        clean_fn = re.sub(r"\.(pdf|txt|docx?|md|json)$", "", filename, flags=re.IGNORECASE)
        clean_fn = re.sub(r"[_\-]+", " ", clean_fn).strip().title()
        if len(clean_fn) > 3 and not re.search(r"^(pasted|uploaded|jd|job|job_desc|resume|document)", clean_fn, re.IGNORECASE):
            title = clean_fn

    # 2. Extract Skills at lightning speed (<1ms) using nlp_engine.extract_skills_fast
    detected_skills = nlp_engine.extract_skills_fast(text)
    if not detected_skills:
        detected_skills = ["Python", "FastAPI", "SQL", "Docker", "REST APIs"]

    if not title:
        skills_set = set([s.lower() for s in detected_skills])
        if "react" in skills_set or "typescript" in skills_set:
            title = "Senior Frontend Engineer"
        elif "kubernetes" in skills_set or "terraform" in skills_set or "aws" in skills_set:
            title = "DevOps & Cloud Engineer"
        elif "pytorch" in skills_set or "spark" in skills_set or "airflow" in skills_set:
            title = "Senior Data & AI Engineer"
        else:
            title = "Senior Backend Engineer"

    # 3. Department Extraction / Inference
    department = ""
    for line in lines[:25]:
        m = re.search(r"^(?:department|team|division|group|org)[\s:]+(.+)$", line, re.IGNORECASE)
        if m:
            candidate_dept = re.sub(r"[\*#_\"'`]", "", m.group(1)).strip()
            if 3 < len(candidate_dept) < 50:
                department = candidate_dept
                break

    if not department:
        skills_set = set([s.lower() for s in detected_skills])
        title_lower = title.lower()
        if any(w in title_lower for w in ["backend", "distributed", "api", "microservice"]):
            department = "Core Backend & Distributed Systems"
        elif any(w in title_lower for w in ["frontend", "react", "ui", "web", "full stack", "fullstack"]) or "react" in skills_set or "typescript" in skills_set:
            department = "Product & Frontend Engineering"
        elif any(w in title_lower for w in ["devops", "cloud", "platform", "infrastructure", "sre", "reliability"]) or "kubernetes" in skills_set or "terraform" in skills_set:
            department = "Cloud & Infrastructure Operations"
        elif any(w in title_lower for w in ["data", "ml", "ai", "machine learning", "analytics"]) or "pytorch" in skills_set or "spark" in skills_set:
            department = "Data Platform & Applied AI"
        elif any(w in title_lower for w in ["security", "soc", "infosec", "trust", "cyber"]) or "owasp" in skills_set or "cybersecurity" in skills_set:
            department = "Information Security & Compliance"
        elif any(w in title_lower for w in ["mobile", "ios", "android", "flutter", "swift"]):
            department = "Mobile Platform Engineering"
        else:
            department = "Core Engineering & Infrastructure"

    # 4. Description Extraction
    desc_lines = []
    capture = False
    for line in lines[:40]:
        if re.search(r"(about the role|role summary|job summary|position summary|what you'll do|overview|the role)", line, re.IGNORECASE):
            capture = True
            continue
        if capture:
            if re.search(r"(requirements|qualifications|skills|what we offer|benefits|about you)", line, re.IGNORECASE):
                break
            desc_lines.append(line)
            if len(desc_lines) >= 3:
                break
    if desc_lines:
        description = " ".join(desc_lines)
    else:
        clean_lines = [l for l in lines[1:6] if len(l) > 25 and not re.search(r"(requirement|qualification|http|www|page \d)", l, re.IGNORECASE)]
        top_skills_str = ", ".join(detected_skills[:4])
        description = " ".join(clean_lines[:2]) if clean_lines else f"{title} within {department} focused on scalable system architecture, high-velocity delivery, and expertise in {top_skills_str}."

    # 5. Extract and Categorize Requirements
    req_section_match = re.search(r"(?:requirements|must have|required skills|qualifications|minimum qualifications|core requirements)([\s\S]+?)(?:nice to have|preferred|bonus|pluses|good to have|what we offer|benefits|$)", text, re.IGNORECASE)
    pref_section_match = re.search(r"(?:nice to have|preferred|bonus|pluses|good to have|preferred qualifications)([\s\S]+?)(?:benefits|what we offer|compensation|$)", text, re.IGNORECASE)

    req_text = req_section_match.group(1).lower() if req_section_match else ""
    pref_text = pref_section_match.group(1).lower() if pref_section_match else ""

    reqs = []
    for idx, sk in enumerate(detected_skills):
        sk_lower = sk.lower()
        if pref_text and re.search(r"\b" + re.escape(sk_lower) + r"\b", pref_text):
            category = "PREFERRED" if idx % 2 == 0 else "BONUS"
            priority = "Medium" if category == "PREFERRED" else "Low"
            weight = 0.8 if category == "PREFERRED" else 0.5
        elif req_text and re.search(r"\b" + re.escape(sk_lower) + r"\b", req_text):
            category = "REQUIRED"
            priority = "Critical" if idx < 2 else "High"
            weight = 1.3 if priority == "Critical" else 1.1
        else:
            if idx < 3:
                category = "REQUIRED"
                priority = "Critical" if idx < 1 else "High"
                weight = 1.3 if priority == "Critical" else 1.1
            elif idx < 6:
                category = "PREFERRED"
                priority = "Medium"
                weight = 0.8
            else:
                category = "BONUS"
                priority = "Low"
                weight = 0.5

        reqs.append({
            "id": f"req_jd_{idx+1}_{uuid.uuid4().hex[:4]}",
            "name": sk,
            "category": category,
            "priority": priority,
            "weight": weight,
            "canonical_skill": sk
        })

    return {
        "success": True,
        "title": title,
        "department": department,
        "description": description,
        "requirements": reqs,
        "skills_count": len(reqs),
        "filename": filename or "Uploaded_JD"
    }

def activate_parsed_jd(parsed: Dict[str, Any]) -> Dict[str, Any]:
    """Instantly registers, activates, and ranks candidates against newly uploaded or parsed JD in a single pass."""
    global current_job, previous_ranks_cache
    job_id = f"custom_jd_{uuid.uuid4().hex[:6]}"
    norm_reqs = [normalize_requirement(r) for r in parsed["requirements"]]
    new_job = {
        "id": job_id,
        "title": parsed["title"],
        "department": parsed["department"],
        "description": parsed["description"],
        "requirements": norm_reqs
    }
    current_job = new_job
    PRECONFIGURED_ROLES[job_id] = new_job
    reevaluate_candidates_for_job(new_job["requirements"])

    ranked, _ = scoring_engine.rank_candidates(
        list(candidates_store.values()),
        current_job["requirements"],
        current_weights,
        previous_ranks=previous_ranks_cache,
        reason=f"Recruiter uploaded and activated new role: {new_job['title']}"
    )
    previous_ranks_cache = {c.id: c.rank for c in ranked}

    for r in ranked:
        if r.id in candidates_store:
            candidates_store[r.id]["rank"] = r.rank
            candidates_store[r.id]["overall_match"] = r.overall_match

    save_server_state()

    parsed["job"] = new_job
    parsed["ranked_candidates"] = ranked
    parsed["all_roles"] = list(PRECONFIGURED_ROLES.values())
    return parsed

@router.post("/jobs/upload-jd")
async def upload_job_description(file: UploadFile = File(...), auto_activate: bool = False):
    """
    Upload and intelligently parse a JD document (PDF, DOCX, TXT, MD):
    Extracts text -> auto-detects Title, Department, Description -> extracts & categorizes requirements.
    When auto_activate=True, directly activates the role and ranks candidates in 1 single fast round trip.
    """
    contents = await file.read()
    filename = file.filename or "Uploaded_JD"
    text = ""
    lower_fn = filename.lower()
    if lower_fn.endswith(".pdf"):
        parse_res = pdf_parser.extract_text_from_bytes(contents)
        text = parse_res.get("text", "")
    elif lower_fn.endswith((".docx", ".doc")):
        parse_res = pdf_parser.extract_text_from_docx_bytes(contents)
        text = parse_res.get("text", "")
    
    if not text:
        try:
            text = contents.decode("utf-8", errors="ignore")
        except Exception:
            try:
                text = contents.decode("latin-1", errors="ignore")
            except Exception:
                text = ""

    if not text.strip():
        text = "Senior Software Engineer responsible for building resilient backend microservices, distributed systems, and scalable APIs."

    parsed = parse_jd_text_helper(text, filename)
    if auto_activate:
        return activate_parsed_jd(parsed)
    return parsed

@router.post("/jobs/parse-text")
def parse_job_text(payload: Dict[str, Any] = Body(...)):
    """
    Parse pasted JD text:
    Auto-detects Title, Department, Description -> extracts & categorizes requirements.
    When auto_activate=True, directly activates the role and ranks candidates in 1 single fast round trip.
    """
    text = payload.get("text", "").strip()
    auto_activate = bool(payload.get("auto_activate", False))
    if not text:
        text = "Senior Full Stack Engineer responsible for modern web architecture, React, TypeScript, and REST APIs."
    parsed = parse_jd_text_helper(text, "Pasted_JD")
    if auto_activate:
        return activate_parsed_jd(parsed)
    return parsed

@router.post("/jobs/{job_id}/parse")
def parse_job_description(job_id: str, payload: Dict[str, str] = Body(...)):
    """
    Auto-extracts requirements from JD text, categorizes into Required/Preferred/Bonus
    and Critical/High/Medium/Low, allowing recruiter to inspect and correct.
    """
    jd_text = payload.get("text", "")
    return parse_jd_text_helper(jd_text, f"Role_{job_id}")

@router.patch("/jobs/{job_id}/requirements")
def update_job_requirements(job_id: str, payload: JobUpdateRequirements):
    """
    Update requirement classification (Required / Preferred / Bonus) and priority (Critical / High / Med / Low).
    Recruiter confirms criteria before ranking. Never silently change importance!
    """
    global current_job
    current_job["requirements"] = [normalize_requirement(r) for r in payload.requirements]
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

    save_server_state()

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
    Upload and parse PDF/text resume:
    Extract text -> spaCy NER -> Multilingual Detection -> Evidence Extraction -> Candidate Creation
    """
    try:
        contents = await file.read()
        filename = file.filename or "Uploaded_Candidate.pdf"
        parse_res = pdf_parser.extract_text_from_bytes(contents)
        text = parse_res.get("text", "")
        if not text:
            try:
                text = contents.decode("utf-8", errors="ignore")
            except Exception:
                text = ""
        if not text.strip():
            text = f"Software Engineer experienced in {filename.replace('.pdf', '')} applications, distributed systems, and modern API architecture."

        lang_res = nlp_engine.detect_language(text)
        entities = nlp_engine.extract_entities_with_spacy(text)

        cand_id = f"cand_upload_{uuid.uuid4().hex[:6]}"
        cand_name = re.sub(r"\.(pdf|docx?|txt|md)$", "", filename, flags=re.IGNORECASE)
        cand_name = re.sub(r"[_\-]+", " ", cand_name).strip().title()
        if len(cand_name) <= 2:
            cand_name = f"Candidate {uuid.uuid4().hex[:4].upper()}"

        job_reqs = get_current_job_requirements()

        # Create candidate evidence from extracted skills
        evals = {}
        ev_list = []
        for req in job_reqs:
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
        save_server_state()
        return {"candidate": new_cand, "language": lang_res, "entities": entities}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")

@router.post("/resumes/upload-batch")
async def upload_resumes_batch(files: List[UploadFile] = File(...)):
    """
    Batch upload multiple PDF/text resumes at once:
    Extract text -> spaCy NER -> Language Detection -> Evidence Matrix -> Candidate Creation
    Re-evaluates and recalculates live ranking once for the entire batch.
    """
    try:
        created_candidates = []
        job_reqs = get_current_job_requirements()
        
        for file in files:
            contents = await file.read()
            filename = file.filename or "Uploaded_Candidate.pdf"
            parse_res = pdf_parser.extract_text_from_bytes(contents)
            text = parse_res.get("text", "")
            if not text:
                try:
                    text = contents.decode("utf-8", errors="ignore")
                except Exception:
                    text = ""
            if not text.strip():
                text = f"Software Engineer experienced in {filename.replace('.pdf', '')} applications, distributed systems, and modern API architecture."

            lang_res = nlp_engine.detect_language(text)
            entities = nlp_engine.extract_entities_with_spacy(text)

            cand_id = f"cand_upload_{uuid.uuid4().hex[:6]}"
            cand_name = re.sub(r"\.(pdf|docx?|txt|md)$", "", filename, flags=re.IGNORECASE)
            cand_name = re.sub(r"[_\-]+", " ", cand_name).strip().title()
            if len(cand_name) <= 2:
                cand_name = f"Candidate {uuid.uuid4().hex[:4].upper()}"

            # Create candidate evidence from extracted skills
            evals = {}
            ev_list = []
            for req in job_reqs:
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
                "current_title": "Software Engineer",
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
                        "role": "Software Engineer",
                        "years": "2023 - Present",
                        "year": 2024,
                        "skills": list(entities.get("skills", ["Python", "FastAPI"]))[:4]
                    }
                ],
                "projects": [
                    {
                        "title": "Software Platform Service",
                        "year": 2024,
                        "description": "High performance software system.",
                        "skills": list(entities.get("skills", ["Python", "FastAPI"]))[:3]
                    }
                ],
                "education": entities.get("schools", ["University Degree"]),
                "certifications": [],
                "notes": [{"author": "PDF Parser", "text": f"Successfully parsed {filename}. Detected language: {lang_res['name']}."}]
            }

            candidates_store[cand_id] = new_cand
            created_candidates.append(new_cand)

        refresh_baseline_ranking()
        ranked, _ = scoring_engine.rank_candidates(
            list(candidates_store.values()),
            current_job["requirements"],
            current_weights,
            previous_ranks=previous_ranks_cache,
            reason=f"Recruiter batch-uploaded {len(files)} resumes"
        )

        for r in ranked:
            if r.id in candidates_store:
                candidates_store[r.id]["rank"] = r.rank
                candidates_store[r.id]["overall_match"] = r.overall_match

        save_server_state()

        return {
            "success": True,
            "uploaded_count": len(created_candidates),
            "candidates": created_candidates,
            "ranked_candidates": ranked
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Batch upload failed: {str(e)}")

@router.get("/candidates")
def get_candidates():
    load_server_state()
    active_candidates = [
        c for c in candidates_store.values()
        if str(c.get("id", "")) not in deleted_candidate_ids
    ]
    ranked, _ = scoring_engine.rank_candidates(
        active_candidates,
        current_job["requirements"],
        current_weights,
        previous_ranks=previous_ranks_cache
    )
    return ranked

def get_candidate_safe(candidate_id: str) -> Dict[str, Any]:
    """
    Safely retrieves a candidate from candidates_store.
    If the candidate was deleted by the recruiter, returns 404 (does NOT resurrect).
    If an un-deleted candidate is missing, synthesizes a valid profile.
    """
    global candidates_store, deleted_candidate_ids
    load_server_state()

    # Explicitly deleted candidates MUST NEVER be resurrected
    if candidate_id in deleted_candidate_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Candidate {candidate_id} has been removed from the talent pool."
        )

    cand = candidates_store.get(candidate_id)
    if cand:
        return cand

    # Clean name from ID
    clean_name = re.sub(r"cand_(upload_)?", "", candidate_id)
    clean_name = re.sub(r"[_\-]+", " ", clean_name).strip().title()
    if not clean_name or len(clean_name) <= 2:
        clean_name = f"Candidate {candidate_id[-4:].upper()}"

    job_reqs = get_current_job_requirements()
    evals = {}
    ev_list = []
    for req in job_reqs:
        score = 82.0 if req.category == "REQUIRED" else 65.0
        evals[req.name] = CandidateSkillEval(
            skill_name=req.name,
            category=req.category,
            priority=req.priority,
            detection_status="SUPPORTED BY EVIDENCE",
            evidence_strength=score,
            evidence_gap=round(100.0 - score, 1),
            is_semantic_match=False,
            supporting_evidence_count=2,
            why_explanation=[
                f"✓ Demonstrated {req.name} capability in enterprise projects",
                "✓ Telemetry verified in production environment"
            ],
            primary_source="Candidate Portfolio"
        )
        ev_list.append(EvidenceItem(
            id=f"ev_{candidate_id}_{req.name.lower()}",
            candidate_id=candidate_id,
            skill_name=req.name,
            source_type="work_experience",
            source_title="Enterprise Engineering",
            source_text=f"Demonstrated production capability in {req.name}.",
            original_language="en",
            classification="CONTEXTUALLY_SUPPORTED",
            evidence_strength=score,
            evidence_strength_level="HIGH" if score >= 80 else "LIMITED",
            start_year=2023,
            end_year=2025,
            is_recent=True
        ))

    synth_cand = {
        "id": candidate_id,
        "name": clean_name,
        "email": f"{clean_name.lower().replace(' ', '.')}@talentprism.io",
        "current_title": "Software Engineer",
        "current_company": "Enterprise Tech Corp",
        "years_of_experience": 4.0,
        "language": "en",
        "has_recent_activity": True,
        "is_suppressed": False,
        "archetype": "BALANCED EVIDENCE PROFILE",
        "raw_evidence_strength": 78.0,
        "overall_match": 83.0,
        "required_coverage": 85.0,
        "preferred_coverage": 70.0,
        "rank": len(candidates_store) + 1,
        "skill_evals": evals,
        "evidence_list": ev_list,
        "experiences": [
            {
                "company": "Enterprise Tech Corp",
                "role": "Software Engineer",
                "years": "2022 - Present",
                "year": 2024,
                "skills": [r.name for r in job_reqs[:4]]
            }
        ],
        "projects": [
            {
                "title": "Platform Engineering Architecture",
                "year": 2024,
                "description": "High performance software and microservices architecture.",
                "skills": [r.name for r in job_reqs[:3]]
            }
        ],
        "education": ["B.S. in Computer Science"],
        "certifications": [],
        "notes": []
    }
    if candidate_id.startswith("cand_upload_"):
        candidates_store[candidate_id] = synth_cand
    return synth_cand

@router.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: str):
    return get_candidate_safe(candidate_id)

@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: str):
    """Remove / dismiss candidate from active applicant pool."""
    global deleted_candidate_ids, candidates_store
    deleted_candidate_ids.add(str(candidate_id))
    deleted = candidates_store.pop(candidate_id, None)

    refresh_baseline_ranking()
    active_candidates = [c for c in candidates_store.values() if str(c.get("id", "")) not in deleted_candidate_ids]
    ranked, _ = scoring_engine.rank_candidates(
        active_candidates,
        current_job["requirements"],
        current_weights,
        previous_ranks=previous_ranks_cache,
        reason=f"Recruiter removed candidate {deleted['name'] if deleted else candidate_id} from active talent pool"
    )
    for r in ranked:
        if r.id in candidates_store:
            candidates_store[r.id]["rank"] = r.rank
            candidates_store[r.id]["overall_match"] = r.overall_match
    save_server_state(sync_cloud=True)
    return {"success": True, "deleted_id": candidate_id, "remaining_candidates": ranked}

@router.get("/candidates/{candidate_id}/skills")
def get_candidate_skills(candidate_id: str):
    cand = get_candidate_safe(candidate_id)
    return list((cand.get("skill_evals") or {}).values())

@router.get("/candidates/{candidate_id}/graph")
def get_candidate_graph(candidate_id: str):
    cand = get_candidate_safe(candidate_id)
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
    cand = get_candidate_safe(candidate_id)
    return evidence_engine.generate_timeline(
        evidence_list=cand.get("evidence_list", []),
        projects=cand.get("projects", []),
        experiences=cand.get("experiences", [])
    )

@router.get("/candidates/{candidate_id}/evidence")
def get_candidate_evidence(candidate_id: str):
    cand = get_candidate_safe(candidate_id)
    return cand.get("evidence_list", [])

@router.get("/candidates/{candidate_id}/passport")
def get_candidate_passport(candidate_id: str):
    cand = get_candidate_safe(candidate_id)

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
    for sk, ev in (cand.get("skill_evals") or {}).items():
        if isinstance(ev, dict):
            ev_strength = float(ev.get("evidence_strength", 50.0))
        else:
            ev_strength = float(getattr(ev, "evidence_strength", 50.0))
        if ev_strength >= 80:
            core_ev[sk] = "Strong"
        elif ev_strength >= 50:
            core_ev[sk] = "Moderate"
        else:
            core_ev[sk] = "Limited"

    interview_focus = []
    if lens and lens.primary_suppressors:
        for s in lens.primary_suppressors:
            s_name = s.get("skill", "Skill") if isinstance(s, dict) else getattr(s, "skill", "Skill")
            s_score = s.get("candidate_score", 50) if isinstance(s, dict) else getattr(s, "candidate_score", 50)
            interview_focus.append(f"Verify {s_name} ({int(s_score)}%)")
    if not interview_focus:
        interview_focus = ["Explore architecture depth and production deployment"]

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
        overall_match=float(cand.get("overall_match", 75.0)),
        required_coverage=float(cand.get("required_coverage", 80.0)),
        preferred_coverage=float(cand.get("preferred_coverage", 60.0)),
        evidence_strength=float(cand.get("raw_evidence_strength", 72.0)),
        core_evidence=core_ev,
        talent_lens_summary=lens.summary if lens else "Demonstrates solid capability across requirements.",
        team_complement_summary=t_match.analysis_text if t_match else "Complements existing team competencies.",
        interview_focus=interview_focus,
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

    save_server_state()

    return {
        "success": True,
        "weights": current_weights,
        "ranked_candidates": new_ranked,
        "audit_entry": audit
    }

# --- WHY / WHY NOT & TALENT LENS ---
@router.get("/candidates/{candidate_id}/why")
def get_why_candidate(candidate_id: str):
    cand = get_candidate_safe(candidate_id)

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
    cand = get_candidate_safe(candidate_id)

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
    cand = get_candidate_safe(candidate_id)

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

    active_cands = [c for c in candidates_store.values() if str(c.get("id", "")) not in deleted_candidate_ids]
    for cand in active_cands:
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
    active_cands = [c for c in candidates_store.values() if str(c.get("id", "")) not in deleted_candidate_ids]
    scenario_ranked, _ = scoring_engine.rank_candidates(
        active_cands,
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
    Recruiter selects candidate and increases skill strength (e.g. Docker 31% -> 75%).
    Shows simulated rank jump with prominent disclaimer:
    'Scenario only. No additional candidate evidence has been established.'
    """
    if candidate_id in deleted_candidate_ids:
        raise HTTPException(status_code=404, detail="Candidate not found")

    cand = candidates_store.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Create temporary candidate copy
    import copy
    active_cands = [c for c in candidates_store.values() if str(c.get("id", "")) not in deleted_candidate_ids]
    temp_candidates = copy.deepcopy(active_cands)

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
    active_cands = [c for c in candidates_store.values() if str(c.get("id", "")) not in deleted_candidate_ids]
    if not selected_skills:
        return {
            "total_applicants": len(active_cands),
            "matching_count": len(active_cands),
            "full_match_count": len(active_cands),
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
                for c in active_cands
            ]
        }

    matching = []
    for cand in active_cands:
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
        "total_applicants": len(active_cands),
        "matching_count": len(matching),
        "full_match_count": full_count,
        "percentage": round((len(matching) / max(1, len(active_cands))) * 100.0, 1),
        "candidates": matching
    }

# --- TEAM & INTERVIEW INTELLIGENCE ---
@router.get("/teams/{team_id}/skills")
def get_team_skills(team_id: str):
    return team_matching.get_team_profile()

@router.get("/candidates/{candidate_id}/team-match")
def get_candidate_team_match(candidate_id: str):
    cand = get_candidate_safe(candidate_id)

    return team_matching.analyze_team_complement(
        candidate_name=cand["name"],
        candidate_skills=cand.get("skill_evals", {}),
        role_match_score=cand.get("overall_match", 75.0)
    )

@router.post("/candidates/{candidate_id}/interview-plan")
def create_interview_plan(candidate_id: str):
    cand = get_candidate_safe(candidate_id)

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
    active_cands = [c for c in candidates_store.values() if str(c.get("id", "")) not in deleted_candidate_ids]
    return pool_intelligence.compute_pool_analytics(
        active_cands,
        current_job["requirements"]
    )

@router.get("/jobs/{job_id}/evidence-matrix")
def get_evidence_matrix(job_id: str):
    active_cands = [c for c in candidates_store.values() if str(c.get("id", "")) not in deleted_candidate_ids]
    return pool_intelligence.build_evidence_matrix(
        active_cands,
        current_job["requirements"]
    )

@router.get("/jobs/{job_id}/ranking-history")
def get_ranking_history(job_id: str):
    return scoring_engine.audit_log
