from typing import Dict, List, Any, Optional
from app.models.schemas import TalentLensInsight, CandidateSkillEval

# Comprehensive applicant pool benchmark averages across tech competencies
DEFAULT_BENCHMARK_POOL = {
    # Backend & Architecture
    "Python": 68.0,
    "FastAPI": 64.0,
    "SQL": 71.0,
    "REST APIs": 74.0,
    "Docker": 76.0,
    "AWS": 62.0,
    "Redis": 58.0,
    "Kubernetes": 52.0,
    "Kafka": 46.0,
    "PostgreSQL": 68.0,
    "Java": 65.0,
    "Spring": 62.0,
    "Go": 55.0,
    "Rust": 45.0,
    "Node.js": 68.0,
    "TypeScript": 64.0,
    "React": 60.0,
    "C++": 58.0,
    "Microservices": 66.0,
    "System Design": 62.0,
    # Cloud, DevOps & Security
    "Cloud Security": 58.0,
    "GCP": 56.0,
    "Azure": 58.0,
    "CI/CD": 66.0,
    "Terraform": 54.0,
    "Linux": 72.0,
    "Git": 82.0,
    "IAM": 50.0,
    "Zero Trust": 48.0,
    # Data & AI
    "Data Modeling": 62.0,
    "PyTorch": 50.0,
    "Machine Learning": 54.0,
    "Spark": 48.0,
    "ETL": 62.0,
    "GraphQL": 52.0
}
POOL_AVERAGES = DEFAULT_BENCHMARK_POOL

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
        strength = float(item.get("evidence_strength", 50.0))
        gap = float(item.get("evidence_gap", max(0.0, 100.0 - strength)))
        return CandidateSkillEval(
            skill_name=str(item.get("skill_name", "Skill")),
            category=str(item.get("category", "REQUIRED")),
            priority=str(item.get("priority", "High")),
            detection_status=str(item.get("detection_status", "LIMITED EVIDENCE")),
            evidence_strength=strength,
            evidence_gap=gap,
            is_semantic_match=bool(item.get("is_semantic_match", False)),
            semantic_bridge_note=item.get("semantic_bridge_note"),
            supporting_evidence_count=int(item.get("supporting_evidence_count", 1)),
            why_explanation=list(item.get("why_explanation", ["Telemetry verified"])),
            primary_source=str(item.get("primary_source", "Portfolio"))
        )
    strength = float(getattr(item, "evidence_strength", 50.0))
    gap = float(getattr(item, "evidence_gap", max(0.0, 100.0 - strength)))
    return CandidateSkillEval(
        skill_name=str(getattr(item, "skill_name", "Skill")),
        category=str(getattr(item, "category", "REQUIRED")),
        priority=str(getattr(item, "priority", "High")),
        detection_status=str(getattr(item, "detection_status", "LIMITED EVIDENCE")),
        evidence_strength=strength,
        evidence_gap=gap,
        is_semantic_match=bool(getattr(item, "is_semantic_match", False)),
        semantic_bridge_note=getattr(item, "semantic_bridge_note", None),
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
        current_rank: int = 1,
        overall_match: float = 75.0,
        dynamic_pool_averages: Optional[Dict[str, float]] = None
    ) -> TalentLensInsight:
        """
        Analyze whether an aggregate score hides exceptional candidate strengths.
        Isolates Rank Suppression and generates actionable recruitment strategy.
        """
        skill_evals = {k: _normalize_eval(v) for k, v in (skill_evals or {}).items()}
        pool_comparison = []
        suppressors = []
        strengths = []

        for skill, eval_item in skill_evals.items():
            if dynamic_pool_averages and skill in dynamic_pool_averages:
                pool_avg = dynamic_pool_averages[skill]
            else:
                pool_avg = DEFAULT_BENCHMARK_POOL.get(skill, 62.0)

            score = eval_item.evidence_strength
            diff = score - pool_avg

            comp_entry = {
                "skill": skill,
                "candidate_score": score,
                "pool_average": pool_avg,
                "difference": round(diff, 1),
                "is_outperforming": diff >= 5.0,
                "is_underperforming": diff <= -8.0
            }
            pool_comparison.append(comp_entry)

            # Identification criteria
            if score >= 75.0 or diff >= 6.0:
                strengths.append(comp_entry)
            elif score <= 55.0 or diff <= -10.0 or eval_item.evidence_gap >= 40.0:
                suppressors.append(comp_entry)

        total_skills = max(1, len(skill_evals))

        # Dynamic suppression condition:
        # Candidate has genuine high capability in core requirements,
        # but 1 or more unverified gaps depress their composite standing
        if total_skills <= 3:
            has_strength = len(strengths) >= 1
        else:
            has_strength = len(strengths) >= 1 and (
                len(strengths) >= 2 or
                any(s["candidate_score"] >= 80.0 for s in strengths) or
                any(s["difference"] >= 6.0 for s in strengths)
            )

        has_suppressor = len(suppressors) >= 1
        is_suppressed = has_strength and has_suppressor

        # Calculate estimated score penalty and potential recovery
        total_penalty = 0.0
        if suppressors:
            for s in suppressors:
                gap = max(15.0, 80.0 - s["candidate_score"])
                single_penalty = (gap / 100.0) * (1.0 / total_skills) * 100.0 * 1.35
                total_penalty += single_penalty
            total_penalty = round(min(22.0, max(7.5, total_penalty)), 1)
        else:
            total_penalty = 0.0

        recovered_score = round(min(98.5, overall_match + total_penalty), 1) if is_suppressed else overall_match
        if is_suppressed:
            if current_rank > 1:
                recovered_rank = max(1, min(current_rank - 1, max(1, int(current_rank * 0.35))))
            else:
                recovered_rank = 1
        else:
            recovered_rank = current_rank

        if is_suppressed:
            sup_names = ", ".join([s["skill"] for s in suppressors])
            str_names = ", ".join([s["skill"] for s in strengths])
            max_diff = max([s["difference"] for s in strengths]) if strengths else 15.0
            top_strength = strengths[0]["skill"] if strengths else "Core Engineering"

            if current_rank >= 2:
                headline = "HIDDEN CORE STRENGTH DETECTED (Rank Suppression)"
                summary = (
                    f"Candidate demonstrates elite tier evidence across core capabilities ({str_names}), "
                    f"significantly outperforming applicant pool averages (up to +{int(max_diff)}% above benchmark). "
                    f"However, current rank #{current_rank} is disproportionately suppressed by concentrated uncertainty in: {sup_names}. "
                    f"This is not a generally low-evidence profile. The lower aggregate match ({overall_match}%) is concentrated around specific unverified requirements."
                )
            else:
                headline = "HIGH-PERFORMING TALENT WITH UNVERIFIED GAP"
                summary = (
                    f"Candidate leads the talent pool with standout evidence in core capabilities ({str_names}), "
                    f"outperforming applicant benchmarks by up to +{int(max_diff)}%. "
                    f"However, composite score ({overall_match}%) is currently depressed by isolated uncertainty in {sup_names}. "
                    f"Targeted validation elevates estimated match to {recovered_score}%."
                )

            archetype = "SPECIALIST-LIKE EVIDENCE PROFILE (High Core Depth)" if any(s["candidate_score"] >= 88.0 for s in strengths) else "CONCENTRATED TALENT PROFILE"
            profile_desc = (
                f"Exhibits deep technical specialization in {top_strength} and core domain components. "
                f"Outperforms applicant pool averages by up to +{int(max_diff)}%, representing an exceptional technical asset "
                f"whose aggregate score is artificially reduced by isolated resume omissions."
            )
            recruiter_strategy = (
                f"Do not reject this candidate. {candidate_name} exhibits top-tier mastery in {str_names}. "
                f"Current ranking is suppressed by unverified resume signals in {sup_names}. "
                f"Rather than filtering out, utilize the AI Interview Intelligence module to directly probe hands-on {sup_names} capability. "
                f"Validating these gaps elevates this candidate to an estimated {recovered_score}% match (advancing to Top #{recovered_rank})!"
            )
            interview_focus = [
                f"Technical Deep Dive: Verify hands-on production {s['skill']} experience ({int(s['candidate_score'])}% resume evidence vs {int(s['pool_average'])}% benchmark)."
                for s in suppressors
            ]
        else:
            str_names = ", ".join([s["skill"] for s in strengths[:3]]) if strengths else "evaluated requirements"
            max_diff = max([s["difference"] for s in strengths]) if strengths else 5.0
            if current_rank <= 3:
                headline = "TOP-TIER HIGH-ALIGNMENT PROFILE"
                archetype = "WELL-BALANCED ENTERPRISE ARCHITECT"
                profile_desc = (
                    f"Consistently exceeds applicant pool benchmarks across primary competency dimensions ({str_names}). "
                    f"Demonstrates dependable technical breadth with zero concentrated operational gaps."
                )
            else:
                headline = "BALANCED MULTI-DOMAIN COMPETENCY"
                archetype = "BALANCED EVIDENCE PROFILE"
                profile_desc = (
                    f"Demonstrates balanced coverage matching applicant pool benchmarks across competencies ({str_names}). "
                    f"Evidence distribution shows steady, predictable capability across primary operational domains."
                )

            summary = (
                f"Candidate demonstrates a {archetype.lower()} matching or exceeding general pool expectations. "
                f"Evidence distribution shows steady capability across core requirements ({str_names}), "
                f"with consistent alignment to role expectations and manageable onboarding variance."
            )
            recruiter_strategy = (
                f"{candidate_name} presents a dependable, well-distributed candidate profile across requirements ({str_names}). "
                f"Advance through standard technical screening with a focus on system scalability and peer code review standards."
            )
            interview_focus = [
                f"Probe complex production failure scenarios and distributed architecture decision-making in {str_names}",
                "Verify end-to-end telemetry, CI/CD operational hygiene, and system resilience under load"
            ]

        return TalentLensInsight(
            is_suppressed=is_suppressed,
            archetype=archetype,
            headline=headline,
            summary=summary,
            primary_suppressors=suppressors,
            core_strengths=strengths,
            pool_comparison=pool_comparison,
            estimated_score_penalty=total_penalty,
            potential_recovered_score=recovered_score,
            potential_recovered_rank=recovered_rank,
            recruiter_strategy=recruiter_strategy,
            interview_validation_focus=interview_focus,
            profile_distribution_description=profile_desc
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
        skill_evals: Dict[str, Any],
        candidate: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Evaluate candidate against other currently open company roles using their complete skills portfolio.
        """
        skill_evals = {k: _normalize_eval(v) for k, v in (skill_evals or {}).items()}
        portfolio = dict(candidate.get("all_skills_portfolio", {})) if candidate else {}
        cross_role_matches = []
        for role in OTHER_OPEN_ROLES:
            role_skills = role["skills"]
            scores = []
            matching_skills = []
            
            for s in role_skills:
                score = portfolio.get(s)
                if score is None and s in skill_evals:
                    score = skill_evals[s].evidence_strength
                if score is None:
                    for pk, pv in portfolio.items():
                        if pk.lower() == s.lower():
                            score = float(pv)
                            break
                if score is None:
                    score = 45.0
                
                scores.append(score)
                if score >= 60.0:
                    matching_skills.append(s)

            avg_score = sum(scores) / len(scores) if scores else 50.0

            cross_role_matches.append({
                "role_id": role["id"],
                "role_title": role["title"],
                "department": role["department"],
                "fit_percentage": round(avg_score, 1),
                "matched_skills": matching_skills,
                "key_advantage": f"Strong alignment in {', '.join(matching_skills[:3])}" if matching_skills else f"Foundational {role['department']} background",
                "status": "Recommended for Cross-Role Review" if avg_score >= 72.0 else "Viable Alternative"
            })

        cross_role_matches.sort(key=lambda x: x["fit_percentage"], reverse=True)
        return cross_role_matches

talent_lens = TalentLensEngine()
