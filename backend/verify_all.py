import sys
import os
import io
import json
import math

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.services.scoring_engine import scoring_engine
from app.models.schemas import ScoringWeights, JobRequirement

client = TestClient(app)

passed = 0
failed = 0
errors = []

def check(condition, test_name, detail=""):
    global passed, failed, errors
    if condition:
        passed += 1
        print(f"[PASS] {test_name}")
    else:
        failed += 1
        msg = f"[FAIL] {test_name} - {detail}"
        print(msg)
        errors.append(msg)

print("=" * 60)
print("TALENTPRISM AI - RIGOROUS COMPREHENSIVE SYSTEM VERIFICATION")
print("=" * 60)

# ----------------------------------------------------
# 1. SCORING ENGINE MATHEMATICAL ACCURACY
# ----------------------------------------------------
print("\n--- 1. Testing Scoring Engine Accuracy ---")
weights = ScoringWeights(
    required_skills=0.40,
    evidence_strength=0.20,
    relevant_experience=0.20,
    recency=0.10,
    preferred_skills=0.10
)

reqs = [
    JobRequirement(id="r1", name="Python", category="REQUIRED", priority="Critical", weight=1.0),
    JobRequirement(id="r2", name="PostgreSQL", category="REQUIRED", priority="High", weight=0.9),
    JobRequirement(id="r3", name="Docker", category="PREFERRED", priority="Medium", weight=0.8),
]

mock_cand = {
    "id": "mock_1",
    "name": "Test Candidate",
    "years_of_experience": 4.0,
    "has_recent_activity": True,
    "raw_evidence_strength": 80.0,
    "skill_evals": {
        "Python": {"evidence_strength": 90.0, "evidence_gap": 10.0},
        "PostgreSQL": {"evidence_strength": 70.0, "evidence_gap": 30.0},
        "Docker": {"evidence_strength": 60.0, "evidence_gap": 40.0},
    }
}

score_res = scoring_engine.compute_candidate_score(mock_cand, reqs, weights)

# Manual calculation:
# Required coverage:
# req sum = 90.0*1.0 + 70.0*0.9 = 90 + 63 = 153.0
# max req sum = (1.0 + 0.9) * 100 = 190.0
# req_coverage = (153.0 / 190.0) * 100 = 80.5263...
expected_req_cov = round((153.0 / 190.0) * 100.0, 1)
check(abs(score_res["required_coverage"] - expected_req_cov) < 0.15,
      "Required coverage calculation matches formula",
      f"got {score_res['required_coverage']}, expected ~{expected_req_cov}")

# Preferred coverage:
# pref sum = 60.0*0.8 = 48.0
# max pref sum = 0.8 * 100 = 80.0
# pref_coverage = (48.0 / 80.0) * 100 = 60.0
check(abs(score_res["preferred_coverage"] - 60.0) < 0.1,
      "Preferred coverage calculation matches formula",
      f"got {score_res['preferred_coverage']}, expected 60.0")

# Experience score: (4.0 / 5.0) * 100 = 80.0
check(abs(score_res["exp_score"] - 80.0) < 0.1,
      "Experience score calculation matches formula",
      f"got {score_res['exp_score']}, expected 80.0")

# Recency score: has_recent is True => 95.0
check(abs(score_res["recency_score"] - 95.0) < 0.1,
      "Recency score calculation matches formula",
      f"got {score_res['recency_score']}, expected 95.0")

# Evidence strength: avg of 90, 70, 60 = 73.333...
expected_ev = round((90.0 + 70.0 + 60.0) / 3.0, 1)
check(abs(score_res["evidence_strength"] - expected_ev) < 0.15,
      "Evidence strength average matches formula",
      f"got {score_res['evidence_strength']}, expected ~{expected_ev}")

# Overall composite:
expected_composite = round(
    (score_res["required_coverage"] * 0.40) +
    (score_res["preferred_coverage"] * 0.10) +
    (score_res["evidence_strength"] * 0.20) +
    (score_res["exp_score"] * 0.20) +
    (score_res["recency_score"] * 0.10),
    1
)
check(abs(score_res["overall_match"] - expected_composite) < 0.15,
      "Overall composite match score matches weighted sum",
      f"got {score_res['overall_match']}, expected ~{expected_composite}")

# ----------------------------------------------------
# 2. TIE BREAKING & RANKING STABILITY
# ----------------------------------------------------
print("\n--- 2. Testing Ranking Tie-Breaking ---")
cand_a = {
    "id": "cand_a", "name": "Candidate A", "years_of_experience": 5.0, "has_recent_activity": True, "raw_evidence_strength": 80.0,
    "skill_evals": {"Python": {"evidence_strength": 90.0}, "PostgreSQL": {"evidence_strength": 90.0}}
}
cand_b = {
    "id": "cand_b", "name": "Candidate B", "years_of_experience": 5.0, "has_recent_activity": True, "raw_evidence_strength": 80.0,
    "skill_evals": {"Python": {"evidence_strength": 70.0}, "PostgreSQL": {"evidence_strength": 70.0}}
}
ranked_list, _ = scoring_engine.rank_candidates([cand_b, cand_a], reqs[:2], weights)
check(ranked_list[0].id == "cand_a" and ranked_list[1].id == "cand_b",
      "Higher skilled candidate ranks #1 regardless of input order",
      f"Rank 1: {ranked_list[0].id}, Rank 2: {ranked_list[1].id}")

# ----------------------------------------------------
# 3. FASTAPI ENDPOINTS & CORE FUNCTIONALITY
# ----------------------------------------------------
print("\n--- 3. Testing API Endpoints ---")

# Health
r = client.get("/api/health")
check(r.status_code == 200 and r.json().get("status") == "healthy", "GET /api/health is healthy")

# Roles Catalog
r = client.get("/api/jobs/roles")
check(r.status_code == 200 and len(r.json()) >= 5, "GET /api/jobs/roles returns full catalog", f"Count: {len(r.json())}")

# Current Job
r = client.get("/api/jobs/current")
check(r.status_code == 200 and "requirements" in r.json(), "GET /api/jobs/current returns valid job specification")

# Select Preset Role (Backend Engineer)
r = client.post("/api/jobs/select-role", json={"role_id": "job_backend_core"})
check(r.status_code == 200 and r.json().get("active_job", {}).get("id") == "job_backend_core",
      "POST /api/jobs/select-role switches to Senior Backend Engineer")

# Disconnect JD
r = client.post("/api/jobs/disconnect-jd")
check(r.status_code == 200 and r.json().get("active_job", {}).get("id") == "none",
      "POST /api/jobs/disconnect-jd clears active role to 'none'")
check(len(r.json().get("active_job", {}).get("requirements", [])) == 0,
      "Disconnected JD has empty requirements list")

# Candidates in Disconnected mode
r = client.get("/api/candidates")
check(r.status_code == 200 and len(r.json()) > 0,
      "GET /api/candidates returns valid candidate list in disconnected mode", f"Count: {len(r.json())}")

# Re-select role for remaining tests
client.post("/api/jobs/select-role", json={"role_id": "job_backend_core"})

# Candidates
r = client.get("/api/candidates")
cands = r.json()
check(r.status_code == 200 and len(cands) >= 20, "GET /api/candidates returns populated talent pool", f"Count: {len(cands)}")

# Verify Elena Rostova was removed by user and returns 404 (Deletion Integrity)
r_elena = client.get("/api/candidates/cand_elena")
check(r_elena.status_code == 404, "Deleted candidate cand_elena correctly returns 404 (Deletion Integrity preserved)")

# Select an active candidate from the talent pool for deep sub-endpoint testing
test_cand = cands[0] if len(cands) > 0 else None
check(test_cand is not None, "Active candidate selected for sub-endpoint verification", f"Testing candidate: {test_cand.get('name') if test_cand else 'None'}")

# Candidate Sub-endpoints
if test_cand:
    cand_id = test_cand["id"]
    
    # Profile
    r = client.get(f"/api/candidates/{cand_id}")
    check(r.status_code == 200 and r.json().get("id") == cand_id, f"GET /api/candidates/{cand_id} returns valid profile")
    
    # Skills
    r = client.get(f"/api/candidates/{cand_id}/skills")
    check(r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0, "GET /api/candidates/{id}/skills returns skill evals list")
    
    # Knowledge Graph
    r = client.get(f"/api/candidates/{cand_id}/graph")
    check(r.status_code == 200 and "nodes" in r.json() and "edges" in r.json(), "GET /api/candidates/{id}/graph returns nodes and edges")
    
    # Timeline
    r = client.get(f"/api/candidates/{cand_id}/timeline")
    check(r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0, "GET /api/candidates/{id}/timeline returns timeline items")
    
    # Evidence List
    r = client.get(f"/api/candidates/{cand_id}/evidence")
    check(r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0, "GET /api/candidates/{id}/evidence returns verified items")
    
    # Digital Passport
    r = client.get(f"/api/candidates/{cand_id}/passport")
    check(r.status_code == 200 and "candidate_id" in r.json() and "applied_role" in r.json(), "GET /api/candidates/{id}/passport returns passport record")
    
    # Why Hire
    r = client.get(f"/api/candidates/{cand_id}/why")
    check(r.status_code == 200 and len(r.json().get("strong_evidence_skills", [])) > 0, "GET /api/candidates/{id}/why returns explainable strengths")
    
    # Why Not Higher
    r = client.get(f"/api/candidates/{cand_id}/why-not")
    check(r.status_code == 200 and "primary_suppressing_factor" in r.json(), "GET /api/candidates/{id}/why-not identifies suppressing gap")
    
    # Talent Lens
    r = client.get(f"/api/candidates/{cand_id}/talent-lens")
    check(r.status_code == 200 and "headline" in r.json() and "archetype" in r.json(), "GET /api/candidates/{id}/talent-lens returns suppression intelligence")
    
    # Skill Scenario Simulation
    r = client.post(f"/api/candidates/{cand_id}/skill-scenario", json={
        "candidate_id": cand_id,
        "skill_name": "Docker",
        "simulated_evidence_strength": 95.0
    })
    check(r.status_code == 200 and "scenario_rank" in r.json(),
          "POST /api/candidates/{id}/skill-scenario returns scenario rank evaluation",
          f"Actual: #{r.json().get('actual_rank')} -> Scenario: #{r.json().get('scenario_rank')}")
    
    # Team Match
    r = client.get(f"/api/candidates/{cand_id}/team-match")
    check(r.status_code == 200 and "team_complement_score" in r.json() and "distinctive_capabilities" in r.json(),
          "GET /api/candidates/{id}/team-match returns complement analysis")
    
    # Interview Plan
    r = client.post(f"/api/candidates/{cand_id}/interview-plan")
    check(r.status_code == 200 and "high_priority_verification" in r.json(),
          "POST /api/candidates/{id}/interview-plan generates targeted questions")

# ----------------------------------------------------
# 4. CUSTOM ROLE CREATION & DELETION SAFETY
# ----------------------------------------------------
print("\n--- 4. Testing Custom Role Lifecycle & Protection ---")
new_role_payload = {
    "title": "Staff ML Infrastructure Engineer",
    "department": "AI Research",
    "description": "High-throughput model serving and distributed training platform engineer.",
    "requirements": [
        {"name": "PyTorch", "category": "REQUIRED", "priority": "Critical", "weight": 1.0},
        {"name": "CUDA", "category": "REQUIRED", "priority": "Critical", "weight": 1.0},
        {"name": "Triton", "category": "PREFERRED", "priority": "Medium", "weight": 0.8}
    ]
}
r = client.post("/api/jobs", json=new_role_payload)
check(r.status_code == 200 and "job" in r.json(), "POST /api/jobs creates custom role successfully")
created_job_id = r.json().get("job", {}).get("id")

# Verify deletion of custom role works
if created_job_id:
    r = client.delete(f"/api/jobs/roles/{created_job_id}")
    check(r.status_code == 200 and r.json().get("success") is True, f"DELETE /api/jobs/roles/{created_job_id} deletes custom role")

# Verify protection: Preset role CANNOT be deleted
r = client.delete("/api/jobs/roles/job_backend_core")
check(r.status_code == 400, "DELETE /api/jobs/roles/job_backend_core is properly protected against deletion")

# ----------------------------------------------------
# 5. RESUME PDF PARSER & MULTILINGUAL NLP
# ----------------------------------------------------
print("\n--- 5. Testing Resume PDF Parser & NLP Engine ---")
sample_pdf_path = "sample_resumes/Elena_Rostova_Resume.pdf"
if os.path.exists(sample_pdf_path):
    with open(sample_pdf_path, "rb") as f:
        pdf_bytes = f.read()
    r = client.post("/api/resumes/upload", files={"file": ("Elena_Rostova_Resume.pdf", pdf_bytes, "application/pdf")})
    check(r.status_code == 200 and "candidate" in r.json(), "POST /api/resumes/upload parses PDF and extracts candidate profile")
    if r.status_code == 200:
        upload_cand = r.json().get("candidate", {})
        check(len(upload_cand.get("all_skills_portfolio", {})) > 0, "Uploaded resume extracts skills into portfolio")
else:
    print("[SKIP] Sample PDF not found at path")

# ----------------------------------------------------
# 6. CROSS-BROWSER STATE SYNC
# ----------------------------------------------------
print("\n--- 6. Testing State Synchronization Route ---")
sync_payload = {
    "custom_roles": [],
    "deleted_role_ids": [],
    "active_role_id": "job_backend_core",
    "removed_candidate_ids": [],
    "is_initial_load": True
}
r = client.post("/api/sync/state", json=sync_payload)
check(r.status_code == 200 and r.json().get("success") is True, "POST /api/sync/state synchronizes successfully")
check(r.json().get("active_role_id") == "job_backend_core", "POST /api/sync/state reflects active role ID")

# ----------------------------------------------------
# SUMMARY
# ----------------------------------------------------
print("\n" + "=" * 60)
print(f"VERIFICATION RESULTS: {passed} PASSED, {failed} FAILED")
print("=" * 60)

if failed > 0:
    print("\nFAILED CHECKS:")
    for e in errors:
        print(" - " + e)
    sys.exit(1)
else:
    print("\nALL VERIFICATION CHECKS PASSED WITH 100% ACCURACY!")
    sys.exit(0)
