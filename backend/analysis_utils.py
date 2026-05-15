from __future__ import annotations

import json
from typing import Any


_MESSAGES = {
    "en": {
        "fallback_title": "Medical Image Review Needed",
        "fallback_reassurance": "I could not read this image with enough confidence yet.",
        "fallback_summary": "Please upload a clearer photo of a prescription, lab report, or medicine pack. Good lighting and a straight camera angle help a lot.",
        "fallback_note": "The AI analysis service was temporarily unavailable or the image was unclear.",
        "fallback_safety": "No medicine safety check was completed because the document could not be read clearly.",
        "fallback_positive": "You are doing the right thing by checking before taking action.",
        "fallback_actions": [
            "Retake the photo in bright light.",
            "Keep the whole document inside the frame.",
            "Try again with the language you prefer.",
        ],
        "fallback_points": [
            "Avoid guessing medicine names from an unclear image.",
            "A sharper photo usually improves the result.",
            "Ask a doctor or pharmacist if the text is urgent.",
        ],
        "fallback_timeline_now": "Now",
        "fallback_timeline_next": "Next",
        "fallback_timeline_now_action": "Take a clearer photo of the same document.",
        "fallback_timeline_next_action": "Upload it again for a better explanation.",
        "prescription_title": "Prescription Summary",
        "lab_report_title": "Lab Report Summary",
        "medicine_title": "Medicine Information",
        "unknown_title": "Medical Image Summary",
    },
    "hi": {
        "fallback_title": "Medical Image Review Needed",
        "fallback_reassurance": "I could not read this image with enough confidence yet.",
        "fallback_summary": "Please upload a clearer photo of a prescription, lab report, or medicine pack. Good lighting and a straight camera angle help a lot.",
        "fallback_note": "The AI analysis service was temporarily unavailable or the image was unclear.",
        "fallback_safety": "No medicine safety check was completed because the document could not be read clearly.",
        "fallback_positive": "You are doing the right thing by checking before taking action.",
        "fallback_actions": [
            "Retake the photo in bright light.",
            "Keep the whole document inside the frame.",
            "Try again with the language you prefer.",
        ],
        "fallback_points": [
            "Avoid guessing medicine names from an unclear image.",
            "A sharper photo usually improves the result.",
            "Ask a doctor or pharmacist if the text is urgent.",
        ],
        "fallback_timeline_now": "Now",
        "fallback_timeline_next": "Next",
        "fallback_timeline_now_action": "Take a clearer photo of the same document.",
        "fallback_timeline_next_action": "Upload it again for a better explanation.",
        "prescription_title": "Prescription Summary",
        "lab_report_title": "Lab Report Summary",
        "medicine_title": "Medicine Information",
        "unknown_title": "Medical Image Summary",
    },
    "te": {
        "fallback_title": "Medical Image Review Needed",
        "fallback_reassurance": "I could not read this image with enough confidence yet.",
        "fallback_summary": "Please upload a clearer photo of a prescription, lab report, or medicine pack. Good lighting and a straight camera angle help a lot.",
        "fallback_note": "The AI analysis service was temporarily unavailable or the image was unclear.",
        "fallback_safety": "No medicine safety check was completed because the document could not be read clearly.",
        "fallback_positive": "You are doing the right thing by checking before taking action.",
        "fallback_actions": [
            "Retake the photo in bright light.",
            "Keep the whole document inside the frame.",
            "Try again with the language you prefer.",
        ],
        "fallback_points": [
            "Avoid guessing medicine names from an unclear image.",
            "A sharper photo usually improves the result.",
            "Ask a doctor or pharmacist if the text is urgent.",
        ],
        "fallback_timeline_now": "Now",
        "fallback_timeline_next": "Next",
        "fallback_timeline_now_action": "Take a clearer photo of the same document.",
        "fallback_timeline_next_action": "Upload it again for a better explanation.",
        "prescription_title": "Prescription Summary",
        "lab_report_title": "Lab Report Summary",
        "medicine_title": "Medicine Information",
        "unknown_title": "Medical Image Summary",
    },
}


def _messages(lang_code: str) -> dict[str, Any]:
    return _MESSAGES.get(lang_code, _MESSAGES["en"])


def extract_json_object(raw_text: str | None) -> dict[str, Any] | None:
    if not raw_text:
        return None

    text = raw_text.strip()
    if not text:
        return None

    if "```" in text:
        parts = [part.strip() for part in text.split("```") if part.strip()]
        for part in parts:
            candidate = part
            if candidate.lower().startswith("json"):
                candidate = candidate[4:].strip()
            parsed = _try_json_load(candidate)
            if isinstance(parsed, dict):
                return parsed

    parsed = _try_json_load(text)
    if isinstance(parsed, dict):
        return parsed

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        parsed = _try_json_load(text[start : end + 1])
        if isinstance(parsed, dict):
            return parsed

    return None


def _try_json_load(candidate: str) -> Any:
    try:
        return json.loads(candidate)
    except (TypeError, json.JSONDecodeError):
        return None


def normalize_result_payload(payload: Any, lang_code: str) -> dict[str, Any]:
    if not isinstance(payload, dict):
        return build_text_fallback(str(payload or ""), lang_code)

    document_type = _normalize_document_type(payload.get("document_type"))
    summary = _stringify(payload.get("summary")) or _messages(lang_code)["fallback_summary"]
    actions = _normalize_string_list(payload.get("what_to_do"))
    if not actions:
        actions = list(_messages(lang_code)["fallback_actions"])

    details = _normalize_details(payload.get("details"))
    timeline = _normalize_timeline(payload.get("timeline"), lang_code, actions)

    result = {
        "document_type": document_type,
        "confidence": _normalize_confidence(payload.get("confidence")),
        "confidence_note": _stringify(payload.get("confidence_note")) or _messages(lang_code)["fallback_note"],
        "reassurance": _stringify(payload.get("reassurance")) or _messages(lang_code)["fallback_reassurance"],
        "title": _stringify(payload.get("title")) or _default_title(document_type, lang_code),
        "summary": summary,
        "what_to_do": actions[:5],
        "details": details[:8],
        "key_points": _normalize_string_list(payload.get("key_points"))[:5] or list(_messages(lang_code)["fallback_points"]),
        "safety_ok": _normalize_bool(payload.get("safety_ok"), default=document_type == "unknown"),
        "safety_message": _stringify(payload.get("safety_message")) or _messages(lang_code)["fallback_safety"],
        "timeline": timeline[:4],
        "audio_text": _stringify(payload.get("audio_text")) or _build_audio_text(summary, actions, lang_code),
        "positive_note": _stringify(payload.get("positive_note")) or _messages(lang_code)["fallback_positive"],
    }

    if document_type == "unknown" and not result["details"]:
        result["safety_ok"] = True
        result["safety_message"] = _messages(lang_code)["fallback_safety"]

    return result


def build_text_fallback(text: str, lang_code: str) -> dict[str, Any]:
    fallback = build_unavailable_result(lang_code)
    cleaned = " ".join(text.split())
    if cleaned:
        fallback["summary"] = cleaned[:700]
        fallback["audio_text"] = cleaned[:320]
    return fallback


def build_unavailable_result(lang_code: str) -> dict[str, Any]:
    messages = _messages(lang_code)
    return {
        "document_type": "unknown",
        "confidence": "low",
        "confidence_note": messages["fallback_note"],
        "reassurance": messages["fallback_reassurance"],
        "title": messages["fallback_title"],
        "summary": messages["fallback_summary"],
        "what_to_do": list(messages["fallback_actions"]),
        "details": [],
        "key_points": list(messages["fallback_points"]),
        "safety_ok": True,
        "safety_message": messages["fallback_safety"],
        "timeline": [
            {"step": messages["fallback_timeline_now"], "action": messages["fallback_timeline_now_action"]},
            {"step": messages["fallback_timeline_next"], "action": messages["fallback_timeline_next_action"]},
        ],
        "audio_text": messages["fallback_summary"],
        "positive_note": messages["fallback_positive"],
    }


def _normalize_document_type(value: Any) -> str:
    text = _stringify(value).lower()
    if not text:
        return "unknown"
    if "prescription" in text:
        return "prescription"
    if "lab" in text or "report" in text or "scan" in text or "x-ray" in text or "blood" in text:
        return "lab_report"
    if "medicine" in text or "strip" in text or "tablet" in text or "bottle" in text or "pack" in text:
        return "medicine"
    if text in {"prescription", "lab_report", "medicine", "unknown"}:
        return text
    return "unknown"


def _normalize_confidence(value: Any) -> str:
    if isinstance(value, (int, float)):
        if value >= 0.75:
            return "high"
        if value >= 0.4:
            return "medium"
        return "low"

    text = _stringify(value).lower()
    if "high" in text:
        return "high"
    if "medium" in text or "moderate" in text:
        return "medium"
    if "low" in text:
        return "low"
    return "low"


def _normalize_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    text = _stringify(value).strip().lower()
    if text in {"true", "yes", "y", "1", "safe", "ok"}:
        return True
    if text in {"false", "no", "n", "0"}:
        return False
    return default


def _normalize_details(value: Any) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []

    details: list[dict[str, str]] = []
    for item in value:
        if isinstance(item, dict):
            details.append(
                {
                    "name": _stringify(item.get("name")) or "Item",
                    "primary": _stringify(item.get("primary")),
                    "secondary": _stringify(item.get("secondary")),
                    "when": _stringify(item.get("when")),
                    "duration": _stringify(item.get("duration")),
                    "status": _normalize_status(item.get("status")),
                }
            )
        else:
            text = _stringify(item)
            if text:
                details.append(
                    {
                        "name": text,
                        "primary": "",
                        "secondary": "",
                        "when": "",
                        "duration": "",
                        "status": "info",
                    }
                )
    return details


def _normalize_timeline(value: Any, lang_code: str, actions: list[str]) -> list[dict[str, str]]:
    timeline: list[dict[str, str]] = []
    if isinstance(value, list):
        for item in value:
            if isinstance(item, dict):
                step = _stringify(item.get("step"))
                action = _stringify(item.get("action"))
                if step or action:
                    timeline.append({"step": step or _messages(lang_code)["fallback_timeline_now"], "action": action or _messages(lang_code)["fallback_timeline_now_action"]})

    if timeline:
        return timeline

    messages = _messages(lang_code)
    if actions:
        return [
            {"step": messages["fallback_timeline_now"], "action": actions[0]},
            {"step": messages["fallback_timeline_next"], "action": actions[min(1, len(actions) - 1)]},
        ]

    return [
        {"step": messages["fallback_timeline_now"], "action": messages["fallback_timeline_now_action"]},
        {"step": messages["fallback_timeline_next"], "action": messages["fallback_timeline_next_action"]},
    ]


def _normalize_status(value: Any) -> str:
    text = _stringify(value).lower()
    if "high" in text:
        return "high"
    if "low" in text:
        return "low"
    if "normal" in text or "safe" in text or "ok" == text:
        return "normal"
    return "info"


def _normalize_string_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [text for text in (_stringify(item) for item in value) if text]
    if isinstance(value, str):
        normalized = value.replace("\r", "\n")
        parts = [part.strip(" -•\t") for part in normalized.replace(";", "\n").split("\n")]
        return [part for part in parts if part]
    text = _stringify(value)
    return [text] if text else []


def _default_title(document_type: str, lang_code: str) -> str:
    messages = _messages(lang_code)
    mapping = {
        "prescription": messages["prescription_title"],
        "lab_report": messages["lab_report_title"],
        "medicine": messages["medicine_title"],
        "unknown": messages["unknown_title"],
    }
    return mapping.get(document_type, messages["unknown_title"])


def _build_audio_text(summary: str, actions: list[str], lang_code: str) -> str:
    pieces = [summary]
    pieces.extend(actions[:2])
    pieces.append(_messages(lang_code)["fallback_positive"])
    return " ".join(piece.strip() for piece in pieces if piece).strip()


def _stringify(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float, bool)):
        return str(value).strip()
    if isinstance(value, list):
        return ", ".join(part for part in (_stringify(item) for item in value) if part)
    if isinstance(value, dict):
        try:
            return json.dumps(value, ensure_ascii=False)
        except TypeError:
            return str(value).strip()
    return str(value).strip()
