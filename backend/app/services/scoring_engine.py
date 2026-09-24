from typing import List, Dict, Any, Optional, Tuple
from app.models.schemas import (
    ScoringWeights, JobRequirement, CandidateSkillEval, RankedCandidate,
    RankingAuditEntry
)
import datetime
import uuid

class ScoringEngine:
    def __init__(self):
        self.default_weights = ScoringWeights()
        self.audit_log: List[RankingAuditEntry] = [
            RankingAuditEntry(
                id="audit_init",
                timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                action="INITIAL_CALIBRATION",
                old_config={},
                new_config=self.default_weights.model_dump(),
                affected_rankings=[],
                reason="Default baseline scoring profile configured for Backend Engineer role"
            )
        ]

    def compute_candidate_score(
        self,
        candidate: Dict[str, Any],
        requirements: List[JobRequirement],
        weights: ScoringWeights
    ) -> Dict[str, Any]:
        """
        Compute explainable score components:
        - Required requirement coverage
        - Preferred requirement coverage
        - Average evidence strength
        - Experience score
        - Recency score
        - Overall composite score
        """
        # Ensure all requirements are normalized to JobRequirement objects
        normalized_reqs = []
        for r in requirements:
            if isinstance(r, JobRequirement):
                normalized_reqs.append(r)
            elif isinstance(r, dict):
                normalized_reqs.append(JobRequirement(**r))
            else:
                normalized_reqs.append(r)

        required_reqs = [r for r in normalized_reqs if r.category == "REQUIRED"]
        preferred_reqs = [r for r in normalized_reqs if r.category == "PREFERRED"]
        bonus_reqs = [r for r in normalized_reqs if r.category == "BONUS"]

        skill_evals: Dict[str, CandidateSkillEval] = candidate.get("skill_evals", {})

        # 1. Required Coverage
        req_strengths = []
        req_detected_count = 0
        for r in required_reqs:
            eval_item = skill_evals.get(r.name)
            str_val = eval_item.evidence_strength if eval_item else 0.0
            req_strengths.append(str_val * r.weight)
            if str_val >= 50.0:
                req_detected_count += 1
        
        req_coverage = (sum(req_strengths) / (sum(r.weight for r in required_reqs) * 100.0) * 100.0) if required_reqs else 100.0
        req_ratio = f"{req_detected_count}/{len(required_reqs)}"

        # 2. Preferred Coverage
        pref_strengths = []
        pref_detected_count = 0
        for p in preferred_reqs:
            eval_item = skill_evals.get(p.name)
            str_val = eval_item.evidence_strength if eval_item else 0.0
            pref_strengths.append(str_val * p.weight)
            if str_val >= 50.0:
                pref_detected_count += 1

        pref_coverage = (sum(pref_strengths) / (sum(p.weight for p in preferred_reqs) * 100.0) * 100.0) if preferred_reqs else 100.0
        pref_ratio = f"{pref_detected_count}/{len(preferred_reqs)}"

        # 3. Overall Evidence Strength across all role skills
        all_evals = list(skill_evals.values())
        if all_evals:
            avg_evidence_strength = sum(e.evidence_strength for e in all_evals) / len(all_evals)
        else:
            avg_evidence_strength = candidate.get("raw_evidence_strength", 65.0)

        # 4. Relevant Experience (cap at 6 years for max score 100)
        years_exp = candidate.get("years_of_experience", 3.0)
        exp_score = min(100.0, (years_exp / 5.0) * 100.0)

        # 5. Recency (higher if active projects/roles in 2025/2026)
        has_recent = candidate.get("has_recent_activity", True)
        recency_score = 95.0 if has_recent else 60.0

        # Composite score
        composite = (
            (req_coverage * weights.required_skills) +
            (pref_coverage * weights.preferred_skills) +
            (avg_evidence_strength * weights.evidence_strength) +
            (exp_score * weights.relevant_experience) +
            (recency_score * weights.recency)
        )

        return {
            "overall_match": round(composite, 1),
            "required_coverage": round(req_coverage, 1),
            "preferred_coverage": round(pref_coverage, 1),
            "evidence_strength": round(avg_evidence_strength, 1),
            "required_ratio": req_ratio,
            "preferred_ratio": pref_ratio,
            "exp_score": round(exp_score, 1),
            "recency_score": round(recency_score, 1),
            "breakdown": {
                "Required Skills": round(req_coverage * weights.required_skills, 1),
                "Preferred Skills": round(pref_coverage * weights.preferred_skills, 1),
                "Evidence Strength": round(avg_evidence_strength * weights.evidence_strength, 1),
                "Relevant Experience": round(exp_score * weights.relevant_experience, 1),
                "Recency": round(recency_score * weights.recency, 1)
            }
        }

    def rank_candidates(
        self,
        candidates: List[Dict[str, Any]],
        requirements: List[JobRequirement],
        weights: ScoringWeights,
        previous_ranks: Optional[Dict[str, int]] = None,
        reason: Optional[str] = None
    ) -> Tuple[List[RankedCandidate], Optional[RankingAuditEntry]]:
        """
        Rank candidate list, calculating rank movements and audit log.
        """
        normalized_reqs = []
        for r in requirements:
            if isinstance(r, JobRequirement):
                normalized_reqs.append(r)
            elif isinstance(r, dict):
                normalized_reqs.append(JobRequirement(**r))
            else:
                normalized_reqs.append(r)
        requirements = normalized_reqs

        scored_list = []
        for cand in candidates:
            score_res = self.compute_candidate_score(cand, requirements, weights)
            scored_list.append((cand, score_res))

        # Sort descending by overall match, then required coverage
        scored_list.sort(key=lambda x: (x[1]["overall_match"], x[1]["required_coverage"]), reverse=True)

        ranked: List[RankedCandidate] = []
        rank_movements = []

        for idx, (cand, score_res) in enumerate(scored_list):
            current_rank = idx + 1
            cand_id = cand["id"]
            prev_rank = previous_ranks.get(cand_id) if previous_ranks else current_rank
            delta = (prev_rank - current_rank) if prev_rank else 0

            # Major gap detection
            major_gap = None
            skill_evals = cand.get("skill_evals", {})
            for r in requirements:
                if r.category == "REQUIRED" and r.name in skill_evals:
                    if skill_evals[r.name].evidence_strength < 50.0:
                        major_gap = r.name
                        break
            if not major_gap:
                for r in requirements:
                    if r.category == "PREFERRED" and r.name in skill_evals:
                        if skill_evals[r.name].evidence_strength < 45.0:
                            major_gap = r.name
                            break

            # Talent Lens Badge
            has_talent_lens = cand.get("is_suppressed", False)
            tl_badge = "Hidden Core Strength" if has_talent_lens else None

            ranked_item = RankedCandidate(
                id=cand_id,
                name=cand["name"],
                email=cand.get("email", ""),
                current_title=cand.get("current_title", "Software Engineer"),
                current_company=cand.get("current_company"),
                rank=current_rank,
                previous_rank=prev_rank,
                rank_delta=delta,
                overall_match=score_res["overall_match"],
                required_coverage=score_res["required_coverage"],
                preferred_coverage=score_res["preferred_coverage"],
                evidence_strength=score_res["evidence_strength"],
                required_ratio=score_res["required_ratio"],
                preferred_ratio=score_res["preferred_ratio"],
                major_gap=major_gap,
                has_talent_lens_alert=has_talent_lens,
                talent_lens_badge=tl_badge,
                profile_archetype=cand.get("archetype", "BALANCED"),
                resume_language=cand.get("language", "en"),
                years_of_experience=cand.get("years_of_experience", 3.5)
            )
            ranked.append(ranked_item)

            if delta != 0:
                rank_movements.append({
                    "candidate_id": cand_id,
                    "name": cand["name"],
                    "old_rank": prev_rank,
                    "new_rank": current_rank,
                    "delta": delta
                })

        audit_entry = None
        if reason:
            audit_entry = RankingAuditEntry(
                id=f"audit_{uuid.uuid4().hex[:8]}",
                timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                action="RE_RANKING_TRIGGERED",
                old_config={},
                new_config=weights.model_dump(),
                affected_rankings=rank_movements[:10],
                reason=reason
            )
            self.audit_log.insert(0, audit_entry)

        return ranked, audit_entry

scoring_engine = ScoringEngine()
