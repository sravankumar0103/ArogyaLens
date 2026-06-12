"""Curated medicine knowledge base.

The vision model only IDENTIFIES the medicine; the canonical usage facts
(dosage, frequency, instructions, side effects) come from this table so
the output is identical on every scan. Keys are matched as substrings of
the detected medicine name/composition (lowercase).
"""

from __future__ import annotations

KB: dict[str, dict[str, str]] = {
    "loperamide": {
        "purpose": "For sudden, short-term diarrhea",
        "dosage": "Take one capsule",
        "frequency": "Up to three times a day",
        "instructions": "Take with water. Drink plenty of fluids or ORS to stay hydrated",
        "side_effects": "May cause constipation; Do not take for more than 2 days without consulting a doctor",
    },
    "paracetamol": {
        "purpose": "For fever and body pain",
        "dosage": "Take one tablet",
        "frequency": "Three times a day",
        "instructions": "Take after food",
        "side_effects": "Do not exceed 3 tablets a day; Overdose may damage the liver",
    },
    "dolo": {
        "purpose": "For fever and body pain",
        "dosage": "Take one tablet",
        "frequency": "Three times a day",
        "instructions": "Take after food",
        "side_effects": "Do not exceed 3 tablets a day; Overdose may damage the liver",
    },
    "saridon": {
        "purpose": "For headaches and body pain",
        "dosage": "Take one tablet",
        "frequency": "Up to three times a day",
        "instructions": "Take with food or milk",
        "side_effects": "Do not take more than three tablets a day; Avoid on an empty stomach",
    },
    "sinarest": {
        "purpose": "For cold, flu, and nasal congestion",
        "dosage": "Take one tablet",
        "frequency": "Twice a day",
        "instructions": "Take after food",
        "side_effects": "May cause sleepiness; Do not take if you have high blood pressure",
    },
    "atarax": {
        "purpose": "For anxiety, itching, or as a sedative",
        "dosage": "Take one tablet",
        "frequency": "At night before sleep",
        "instructions": "Take with water",
        "side_effects": "May cause drowsiness; Do not drive or operate machinery after taking",
    },
    "hydroxyzine": {
        "purpose": "For anxiety, itching, or as a sedative",
        "dosage": "Take one tablet",
        "frequency": "At night before sleep",
        "instructions": "Take with water",
        "side_effects": "May cause drowsiness; Do not drive or operate machinery after taking",
    },
    "cetirizine": {
        "purpose": "For allergy, sneezing, and runny nose",
        "dosage": "Take one tablet",
        "frequency": "Once a day",
        "instructions": "Take at night with water",
        "side_effects": "May cause sleepiness; Avoid alcohol",
    },
    "azithromycin": {
        "purpose": "Antibiotic for bacterial infections",
        "dosage": "Take one tablet",
        "frequency": "Once a day",
        "instructions": "Take one hour before or two hours after food",
        "side_effects": "May cause stomach upset; Complete the full course even if you feel better",
    },
    "amoxicillin": {
        "purpose": "Antibiotic for bacterial infections",
        "dosage": "Take one capsule",
        "frequency": "Twice a day",
        "instructions": "Take after food",
        "side_effects": "May cause stomach upset; Complete the full course even if you feel better",
    },
    "ibuprofen": {
        "purpose": "For pain, swelling, and fever",
        "dosage": "Take one tablet",
        "frequency": "Twice a day",
        "instructions": "Take after food, never on an empty stomach",
        "side_effects": "May cause acidity or stomach pain; Avoid if you have ulcers",
    },
    "pantoprazole": {
        "purpose": "For acidity and heartburn",
        "dosage": "Take one tablet",
        "frequency": "Once a day",
        "instructions": "Take in the morning before breakfast",
        "side_effects": "Avoid spicy and oily food while on this medicine",
    },
    "omeprazole": {
        "purpose": "For acidity and heartburn",
        "dosage": "Take one capsule",
        "frequency": "Once a day",
        "instructions": "Take in the morning before breakfast",
        "side_effects": "Avoid spicy and oily food while on this medicine",
    },
    "metformin": {
        "purpose": "For controlling blood sugar in diabetes",
        "dosage": "Take one tablet",
        "frequency": "Twice a day",
        "instructions": "Take with meals",
        "side_effects": "May cause stomach upset in the first days; Do not skip meals after taking",
    },
    "benadryl": {
        "purpose": "For cough and throat irritation",
        "dosage": "10 ml",
        "frequency": "Three times a day",
        "instructions": "Take with water. Avoid cold drinks",
        "side_effects": "May cause sleepiness; Do not take more than three times a day",
    },
    "cough": {
        "purpose": "For cough relief",
        "dosage": "10 ml",
        "frequency": "Three times a day",
        "instructions": "Take with water. Drink warm water through the day",
        "side_effects": "May cause sleepiness; Do not exceed the recommended dose",
    },
    "diclofenac": {
        "purpose": "For pain and inflammation",
        "dosage": "Take one tablet",
        "frequency": "Twice a day",
        "instructions": "Take after food",
        "side_effects": "May cause stomach irritation; Avoid long-term use without doctor advice",
    },
    "ranitidine": {
        "purpose": "For acidity and stomach ulcers",
        "dosage": "Take one tablet",
        "frequency": "Twice a day",
        "instructions": "Take before meals",
        "side_effects": "Avoid spicy food; Consult a doctor if symptoms persist beyond 2 weeks",
    },
    "montelukast": {
        "purpose": "For asthma and allergic rhinitis",
        "dosage": "Take one tablet",
        "frequency": "At night before sleep",
        "instructions": "Take with water",
        "side_effects": "May cause headache; Take regularly for best effect",
    },
    "amlodipine": {
        "purpose": "For high blood pressure",
        "dosage": "Take one tablet",
        "frequency": "Once a day",
        "instructions": "Take at the same time every day",
        "side_effects": "May cause ankle swelling or dizziness; Do not stop suddenly without doctor advice",
    },
}


# Field-level translations for KB values. Keyed by the exact English string.
_TRANSLATIONS: dict[str, dict[str, dict[str, str]]] = {
    "hi": {
        "dosage": {
            "Take one tablet": "एक गोली लें",
            "Take one capsule": "एक कैप्सूल लें",
            "10 ml": "10 मि.ली.",
        },
        "frequency": {
            "Once a day": "दिन में एक बार",
            "Twice a day": "दिन में दो बार",
            "Three times a day": "दिन में तीन बार",
            "Up to three times a day": "दिन में अधिकतम तीन बार",
            "Morning and Night": "सुबह और रात",
            "At night before sleep": "रात को सोने से पहले",
        },
    },
    "te": {
        "dosage": {
            "Take one tablet": "ఒక మాత్ర తీసుకోండి",
            "Take one capsule": "ఒక క్యాప్సూల్ తీసుకోండి",
            "10 ml": "10 మి.లీ.",
        },
        "frequency": {
            "Once a day": "రోజుకు ఒకసారి",
            "Twice a day": "రోజుకు రెండుసార్లు",
            "Three times a day": "రోజుకు మూడుసార్లు",
            "Up to three times a day": "రోజుకు గరిష్ఠంగా మూడుసార్లు",
            "Morning and Night": "ఉదయం మరియు రాత్రి",
            "At night before sleep": "రాత్రి నిద్రకు ముందు",
        },
    },
}


def _translate(field: str, value: str, lang: str) -> str:
    return _TRANSLATIONS.get(lang, {}).get(field, {}).get(value, value)


def enrich_medicine(med: dict[str, str], lang: str = "en") -> dict[str, str]:
    """Override LLM-generated usage facts with canonical KB values when the medicine is recognized.

    Dosage and frequency are short fixed phrases, so they are translated from the
    KB table for hi/te. Longer free-text fields (purpose, instructions, side effects)
    keep the model's translated text for non-English languages.
    """
    haystack = f"{med.get('name', '')} {med.get('composition', '')}".lower()
    for key, facts in KB.items():
        if key in haystack:
            med = dict(med)
            med["dosage"] = _translate("dosage", facts["dosage"], lang)
            med["frequency"] = _translate("frequency", facts["frequency"], lang)
            if lang == "en":
                med["purpose"] = facts["purpose"]
                med["instructions"] = facts["instructions"]
                med["side_effects"] = facts["side_effects"]
            break
    return med
