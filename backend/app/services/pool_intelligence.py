from typing import Dict, List, Any
from app.models.schemas import JobRequirement, CandidateSkillEval

class PoolIntelligenceEngine:
    def __init__(self):
        pass

    def compute_pool_analytics(
        self,
        candidates: List[Dict[str, Any]],
        requirements: List[JobRequirement]
    ) -> Dict[str, Any]:
        """
        Analyze the full applicant pool distribution, availability percentages,
        rare skill combinations, and JD Expectation Signals.
        """
        total = len(candidates)
        if total == 0:
            return {}

        # 1. Skill Availability
        skill_counts: Dict[str, int] = {}
        for req in requirements:
            skill_counts[req.name] = 0

        for cand in candidates:
            skill_evals: Dict[str, CandidateSkillEval] = cand.get("skill_evals", {})
            for req in requirements:
                ev = skill_evals.get(req.name)
                if ev and ev.evidence_strength >= 50.0:
                    skill_counts[req.name] += 1

        skill_availability = []
        for req_name, count in skill_counts.items():
            pct = round((count / total) * 100.0, 1)
            skill_availability.append({
                "skill": req_name,
                "count": count,
                "percentage": pct,
                "rarity": "High Scarcity" if pct < 25.0 else ("Moderate" if pct < 60.0 else "Abundant")
            })

        skill_availability.sort(key=lambda x: x["percentage"], reverse=True)

        # 2. Rare Combinations Detection
        combos = [
            ("FastAPI + Docker + AWS", ["FastAPI", "Docker", "AWS"]),
            ("Python + Kafka + Kubernetes", ["Python", "Kafka", "Kubernetes"]),
            ("FastAPI + SQL + Redis", ["FastAPI", "SQL", "Redis"]),
            ("Docker + Kubernetes + CI/CD", ["Docker", "Kubernetes", "CI/CD"])
        ]

        rare_combinations = []
        for combo_name, combo_skills in combos:
            combo_candidates = []
            for cand in candidates:
                skill_evals = cand.get("skill_evals", {})
                has_all = True
                for sk in combo_skills:
                    ev = skill_evals.get(sk)
                    if not ev or ev.evidence_strength < 50.0:
                        has_all = False
                        break
                if has_all:
                    combo_candidates.append(cand["name"])

            rare_combinations.append({
                "name": combo_name,
                "skills": combo_skills,
                "count": len(combo_candidates),
                "percentage": round((len(combo_candidates) / total) * 100.0, 1),
                "candidates": combo_candidates[:5]
            })

        # 3. JD Expectation Signals
        signals = []
        for req in requirements:
            pct = next((s["percentage"] for s in skill_availability if s["skill"] == req.name), 0.0)
            if req.category == "REQUIRED" and pct < 25.0:
                signals.append({
                    "skill": req.name,
                    "level": "CAUTION_RESTRICTIVE",
                    "signal_type": "High Expectation Friction",
                    "message": (
                        f"'{req.name}' is currently marked REQUIRED, but supporting evidence appears in only "
                        f"{pct}% of this applicant pool. Marking this requirement as mandatory may prematurely disqualify "
                        f"up to {int(100 - pct)}% of candidates with strong core potential."
                    ),
                    "action_suggestion": "Consider relaxing to PREFERRED or verifying during technical interviews."
                })
            elif req.category == "PREFERRED" and pct > 75.0:
                signals.append({
                    "skill": req.name,
                    "level": "INFO_ABUNDANT",
                    "signal_type": "Market Saturation Signal",
                    "message": (
                        f"'{req.name}' is marked PREFERRED and is possessed by {pct}% of applicants. "
                        f"This provides high baseline confidence across the candidate pipeline."
                    ),
                    "action_suggestion": "Ideal baseline requirement; does not restrict pipeline volume."
                })

        return {
            "total_applicants": total,
            "skill_availability": skill_availability,
            "rare_combinations": rare_combinations,
            "jd_signals": signals,
            "confidence_distribution": {
                "high_confidence_candidates": sum(1 for c in candidates if c.get("raw_evidence_strength", 70) >= 80),
                "moderate_evidence_candidates": sum(1 for c in candidates if 50 <= c.get("raw_evidence_strength", 70) < 80),
                "uncertain_evidence_candidates": sum(1 for c in candidates if c.get("raw_evidence_strength", 70) < 50),
            }
        }

    def build_evidence_matrix(
        self,
        candidates: List[Dict[str, Any]],
        requirements: List[JobRequirement]
    ) -> Dict[str, Any]:
        """
        Build the interactive Heatmap matrix: Candidates x Requirements.
        Allows filtering by Required/Preferred and cell drilldowns.
        """
        required_cols = [r.name for r in requirements if r.category == "REQUIRED"]
        preferred_cols = [r.name for r in requirements if r.category == "PREFERRED"]

        matrix_rows = []
        for cand in candidates:
            row = {
                "candidate_id": cand["id"],
                "candidate_name": cand["name"],
                "rank": cand.get("rank", 1),
                "overall_match": cand.get("overall_match", 75.0),
                "required_scores": {},
                "preferred_scores": {},
                "evidence_details": {}
            }

            skill_evals: Dict[str, CandidateSkillEval] = cand.get("skill_evals", {})

            for r_name in required_cols:
                ev = skill_evals.get(r_name)
                score = ev.evidence_strength if ev else 0.0
                row["required_scores"][r_name] = round(score, 1)
                row["evidence_details"][r_name] = {
                    "score": round(score, 1),
                    "status": ev.detection_status if ev else "NOT DETECTED",
                    "category": "REQUIRED",
                    "why": ev.why_explanation if ev else ["No evidence detected"]
                }

            for p_name in preferred_cols:
                ev = skill_evals.get(p_name)
                score = ev.evidence_strength if ev else 0.0
                row["preferred_scores"][p_name] = round(score, 1)
                row["evidence_details"][p_name] = {
                    "score": round(score, 1),
                    "status": ev.detection_status if ev else "NOT DETECTED",
                    "category": "PREFERRED",
                    "why": ev.why_explanation if ev else ["No evidence detected"]
                }

            matrix_rows.append(row)

        return {
            "columns": {
                "required": required_cols,
                "preferred": preferred_cols
            },
            "rows": matrix_rows
        }

pool_intelligence = PoolIntelligenceEngine()
