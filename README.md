# TalentPrism AI (SkillProof Engine)

> “A resume tells us what a candidate claims. SkillProof shows where the evidence comes from, what remains uncertain, and what an aggregate score may be hiding.”

**TalentPrism AI** is a production-grade, highly interactive, visually distinctive company-side AI recruitment intelligence platform designed for recruiters, hiring managers, talent acquisition teams, and technical interviewers.

---

## 🌟 Core Philosophy & Key Differentiators

Traditional ATS tools rely on simplistic keyword matching and flat percentage aggregators that hide exceptional talent. TalentPrism AI introduces **evidence-based intelligence**:

1. **Candidate Intelligence Passport**: Digital internal academic-style record tracking multi-source evidence, timeline progression, and version histories (V1 Resume Analysis → V4 Final Assessment).
2. **Talent Lens (Signature Feature)**: Detects when aggregate scores hide exceptional candidate strengths. Isolates **Rank Suppression** (e.g. top-tier Python/FastAPI/SQL suppressed by a single unverified Docker requirement).
3. **Dual-Mode Talent Rescue**:
   - **Mode A (Within-Role)**: Flags candidates with high core evidence and concentrated uncertainty for human review before rejection.
   - **Mode B (Cross-Role)**: Compares passports across other open company roles (e.g. Data Engineer, Platform Engineer) to route viable talent.
4. **Team Skill Matching**: Analyzes candidate capabilities against the existing team’s capability density to determine **Team Complement** (deficit-filling capabilities like Kafka/Kubernetes) vs **Overlapping Core**.
5. **Interactive Evidence Matrix**: Candidates × Requirements heatmap with drillable evidence cells and explainable NLP reasoning.
6. **What-If Simulation Laboratory**:
   - **Recruiter Priority Simulator**: Sliders to test scoring weight distributions with side-by-side scenario ranking.
   - **Skill Scenario Simulator**: Tests hypothetical rank improvement (e.g. verifying Docker from 31% to 75% jumps Candidate #14 to #3) without modifying real candidate data.
7. **AI Interview Intelligence**: Generates targeted verification questions for unverified requirements with follow-ups and “Why Ask This?” context, while explicitly excluding well-evidenced skills.
8. **Applicant Pool Intelligence & JD Expectation Signals**: Evaluates requirement scarcity (e.g. flagging if Kubernetes appears in only 17% of applicants).
9. **Multilingual Resume Intelligence**: Preserves original resume languages (French, German, Spanish, Japanese, Hindi) with language detection, normalized skill mapping, and original snippet inspection.
10. **Immutable Ranking Audit Trail**: Granular logs of recruiter criteria modifications, weight shifts, and affected rank deltas.

---

## 🏗️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide Icons.
- **Backend**: FastAPI, Python 3.11+, Pydantic v2, Uvicorn.
- **AI & NLP**: spaCy NER (`en_core_web_sm`), Sentence-Transformers (`all-MiniLM-L6-v2`), `langdetect`, Canonical Skill Mapping, Cosine Vector Bridge.
- **Parsing**: `pypdf` multi-page PDF text extraction and section segmentation.
- **Storage / Infrastructure**: PostgreSQL / pgvector ready, Docker & Docker Compose.

---

## 🚀 Quick Start

### Option 1: Local Development (Windows)

Double-click `start_dev.bat` or run:

**Backend:**
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Open your browser at:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Option 2: Docker Compose

```bash
docker compose up --build
```

---

## 🎭 The Section 37 Signature Demo Walkthrough

The platform includes a pre-seeded applicant pool of 30 realistic candidates and a built-in **5-Step Interactive Demo Walkthrough** accessible from the top banner:

1. **Step 1 (The Dilemma)**: Candidate **Elena Rostova** applied for Senior Backend Engineer. She has elite evidence in Python (94%), FastAPI (95%), and SQL (92%), but ranks **#14** (74% match) because of Docker (31%).
2. **Step 2 (Why Not Higher?)**: SkillProof explains why she is ranked #14: Docker is listed in skills, but no production deployment evidence was detected in her resume.
3. **Step 3 (Talent Lens)**: Recruiter views Elena vs applicant pool averages, discovering she is in the top 5% for core skills with a **Concentrated Gap Detected**.
4. **Step 4 (What-If Simulator)**: Recruiter tests the hypothesis: "What if Elena verifies Docker at 75% in an interview?" Elena’s simulated rank jumps from **#14 to #3 (+11 positions!)**.
5. **Step 5 (Team Match & Interview Plan)**: Team Matching reveals Elena brings Kafka (88%) and Kubernetes (82%) where the existing team has limited coverage. Interview Intelligence generates targeted questions specifically for Docker containerization while excluding Python and FastAPI.

---

## 📄 License

Proprietary — Developed for TalentPrism AI.
