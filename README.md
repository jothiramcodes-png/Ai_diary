# LifeBook AI — AI-Powered Multimodal Digital Diary & Personal Life Assistant

> *"Your life, remembered."*

LifeBook AI is a real, functional, demo-ready full-stack multimodal digital diary that captures life via **Voice**, **Text**, and **Photos**, extracts structured memories (**People**, **Places**, **Activities**, **Projects**, **Commitments**), links them onto an interactive **Personal Life Graph**, detects recurring habits and routine deviations, answers *"What am I forgetting?"*, and schedules proactive reminders.

Designed with a **handcrafted leather-bound journal aesthetic** laid on a warm mahogany desk with a stitched leather spine, warm cream paper pages, taped polaroids, live audio waveforms, and a floating AI companion.

---

## 📸 Handcrafted Journal UI Experience

The application is styled exactly like an open physical leather diary:
- **Left Stitched Spine Navigation**: Ribbon tabs for *Today*, *Memories*, *Add Memory*, *Commitments* (with badge counter), *Insights*, *Ask My Diary*, *Photos*, *People & Places*, *Goals*, *Privacy*, *Settings*, and *Admin*.
- **Left Page**:
  - Live Date Header: *"Thursday, September 10, 2026"* with sun icon and handwriting greeting.
  - Taped Polaroid card with washi tape (*"Madurai ❤️"*).
  - Central **"What happened today?"** capture card with live HTML5 Web Audio API waveform canvas and emerald green microphone button.
  - Active **11-Stage ProcessingTracker** with real-time state progress.
  - **Today's Diary Narrative** with photo thumbnails, entity tags (*📍 Madurai*, *👤 Ravi*, *👤 Kumar*, *🍴 Biryani*, *💼 Customer Meeting*), and *AI Understood* grid.
  - **LifeBook noticed...** routine insight card with deviation check-in.
- **Right Page**:
  - Top search bar, notification bell with unread badge, and user avatar.
  - **Things that need your attention**: Prioritized commitments with due dates and real database *Mark Done* buttons.
  - **Your routines**: Weekly habits with circular 87% confidence meter and neutral deviation explanation.
  - **On This Day & Recent Photos**: Historical memory resurfacing from 2 years ago (*"A Relaxing Evening at Marina Beach"*).
  - **Mood & Wellbeing**: Emoji mood check-in.
- **Floating "Ask LifeBook" Assistant**:
  - Direct answers for *"What am I forgetting?"*, *"When did I last meet Ravi?"*, *"Show my Madurai trips"*, and conversational search linked to source diary entries.

---

## ⚡ The 11-Stage Durability-First Status Machine

LifeBook AI uses a durability-first approach where raw user voice/text/photo is immediately committed to storage before background AI processing begins. Every entry moves through an explicit state machine:

| Step | State | Description |
| :--- | :--- | :--- |
| **1** | `RECEIVED` | Raw payload received and validated by API gateway |
| **2** | `SAVED` | Raw audio (`.webm`) or text securely committed to disk & DB |
| **3** | `TRANSCRIBING` | Speech-to-Text conversion via Whisper / Local STT |
| **4** | `EXTRACTING` | AI extracts People, Places, Activities, Projects, Commitments |
| **5** | `DRAFTED` | Polished reflective first-person narrative generated |
| **6** | `USER_REVIEW` | Human-in-the-loop review card with disambiguation |
| **7** | `CONFIRMED` | Approved by user with confetti celebration |
| **8** | `GRAPH_UPDATED` | Nodes & edges connected in Personal Life Graph |
| **9** | `EMBEDDING_CREATED` | Semantic vector embeddings computed |
| **10** | `INDEXED` | Search index updated for conversational queries |
| **11** | `COMPLETED` | Fully linked and archived |

> **Zero Data Loss Guarantee**: If an external AI provider experiences an outage, the memory enters `ENRICHMENT_PENDING`. The raw audio and text are never deleted and can be resumed at any time.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Audio Capture**: HTML5 `MediaRecorder` API + `Web Audio API` for live waveform rendering and playback preview.
- **Backend**: Python FastAPI with async route handlers and Pydantic v2 schemas.
- **Database**: Dual mode — **SQLite** default (instant zero-configuration local launch) and **PostgreSQL + pgvector** via Docker Compose.
- **AI Abstraction**: Pluggable provider architecture with `SmartLocalAIProvider` (deterministic local NLP heuristics requiring zero API keys) and `RealAIProvider` (OpenAI / Gemini / Whisper connectors).
- **Security**: JWT Bearer authentication, bcrypt password hashing, user data isolation, and masked PII audit logs.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+ (tested with Python 3.14)
- Node.js v18+ (tested with v24)
- Git

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Seed Demo Data
Run the demo seed script to initialize the SQLite database with realistic memories, Ravi, SIH project, Madurai trip, and commitments:
```bash
python ../database/seed_demo.py
```
> **Default Demo Account**:
> - Email: `jothiram@lifebook.ai`
> - Password: `LifeBook2026!`

### 4. Start the Backend Server
```bash
# Inside backend/ directory:
uvicorn app.main:app --reload --port 8000
```
*API Documentation will be live at:* `http://127.0.0.1:8000/docs`

### 5. Frontend Setup & Run
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Open your browser at:* `http://localhost:5173`

---

## 🧪 Running Automated Tests

Run the complete backend pytest suite:
```bash
cd backend
.venv\Scripts\pytest
```
*Test suite validates:*
- `test_auth.py`: Registration, login, JWT token verification, invalid credentials.
- `test_diary.py`: Text memory creation, durable storage persistence, status lifecycle, confirmation.
- `test_commitments.py`: Detection, listing, completing commitments, and "What am I forgetting?".
- `test_security.py`: User data isolation (User A cannot access User B's memories), unauthenticated 401 rejection.

---

## 🏆 Hackathon Live Demo Walkthrough (Step-by-Step)

Follow this exact scenario during your live presentation:

1. **Open Journal Dashboard**:
   - Notice the leather book aesthetic with *Thursday, September 10, 2026*, coffee cup, fountain pen, and *Day at a Glance*.
2. **Tap "Tap to speak" (or "Write a memory")**:
   - Voice modal opens with live HTML5 waveform animation.
   - Speak or click *"Or run the SIH / Ravi Live Demo recording instantly →"*:
     *"Today I went to college with Ravi. We worked on our SIH project and decided to finish the API next Wednesday."*
3. **Watch the Real-Time Stepper**:
   - `Captured ✓` ➔ `Saved ✓` ➔ `Transcribing ✓` ➔ `Understanding ●` ➔ `User Review ○`
4. **Review AI Understanding & Disambiguation**:
   - Extracted: **Person** (Ravi), **Place** (College), **Project** (SIH Project), **Commitment** (Finish API, Next Wednesday).
   - Low-confidence prompt: *"Which Ravi did you meet today? Ravi Kumar (College) vs Ravi S (Client)"*.
5. **Confirm Draft**:
   - Click **Confirm & Save Memory** ➔ Confetti celebration fires!
   - Status advances to `CONFIRMED` ➔ `GRAPH_UPDATED` ➔ `INDEXED` ➔ `COMPLETED`.
6. **Open Personal Life Graph**:
   - Click **People & Places** on the leather spine.
   - Interactive network diagram displays: `YOU ➔ met ➔ RAVI ➔ worked_on ➔ SIH PROJECT ➔ requires ➔ FINISH API`.
7. **Test "What am I forgetting?"**:
   - Click the floating **Ask LifeBook** widget at the bottom right.
   - Tap `🔘 What am I forgetting?`.
   - The assistant prioritizes:
     - 🔴 **Finish SIH API** (Due: Next Wednesday)
     - 🔴 **Send quotation to Ravi** (Due: Tomorrow)
   - Tap `[ Done ]` on an item ➔ updates database immediately and shows confirmation!
8. **Check Privacy & Data Ownership**:
   - Click **Privacy** ➔ toggle Routine Learning or Location Analysis.
   - Click **Export JSON** ➔ downloads complete machine-readable backup of all diary entries and graph relationships.

# Ai_diary
