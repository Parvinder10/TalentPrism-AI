import re
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.models.schemas import (
    EvidenceItem, CandidateSkillEval, GraphNode, GraphEdge, SkillGraphData,
    TimelineYearGroup, EvidenceClassification, DetectionStatus, EvidenceStrengthLevel
)
from app.services.nlp_engine import nlp_engine, CANONICAL_SKILLS

class EvidenceEngine:
    def __init__(self):
        pass

    def evaluate_skill_evidence(
        self,
        candidate_id: str,
        skill_name: str,
        evidence_list: List[EvidenceItem],
        category: str = "REQUIRED",
        priority: str = "Critical"
    ) -> CandidateSkillEval:
        """
        Evaluate candidate evidence for a given skill.
        Calculates evidence strength (0-100), detection status, and provides the 'WHY' explanation.
        """
        skill_evidence = [e for e in evidence_list if e.skill_name.lower() == skill_name.lower()]
        
        # If no direct evidence, check semantic bridge
        semantic_match = False
        semantic_note = None
        if not skill_evidence:
            all_texts = [e.source_text for e in evidence_list]
            is_match, note, sim = nlp_engine.detect_semantic_bridge(skill_name, all_texts)
            if is_match:
                semantic_match = True
                semantic_note = note

        if not skill_evidence and not semantic_match:
            return CandidateSkillEval(
                skill_name=skill_name,
                category=category,
                priority=priority,
                detection_status=DetectionStatus.NOT_DETECTED,
                evidence_strength=0.0,
                evidence_gap=100.0,
                is_semantic_match=False,
                supporting_evidence_count=0,
                why_explanation=[
                    "✗ No direct keyword found in resume",
                    "✗ No project context mentioning this skill detected",
                    "✗ No professional employment evidence detected",
                    "ℹ Note: Absence of resume evidence does not prove lack of ability"
                ],
                primary_source=None
            )

        if semantic_match and not skill_evidence:
            # Candidate has strong related capabilities
            return CandidateSkillEval(
                skill_name=skill_name,
                category=category,
                priority=priority,
                detection_status=DetectionStatus.SEMANTICALLY_DETECTED,
                evidence_strength=65.0,
                evidence_gap=35.0,
                is_semantic_match=True,
                semantic_bridge_note=semantic_note,
                supporting_evidence_count=1,
                why_explanation=[
                    f"✓ Semantically detected through related domain experience",
                    f"✓ {semantic_note}",
                    "✗ Exact requirement terminology not explicitly claimed",
                    "ℹ Candidate demonstrates transferrable capability in this domain"
                ],
                primary_source="Semantic Skill Bridge"
            )

        # Calculate evidence strength based on source types and context signals
        has_work = any(e.source_type == "work_experience" for e in skill_evidence)
        has_project = any(e.source_type == "project" for e in skill_evidence)
        has_cert = any(e.source_type == "certification" for e in skill_evidence)
        has_recent = any(e.is_recent for e in skill_evidence)
        
        # Base score from max evidence item strength
        base_strength = max((e.evidence_strength for e in skill_evidence), default=40.0)
        
        # Bonus for multiple corroborating sources
        if has_work and has_project:
            base_strength = min(100.0, base_strength + 10.0)
        if has_cert:
            base_strength = min(100.0, base_strength + 5.0)

        evidence_gap = max(0.0, 100.0 - base_strength)

        # Detection status classification
        if base_strength >= 80.0:
            status = DetectionStatus.SUPPORTED_BY_EVIDENCE
        elif base_strength >= 50.0:
            status = DetectionStatus.EXPLICITLY_LISTED
        else:
            status = DetectionStatus.LIMITED_EVIDENCE

        # Detailed why explanation
        why_bullets = []
        for e in skill_evidence:
            if e.context_signals:
                for sig in e.context_signals:
                    why_bullets.append(f"✓ {sig}")
            if e.missing_context:
                for mis in e.missing_context:
                    why_bullets.append(f"✗ {mis}")

        if not why_bullets:
            if has_work:
                why_bullets.append(f"✓ Work experience confirms {skill_name} in production")
            if has_project:
                why_bullets.append(f"✓ Portfolio project implements {skill_name}")
            if has_recent:
                why_bullets.append(f"✓ Recent usage (2024-2026)")
            if not has_work:
                why_bullets.append(f"✗ No professional work context detected")

        primary_source = skill_evidence[0].source_title if skill_evidence else "Resume"

        return CandidateSkillEval(
            skill_name=skill_name,
            category=category,
            priority=priority,
            detection_status=status,
            evidence_strength=round(base_strength, 1),
            evidence_gap=round(evidence_gap, 1),
            is_semantic_match=False,
            semantic_bridge_note=None,
            supporting_evidence_count=len(skill_evidence),
            why_explanation=why_bullets[:4],
            primary_source=primary_source
        )

    def build_candidate_skill_graph(
        self,
        candidate_id: str,
        candidate_name: str,
        evidence_list: List[EvidenceItem],
        projects: List[Dict[str, Any]],
        experiences: List[Dict[str, Any]],
        certifications: List[str] = [],
        education: List[str] = []
    ) -> SkillGraphData:
        """
        Build an interactive knowledge graph containing:
        Candidate -> WORKED_AT -> Company
        Candidate -> WORKED_AS -> Role
        Candidate -> BUILT -> Project
        Candidate -> HAS_SKILL -> Skill
        Project -> USED -> Skill
        Role -> USED -> Skill
        Candidate -> CERTIFIED_IN -> Certification
        """
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []
        node_ids = set()

        def add_node(nid: str, label: str, ntype: str, props: Dict[str, Any] = None):
            if nid not in node_ids:
                node_ids.add(nid)
                nodes.append(GraphNode(
                    id=nid,
                    label=label,
                    type=ntype,
                    properties=props or {}
                ))

        # Root candidate node
        cand_nid = f"cand_{candidate_id}"
        add_node(cand_nid, candidate_name, "candidate", {"title": "Candidate Passport"})

        # Experience nodes
        for i, exp in enumerate(experiences):
            comp_nid = f"comp_{i}_{candidate_id}"
            role_nid = f"role_{i}_{candidate_id}"
            company_name = exp.get("company", "Company")
            role_name = exp.get("role", "Engineer")
            years = exp.get("years", "2023-2025")

            add_node(comp_nid, company_name, "company", {"years": years})
            add_node(role_nid, role_name, "role", {"company": company_name})

            edges.append(GraphEdge(
                id=f"e_cand_comp_{i}",
                source=cand_nid,
                target=comp_nid,
                label="WORKED_AT",
                strength=0.9
            ))
            edges.append(GraphEdge(
                id=f"e_cand_role_{i}",
                source=cand_nid,
                target=role_nid,
                label="WORKED_AS",
                strength=0.9
            ))
            edges.append(GraphEdge(
                id=f"e_role_comp_{i}",
                source=role_nid,
                target=comp_nid,
                label="AT_COMPANY",
                strength=0.8
            ))

            # Skills used in this experience
            for sk in exp.get("skills", []):
                sk_nid = f"sk_{sk.lower().replace(' ', '_')}"
                add_node(sk_nid, sk, "skill", {"category": "Technical"})
                edges.append(GraphEdge(
                    id=f"e_role_sk_{i}_{sk}",
                    source=role_nid,
                    target=sk_nid,
                    label="USED",
                    animated=True,
                    strength=0.85
                ))

        # Project nodes
        for j, proj in enumerate(projects):
            proj_nid = f"proj_{j}_{candidate_id}"
            proj_title = proj.get("title", f"Project {j+1}")
            proj_desc = proj.get("description", "")

            add_node(proj_nid, proj_title, "project", {"description": proj_desc})
            edges.append(GraphEdge(
                id=f"e_cand_proj_{j}",
                source=cand_nid,
                target=proj_nid,
                label="BUILT",
                strength=0.85
            ))

            for sk in proj.get("skills", []):
                sk_nid = f"sk_{sk.lower().replace(' ', '_')}"
                add_node(sk_nid, sk, "skill", {"category": "Technical"})
                edges.append(GraphEdge(
                    id=f"e_proj_sk_{j}_{sk}",
                    source=proj_nid,
                    target=sk_nid,
                    label="USED",
                    animated=True,
                    strength=0.8
                ))

        # Certifications
        for k, cert in enumerate(certifications):
            cert_nid = f"cert_{k}_{candidate_id}"
            add_node(cert_nid, cert, "certification", {})
            edges.append(GraphEdge(
                id=f"e_cand_cert_{k}",
                source=cand_nid,
                target=cert_nid,
                label="CERTIFIED_IN",
                strength=0.75
            ))

        # Education
        for m, edu in enumerate(education):
            edu_nid = f"edu_{m}_{candidate_id}"
            add_node(edu_nid, edu, "education", {})
            edges.append(GraphEdge(
                id=f"e_cand_edu_{m}",
                source=cand_nid,
                target=edu_nid,
                label="STUDIED_AT",
                strength=0.75
            ))

        # Direct skill edges from evidence list
        for ev in evidence_list:
            sk_nid = f"sk_{ev.skill_name.lower().replace(' ', '_')}"
            add_node(sk_nid, ev.skill_name, "skill", {
                "strength": ev.evidence_strength,
                "level": ev.evidence_strength_level
            })
            edge_id = f"e_cand_sk_{sk_nid}"
            if not any(e.id == edge_id for e in edges):
                edges.append(GraphEdge(
                    id=edge_id,
                    source=cand_nid,
                    target=sk_nid,
                    label="HAS_SKILL",
                    animated=ev.evidence_strength >= 80,
                    strength=ev.evidence_strength / 100.0
                ))

        return SkillGraphData(nodes=nodes, edges=edges)

    def generate_timeline(
        self,
        evidence_list: List[EvidenceItem],
        projects: List[Dict[str, Any]],
        experiences: List[Dict[str, Any]]
    ) -> List[TimelineYearGroup]:
        """
        Create chronological timeline (e.g. 2023, 2024, 2025, 2026) showing skill progression.
        """
        years_map: Dict[int, Dict[str, Any]] = {}

        # Default years range
        for y in [2023, 2024, 2025, 2026]:
            years_map[y] = {"skills": set(), "experiences": [], "projects": []}

        for exp in experiences:
            y = exp.get("year", 2024)
            if y not in years_map:
                years_map[y] = {"skills": set(), "experiences": [], "projects": []}
            years_map[y]["experiences"].append(exp)
            for sk in exp.get("skills", []):
                years_map[y]["skills"].add(sk)

        for proj in projects:
            y = proj.get("year", 2025)
            if y not in years_map:
                years_map[y] = {"skills": set(), "experiences": [], "projects": []}
            years_map[y]["projects"].append(proj)
            for sk in proj.get("skills", []):
                years_map[y]["skills"].add(sk)

        for ev in evidence_list:
            if ev.start_year and ev.start_year in years_map:
                years_map[ev.start_year]["skills"].add(ev.skill_name)
            if ev.end_year and ev.end_year in years_map:
                years_map[ev.end_year]["skills"].add(ev.skill_name)

        groups = []
        for yr in sorted(years_map.keys()):
            groups.append(TimelineYearGroup(
                year=yr,
                skills=sorted(list(years_map[yr]["skills"])),
                experiences=years_map[yr]["experiences"],
                projects=years_map[yr]["projects"]
            ))

        return groups

evidence_engine = EvidenceEngine()
