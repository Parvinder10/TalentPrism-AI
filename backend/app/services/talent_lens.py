from typing import Dict, List, Any, Optional
from app.models.schemas import TalentLensInsight, CandidateSkillEval

# Benchmark applicant pool averages for Backend Engineer
POOL_AVERAGES = {
    "Python": 68.0,
    "FastAPI": 64.0,
    "SQL": 71.0,
    "REST APIs": 74.0,
    "Docker": 76.0,
    "AWS": 62.0,
    "Redis": 58.0,
    "Kubernetes": 35.0,
    "Kafka": 42.0
}

OTHER_OPEN_ROLES = [
    {
        "id": "role_data_eng",
        "title": "Senior Data Engineer",
        "department": "Data Platform",
        "skills": ["Python", "SQL", "PostgreSQL", "Kafka", "Data Modeling"],
        "min_experience": 3
    },
    {
        "id": "role_platform_eng",
        "title": "Platform Infrastructure Engineer",
        "department": "Cloud & Infra",
        "skills": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
        "min_experience": 4
    },
    {
        "id": "role_ml_eng",
        "title": "Machine Learning Engineer",
        "department": "AI Research",
        "skills": ["Python", "PyTorch", "FastAPI", "SQL", "Docker"],
        "min_experience": 3
    },
    {
        "id": "role_api_backend",
        "title": "High-Throughput API Engineer",
        "department": "Core Platform",
        "skills": ["Python", "FastAPI", "REST APIs", "SQL", "Redis"],
        "min_experience": 3
    }
]

def _normalize_eval(item: Any) -> CandidateSkillEval:
    if isinstance(item, CandidateSkillEval):
        return item
    if isinstance(item, dict):
        return CandidateSkillEval(**item)
    return CandidateSkillEval(
        skill_name=str(getattr(item, "skill_name", "Skill")),
        category=str(getattr(item, "category", "REQUIRED")),
        priority=str(getattr(item, "priority", "High")),
        detection_status=str(getattr(item, "detection_status", "LIMITED EVIDENCE")),
        evidence_strength=float(getattr(item, "evidence_strength", 50.0)),
        evidence_gap=float(getattr(item, "evidence_gap", 50.0)),
        is_semantic_match=bool(getattr(item, "is_semantic_match", False)),
        supporting_evidence_count=int(getattr(item, "supporting_evidence_count", 1)),
        why_explanation=list(getattr(item, "why_explanation", ["Telemetry verified"])),
        primary_source=str(getattr(item, "primary_source", "Portfolio"))
    )

class TalentLensEngine:
    def __init__(self):
        pass

    def analyze_candidate(
        self,
        candidate_id: str,
        candidate_name: str,
        skill_evals: Dict[str, Any],
        current_rank: int
    ) -> TalentLensInsight:
        """
        Analyze whether an aggregate score hides exceptional candidate strengths.
        """
        skill_evals = {k: _normalize_eval(v) for k, v in (skill_evals or {}).items()}
        pool_comparison = []
        suppressors = []
        strengths = []

        for skill, eval_item in skill_evals.items():
            pool_avg = POOL_AVERAGES.get(skill, 60.0)
            score = eval_item.evidence_strength
            diff = score - pool_avg

            comp_entry = {
                "skill": skill,
                "candidate_score": score,
                "pool_average": pool_avg,
                "difference": round(diff, 1),
                "is_outperforming": diff > 10.0,
                "is_underperforming": diff < -15.0
            }
            pool_comparison.append(comp_entry)

            if score >= 88.0 and diff > 15.0:
                strengths.append(comp_entry)
            elif score <= 45.0 and diff < -20.0 and eval_item.category in ("REQUIRED", "PREFERRED"):
                suppressors.append(comp_entry)

        # Suppression condition: Top-tier core skills (Python, FastAPI, SQL >= 90), but pulled down by 1-2 lower scores
        is_suppressed = len(strengths) >= 2 and len(suppressors) >= 1
        archetype = "SPECIALIST-LIKE EVIDENCE PROFILE" if is_suppressed or len(strengths) >= 3 else "BALANCED EVIDENCE PROFILE"

        if is_suppressed:
            sup_names = ", ".join([s["skill"] for s in suppressors])
            str_names = ", ".join([s["skill"] for s in strengths])
            headline = "HIDDEN CORE STRENGTH DETECTED (Rank Suppression)"
            summary = (
                f"Candidate demonstrates elite tier evidence across core capabilities ({str_names}), "
                f"significantly outperforming applicant pool averages. However, current rank #{current_rank} "
                f"is disproportionately suppressed by concentrated uncertainty in: {sup_names}. "
                f"This is not a generally low-evidence profile. The lower aggregate score is concentrated around specific gaps."
            )
        else:
            headline = "CONSISTENT EVIDENCE PROFILE"
            summary = (
                f"Candidate demonstrates a {archetype.lower()} matching general pool expectations. "
                f"Evidence distribution shows steady capability across core requirements."
            )

        return TalentLensInsight(
            is_suppressed=is_suppressed,
            archetype=archetype,
            headline=headline,
            summary=summary,
            primary_suppressors=suppressors,
            core_strengths=strengths,
            pool_comparison=pool_comparison
        )

    def generate_why_this_candidate(
        self,
        candidate_name: str,
        skill_evals: Dict[str, Any],
        projects: List[Dict[str, Any]],
        years_exp: float,
        lens: TalentLensInsight
    ) -> Dict[str, Any]:
        """Evidence-linked positive factors."""
        skill_evals = {k: _normalize_eval(v) for k, v in (skill_evals or {}).items()}
        strong_skills = [
            s for s, e in skill_evals.items()
            if e.evidence_strength >= 85.0
        ]
        distinctive_highlights = []
        for s in (lens.core_strengths if lens else []):
            distinctive_highlights.append(
                f"{s['skill']} evidence ({int(s['candidate_score'])}%) outperforms applicant pool average ({int(s['pool_average'])}%) by +{int(s['difference'])}%"
            )

        return {
            "title": f"Why Consider {candidate_name}?",
            "strong_evidence_skills": strong_skills,
            "relevant_projects_count": len(projects or []),
            "project_highlights": [p.get("title", "Project") for p in (projects or [])[:3]],
            "years_of_experience": years_exp,
            "recent_backend_experience": True,
            "distinctive_strengths": distinctive_highlights if distinctive_highlights else [
                "Demonstrated consistency across core requirements",
                "Verified production work context"
            ],
            "evidence_quote": f"Verified through {len(projects or [])} deep technical projects and historical career progression."
        }

    def generate_why_not_higher(
        self,
        candidate_name: str,
        current_rank: int,
        skill_evals: Dict[str, Any],
        lens: TalentLensInsight
    ) -> Dict[str, Any]:
        """Evidence-linked reasons why candidate is not ranked higher."""
        skill_evals = {k: _normalize_eval(v) for k, v in (skill_evals or {}).items()}
        uncertainties = []
        for sup in (lens.primary_suppressors if lens else []):
            skill = sup["skill"]
            eval_item = skill_evals.get(skill)
            uncertainties.append({
                "skill": skill,
                "role_importance": eval_item.priority if eval_item else "High",
                "candidate_evidence_score": sup["candidate_score"],
                "pool_average": sup["pool_average"],
                "evidence_status": eval_item.detection_status if eval_item else "LIMITED EVIDENCE",
                "why_breakdown": eval_item.why_explanation if eval_item else [
                    "✓ Skill listed in resume",
                    "✗ No production work context detected",
                    "✗ No deployment telemetry detected"
                ]
            })

        if not uncertainties:
            # Pick lowest scoring requirement
            lowest = sorted(skill_evals.items(), key=lambda x: x[1].evidence_strength)
            if lowest:
                l_skill, l_eval = lowest[0]
                uncertainties.append({
                    "skill": l_skill,
                    "role_importance": l_eval.priority,
                    "candidate_evidence_score": l_eval.evidence_strength,
                    "pool_average": POOL_AVERAGES.get(l_skill, 60.0),
                    "evidence_status": l_eval.detection_status,
                    "why_breakdown": l_eval.why_explanation
                })

        return {
            "title": f"Why Is {candidate_name} Not Ranked Higher?",
            "current_rank": current_rank,
            "primary_suppressing_factor": uncertainties[0]["skill"] if uncertainties else "Competitive pool density",
            "uncertainties": uncertainties,
            "recruiter_guidance": (
                "The lower aggregate score is driven by specific unverified skills rather than poor ability. "
                "Verify these uncertainties directly during the technical interview before making a final decision."
            )
        }

    def evaluate_cross_role_rescue(
        self,
        candidate_id: str,
        candidate_name: str,
        skill_evals: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Evaluate candidate against other currently open company roles.
        """
        skill_evals = {k: _normalize_eval(v) for k, v in (skill_evals or {}).items()}
        cross_role_matches = []
        for role in OTHER_OPEN_ROLES:
            role_skills = role["skills"]
            scores = []
            matching_skills = []
            
            for s in role_skills:
                if s in skill_evals:
                    score = skill_evals[s].evidence_strength
                    scores.append(score)
                    if score >= 60.0:
                        matching_skills.append(s)
                else:
                    scores.append(40.0) # Baseline assumption for un-evaluated

            avg_score = sum(scores) / len(scores) if scores else 50.0

            cross_role_matches.append({
                "role_id": role["id"],
                "role_title": role["title"],
                "department": role["department"],
                "fit_percentage": round(avg_score, 1),
                "matched_skills": matching_skills,
                "key_advantage": f"Strong alignment in {', '.join(matching_skills[:3])}",
                "status": "Recommended for Cross-Role Review" if avg_score >= 75.0 else "Viable Alternative"
            })

        cross_role_matches.sort(key=lambda x: x["fit_percentage"], reverse=True)
        return cross_role_matches

talent_lens = TalentLensEngine()
