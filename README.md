# ArogyaLens

**Understand any medical document — in your own language, without medical knowledge.**

ArogyaLens is an AI health companion that turns any medical document — a medicine strip, prescription, or lab report — into a simple, spoken explanation in the user's own language (English, Hindi, Telugu). Users just photograph the document, and within seconds ArogyaLens explains what each medicine does, how and when to take it, what to avoid, and any safety warnings — in plain, caring language built for elderly and rural users who cannot decode medical jargon.

Built for the **Gen AI Academy APAC Edition** hackathon (Google Cloud + Hack2skill) under the challenge *"AI for Better Living and Smarter Communities."*

**Live app:** https://arogyalens.vercel.app

## Features

- Scan any medical document by camera or upload — medicine, prescription, or lab report (auto-detected)
- Plain-language explanation: purpose, dosage, frequency, instructions, and side effects
- Multilingual output: English, Hindi, Telugu
- Audio playback (text-to-speech) for low-literacy and elderly users
- Safety intelligence: drug-interaction warnings, expiry and storage guidance
- Verified medicine knowledge base — no hallucinated dosages
- Mobile OTP login with personal health profile and cloud scan history
- Download or share results as PDF or image

## How it works

Image → Google Gemini (identify + explain) → verified knowledge base & safety layer → universal cache → structured result with card UI + audio.

The AI only *identifies* the medicine; the actual dosage, frequency, and warnings come from a curated knowledge base, so results stay medically consistent — the same scan always gives the same trusted answer. NVIDIA NIM vision serves as an automatic fallback for resilience.

## Tech Stack

- **Frontend:** React 19 + Vite (Vercel)
- **Backend:** Python FastAPI (Vercel serverless)
- **AI:** Google Gemini (vision + reasoning), Google gTTS (speech), NVIDIA NIM (fallback)
- **Database/Cloud:** Supabase (Postgres) — profiles, scan history, universal cache
- **Safety data:** OpenFDA drug-interaction checks

## Project Structure

- `frontend/` — React + Vite single-page app
- `backend/` — FastAPI service, medicine knowledge base, scan cache, safety checks

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app_main:app --port 8000 --reload

# Frontend
cd frontend
npm install
npm run dev
```
