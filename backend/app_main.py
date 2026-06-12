import logging
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import types
from gtts import gTTS
import io
from fastapi.responses import StreamingResponse

import hashlib

from analysis_utils import build_text_fallback, build_unavailable_result, extract_json_object, normalize_medicine_payload, normalize_result_payload
from medicine_kb import enrich_medicine
from scan_cache import cache_get, cache_set
from nim_engine import run_pipeline
from openfda import get_safety_checker


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("arogya")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODELS = [
    model.strip()
    for model in os.getenv("GEMINI_MODELS", "gemini-2.5-flash,gemini-flash-latest,gemini-2.5-pro").split(",")
    if model.strip()
]
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))


UPLOAD_DIR = BASE_DIR / "uploads"
AUDIO_DIR = BASE_DIR / "audio"
AUDIO_DIR.mkdir(exist_ok=True)
# We don't create these anymore as we use in-memory processing

gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

app = FastAPI(title="ArogyaLens API", version="4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")

LANG_MAP = {
    "en": ("English", "en"),
    "hi": ("Hindi", "hi"),
    "te": ("Telugu", "te"),
}

SYSTEM_PROMPT = """
You are ArogyaLens, a calm and caring medical document explainer for everyday people.
You are a healthcare assistant — not Wikipedia, not a medical research paper.
Analyze the uploaded image and return ONLY valid JSON.

Global rules:
- Keep these enum fields EXACTLY in English:
  - document_type: prescription | lab_report | medicine | unknown
  - confidence: high | medium | low
- All other user-facing text must be in {LANGUAGE}.
- If the image is not a medical document, or the text is too unclear, use document_type "unknown" and confidence "low".
- Never invent medicine names, dosages, test values, or diagnoses that are not visible.
- Use short, simple, spoken-style sentences. Caring, rural-friendly, elderly-friendly. No medical jargon, no robotic AI language, no encyclopedia paragraphs, no filler.
- Use empty strings and empty arrays instead of null. NEVER omit a key from the JSON shape.
- BE DETERMINISTIC: describe only what is visible, in the same order it appears on the package. The same image must always produce the same content.

First detect the document type, then use the matching format below.

=== FORMAT A: MEDICINE (strip, bottle, syrup, tablet pack, capsule, injection) ===
Everything must be based ONLY on the uploaded medicine image: detected medicine(s), dosage, combinations, warnings, timing, instructions.
- title: the real combined medicine name, e.g. "Paracetamol + Azithromycin" or "Eldoper (Loperamide) 2mg Capsules". NEVER a generic title like "Detected Medicines".
- summary: 2-4 short natural sentences ONLY about what was detected, why it is generally used, and what condition it usually helps.
  GOOD: "These tablets are usually used for fever, body pain, and cold symptoms."
  BAD: "This medicine is indicated for symptomatic management of upper respiratory tract conditions."
- medicines: one card per detected medicine. EVERY card MUST be as complete as possible:
  - If dosage/frequency/instructions are printed on the package or prescription, use exactly those.
  - Otherwise, if the medicine is well-known, give its standard commonly-recommended adult guidance (e.g. dosage "Take one tablet", frequency "Twice a day", instructions "Take after food") — this is label-standard knowledge, not hallucination.
  - side_effects: ALWAYS give the 1-2 most important real warnings for that medicine (e.g. "May cause sleepiness; Do not drive after taking"). Separate multiple warnings with "; ".
  - composition: read from the package if visible, else the medicine's known active ingredients.
  - Use an empty string ONLY when the medicine itself is unrecognizable or no reliable standard guidance exists. NEVER invent specific mg doses that are not visible or standard.
- important_warnings: ONLY if there is a real dangerous interaction, overdose risk, duplicate ingredient, or unsafe combination. Empty array if none. No fake generic warnings.
- safety_checks: 2-4 items covering: safe-together check, expiry detection if visible, storage guidance, when to consult a doctor. status "safe" or "warning". Do not over-generate warnings.
- advice: 2-4 REAL practical recovery suggestions matched to the probable condition (e.g. cough medicine -> drink warm water, avoid cold drinks; acidity medicine -> avoid spicy food). No random lifestyle advice.
- key_points: 3-5 compact, important-only bullets.

Return exactly this JSON shape:
{
  "document_type": "medicine",
  "confidence": "high|medium|low",
  "confidence_note": "One short sentence about image clarity",
  "title": "Real medicine name(s)",
  "summary": "Short natural human summary",
  "medicines": [
    {
      "name": "ALWAYS format as: Brand name (active formula) strength + type. Example: 'Eldoper (Loperamide) 2mg Capsules', 'Saridon (Paracetamol + Propyphenazone + Caffeine) Tablets'. The BRAND name printed on the package comes FIRST, formula in brackets after it. NEVER use only the formula name as the title.",
      "purpose": "One-line real usage (e.g., For fever and body pain)",
      "dosage": "e.g., 'Take one tablet', 'Take one capsule', '5ml'",
      "frequency": "STRICT: must contain a NUMBER of times per day. Pick ONLY from: 'Once a day', 'Twice a day', 'Three times a day', 'Up to three times a day', 'Morning and Night', 'Morning, Afternoon, Night', 'At night before sleep'. Convert shorthand (1-0-1 -> Morning and Night). FORBIDDEN: 'When needed', 'As needed', any sentence, any 'or', any 'as advised/directed by doctor'.",
      "instructions": "Practical usage instructions (e.g., Take after food, Take with water)",
      "side_effects": "The 1-2 most important realistic warnings, separated by '; ' (e.g., 'May cause sleepiness; Do not drive after taking')",
      "composition": "Active ingredients, or empty string"
    }
  ],
  "important_warnings": [],
  "safety_checks": [
    {"status": "safe|warning", "message": "Short safety line"}
  ],
  "advice": ["Practical suggestion 1", "Practical suggestion 2"],
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "audio_text": "Complete simplified spoken explanation of the whole result"
}

=== FORMAT B: PRESCRIPTION / LAB REPORT / UNKNOWN ===
- details[].status: normal | high | low | info (EXACTLY in English)
- Keep timeline as an array of objects with "step" and "action".

Return exactly this JSON shape:
{
  "document_type": "prescription|lab_report|unknown",
  "confidence": "high|medium|low",
  "confidence_note": "One short sentence about image clarity and reliability",
  "reassurance": "One or two calm opening sentences",
  "title": "A short friendly title",
  "summary": "Four to six simple sentences",
  "what_to_do": ["Action 1", "Action 2", "Action 3"],
  "details": [
    {
      "name": "Medicine name or test name",
      "primary": "Dosage or result value",
      "secondary": "What it means in simple words",
      "when": "When to take it, or empty string",
      "duration": "How long, or empty string",
      "status": "normal|high|low|info"
    }
  ],
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "safety_ok": true,
  "safety_message": "A calm safety note",
  "timeline": [
    {"step": "Now", "action": "What to do now"},
    {"step": "Next", "action": "What to do next"}
  ],
  "audio_text": "A short voice-friendly summary",
  "positive_note": "A supportive closing sentence"
}

RETURN EXACTLY ONE JSON OBJECT MATCHING THE DETECTED DOCUMENT TYPE.
"""




def _validate_image(file: UploadFile, content: bytes) -> str:
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"Please upload an image smaller than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")

    mime_type = (file.content_type or "").lower()
    if mime_type and not mime_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload a valid image file.")

    return mime_type or "image/jpeg"


@app.get("/api/audio")
async def get_audio(text: str, lang: str = "en"):
    try:
        _, gtts_lang = LANG_MAP.get(lang, ("English", "en"))
        mp3_fp = io.BytesIO()
        tts = gTTS(text=text[:3500], lang=gtts_lang, slow=False)
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        return StreamingResponse(mp3_fp, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _run_gemini_analysis(content: bytes, mime_type: str, prompt: str) -> tuple[dict | None, list[str]]:
    if gemini_client is None:
        return None, ["Gemini is not configured."]

    errors: list[str] = []
    for model_name in GEMINI_MODELS:
        try:
            logger.info("Trying Gemini model: %s", model_name)
            response = gemini_client.models.generate_content(
                model=model_name,
                contents=[types.Part.from_bytes(data=content, mime_type=mime_type), prompt],
                config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.0, seed=42),
            )
            payload = extract_json_object(response.text)
            if payload:
                payload["analysis_source"] = f"gemini:{model_name}"
                return payload, errors
            errors.append(f"{model_name}: response was not valid JSON")
        except Exception as exc:
            logger.warning("Gemini model %s failed: %s", model_name, exc)
            errors.append(f"{model_name}: {exc}")

    return None, errors


async def _run_nvidia_analysis(content: bytes, mime_type: str, prompt: str, language: str) -> tuple[dict | None, list[str]]:
    try:
        logger.info("Trying NVIDIA vision fallback")
        raw_text, model_name = await run_pipeline(content, prompt=prompt, mime_type=mime_type)
        payload = extract_json_object(raw_text)
        if payload:
            payload["analysis_source"] = f"nvidia:{model_name}"
            return payload, []

        fallback = normalize_result_payload(build_text_fallback(raw_text, language), language)
        fallback["analysis_source"] = f"nvidia:{model_name}:text"
        return fallback, []
    except Exception as exc:
        logger.warning("NVIDIA analysis failed: %s", exc)
        return None, [f"nvidia: {exc}"]


def _apply_safety_check(result: dict, language: str) -> dict:
    if language != "en" or result.get("document_type") != "prescription":
        return result

    medicine_names = [detail.get("name", "").strip() for detail in result.get("details", []) if detail.get("name")]
    if len(medicine_names) < 2:
        return result

    try:
        warning = get_safety_checker().check_interactions(medicine_names)
        if warning and "No dangerous interactions found" not in warning and "No interactions to check" not in warning:
            result["safety_ok"] = False
            result["safety_message"] = warning
    except Exception as exc:
        logger.warning("OpenFDA safety check failed: %s", exc)

    return result


@app.post("/analyze")
async def analyze_document(file: UploadFile = File(...), language: str = "en"):
    lang_name, _ = LANG_MAP.get(language, ("English", "en"))
    prompt = SYSTEM_PROMPT.replace("{LANGUAGE}", lang_name)

    content = await file.read()
    mime_type = _validate_image(file, content)
    file_id = str(uuid.uuid4())

    cache_key = hashlib.sha256(content + language.encode()).hexdigest()
    cached = cache_get(cache_key)
    if cached:
        logger.info("Returning cached analysis for %s", cache_key[:12])
        return cached

    provider_errors: list[str] = []

    result, errors = _run_gemini_analysis(content, mime_type, prompt)
    provider_errors.extend(errors)

    if result is None:
        result, errors = await _run_nvidia_analysis(content, mime_type, prompt, language)
        provider_errors.extend(errors)

    if result is None:
        logger.warning("All analyzers failed: %s", " | ".join(provider_errors))
        result = build_unavailable_result(language)

    if result.get("document_type") == "medicine" and isinstance(result.get("medicines"), list) and result["medicines"]:
        result = normalize_medicine_payload(result, language)
        result["medicines"] = [enrich_medicine(med, language) for med in result["medicines"]]
    else:
        result = normalize_result_payload(result, language)
        result = _apply_safety_check(result, language)

    result["audio_url"] = f"/api/audio?text={result.get('summary', '')}&lang={language}"
    if result.get("document_type") != "unknown":
        cache_set(cache_key, result)
    return result


@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "4.1-medicine-format",
        "providers": {
            "gemini_configured": bool(GEMINI_API_KEY),
            "nvidia_configured": bool(os.getenv("NVAPI_KEY")),
            "audio_enabled": True,
        },
        "max_upload_bytes": MAX_UPLOAD_BYTES,
    }
