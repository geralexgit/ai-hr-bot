
---

# AGENTS.md

## Overview

This document describes the architecture and agent responsibilities of the **AI HR Bot** system. The system is a **Telegram bot** that manages recruitment workflows, with integrations for:

* **PostgreSQL** database (vacancies and candidate dialogues)
* **LLM-powered analysis agent** for candidate answers
* **Google Speech-to-Text** for audio message processing
* **Next.js admin panel** for HR managers to manage vacancies and candidate pipelines

---

## Agents and Responsibilities

### 1. **Bot Agent (Telegram Integration)**

* Presents active vacancies as **buttons** to candidates.
* Manages candidate interactions: text input, audio input, button responses.
* Sends data to the database and triggers analysis pipeline.
* Delivers structured feedback and personalized notifications back to candidates.

**Inputs:** Candidate responses (text/audio), vacancy selection.
**Outputs:** Stored dialogues, analysis requests to AI agent, candidate feedback.

---

### 2. **Audio Processing Agent (Google Speech-to-Text)**

* Converts candidate **voice messages** into text.
* Stores original audio files in persistent storage.
* Provides transcriptions for further NLP analysis.

**Inputs:** Telegram audio messages.
**Outputs:** Audio file storage + text transcription.

---

### 3. **Database Agent (PostgreSQL)**

**Tables:**

* **Vacancies** – stores job requirements, weights, skills, key criteria.
* **Dialogues** – stores full candidate conversations (text + audio + analysis).

**Responsibilities:**

* Persist candidate interactions.
* Store structured reports and evaluation results.
* Link candidates to vacancies.

---

### 4. **LLM Analysis Agent**

* Performs **semantic analysis** of candidate answers against vacancy requirements.
* Extracts and classifies candidate skills, experiences, and key phrases.
* Identifies:

  * ✅ Confirmed requirements
  * ❌ Unconfirmed requirements
  * ⚠ Contradictions / Red flags

**Evaluation Pipeline:**

1. **NLP Matching** – extract relevant entities, skills, and experience.
2. **Weighted Scoring** – compute fit percentage based on configurable weights:

   * Technical skills – 50%
   * Communication – 30%
   * Case/problem solving – 20%
3. **Report Generation** – structured report with:

   * Overall percentage match
   * Strengths and gaps
   * Recommendation: *Proceed*, *Reject*, *Clarify*

**Outputs:**

* JSON structured report
* Candidate-specific feedback messages

---

### 5. **Admin Panel Agent (Next.js)**

**Requirements:**

* **Transparent interface** for managing vacancies and recruitment processes.
* **Flexible candidate pipeline management** (track status, move between stages).
* **Reporting features**:

  * Candidate evaluation reports
  * Vacancy statistics
  * Decision-making history
* **Vacancy management:**

  * Create, update, delete vacancies
  * Assign weights for evaluation criteria
  * Push vacancies to Telegram bot

---

## Candidate Feedback Flow

1. Candidate selects a vacancy → answers questions.
2. Responses (text/audio) are stored and analyzed.
3. LLM generates **fit report**.
4. Personalized feedback is generated (e.g., *“Your Python knowledge is strong, but SQL requires improvement”*).
5. Bot sends structured decision to candidate:

   * ✅ Proceed to next stage
   * ❌ Rejection (with explanation)
   * ❓ Requires clarification

---

## Reporting Format (Example JSON)

```json
{
  "vacancy_id": "123",
  "candidate_id": "456",
  "match_score": 78,
  "criteria": {
    "technical_skills": { "score": 80, "confirmed": ["Python"], "gaps": ["SQL"] },
    "communication": { "score": 70, "flags": ["generic answers"] },
    "case_solving": { "score": 85 }
  },
  "contradictions": ["Years of experience inconsistent"],
  "recommendation": "Proceed to next stage",
  "feedback": "Your Python level is solid. Please provide more details about SQL experience."
}
```

---

## Future Extensions

* Multi-language support for candidates.
* Advanced analytics dashboards in admin panel.
* Integration with HRM/ATS systems.
* Automated scheduling of interviews.


