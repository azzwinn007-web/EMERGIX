import json
import os
import re
from typing import Any, Dict, List, Optional

import google.generativeai as genai


# =========================================================
# EMERGIX AI EMERGENCY TRIAGE ENGINE
# =========================================================
#
# EMERGIX provides emergency-support / triage assistance.
# It does NOT provide a confirmed medical diagnosis.
#
# Decision flow:
#
#   1. Deterministic emergency red-flag screening
#   2. Gemini interpretation when API key is available
#   3. Conservative rule-based fallback
#
# Critical red flags always override a lower AI result.
# =========================================================


MODEL_NAME = "gemini-2.5-flash"


# =========================================================
# BASIC HELPERS
# =========================================================

def _clean_text(value: Any) -> str:
    """Normalize and limit user-provided text."""

    if value is None:
        return ""

    text = str(value).strip()

    return text[:4000]


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    """
    Safely extract a JSON object from model output.

    Handles:
        plain JSON
        ```json ... ```
        explanatory text surrounding JSON
    """

    if not text:
        return None

    text = text.strip()

    # Remove Markdown code fences.
    text = re.sub(
        r"^```json\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"^```\s*",
        "",
        text,
    )

    text = re.sub(
        r"\s*```$",
        "",
        text,
    )

    # First attempt: complete response is JSON.
    try:
        data = json.loads(text)

        if isinstance(data, dict):
            return data

    except json.JSONDecodeError:
        pass

    # Second attempt: locate JSON object in surrounding text.
    match = re.search(
        r"\{.*\}",
        text,
        flags=re.DOTALL,
    )

    if not match:
        return None

    try:
        data = json.loads(match.group(0))

        if isinstance(data, dict):
            return data

    except json.JSONDecodeError:
        return None

    return None


def _normalize_level(level: Any) -> str:
    """Normalize model output to EMERGIX severity levels."""

    value = str(level or "").strip().lower()

    if value in {
        "critical",
        "emergency",
        "life-threatening",
        "life threatening",
        "level 1",
        "level 1 - critical",
    }:
        return "Critical"

    if value in {
        "urgent",
        "high",
        "high priority",
        "level 2",
        "level 2 - urgent",
    }:
        return "Urgent"

    if value in {
        "moderate",
        "low",
        "routine",
        "non-urgent",
        "non urgent",
        "level 3",
        "level 3 - moderate",
    }:
        return "Moderate"

    # Unknown model output should not become a false reassurance.
    return "Urgent"


def _normalize_score(score: Any) -> float:
    """Keep priority score between 1 and 10."""

    try:
        value = float(score)
    except (TypeError, ValueError):
        value = 7.0

    return round(
        max(1.0, min(10.0, value)),
        1,
    )


def _normalize_list(value: Any) -> List[str]:
    """Normalize model list fields."""

    if not isinstance(value, list):
        return []

    cleaned = []

    for item in value[:10]:
        item_text = str(item).strip()

        if item_text and item_text not in cleaned:
            cleaned.append(item_text)

    return cleaned


# =========================================================
# DETERMINISTIC RED-FLAG SCREEN
# =========================================================

def _red_flag_screen(text: str) -> Dict[str, Any]:
    """
    Detect high-risk symptom patterns.

    This is a safety layer, not a diagnosis engine.
    """

    text = text.lower()

    red_flags: List[str] = []
    resources: List[str] = []

    # -----------------------------------------------------
    # Breathing / airway emergencies
    # -----------------------------------------------------

    breathing_patterns = [
        "can't breathe",
        "cannot breathe",
        "difficulty breathing",
        "severe breathing difficulty",
        "severe shortness of breath",
        "struggling to breathe",
        "gasping",
        "choking",
        "blue lips",
        "turning blue",
    ]

    if any(
        phrase in text
        for phrase in breathing_patterns
    ):
        red_flags.append(
            "Severe breathing difficulty"
        )

        resources.extend([
            "Emergency Room",
            "Oxygen",
        ])

    # -----------------------------------------------------
    # Chest / cardiac warning signs
    # -----------------------------------------------------

    cardiac_patterns = [
        "chest pain",
        "chest pressure",
        "chest tightness",
        "crushing chest pain",
        "severe chest pain",
        "heart attack",
        "pain spreading to my arm",
        "pain spreading to my jaw",
        "pain radiating to arm",
        "pain radiating to jaw",
    ]

    if any(
        phrase in text
        for phrase in cardiac_patterns
    ):
        red_flags.append(
            "Chest pain or pressure"
        )

        resources.extend([
            "Emergency Room",
            "Cardiology",
        ])

    # -----------------------------------------------------
    # Stroke / acute neurological warning signs
    # -----------------------------------------------------

    stroke_patterns = [
        "face drooping",
        "facial droop",
        "arm weakness",
        "leg weakness",
        "one sided weakness",
        "one-sided weakness",
        "slurred speech",
        "difficulty speaking",
        "can't speak",
        "cannot speak",
        "sudden confusion",
        "sudden numbness",
        "sudden loss of vision",
        "sudden vision loss",
    ]

    if any(
        phrase in text
        for phrase in stroke_patterns
    ):
        red_flags.append(
            "Possible acute neurological warning signs"
        )

        resources.extend([
            "Emergency Room",
            "Stroke / Neurology",
            "CT Scanner",
        ])

    # -----------------------------------------------------
    # Major trauma / bleeding
    # -----------------------------------------------------

    trauma_patterns = [
        "major accident",
        "car accident",
        "road accident",
        "motorcycle accident",
        "severe trauma",
        "major trauma",
        "heavy bleeding",
        "severe bleeding",
        "uncontrolled bleeding",
        "bleeding won't stop",
        "bleeding does not stop",
    ]

    if any(
        phrase in text
        for phrase in trauma_patterns
    ):
        red_flags.append(
            "Major trauma or uncontrolled bleeding"
        )

        resources.extend([
            "Emergency Room",
            "Trauma Care",
            "Blood Bank",
        ])

    # -----------------------------------------------------
    # Consciousness / seizure
    # -----------------------------------------------------

    consciousness_patterns = [
        "unconscious",
        "not responding",
        "passed out",
        "lost consciousness",
        "fainted and won't wake",
        "seizure",
        "convulsions",
    ]

    if any(
        phrase in text
        for phrase in consciousness_patterns
    ):
        red_flags.append(
            "Altered consciousness or seizure"
        )

        resources.append(
            "Emergency Room"
        )

    # -----------------------------------------------------
    # Severe allergic reaction
    # -----------------------------------------------------

    allergy_patterns = [
        "anaphylaxis",
        "throat swelling",
        "tongue swelling",
        "face swelling",
        "difficulty swallowing after allergy",
        "severe allergic reaction",
    ]

    if any(
        phrase in text
        for phrase in allergy_patterns
    ):
        red_flags.append(
            "Possible severe allergic reaction"
        )

        resources.extend([
            "Emergency Room",
            "Oxygen",
        ])

    # -----------------------------------------------------
    # Possible poisoning / overdose
    # -----------------------------------------------------

    poisoning_patterns = [
        "overdose",
        "drug overdose",
        "poisoned",
        "poisoning",
        "took too many pills",
        "swallowed poison",
    ]

    if any(
        phrase in text
        for phrase in poisoning_patterns
    ):
        red_flags.append(
            "Possible poisoning or overdose"
        )

        resources.append(
            "Emergency Room"
        )

    # Remove duplicates.
    red_flags = list(
        dict.fromkeys(red_flags)
    )

    resources = list(
        dict.fromkeys(resources)
    )

    return {
        "red_flags": red_flags,
        "required_resources": resources,
    }


# =========================================================
# MODERATE-SYMPTOM DETECTION
# =========================================================

def _looks_mild(text: str) -> bool:
    """
    Detect descriptions that explicitly sound mild and contain
    no obvious emergency warning signs.

    This is intentionally conservative.
    It should not override red flags.
    """

    text = text.lower()

    mild_patterns = [
        "mild headache",
        "slight headache",
        "slight tiredness",
        "mild tiredness",
        "a little tired",
        "feeling a little tired",
        "mild cold",
        "mild cough",
        "small bruise",
        "minor bruise",
        "mild muscle ache",
        "minor muscle ache",
        "mild body ache",
        "minor body ache",
        "runny nose",
        "sneezing",
        "mild sore throat",
        "slight sore throat",
        "mild fatigue",
        "slight fatigue",
    ]

    return any(
        phrase in text
        for phrase in mild_patterns
    )


def _safe_fallback(
    text: str,
    screen: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Rule-based fallback used when Gemini is unavailable.

    Critical red flags -> Critical

    Explicitly mild descriptions -> Moderate

    Everything else -> Urgent
    so uncertain cases are not falsely reassured.
    """

    red_flags = screen["red_flags"]
    resources = screen["required_resources"]

    # -----------------------------------------------------
    # Critical override
    # -----------------------------------------------------

    if red_flags:

        return {
            "triage_level": "Critical",
            "priority_score": 9.0,
            "required_resources": (
                resources or ["Emergency Room"]
            ),
            "red_flags": red_flags,
            "recommended_department": (
                "Emergency Department"
            ),
            "ai_summary": (
                "Emergency warning signs were detected. "
                "Immediate professional medical evaluation "
                "is recommended."
            ),
            "disclaimer": (
                "EMERGIX provides emergency-support guidance "
                "and does not provide a medical diagnosis."
            ),
            "source": "EMERGIX safety rules",
        }

    # -----------------------------------------------------
    # Moderate / low-risk pattern
    # -----------------------------------------------------

    if _looks_mild(text):

        return {
            "triage_level": "Moderate",
            "priority_score": 3.5,
            "required_resources": [],
            "red_flags": [],
            "recommended_department": (
                "Primary Care / Outpatient Care"
            ),
            "ai_summary": (
                "The reported symptoms appear mild based on "
                "the information provided, with no immediate "
                "emergency warning signs detected."
            ),
            "disclaimer": (
                "EMERGIX provides emergency-support guidance "
                "and does not provide a medical diagnosis."
            ),
            "source": "EMERGIX safety rules",
        }

    # -----------------------------------------------------
    # Unknown / uncertain case
    # -----------------------------------------------------

    return {
        "triage_level": "Urgent",
        "priority_score": 7.0,
        "required_resources": [
            "Emergency Room"
        ],
        "red_flags": [],
        "recommended_department": (
            "Emergency Department"
        ),
        "ai_summary": (
            "The available information is not sufficient "
            "to safely classify the symptoms as low risk. "
            "Prompt clinical evaluation is recommended."
        ),
        "disclaimer": (
            "EMERGIX provides emergency-support guidance "
            "and does not provide a medical diagnosis."
        ),
        "source": "EMERGIX fallback engine",
    }


# =========================================================
# MAIN AI ANALYSIS
# =========================================================

def analyze_emergency(
    symptom_description: str,
) -> Dict[str, Any]:
    """
    Analyze a patient's symptom description.

    Returns:
        triage_level
        priority_score
        red_flags
        required_resources
        recommended_department
        ai_summary
        disclaimer
        source
    """

    text = _clean_text(
        symptom_description
    )

    # -----------------------------------------------------
    # Empty input
    # -----------------------------------------------------

    if not text:

        return {
            "triage_level": "Urgent",
            "priority_score": 7.0,
            "required_resources": [
                "Emergency Room"
            ],
            "red_flags": [],
            "recommended_department": (
                "Emergency Department"
            ),
            "ai_summary": (
                "No symptom information was provided. "
                "Please provide symptom details or seek "
                "professional medical evaluation."
            ),
            "disclaimer": (
                "EMERGIX provides emergency-support guidance "
                "and does not provide a medical diagnosis."
            ),
            "source": "EMERGIX fallback engine",
        }

    # -----------------------------------------------------
    # 1. Deterministic safety screen
    # -----------------------------------------------------

    screen = _red_flag_screen(text)

    # -----------------------------------------------------
    # 2. Immediate critical override
    #
    # Never allow an AI response to downgrade a clear
    # deterministic emergency warning.
    # -----------------------------------------------------

    if screen["red_flags"]:

        return {
            "triage_level": "Critical",
            "priority_score": 9.0,
            "required_resources": (
                screen["required_resources"]
                or ["Emergency Room"]
            ),
            "red_flags": screen["red_flags"],
            "recommended_department": (
                "Emergency Department"
            ),
            "ai_summary": (
                "Emergency warning signs were detected. "
                "Immediate professional medical evaluation "
                "is recommended."
            ),
            "disclaimer": (
                "EMERGIX provides emergency-support guidance "
                "and does not provide a medical diagnosis."
            ),
            "source": "EMERGIX safety rules",
        }

    # -----------------------------------------------------
    # 3. Gemini analysis
    # -----------------------------------------------------

    api_key = os.getenv(
        "GEMINI_API_KEY"
    )

    if api_key:

        try:
            genai.configure(
                api_key=api_key
            )

            model = genai.GenerativeModel(
                MODEL_NAME,
                generation_config={
                    "temperature": 0.1,
                    "response_mime_type": "application/json",
                },
            )

            prompt = f"""
You are the emergency triage reasoning component
of EMERGIX.

EMERGIX is an emergency-support application.
You must NOT provide a confirmed medical diagnosis.

Classify the symptom description into exactly one
of these three categories:

1. Critical
   Possible life-threatening emergency or major
   emergency warning signs requiring immediate
   professional evaluation.

2. Urgent
   Prompt medical evaluation is appropriate,
   but the description does not clearly indicate
   an immediately life-threatening emergency.

3. Moderate
   The description appears relatively low-risk
   based only on the information provided and does
   not indicate immediate emergency routing.
   This does NOT mean the patient definitively
   does not need medical care.

Return ONLY valid JSON:

{{
  "triage_level": "Critical | Urgent | Moderate",
  "priority_score": 1,
  "red_flags": [],
  "required_resources": [],
  "recommended_department": "Emergency Department",
  "ai_summary": "Brief conservative explanation"
}}

Rules:

- priority_score must be between 1 and 10.
- Do not invent vital signs.
- Do not invent medical history.
- Do not invent test results.
- Do not claim a confirmed diagnosis.
- Do not recommend a specific hospital.
- Do not tell the patient to ignore worsening symptoms.
- Mild symptoms with no emergency warning signs may be Moderate.
- When uncertainty could represent a serious problem, prefer Urgent.
- Keep ai_summary under 300 characters.
- required_resources should include only resources reasonably
  supported by the description.
- Do not add ICU, ventilator, cardiology, CT, or blood resources
  unless the symptoms reasonably justify them.

Patient symptom description:

{text}
"""

            response = model.generate_content(
                prompt
            )

            parsed = _extract_json(
                getattr(response, "text", "")
            )

            if parsed:

                level = _normalize_level(
                    parsed.get("triage_level")
                )

                score = _normalize_score(
                    parsed.get("priority_score")
                )

                model_flags = _normalize_list(
                    parsed.get("red_flags")
                )

                model_resources = _normalize_list(
                    parsed.get("required_resources")
                )

                model_department = str(
                    parsed.get(
                        "recommended_department",
                        "Emergency Department",
                    )
                ).strip()

                model_summary = str(
                    parsed.get(
                        "ai_summary",
                        "Professional medical evaluation is recommended.",
                    )
                ).strip()

                # Never allow a blank summary.
                if not model_summary:
                    model_summary = (
                        "Professional medical evaluation "
                        "is recommended."
                    )

                # Combine flags/resources while preserving
                # uniqueness.
                combined_flags = list(
                    dict.fromkeys(
                        model_flags
                    )
                )

                combined_resources = list(
                    dict.fromkeys(
                        model_resources
                    )
                )

                # -------------------------------------------------
                # Safety normalization
                # -------------------------------------------------

                if level == "Critical":
                    score = max(
                        score,
                        8.5,
                    )

                elif level == "Moderate":
                    score = min(
                        score,
                        5.0,
                    )

                # If Gemini says Moderate but it somehow
                # produced emergency resources, do not allow
                # that inconsistency.
                if level == "Moderate":
                    combined_resources = []

                return {
                    "triage_level": level,
                    "priority_score": score,
                    "required_resources": combined_resources,
                    "red_flags": combined_flags,
                    "recommended_department": (
                        model_department
                        or (
                            "Primary Care / Outpatient Care"
                            if level == "Moderate"
                            else "Emergency Department"
                        )
                    ),
                    "ai_summary": model_summary[:500],
                    "disclaimer": (
                        "EMERGIX provides emergency-support "
                        "guidance and does not provide a "
                        "medical diagnosis."
                    ),
                    "source": "Gemini + EMERGIX safety rules",
                }

        except Exception as exc:

            # Log server-side only.
            print(
                f"Gemini analysis unavailable: {exc}"
            )

    # -----------------------------------------------------
    # 4. Safe fallback
    # -----------------------------------------------------

    return _safe_fallback(
        text,
        screen,
    )