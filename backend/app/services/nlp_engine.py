import re
from typing import Dict, List, Any, Optional, Tuple
try:
    import spacy
except ImportError:
    spacy = None
import numpy as np
from langdetect import detect, DetectorFactory

# Enforce deterministic language detection
DetectorFactory.seed = 0

# Canonical skill aliases database
CANONICAL_SKILLS = {
    "Python": ["python", "python3", "py", "python 3", "python 3.x", "asyncio"],
    "FastAPI": ["fastapi", "fast api", "fast-api", "starlette", "pydantic"],
    "SQL": ["sql", "postgresql", "postgres", "mysql", "sqlite", "relational database", "rdbms", "database queries", "complex sql"],
    "REST APIs": ["rest api", "rest apis", "restful", "restful apis", "restful web services", "crud endpoints", "api development", "http apis", "microservices endpoints"],
    "Docker": ["docker", "containerization", "containers", "dockerfile", "docker-compose", "docker compose", "containerized applications"],
    "AWS": ["aws", "amazon web services", "ec2", "s3", "ecs", "lambda", "cloudwatch", "iam", "aws cloud"],
    "Redis": ["redis", "in-memory cache", "distributed caching", "redis cache", "redis pub/sub", "key-value store"],
    "Kubernetes": ["kubernetes", "k8s", "helm", "k8s cluster", "container orchestration", "pods", "ingress controller"],
    "Kafka": ["kafka", "apache kafka", "event streaming", "kafka consumer", "message broker", "kafka streams"],
    "CI/CD": ["ci/cd", "continuous integration", "continuous deployment", "jenkins", "github actions", "gitlab ci", "deployment pipeline"],
    "Git": ["git", "github", "gitlab", "version control", "git branching"],
    "Django": ["django", "django rest framework", "drf", "django orm"],
    "Flask": ["flask", "werkzeug"],
    "GraphQL": ["graphql", "apollo", "schema stitching"],
    "MongoDB": ["mongodb", "nosql", "document store"],
    "Elasticsearch": ["elasticsearch", "elastic search", "opensearch", "elk stack"],
    "Java": ["java", "spring boot", "spring framework", "jvm"],
    "Go": ["golang", "go programming", "goroutines"],
    "TypeScript": ["typescript", "ts"],
    "React": ["react", "react.js", "reactjs", "react hooks"],
    "Microservices": ["microservices", "distributed systems", "event-driven architecture", "service mesh"],
    "Unit Testing": ["pytest", "unittest", "test driven development", "tdd", "unit tests", "integration testing"],
}

# Domain relatedness map for semantic bridging
SKILL_RELATIONS = {
    "Django": [("Python", 0.85), ("FastAPI", 0.78), ("REST APIs", 0.75)],
    "FastAPI": [("Python", 0.90), ("REST APIs", 0.88), ("Flask", 0.75), ("Microservices", 0.72)],
    "SQL": [("PostgreSQL", 0.95), ("MySQL", 0.92), ("Database Queries", 0.90)],
    "Docker": [("Kubernetes", 0.80), ("CI/CD", 0.72), ("AWS", 0.65)],
    "Kubernetes": [("Docker", 0.82), ("Microservices", 0.75), ("AWS", 0.70)],
    "Kafka": [("Microservices", 0.80), ("Redis", 0.68), ("Distributed Systems", 0.85)],
    "CI/CD": [("Jenkins", 0.90), ("GitHub Actions", 0.90), ("Docker", 0.75)],
    "REST APIs": [("FastAPI", 0.88), ("CRUD Endpoints", 0.92), ("HTTP APIs", 0.90)],
}

class NLPEngine:
    def __init__(self):
        self.nlp = None
        if spacy is not None:
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except Exception:
                try:
                    self.nlp = spacy.blank("en")
                except Exception:
                    self.nlp = None

        self.sentence_transformer = None
        self._transformer_attempted = False

    def _get_transformer(self):
        """Lazy loader for SentenceTransformer with instant fallback."""
        if not self._transformer_attempted:
            self._transformer_attempted = True
            try:
                import os
                # Disable network hang
                os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "0"
                from sentence_transformers import SentenceTransformer
                self.sentence_transformer = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
            except Exception as e:
                self.sentence_transformer = None
        return self.sentence_transformer

    def detect_language(self, text: str) -> Dict[str, Any]:
        """Detect language of resume text."""
        try:
            sample = text[:1000] if len(text) > 1000 else text
            lang = detect(sample)
            lang_names = {
                "en": "English",
                "fr": "French",
                "de": "German",
                "es": "Spanish",
                "it": "Italian",
                "pt": "Portuguese",
                "ja": "Japanese",
                "zh-cn": "Chinese (Simplified)",
                "ru": "Russian",
                "hi": "Hindi"
            }
            return {
                "code": lang,
                "name": lang_names.get(lang, lang.upper()),
                "is_multilingual": lang != "en"
            }
        except Exception:
            return {"code": "en", "name": "English", "is_multilingual": False}

    def canonicalize_skill(self, text: str) -> Optional[str]:
        """Map text or token to a canonical skill name."""
        cleaned = text.lower().strip()
        for canonical, aliases in CANONICAL_SKILLS.items():
            if cleaned == canonical.lower() or cleaned in aliases:
                return canonical
        return None

    def extract_entities_with_spacy(self, text: str) -> Dict[str, List[str]]:
        """Run spaCy NER to extract organizations, dates, persons, and custom entities."""
        entities = {
            "companies": [],
            "roles": [],
            "dates": [],
            "schools": [],
            "locations": [],
            "skills": []
        }

        if self.nlp is not None:
            try:
                doc = self.nlp(text[:6000]) # Limit length for fast response
                for ent in doc.ents:
                    val = ent.text.strip()
                    if ent.label_ == "ORG":
                        if len(val) > 2 and val not in entities["companies"]:
                            entities["companies"].append(val)
                    elif ent.label_ in ("DATE", "TIME"):
                        if val not in entities["dates"]:
                            entities["dates"].append(val)
                    elif ent.label_ == "GPE":
                        if val not in entities["locations"]:
                            entities["locations"].append(val)
            except Exception:
                pass

        # Match canonical skills in text using high-speed O(1) token set lookup
        text_lower = text.lower()
        tokens_set = set(re.findall(r"[a-z0-9+#.-]+", text_lower))
        for canonical, aliases in CANONICAL_SKILLS.items():
            matched = False
            can_lower = canonical.lower()
            if " " in can_lower:
                if can_lower in text_lower:
                    matched = True
            elif can_lower in tokens_set:
                matched = True

            if not matched:
                for alias in aliases:
                    if " " in alias or "-" in alias:
                        if alias in text_lower:
                            matched = True
                            break
                    elif alias in tokens_set:
                        matched = True
                        break

            if matched and canonical not in entities["skills"]:
                entities["skills"].append(canonical)

        return entities

    def compute_semantic_similarity(self, text_a: str, text_b: str) -> float:
        """Compute cosine similarity between two sentences using SentenceTransformer or fallback."""
        model = self._get_transformer()
        if model:
            try:
                embeddings = model.encode([text_a, text_b], convert_to_numpy=True)
                emb_a, emb_b = embeddings[0], embeddings[1]
                norm_a = np.linalg.norm(emb_a)
                norm_b = np.linalg.norm(emb_b)
                if norm_a == 0 or norm_b == 0:
                    return 0.0
                similarity = float(np.dot(emb_a, emb_b) / (norm_a * norm_b))
                return max(0.0, min(1.0, similarity))
            except Exception:
                pass

        # High-quality fallback token semantic overlap
        words_a = set(re.findall(r"\w+", text_a.lower()))
        words_b = set(re.findall(r"\w+", text_b.lower()))
        if not words_a or not words_b:
            return 0.0

        intersection = words_a.intersection(words_b)
        union = words_a.union(words_b)
        jaccard = len(intersection) / len(union)

        # Check domain relatedness
        boost = 0.0
        for skill, relations in SKILL_RELATIONS.items():
            if skill.lower() in text_a.lower():
                for related, score in relations:
                    if related.lower() in text_b.lower():
                        boost = max(boost, score * 0.7)

        return max(0.0, min(1.0, jaccard * 0.7 + boost))

    def detect_semantic_bridge(self, target_requirement: str, candidate_evidence_texts: List[str]) -> Tuple[bool, Optional[str], float]:
        """
        Detect if candidate has semantic evidence bridging to a requirement even if exact keyword differs.
        Example:
        Requirement: "REST API development"
        Evidence: "Built CRUD endpoints with FastAPI"
        -> (True, "Semantic Match: 'Built CRUD endpoints with FastAPI' bridges to REST API development", 0.91)
        """
        req_clean = target_requirement.lower()

        # Check semantic skill bridging rules
        for req_skill, relations in SKILL_RELATIONS.items():
            if req_skill.lower() == req_clean or req_skill.lower() in req_clean:
                for alt_skill, sim_score in relations:
                    for ev_text in candidate_evidence_texts:
                        if alt_skill.lower() in ev_text.lower():
                            bridge_msg = (
                                f"Semantic Match ({int(sim_score*100)}%): "
                                f"Evidence contains '{alt_skill}' context ('{ev_text[:80]}...') "
                                f"which bridges strongly to '{target_requirement}'."
                            )
                            return True, bridge_msg, sim_score

        # Check Sentence-Transformer similarity across candidate sentences
        best_sim = 0.0
        best_text = ""
        for ev_text in candidate_evidence_texts:
            sim = self.compute_semantic_similarity(target_requirement, ev_text)
            if sim > best_sim:
                best_sim = sim
                best_text = ev_text

        if best_sim >= 0.65:
            bridge_msg = (
                f"Semantic Match ({int(best_sim*100)}% relevance): "
                f"Phrase '{best_text[:80]}' semantically covers requirement '{target_requirement}'."
            )
            return True, bridge_msg, best_sim

        return False, None, best_sim

nlp_engine = NLPEngine()
