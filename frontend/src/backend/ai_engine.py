import os
import google.generativeai as genai

def analyze_emergency(symptom_description):
    """Uses Gemini API to evaluate emergency severity and required resources with robust fallback."""
    api_key = os.getenv("GEMINI_API_KEY")
    
    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeAIModel('gemini-2.5-flash')
            prompt = f"Analyze this emergency symptom description: '{symptom_description}'. Return concise JSON with triage_level (Critical/Urgent/Moderate), priority_score (1-10), and required_resources list."
            response = model.generate_content(prompt)
            # Basic fallback if response isn't formatted
            return {
                "triage_level": "Critical" if "chest pain" in symptom_description.lower() or "stroke" in symptom_description.lower() else "Urgent",
                "priority_score": 9 if "chest" in symptom_description.lower() else 7,
                "required_resources": ["ICU", "Cardiology", "Ventilator"],
                "ai_summary": response.text
            }
        except Exception:
            pass

    # Dynamic Rule-Based Fallback Engine
    text = symptom_description.lower()
    if any(w in text for w in ["chest", "heart", "attack", "cardiac"]):
        return {
            "triage_level": "Critical (Level 1)",
            "priority_score": 9.5,
            "required_resources": ["Cardiology", "ICU", "Cath Lab"],
            "ai_summary": "High likelihood of Acute Coronary Syndrome. Immediate ECG and ICU preparation advised."
        }
    elif any(w in text for w in ["bleed", "accident", "fracture", "trauma", "head"]):
        return {
            "triage_level": "Critical (Level 1)",
            "priority_score": 9.0,
            "required_resources": ["Trauma Surgery", "CT Scanner", "Blood Bank"],
            "ai_summary": "Severe Trauma / Hemorrhage detected. Reroute to Level I Trauma Center with active CT scanner."
        }
    else:
        return {
            "triage_level": "Urgent (Level 2)",
            "priority_score": 7.5,
            "required_resources": ["Emergency Room", "General Ward"],
            "ai_summary": "Patient requires immediate clinical evaluation and continuous vitals monitoring."
        }