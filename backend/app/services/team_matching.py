from typing import Dict, List, Any
from app.models.schemas import TeamMatchAnalysis, CandidateSkillEval

# Baseline capability levels of current Backend Engineering Team (10 engineers)
TEAM_CAPABILITIES = {
    "Python": {"level": "STRONG", "coverage": 95.0, "headcount": 10},
    "FastAPI": {"level": "STRONG", "coverage": 90.0, "headcount": 9},
    "SQL": {"level": "STRONG", "coverage": 92.0, "headcount": 9},
    "REST APIs": {"level": "STRONG", "coverage": 88.0, "headcount": 8},
    "Docker": {"level": "MODERATE", "coverage": 55.0, "headcount": 5},
    "AWS": {"level": "LIMITED", "coverage": 32.0, "headcount": 3},
    "Redis": {"level": "MODERATE", "coverage": 50.0, "headcount": 4},
    "Kafka": {"level": "LIMITED", "coverage": 22.0, "headcount": 2},
    "Kubernetes": {"level": "LIMITED", "coverage": 18.0, "headcount": 1},
    "GraphQL": {"level": "LIMITED", "coverage": 15.0, "headcount": 1}
}

class TeamMatchingEngine:
    def __init__(self):
        pass

    def get_team_profile(self) -> Dict[str, Any]:
        """Returns the current team skill distribution and coverage levels."""
        return {
            "team_name": "Core Backend & Platform Team",
            "size": 10,
            "capabilities": TEAM_CAPABILITIES
        }

    def analyze_team_complement(
        self,
        candidate_name: str,
        candidate_skills: Dict[str, Any],
        role_match_score: float
    ) -> TeamMatchAnalysis:
        """
        Analyze whether candidate brings capabilities currently missing or limited in the team,
        or reinforces existing strengths.
        """
        distinctive = []
        overlapping = []
        remaining_gaps = []

        for skill, team_data in TEAM_CAPABILITIES.items():
            cand_eval = (candidate_skills or {}).get(skill)
            if isinstance(cand_eval, dict):
                cand_score = float(cand_eval.get("evidence_strength", 0.0))
            elif cand_eval:
                cand_score = float(getattr(cand_eval, "evidence_strength", 0.0))
            else:
                cand_score = 0.0

            if cand_score >= 65.0:
                if team_data["coverage"] <= 40.0:
                    # Low team coverage, high candidate capability = Great complement!
                    distinctive.append(skill)
                else:
                    overlapping.append(skill)
            else:
                if team_data["coverage"] <= 35.0:
                    remaining_gaps.append(skill)

        # Team complement score calculation
        # Higher if candidate possesses capabilities the team lacks
        complement_bonus = min(100.0, len(distinctive) * 30.0 + len(overlapping) * 10.0)

        distinctive_str = ", ".join(distinctive) if distinctive else "None detected"
        analysis_text = (
            f"Candidate brings high evidence in capabilities where the existing team has limited coverage ({distinctive_str}). "
            f"While maintaining strong overlap in core technologies ({', '.join(overlapping[:3])}), this candidate could "
            f"serve as a domain specialist for under-represented infrastructure capabilities."
            if distinctive else
            f"Candidate profile aligns closely with existing team strengths ({', '.join(overlapping[:4])}), providing "
            f"solid reinforcement without introducing new specialization domains."
        )

        return TeamMatchAnalysis(
            role_match_score=role_match_score,
            team_complement_score=round(complement_bonus, 1),
            distinctive_capabilities=distinctive,
            overlapping_capabilities=overlapping,
            remaining_team_gaps=remaining_gaps,
            analysis_text=analysis_text
        )

team_matching = TeamMatchingEngine()
