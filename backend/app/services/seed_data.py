from typing import Dict, List, Any
from app.models.schemas import (
    JobRequirement, EvidenceItem, CandidateSkillEval,
    CandidateIntelligencePassport, PassportVersion
)
import uuid

# --- 5 PRE-CONFIGURED INDUSTRY ROLES ---
PRECONFIGURED_ROLES: Dict[str, Dict[str, Any]] = {
    "job_backend_core": {
        "id": "job_backend_core",
        "title": "Senior Backend Engineer (SDE / Core Systems)",
        "department": "Core Platform & Infrastructure",
        "description": "Architect high-concurrency microservices, optimize distributed data pipelines, design resilient RESTful APIs, and manage database scalability.",
        "requirements": [
            JobRequirement(id="req_1", name="Python", category="REQUIRED", priority="Critical", weight=1.3, canonical_skill="Python"),
            JobRequirement(id="req_2", name="FastAPI", category="REQUIRED", priority="Critical", weight=1.2, canonical_skill="FastAPI"),
            JobRequirement(id="req_3", name="SQL", category="REQUIRED", priority="High", weight=1.0, canonical_skill="SQL"),
            JobRequirement(id="req_4", name="REST APIs", category="REQUIRED", priority="High", weight=1.0, canonical_skill="REST APIs"),
            JobRequirement(id="req_5", name="Docker", category="PREFERRED", priority="Medium", weight=0.9, canonical_skill="Docker"),
            JobRequirement(id="req_6", name="AWS", category="PREFERRED", priority="Medium", weight=0.8, canonical_skill="AWS"),
            JobRequirement(id="req_7", name="Redis", category="PREFERRED", priority="Medium", weight=0.7, canonical_skill="Redis"),
            JobRequirement(id="req_8", name="Kubernetes", category="BONUS", priority="Low", weight=0.5, canonical_skill="Kubernetes"),
            JobRequirement(id="req_9", name="Kafka", category="BONUS", priority="Low", weight=0.5, canonical_skill="Kafka"),
        ]
    },
    "job_fullstack": {
        "id": "job_fullstack",
        "title": "Full Stack & Frontend Engineer (React / TypeScript)",
        "department": "Product Engineering",
        "description": "Build high-performance web applications, interactive design systems, responsive client-side state architectures, and robust API integrations.",
        "requirements": [
            JobRequirement(id="fs_req_1", name="React", category="REQUIRED", priority="Critical", weight=1.3, canonical_skill="React"),
            JobRequirement(id="fs_req_2", name="TypeScript", category="REQUIRED", priority="Critical", weight=1.2, canonical_skill="TypeScript"),
            JobRequirement(id="fs_req_3", name="REST APIs", category="REQUIRED", priority="High", weight=1.0, canonical_skill="REST APIs"),
            JobRequirement(id="fs_req_4", name="Tailwind CSS", category="REQUIRED", priority="High", weight=1.0, canonical_skill="Tailwind CSS"),
            JobRequirement(id="fs_req_5", name="Python", category="PREFERRED", priority="Medium", weight=0.8, canonical_skill="Python"),
            JobRequirement(id="fs_req_6", name="FastAPI", category="PREFERRED", priority="Medium", weight=0.8, canonical_skill="FastAPI"),
            JobRequirement(id="fs_req_7", name="Docker", category="PREFERRED", priority="Medium", weight=0.7, canonical_skill="Docker"),
            JobRequirement(id="fs_req_8", name="GraphQL", category="BONUS", priority="Low", weight=0.5, canonical_skill="GraphQL"),
        ]
    },
    "job_data_eng": {
        "id": "job_data_eng",
        "title": "Senior Data Platform Engineer",
        "department": "Data Platform & Analytics",
        "description": "Build real-time stream ingestion, maintain petabyte-scale data lakes, orchestrate complex ETL workflows, and tune partitioned relational warehouses.",
        "requirements": [
            JobRequirement(id="de_req_1", name="Python", category="REQUIRED", priority="Critical", weight=1.3, canonical_skill="Python"),
            JobRequirement(id="de_req_2", name="SQL", category="REQUIRED", priority="Critical", weight=1.3, canonical_skill="SQL"),
            JobRequirement(id="de_req_3", name="Kafka", category="REQUIRED", priority="High", weight=1.1, canonical_skill="Kafka"),
            JobRequirement(id="de_req_4", name="PostgreSQL", category="REQUIRED", priority="High", weight=1.0, canonical_skill="PostgreSQL"),
            JobRequirement(id="de_req_5", name="AWS", category="PREFERRED", priority="Medium", weight=0.8, canonical_skill="AWS"),
            JobRequirement(id="de_req_6", name="Docker", category="PREFERRED", priority="Medium", weight=0.8, canonical_skill="Docker"),
            JobRequirement(id="de_req_7", name="Redis", category="PREFERRED", priority="Medium", weight=0.7, canonical_skill="Redis"),
            JobRequirement(id="de_req_8", name="Kubernetes", category="BONUS", priority="Low", weight=0.5, canonical_skill="Kubernetes"),
        ]
    },
    "job_devops_infra": {
        "id": "job_devops_infra",
        "title": "Platform Infrastructure & DevOps Engineer",
        "department": "Cloud & Infrastructure Operations",
        "description": "Architect multi-cloud Kubernetes clusters, streamline GitOps CI/CD delivery pipelines, manage infrastructure-as-code, and ensure high availability.",
        "requirements": [
            JobRequirement(id="do_req_1", name="Docker", category="REQUIRED", priority="Critical", weight=1.3, canonical_skill="Docker"),
            JobRequirement(id="do_req_2", name="Kubernetes", category="REQUIRED", priority="Critical", weight=1.3, canonical_skill="Kubernetes"),
            JobRequirement(id="do_req_3", name="AWS", category="REQUIRED", priority="High", weight=1.1, canonical_skill="AWS"),
            JobRequirement(id="do_req_4", name="CI/CD", category="REQUIRED", priority="High", weight=1.0, canonical_skill="CI/CD"),
            JobRequirement(id="do_req_5", name="Python", category="PREFERRED", priority="Medium", weight=0.8, canonical_skill="Python"),
            JobRequirement(id="do_req_6", name="Linux", category="PREFERRED", priority="Medium", weight=0.8, canonical_skill="Linux"),
            JobRequirement(id="do_req_7", name="Redis", category="BONUS", priority="Low", weight=0.5, canonical_skill="Redis"),
            JobRequirement(id="do_req_8", name="Kafka", category="BONUS", priority="Low", weight=0.5, canonical_skill="Kafka"),
        ]
    },
    "job_ml_eng": {
        "id": "job_ml_eng",
        "title": "Machine Learning & AI Systems Engineer",
        "department": "Applied AI Research",
        "description": "Deploy deep learning models in production, build low-latency inference microservices, scale vector databases, and manage feature pipelines.",
        "requirements": [
            JobRequirement(id="ml_req_1", name="Python", category="REQUIRED", priority="Critical", weight=1.3, canonical_skill="Python"),
            JobRequirement(id="ml_req_2", name="PyTorch", category="REQUIRED", priority="Critical", weight=1.2, canonical_skill="PyTorch"),
            JobRequirement(id="ml_req_3", name="FastAPI", category="REQUIRED", priority="High", weight=1.1, canonical_skill="FastAPI"),
            JobRequirement(id="ml_req_4", name="SQL", category="REQUIRED", priority="High", weight=1.0, canonical_skill="SQL"),
            JobRequirement(id="ml_req_5", name="Docker", category="PREFERRED", priority="Medium", weight=0.8, canonical_skill="Docker"),
            JobRequirement(id="ml_req_6", name="AWS", category="PREFERRED", priority="Medium", weight=0.8, canonical_skill="AWS"),
            JobRequirement(id="ml_req_7", name="Kubernetes", category="BONUS", priority="Low", weight=0.5, canonical_skill="Kubernetes"),
            JobRequirement(id="ml_req_8", name="Kafka", category="BONUS", priority="Low", weight=0.5, canonical_skill="Kafka"),
        ]
    }
}

DEFAULT_JOB = PRECONFIGURED_ROLES["job_backend_core"]
DEFAULT_REQUIREMENTS = DEFAULT_JOB["requirements"]

def generate_seed_candidates() -> List[Dict[str, Any]]:
    candidates = []

    # 1. SIGNATURE DEMO CANDIDATE: Elena Rostova (Section 37)
    # Python: 94, FastAPI: 95, SQL: 92, REST: 90, Docker: 31, AWS: 38, Redis: 61, Kafka: 88, Kubernetes: 82
    elena_evidence = [
        EvidenceItem(
            id="ev_elena_1", candidate_id="cand_elena", skill_name="Python",
            source_type="work_experience", source_title="Senior Python Developer at DataStream",
            source_text="Spearheaded async Python microservices serving 45,000 req/sec with custom event loop scheduling and zero-copy deserialization.",
            classification="CONTEXTUALLY_SUPPORTED", evidence_strength=94.0, evidence_strength_level="HIGH",
            start_year=2023, end_year=2026, is_recent=True,
            context_signals=["High-concurrency async Python", "Custom event loops", "3+ years continuous production history"],
            missing_context=[]
        ),
        EvidenceItem(
            id="ev_elena_2", candidate_id="cand_elena", skill_name="FastAPI",
            source_type="project", source_title="Distributed Ingestion Engine (Open Source)",
            source_text="Architected distributed ingestion platform with FastAPI, dependency injection middleware, OpenAPI spec generation, and Pydantic v2 schemas.",
            classification="ARTIFACT_SUPPORTED", evidence_strength=95.0, evidence_strength_level="HIGH",
            start_year=2024, end_year=2026, is_recent=True,
            context_signals=["Pydantic v2 validation", "OpenAPI automated schema", "Extensive modular router architecture"],
            missing_context=[]
        ),
        EvidenceItem(
            id="ev_elena_3", candidate_id="cand_elena", skill_name="SQL",
            source_type="work_experience", source_title="Database & Backend Engineer at FinTech Labs",
            source_text="Designed and optimized PostgreSQL partitioned schemas for multi-tenant billing tables; reduced 99th-percentile query times by 72% via partial indexes.",
            classification="COMPANY_VALIDATED", evidence_strength=92.0, evidence_strength_level="HIGH",
            start_year=2022, end_year=2024, is_recent=True,
            context_signals=["PostgreSQL query execution plans", "Partitioned multi-tenant tables", "Index optimization"],
            missing_context=[]
        ),
        EvidenceItem(
            id="ev_elena_4", candidate_id="cand_elena", skill_name="REST APIs",
            source_type="work_experience", source_title="DataStream API Gateway",
            source_text="Built idempotent CRUD endpoints with strict rate limiting, JWT token verification, and automated API versioning.",
            classification="CONTEXTUALLY_SUPPORTED", evidence_strength=90.0, evidence_strength_level="HIGH",
            start_year=2023, end_year=2026, is_recent=True,
            context_signals=["Idempotent REST APIs", "Strict rate-limiting", "JWT authentication"],
            missing_context=[]
        ),
        EvidenceItem(
            id="ev_elena_5", candidate_id="cand_elena", skill_name="Docker",
            source_type="skills_list", source_title="Resume Skills Section",
            source_text="Docker, Docker Compose, Git, Linux",
            classification="CLAIMED", evidence_strength=31.0, evidence_strength_level="LIMITED",
            start_year=2024, end_year=2024, is_recent=False,
            context_signals=["Docker listed in skills section", "Basic container reference in tutorial"],
            missing_context=["No production work-context evidence detected", "No multi-stage Dockerfile deployment detected"]
        ),
        EvidenceItem(
            id="ev_elena_6", candidate_id="cand_elena", skill_name="AWS",
            source_type="project", source_title="Academic Cloud Coursework",
            source_text="Utilized AWS S3 for object storage backup in university research project.",
            classification="CLAIMED", evidence_strength=38.0, evidence_strength_level="LIMITED",
            start_year=2023, end_year=2023, is_recent=False,
            context_signals=["S3 API storage integration"],
            missing_context=["No infrastructure provisioning (Terraform/CloudFormation)", "No production ECS/EKS administration"]
        ),
        EvidenceItem(
            id="ev_elena_7", candidate_id="cand_elena", skill_name="Redis",
            source_type="work_experience", source_title="DataStream Caching Tier",
            source_text="Integrated Redis key-value store for distributed session tokens and sliding-window rate limiters.",
            classification="CONTEXTUALLY_SUPPORTED", evidence_strength=61.0, evidence_strength_level="MODERATE",
            start_year=2024, end_year=2025, is_recent=True,
            context_signals=["Sliding-window rate limiter", "Distributed session management"],
            missing_context=["No cluster replication or cache invalidation clustering details"]
        ),
        EvidenceItem(
            id="ev_elena_8", candidate_id="cand_elena", skill_name="Kafka",
            source_type="project", source_title="High-Throughput Telemetry Pipeline",
            source_text="Implemented Apache Kafka consumer group for processing 1.2M event messages per minute with exactly-once semantics.",
            classification="ARTIFACT_SUPPORTED", evidence_strength=88.0, evidence_strength_level="HIGH",
            start_year=2025, end_year=2026, is_recent=True,
            context_signals=["Kafka consumer groups", "Exactly-once semantics", "1.2M events/min throughput"],
            missing_context=[]
        ),
        EvidenceItem(
            id="ev_elena_9", candidate_id="cand_elena", skill_name="Kubernetes",
            source_type="project", source_title="Distributed Systems Lab",
            source_text="Deployed custom operator on Kubernetes with custom resource definitions (CRDs) for stateful stream processors.",
            classification="ARTIFACT_SUPPORTED", evidence_strength=82.0, evidence_strength_level="HIGH",
            start_year=2025, end_year=2026, is_recent=True,
            context_signals=["Kubernetes CRDs", "Stateful stream orchestration"],
            missing_context=[]
        ),
        EvidenceItem(
            id="ev_elena_10", candidate_id="cand_elena", skill_name="PostgreSQL",
            source_type="work_experience", source_title="FinTech Labs Backend",
            source_text="Engineered PostgreSQL database triggers, stored procedures, and complex indexing.",
            classification="COMPANY_VALIDATED", evidence_strength=93.0, evidence_strength_level="HIGH",
            start_year=2022, end_year=2024, is_recent=True,
            context_signals=["PostgreSQL indexing", "Stored procedures"],
            missing_context=[]
        )
    ]

    elena_evals = {
        "Python": CandidateSkillEval(
            skill_name="Python", category="REQUIRED", priority="Critical", detection_status="SUPPORTED BY EVIDENCE",
            evidence_strength=94.0, evidence_gap=6.0, is_semantic_match=False, supporting_evidence_count=2,
            why_explanation=["✓ High-concurrency async Python", "✓ Custom event loops", "✓ 3+ years continuous production history"],
            primary_source="DataStream Senior Python Developer"
        ),
        "FastAPI": CandidateSkillEval(
            skill_name="FastAPI", category="REQUIRED", priority="Critical", detection_status="SUPPORTED BY EVIDENCE",
            evidence_strength=95.0, evidence_gap=5.0, is_semantic_match=False, supporting_evidence_count=2,
            why_explanation=["✓ Pydantic v2 validation", "✓ OpenAPI automated schema", "✓ Extensive modular router architecture"],
            primary_source="Open Source Ingestion Platform"
        ),
        "SQL": CandidateSkillEval(
            skill_name="SQL", category="REQUIRED", priority="High", detection_status="SUPPORTED BY EVIDENCE",
            evidence_strength=92.0, evidence_gap=8.0, is_semantic_match=False, supporting_evidence_count=2,
            why_explanation=["✓ PostgreSQL query execution plans", "✓ Partitioned multi-tenant tables", "✓ Index optimization"],
            primary_source="FinTech Labs Backend Engineer"
        ),
        "REST APIs": CandidateSkillEval(
            skill_name="REST APIs", category="REQUIRED", priority="High", detection_status="SUPPORTED BY EVIDENCE",
            evidence_strength=90.0, evidence_gap=10.0, is_semantic_match=False, supporting_evidence_count=2,
            why_explanation=["✓ Idempotent REST APIs", "✓ Strict rate-limiting", "✓ JWT authentication"],
            primary_source="DataStream API Gateway"
        ),
        "Docker": CandidateSkillEval(
            skill_name="Docker", category="PREFERRED", priority="Medium", detection_status="LIMITED EVIDENCE",
            evidence_strength=31.0, evidence_gap=69.0, is_semantic_match=False, supporting_evidence_count=1,
            why_explanation=["✓ Docker listed in skills section", "✓ One minor tutorial reference", "✗ No work-context evidence detected", "✗ No deployment evidence detected"],
            primary_source="Resume Skills Section"
        ),
        "AWS": CandidateSkillEval(
            skill_name="AWS", category="PREFERRED", priority="Medium", detection_status="LIMITED EVIDENCE",
            evidence_strength=38.0, evidence_gap=62.0, is_semantic_match=False, supporting_evidence_count=1,
            why_explanation=["✓ S3 API storage integration", "✗ No cloud infrastructure provisioning", "✗ No production ECS/EKS administration"],
            primary_source="Academic Cloud Coursework"
        ),
        "Redis": CandidateSkillEval(
            skill_name="Redis", category="PREFERRED", priority="Medium", detection_status="EXPLICITLY LISTED",
            evidence_strength=61.0, evidence_gap=39.0, is_semantic_match=False, supporting_evidence_count=1,
            why_explanation=["✓ Sliding-window rate limiter", "✓ Distributed session management", "✗ No cluster replication details"],
            primary_source="DataStream Caching Tier"
        ),
        "Kubernetes": CandidateSkillEval(
            skill_name="Kubernetes", category="BONUS", priority="Low", detection_status="SUPPORTED BY EVIDENCE",
            evidence_strength=82.0, evidence_gap=18.0, is_semantic_match=False, supporting_evidence_count=1,
            why_explanation=["✓ Kubernetes CRDs", "✓ Stateful stream orchestration", "✓ Custom operator deployment"],
            primary_source="Distributed Systems Lab"
        ),
        "Kafka": CandidateSkillEval(
            skill_name="Kafka", category="BONUS", priority="Low", detection_status="SUPPORTED BY EVIDENCE",
            evidence_strength=88.0, evidence_gap=12.0, is_semantic_match=False, supporting_evidence_count=1,
            why_explanation=["✓ Kafka consumer groups", "✓ Exactly-once semantics", "✓ 1.2M events/min throughput"],
            primary_source="High-Throughput Telemetry Pipeline"
        ),
        "PostgreSQL": CandidateSkillEval(
            skill_name="PostgreSQL", category="REQUIRED", priority="High", detection_status="SUPPORTED BY EVIDENCE",
            evidence_strength=93.0, evidence_gap=7.0, is_semantic_match=False, supporting_evidence_count=2,
            why_explanation=["✓ Database triggers", "✓ Partitioned tables"],
            primary_source="FinTech Labs"
        )
    }

    elena = {
        "id": "cand_elena",
        "name": "Elena Rostova",
        "email": "elena.rostova@devmail.io",
        "current_title": "Senior Python Backend Engineer",
        "current_company": "DataStream Technologies",
        "years_of_experience": 4.5,
        "language": "en",
        "has_recent_activity": True,
        "is_suppressed": True,
        "archetype": "SPECIALIST-LIKE EVIDENCE PROFILE",
        "raw_evidence_strength": 74.0,
        "skill_evals": elena_evals,
        "evidence_list": elena_evidence,
        "experiences": [
            {
                "company": "DataStream Technologies",
                "role": "Senior Python Backend Engineer",
                "years": "2023 - Present",
                "year": 2024,
                "skills": ["Python", "FastAPI", "Redis", "Kafka", "REST APIs", "PostgreSQL"]
            },
            {
                "company": "FinTech Labs",
                "role": "Backend Engineer Intern & Associate",
                "years": "2021 - 2023",
                "year": 2022,
                "skills": ["Python", "SQL", "PostgreSQL", "REST APIs"]
            }
        ],
        "projects": [
            {
                "title": "Distributed Ingestion Platform",
                "year": 2025,
                "description": "High throughput data ingestion engine handling asynchronous streams with FastAPI and Kafka.",
                "skills": ["FastAPI", "Python", "Kafka", "REST APIs"]
            },
            {
                "title": "Stateful Stream Operator for Kubernetes",
                "year": 2025,
                "description": "Custom Kubernetes operator orchestrating real-time partition consumers.",
                "skills": ["Kubernetes", "Python", "Kafka"]
            },
            {
                "title": "PostgreSQL Multi-Tenant Sharding Layer",
                "year": 2023,
                "description": "Dynamic connection router and query optimizer for partitioned PostgreSQL instances.",
                "skills": ["SQL", "PostgreSQL", "Python"]
            }
        ],
        "education": ["B.S. in Computer Science, Politehnica University of Bucharest (2021)"],
        "certifications": ["Kafka Certified Developer", "Async Python Specialist Certificate"],
        "notes": [
            {"author": "System Parser", "text": "Detected high-density Python and FastAPI repository contributions. Flagged for Talent Lens inspection due to concentrated Docker gap."}
        ]
    }
    candidates.append(elena)

    # 29 additional candidates with realistic multi-skill profiles
    # Calibrated so the top 12 candidates have consistent scores across all 8 backend requirements,
    # ensuring Elena starts at rank #13-#14 as specified in Section 37!
    candidate_templates = [
        # Top-ranked balanced engineers with high Docker + AWS + Python + FastAPI
        ("David Becker", "Lead Cloud Backend Architect", "CloudScale GmbH", 6.5, "de", False, "BALANCED", 92.0,
         {"Python": 93, "FastAPI": 92, "SQL": 91, "REST APIs": 94, "Docker": 95, "AWS": 94, "Redis": 88, "Kubernetes": 85, "Kafka": 80, "React": 65, "TypeScript": 70, "CI/CD": 92}),
        ("Marcus Vance", "Principal Backend Architect", "Apex Systems", 6.0, "en", False, "BALANCED", 90.5,
         {"Python": 91, "FastAPI": 90, "SQL": 93, "REST APIs": 92, "Docker": 93, "AWS": 90, "Redis": 86, "Kubernetes": 80, "Kafka": 75, "React": 60, "TypeScript": 65, "CI/CD": 90}),
        ("Sarah Jenkins", "Senior Platform Engineer", "Stripeway", 5.5, "en", False, "BALANCED", 89.0,
         {"Python": 89, "FastAPI": 88, "SQL": 89, "REST APIs": 91, "Docker": 92, "AWS": 91, "Redis": 84, "Kubernetes": 78, "Kafka": 72, "React": 70, "TypeScript": 72, "CI/CD": 88}),
        ("Amara Okafor", "Senior Backend Developer", "PayFlex Global", 5.0, "en", False, "BALANCED", 88.0,
         {"Python": 88, "FastAPI": 89, "SQL": 88, "REST APIs": 90, "Docker": 89, "AWS": 88, "Redis": 82, "Kubernetes": 72, "Kafka": 68, "React": 65, "TypeScript": 68, "CI/CD": 85}),
        ("Kenji Tanaka", "Backend Systems Engineer", "Rakuten Horizon", 5.2, "ja", False, "BALANCED", 87.5,
         {"Python": 87, "FastAPI": 87, "SQL": 90, "REST APIs": 89, "Docker": 88, "AWS": 86, "Redis": 83, "Kubernetes": 70, "Kafka": 65, "React": 58, "TypeScript": 62, "CI/CD": 84}),
        ("Chloe Lefebvre", "API Platform Specialist", "Criteo Labs", 4.8, "fr", False, "BALANCED", 86.5,
         {"Python": 88, "FastAPI": 91, "SQL": 84, "REST APIs": 93, "Docker": 86, "AWS": 82, "Redis": 80, "Kubernetes": 65, "Kafka": 60, "React": 78, "TypeScript": 75, "CI/CD": 82}),
        ("Liam O'Connor", "Backend Developer", "Dublin FinTech", 4.5, "en", False, "BALANCED", 85.5,
         {"Python": 86, "FastAPI": 85, "SQL": 87, "REST APIs": 88, "Docker": 87, "AWS": 84, "Redis": 78, "Kubernetes": 68, "Kafka": 62, "React": 60, "TypeScript": 65, "CI/CD": 80}),
        ("Sofia Rodriguez", "Cloud Services Engineer", "Mercado Modern", 4.5, "es", False, "BALANCED", 85.0,
         {"Python": 85, "FastAPI": 84, "SQL": 85, "REST APIs": 87, "Docker": 90, "AWS": 89, "Redis": 76, "Kubernetes": 72, "Kafka": 58, "React": 55, "TypeScript": 60, "CI/CD": 86}),
        ("Arjun Mehta", "Distributed Systems Engineer", "Swiggy Core", 4.8, "hi", False, "BALANCED", 84.5,
         {"Python": 86, "FastAPI": 85, "SQL": 86, "REST APIs": 86, "Docker": 85, "AWS": 82, "Redis": 81, "Kubernetes": 75, "Kafka": 78, "React": 50, "TypeScript": 55, "CI/CD": 82}),
        ("Nadia Al-Mansoor", "Full Stack Backend Lead", "Careem Infra", 4.5, "en", False, "BALANCED", 84.0,
         {"Python": 85, "FastAPI": 83, "SQL": 86, "REST APIs": 88, "Docker": 84, "AWS": 82, "Redis": 78, "Kubernetes": 65, "Kafka": 60, "React": 82, "TypeScript": 80, "CI/CD": 80}),
        ("Gabriel Santos", "Microservices Engineer", "Nubank Core", 4.2, "pt", False, "BALANCED", 83.5,
         {"Python": 84, "FastAPI": 85, "SQL": 83, "REST APIs": 87, "Docker": 83, "AWS": 80, "Redis": 76, "Kubernetes": 60, "Kafka": 62, "React": 72, "TypeScript": 74, "CI/CD": 78}),
        ("Vikram Patel", "Python Microservices Developer", "Razorpay Core", 4.0, "en", False, "BALANCED", 83.0,
         {"Python": 86, "FastAPI": 85, "SQL": 84, "REST APIs": 85, "Docker": 82, "AWS": 78, "Redis": 75, "Kubernetes": 62, "Kafka": 65, "React": 55, "TypeScript": 60, "CI/CD": 76}),

        # Other candidates (Mid to Junior, Specialists, Data Engineers, DevOps, ML)
        ("Tariq Thorne", "DevOps & Infrastructure Developer", "Nebula Cloud", 4.0, "en", True, "SPECIALIST-LIKE EVIDENCE PROFILE", 78.0,
         {"Python": 72, "FastAPI": 65, "SQL": 70, "REST APIs": 75, "Docker": 96, "AWS": 94, "Redis": 60, "Kubernetes": 92, "Kafka": 70, "React": 40, "TypeScript": 45, "CI/CD": 95}),
        ("Hanna Lindstrom", "Data Pipeline Developer", "Klarna North", 4.2, "de", True, "SPECIALIST-LIKE EVIDENCE PROFILE", 77.0,
         {"Python": 92, "FastAPI": 60, "SQL": 95, "REST APIs": 70, "Docker": 50, "AWS": 55, "Redis": 70, "Kubernetes": 30, "Kafka": 92, "PostgreSQL": 94, "Spark": 88, "React": 35}),
        ("Maya Lin", "Frontend & Full Stack Lead", "Shopee AI", 3.8, "zh-cn", False, "BALANCED", 76.5,
         {"Python": 82, "FastAPI": 76, "SQL": 80, "REST APIs": 85, "Docker": 65, "AWS": 60, "Redis": 64, "Kubernetes": 35, "Kafka": 40, "React": 94, "TypeScript": 92, "Tailwind CSS": 90}),
        ("Lucas Moreau", "Web Backend Developer", "BlaBlaCar", 3.5, "fr", False, "BALANCED", 75.0,
         {"Python": 80, "FastAPI": 74, "SQL": 78, "REST APIs": 82, "Docker": 70, "AWS": 65, "Redis": 62, "Kubernetes": 25, "Kafka": 45, "React": 68, "TypeScript": 65, "CI/CD": 72}),
        ("Dmitri Volkov", "Backend Engineer", "Yandex Direct", 3.8, "ru", False, "BALANCED", 74.0,
         {"Python": 83, "FastAPI": 70, "SQL": 82, "REST APIs": 76, "Docker": 66, "AWS": 58, "Redis": 68, "Kubernetes": 35, "Kafka": 60, "React": 45, "TypeScript": 50, "CI/CD": 70}),
        ("Ingrid Bergman", "Systems Programmer", "Spotify Playback", 4.2, "de", False, "SPECIALIST-LIKE EVIDENCE PROFILE", 73.5,
         {"Python": 91, "FastAPI": 58, "SQL": 88, "REST APIs": 72, "Docker": 55, "AWS": 52, "Redis": 74, "Kubernetes": 30, "Kafka": 82, "React": 40, "TypeScript": 42, "CI/CD": 65}),
        ("Kavita Rao", "Cloud Backend Junior", "Freshworks", 2.5, "en", False, "BALANCED", 72.0,
         {"Python": 78, "FastAPI": 76, "SQL": 75, "REST APIs": 80, "Docker": 65, "AWS": 62, "Redis": 58, "Kubernetes": 20, "Kafka": 35, "React": 62, "TypeScript": 65, "CI/CD": 60}),
        ("Mateo Rossi", "Junior Backend Developer", "Enel Digital", 2.5, "it", False, "BALANCED", 71.0,
         {"Python": 76, "FastAPI": 74, "SQL": 72, "REST APIs": 77, "Docker": 60, "AWS": 55, "Redis": 54, "Kubernetes": 25, "Kafka": 30, "React": 58, "TypeScript": 60, "CI/CD": 55}),
        ("Oliver Queen", "Django Web Specialist", "MediaCorp", 4.2, "en", False, "SPECIALIST-LIKE EVIDENCE PROFILE", 69.0,
         {"Python": 87, "FastAPI": 30, "SQL": 80, "REST APIs": 74, "Docker": 56, "AWS": 50, "Redis": 54, "Kubernetes": 18, "Kafka": 32, "React": 52, "TypeScript": 50, "CI/CD": 50}),
        ("Aisha Bello", "Database Administrator & Data Dev", "Flutterwave", 3.5, "en", False, "SPECIALIST-LIKE EVIDENCE PROFILE", 68.0,
         {"Python": 72, "FastAPI": 42, "SQL": 94, "REST APIs": 68, "Docker": 52, "AWS": 45, "Redis": 58, "Kubernetes": 20, "Kafka": 75, "PostgreSQL": 95, "React": 30}),
        ("Felix Fischer", "Cloud Infrastructure Trainee", "Siemens Cloud", 2.0, "de", False, "BALANCED", 66.0,
         {"Python": 68, "FastAPI": 54, "SQL": 65, "REST APIs": 68, "Docker": 78, "AWS": 72, "Redis": 45, "Kubernetes": 42, "Kafka": 30, "React": 40, "TypeScript": 45, "CI/CD": 74}),
        ("Chen Wei", "Frontend & Full Stack Intern", "Baidu Search", 1.8, "zh-cn", False, "BALANCED", 64.0,
         {"Python": 72, "FastAPI": 65, "SQL": 64, "REST APIs": 70, "Docker": 46, "AWS": 40, "Redis": 42, "Kubernetes": 15, "Kafka": 20, "React": 88, "TypeScript": 85, "Tailwind CSS": 86}),
        ("Zoe Martin", "Junior API Developer", "Deliveroo Ops", 2.2, "en", False, "BALANCED", 63.0,
         {"Python": 70, "FastAPI": 68, "SQL": 66, "REST APIs": 72, "Docker": 44, "AWS": 36, "Redis": 45, "Kubernetes": 12, "Kafka": 25, "React": 55, "TypeScript": 58, "CI/CD": 48}),
        ("Hassan El-Sayed", "Software Engineer", "Souq Tech", 2.8, "en", False, "BALANCED", 61.5,
         {"Python": 68, "FastAPI": 48, "SQL": 67, "REST APIs": 65, "Docker": 54, "AWS": 48, "Redis": 40, "Kubernetes": 20, "Kafka": 35, "React": 50, "TypeScript": 52, "CI/CD": 50}),
        ("Olga Smirnova", "Web Scraper & Backend", "Avito", 2.4, "ru", False, "BALANCED", 60.0,
         {"Python": 77, "FastAPI": 35, "SQL": 62, "REST APIs": 58, "Docker": 48, "AWS": 35, "Redis": 44, "Kubernetes": 10, "Kafka": 25, "React": 42, "TypeScript": 40, "CI/CD": 45}),
        ("Tomasz Wozniak", "Junior Python Developer", "Allegro", 2.0, "en", False, "BALANCED", 58.0,
         {"Python": 72, "FastAPI": 52, "SQL": 58, "REST APIs": 60, "Docker": 38, "AWS": 32, "Redis": 35, "Kubernetes": 12, "Kafka": 20, "React": 45, "TypeScript": 42, "CI/CD": 40}),
        ("Rhea Sharma", "Junior Cloud Apprentice", "Zomato", 1.8, "en", False, "BALANCED", 55.0,
         {"Python": 65, "FastAPI": 38, "SQL": 55, "REST APIs": 56, "Docker": 44, "AWS": 42, "Redis": 30, "Kubernetes": 15, "Kafka": 22, "React": 50, "TypeScript": 48, "CI/CD": 42})
    ]

    for idx, (name, title, comp, exp, lang, is_sup, arch, raw_str, skill_dict) in enumerate(candidate_templates):
        cand_id = f"cand_{idx+2}"
        cand_evals = {}
        cand_ev_list = []

        for req in DEFAULT_REQUIREMENTS:
            score = float(skill_dict.get(req.name, 45.0))
            gap = max(0.0, 100.0 - score)
            status = "SUPPORTED BY EVIDENCE" if score >= 80 else ("EXPLICITLY LISTED" if score >= 50 else "LIMITED EVIDENCE")

            eval_item = CandidateSkillEval(
                skill_name=req.name,
                category=req.category,
                priority=req.priority,
                detection_status=status,
                evidence_strength=score,
                evidence_gap=round(gap, 1),
                is_semantic_match=(req.name == "FastAPI" and score < 40 and skill_dict.get("Python", 0) > 80),
                supporting_evidence_count=2 if score >= 70 else 1,
                why_explanation=[
                    f"✓ Corroborated in {comp}" if score >= 70 else f"✓ Listed in {title}",
                    "✓ Verified production usage" if score >= 80 else "✗ Limited operational telemetry detected"
                ],
                primary_source=f"{comp} {title}"
            )
            cand_evals[req.name] = eval_item

            cand_ev_list.append(EvidenceItem(
                id=f"ev_{cand_id}_{req.name.lower().replace(' ', '_')}",
                candidate_id=cand_id,
                skill_name=req.name,
                source_type="work_experience" if score >= 70 else "skills_list",
                source_title=f"{title} at {comp}",
                source_text=f"Demonstrated competence in {req.name} during tenure at {comp} as {title}.",
                original_language=lang,
                translated_or_normalized=f"Standardized {req.name} engineering capability" if lang != "en" else None,
                classification="CONTEXTUALLY_SUPPORTED" if score >= 70 else "CLAIMED",
                evidence_strength=score,
                evidence_strength_level="HIGH" if score >= 80 else ("MODERATE" if score >= 50 else "LIMITED"),
                start_year=2023,
                end_year=2025,
                is_recent=True,
                context_signals=[f"Practical implementation of {req.name}"],
                missing_context=[] if score >= 75 else ["Limited end-to-end evidence"]
            ))

        # Also store other skills that might be needed for other roles
        all_skills_portfolio = dict(skill_dict)

        cand_obj = {
            "id": cand_id,
            "name": name,
            "email": f"{name.lower().replace(' ', '.').replace('\'', '')}@devmail.io",
            "current_title": title,
            "current_company": comp,
            "years_of_experience": exp,
            "language": lang,
            "has_recent_activity": True,
            "is_suppressed": is_sup,
            "archetype": arch,
            "raw_evidence_strength": raw_str,
            "skill_evals": cand_evals,
            "all_skills_portfolio": all_skills_portfolio,
            "evidence_list": cand_ev_list,
            "experiences": [
                {
                    "company": comp,
                    "role": title,
                    "years": "2023 - Present",
                    "year": 2024,
                    "skills": list(skill_dict.keys())[:5]
                }
            ],
            "projects": [
                {
                    "title": f"{comp} Scalability Suite",
                    "year": 2024,
                    "description": f"Core engineering project focusing on distributed {list(skill_dict.keys())[0]} implementation.",
                    "skills": list(skill_dict.keys())[:4]
                }
            ],
            "education": ["B.S. in Computer Science or Software Engineering"],
            "certifications": [f"Certified {list(skill_dict.keys())[0]} Professional"],
            "notes": []
        }
        candidates.append(cand_obj)

    # Attach all_skills_portfolio to Elena as well
    elena["all_skills_portfolio"] = {
        "Python": 94, "FastAPI": 95, "SQL": 92, "REST APIs": 90,
        "Docker": 31, "AWS": 38, "Redis": 61, "Kafka": 88,
        "Kubernetes": 82, "PostgreSQL": 93, "CI/CD": 40, "React": 30
    }

    return candidates

GLOBAL_JOB = DEFAULT_JOB
GLOBAL_CANDIDATES = generate_seed_candidates()
