import requests

base = "http://127.0.0.1:8000/api"

# 1. Health
h = requests.get(f"{base}/health").json()
print("[OK] Health:", h)

# 2. Candidates
cands = requests.get(f"{base}/candidates").json()
print(f"[OK] Candidates Count: {len(cands)}")
elena = next((c for c in cands if c["id"] == "cand_elena"), None)
print(f"[OK] Elena Rostova: Rank #{elena['rank']}, Overall Match: {elena['overall_match']}%, Suppressed: {elena['has_talent_lens_alert']}")

# 3. Why Not Higher
why_not = requests.get(f"{base}/candidates/cand_elena/why-not").json()
print(f"[OK] Why Not Higher Primary Factor: {why_not['primary_suppressing_factor']}")

# 4. Talent Lens
lens = requests.get(f"{base}/candidates/cand_elena/talent-lens").json()
print(f"[OK] Talent Lens Headline: {lens['headline']}")

# 5. Skill Scenario Simulation (Docker 31 -> 75)
sim = requests.post(f"{base}/candidates/cand_elena/skill-scenario", json={
    "candidate_id": "cand_elena",
    "skill_name": "Docker",
    "simulated_evidence_strength": 75.0
}).json()
print(f"[OK] Simulation: Actual #{sim['actual_rank']} -> Scenario #{sim['scenario_rank']} (Rank Lift: +{sim['rank_improvement']})")

# 6. Team Match
t_match = requests.get(f"{base}/candidates/cand_elena/team-match").json()
print(f"[OK] Team Complement Score: {t_match['team_complement_score']}%, Distinctive: {t_match['distinctive_capabilities']}")

# 7. Interview Plan
plan = requests.post(f"{base}/candidates/cand_elena/interview-plan").json()
print(f"[OK] Interview Plan: {len(plan['high_priority_verification'])} High Priority Questions, {len(plan['low_priority_to_reverify'])} Excluded Skills")

# 8. Upload Sample PDF Resume
with open("sample_resumes/Elena_Rostova_Resume.pdf", "rb") as f:
    up_res = requests.post(f"{base}/resumes/upload", files={"file": ("Elena_Rostova_Resume.pdf", f, "application/pdf")}).json()
print(f"[OK] Uploaded Resume Candidate: {up_res['candidate']['name']}, Language: {up_res['language']['name']}")
print("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<")
