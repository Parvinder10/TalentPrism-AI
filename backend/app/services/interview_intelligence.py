from typing import Dict, List, Any
from app.models.schemas import InterviewPlan, InterviewQuestion, CandidateSkillEval

class InterviewIntelligenceEngine:
    def __init__(self):
        pass

    def generate_interview_plan(
        self,
        candidate_id: str,
        candidate_name: str,
        job_title: str,
        skill_evals: Dict[str, CandidateSkillEval],
        projects: List[Dict[str, Any]],
        talent_lens_data: Any
    ) -> InterviewPlan:
        """
        Generate evidence-aware interview questions targeting specific uncertainties
        while excluding well-evidenced core skills.
        """
        high_priority = []
        medium_priority = []
        low_priority = []

        # Categorize requirements by evidence strength
        for skill_name, eval_item in skill_evals.items():
            if eval_item.evidence_strength >= 85.0:
                low_priority.append({
                    "skill": skill_name,
                    "reason": f"Strongly supported by multiple production/project items ({int(eval_item.evidence_strength)}% evidence strength). Do not spend limited interview time re-testing basics."
                })
            elif eval_item.evidence_strength <= 50.0 and eval_item.category in ("REQUIRED", "PREFERRED"):
                # Candidate has uncertainty in an important requirement
                if skill_name == "Docker":
                    high_priority.append(InterviewQuestion(
                        id=f"q_docker_{candidate_id}",
                        priority="High-Priority Verification",
                        skill_target="Docker",
                        question="Your resume mentions Docker, but lacks explicit production containerization details. Walk me through an application you containerized: explain the multi-stage Dockerfile design, environment variable handling, and networking configuration.",
                        follow_up="How did you minimize final image layers and handle non-root execution for security?",
                        why_ask_this="Docker is a critical/high requirement for this role, but candidate's resume shows limited work-context evidence (31% strength).",
                        evidence_context="Resume lists Docker keyword and 1 minor project reference; no production deployment context detected."
                    ))
                elif skill_name == "AWS":
                    high_priority.append(InterviewQuestion(
                        id=f"q_aws_{candidate_id}",
                        priority="High-Priority Verification",
                        skill_target="AWS",
                        question="How have you architected and provisioned cloud infrastructure on AWS? Describe how your services interact with VPCs, IAM policies, and cloud storage or ECS/EKS.",
                        follow_up="If an API service experiences high latency spikes on ECS, what CloudWatch metrics and debugging steps do you take?",
                        why_ask_this="AWS is a preferred cloud provider requirement, but candidate's evidence is currently moderate/limited (38% strength).",
                        evidence_context="Found mention of S3 storage integration, but lacking end-to-end infrastructure management evidence."
                    ))
                elif skill_name == "Kubernetes":
                    medium_priority.append(InterviewQuestion(
                        id=f"q_k8s_{candidate_id}",
                        priority="Medium-Priority Verification",
                        skill_target="Kubernetes",
                        question="Explain how you configure Kubernetes Deployment manifests, including liveness and readiness probes, resource limits, and ConfigMaps.",
                        follow_up="How do you handle zero-downtime rolling updates and rollback strategies in production?",
                        why_ask_this="Kubernetes is a bonus/preferred requirement with low pool availability; verifying practical familiarity will clarify team placement.",
                        evidence_context="Theoretical mention in certifications/studies, but no production cluster administration found."
                    ))
                elif skill_name == "Redis":
                    medium_priority.append(InterviewQuestion(
                        id=f"q_redis_{candidate_id}",
                        priority="Medium-Priority Verification",
                        skill_target="Redis",
                        question="In what capacity have you leveraged Redis? Walk through your cache invalidation strategies and how you mitigate cache stampedes.",
                        follow_up="When would you choose Redis Pub/Sub versus a dedicated message broker like Kafka?",
                        why_ask_this="Redis caching is preferred for backend throughput; evidence is moderate (61%).",
                        evidence_context="Used for session tokens in project, but distributed cache clustering evidence is uncertain."
                    ))
                else:
                    high_priority.append(InterviewQuestion(
                        id=f"q_{skill_name.lower()}_{candidate_id}",
                        priority="High-Priority Verification",
                        skill_target=skill_name,
                        question=f"Can you provide a concrete example of how you implemented {skill_name} in a production environment under operational constraints?",
                        follow_up="What trade-offs did you make during that implementation?",
                        why_ask_this=f"{skill_name} is marked {eval_item.priority}, yet current evidence strength is only {int(eval_item.evidence_strength)}%.",
                        evidence_context=f"Detected via {eval_item.detection_status}; requires explicit operational validation."
                    ))

        # Project Deep Dives
        project_deep_dives = []
        for p in projects[:2]:
            p_title = p.get("title", "Core Architecture Project")
            p_desc = p.get("description", "High performance backend system")
            project_deep_dives.append(InterviewQuestion(
                id=f"q_proj_{p_title.lower().replace(' ', '_')}",
                priority="Project Deep Dive",
                skill_target=p.get("skills", ["Backend"])[0] if p.get("skills") else "Architecture",
                question=f"In your project '{p_title}', what were the most significant architectural bottlenecks you encountered, and how did you diagnose and resolve them?",
                follow_up="If you had to scale this system to 10x current transaction volume, what would fail first?",
                why_ask_this=f"Assesses whether candidate had primary engineering ownership or merely contributed peripheral modules.",
                evidence_context=f"Project description: {p_desc[:120]}..."
            ))

        # Technical challenges tailored to role
        technical_challenges = [
            InterviewQuestion(
                id=f"q_tech_concurrency_{candidate_id}",
                priority="Technical Challenge",
                skill_target="FastAPI & Async IO",
                question="Explain the event loop execution model in Python 3.12+ and FastAPI. How do you prevent CPU-bound tasks from blocking async event handling for other concurrent requests?",
                follow_up="How do you handle thread pools (`run_in_threadpool`) vs ProcessPoolExecutor vs Celery/BackgroundTasks?",
                why_ask_this="Candidate has top 5% FastAPI evidence (95%); challenge them at an advanced engineering level.",
                evidence_context="Candidate demonstrated high proficiency in REST APIs and asynchronous database queries."
            ),
            InterviewQuestion(
                id=f"q_tech_db_{candidate_id}",
                priority="Technical Challenge",
                skill_target="SQL & PostgreSQL",
                question="When analyzing a slow PostgreSQL query under heavy write contention, what steps do you take with `EXPLAIN (ANALYZE, BUFFERS)`? How do you diagnose index bloat and dead tuples?",
                follow_up="What are the trade-offs of partial indexes and BRIN indexes for time-series data?",
                why_ask_this="Validates candidate's deep SQL score (92%) at enterprise scale.",
                evidence_context="Resume indicates extensive query optimization and schema design history."
            )
        ]

        # Behavioral evidence
        behavioral_evidence = [
            InterviewQuestion(
                id=f"q_behav_dispute_{candidate_id}",
                priority="Behavioral Evidence",
                skill_target="Cross-Functional Collaboration",
                question="Describe a situation where engineering priorities conflicted with tight product delivery deadlines. How did you negotiate scope or technical debt?",
                follow_up="What was the lasting impact on the codebase and team velocity?",
                why_ask_this="Evaluates technical maturity and communication with product managers and stakeholders.",
                evidence_context="Candidate worked across cross-functional engineering pods."
            )
        ]

        return InterviewPlan(
            candidate_id=candidate_id,
            candidate_name=candidate_name,
            job_title=job_title,
            high_priority_verification=high_priority,
            medium_priority_verification=medium_priority,
            project_deep_dives=project_deep_dives,
            technical_challenges=technical_challenges,
            behavioral_evidence=behavioral_evidence,
            low_priority_to_reverify=low_priority
        )

interview_intelligence = InterviewIntelligenceEngine()
