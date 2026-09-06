from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List

from auth import authenticate, register_patient

from database import (
    get_all_hospitals,
    get_hospital_by_username,
    update_hospital_full_telemetry,
    get_alerts,
    get_patient_profile,
    add_emergency_assessment,
    create_emergency_alert,
)

from ai_engine import analyze_emergency
from recommendation import rank_hospitals


app = FastAPI(title="EMERGIX API")


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# REQUEST MODELS
# =========================================================

class LoginRequest(BaseModel):
    username: str
    password: str


class PatientRegistration(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=40
    )

    password: str = Field(
        min_length=6,
        max_length=128
    )

    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    age: Optional[int] = Field(
        default=None,
        ge=0,
        le=120
    )

    gender: Optional[str] = None
    blood_group: Optional[str] = None

    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    pre_existing_conditions: Optional[str] = None
    allergies: Optional[str] = None
    primary_physician: Optional[str] = None
    insurance_provider: Optional[str] = None


class HospitalTelemetry(BaseModel):
    icu_free: int = Field(ge=0)
    beds_free: int = Field(ge=0)
    ventilator_free: int = Field(ge=0)
    ambulances_free: int = Field(ge=0)
    er_wait_min: int = Field(ge=0)

    status: str

    oxygen_pct: int = Field(
        ge=0,
        le=100
    )

    blood_status: str

    ct_scanner_active: int = Field(
        ge=0,
        le=1
    )


class EmergencyAssessment(BaseModel):
    symptom_description: str = Field(
        min_length=1,
        max_length=4000
    )

    patient_lat: float = 13.0827
    patient_lon: float = 80.2707

    patient_username: Optional[str] = None


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "EMERGIX API",
    }


# =========================================================
# AUTHENTICATION
# =========================================================

@app.post("/api/auth/login")
def login(request: LoginRequest):

    user = authenticate(
        request.username,
        request.password,
    )

    if not user:
        return {
            "success": False,
            "message": "Invalid username or password",
        }

    return {
        "success": True,
        "user": user,
    }


# =========================================================
# PATIENT REGISTRATION
# =========================================================

@app.post("/api/auth/register")
def register(request: PatientRegistration):

    result = register_patient(
        username=request.username,
        password=request.password,
        full_name=request.full_name,
        age=request.age,
        gender=request.gender,
        blood_group=request.blood_group,
        emergency_contact_name=request.emergency_contact_name,
        emergency_contact_phone=request.emergency_contact_phone,
        pre_existing_conditions=request.pre_existing_conditions,
        allergies=request.allergies,
        primary_physician=request.primary_physician,
        insurance_provider=request.insurance_provider,
    )

    if not result.get("success"):
        return result

    user = authenticate(
        request.username,
        request.password,
    )

    return {
        "success": True,
        "message": "Patient account created successfully.",
        "user": user,
        "patient_id": result.get("patient_id"),
    }


# =========================================================
# PATIENT PROFILE
# =========================================================

@app.get("/api/patients/{username}")
def patient_profile(username: str):

    patient = get_patient_profile(username)

    if not patient:
        return {
            "success": False,
            "message": "Patient profile not found",
        }

    return {
        "success": True,
        "patient": patient,
    }


# =========================================================
# HOSPITALS
# =========================================================

@app.get("/api/hospitals")
def hospitals():

    return {
        "success": True,
        "hospitals": get_all_hospitals(),
    }


@app.get("/api/hospitals/{hospital_id}")
def hospital(hospital_id: int):

    for item in get_all_hospitals():

        if item["id"] == hospital_id:

            return {
                "success": True,
                "hospital": item,
            }

    return {
        "success": False,
        "message": "Hospital not found",
    }


# =========================================================
# HOSPITAL STAFF
# =========================================================

@app.get("/api/hospitals/staff/{username}")
def hospital_staff(username: str):

    hospital = get_hospital_by_username(username)

    if not hospital:

        return {
            "success": False,
            "message": "Hospital profile not found",
        }

    return {
        "success": True,
        "hospital": hospital,
    }


# =========================================================
# HOSPITAL TELEMETRY
# =========================================================

@app.put("/api/hospitals/{hospital_id}/telemetry")
def update_hospital(
    hospital_id: int,
    data: HospitalTelemetry,
):

    exists = any(
        item["id"] == hospital_id
        for item in get_all_hospitals()
    )

    if not exists:

        return {
            "success": False,
            "message": "Hospital not found",
        }

    update_hospital_full_telemetry(
        hospital_id,
        data.model_dump(),
    )

    for item in get_all_hospitals():

        if item["id"] == hospital_id:

            return {
                "success": True,
                "message": "Hospital telemetry updated",
                "hospital": item,
            }

    return {
        "success": False,
        "message": "Update failed",
    }


# =========================================================
# AI EMERGENCY ASSESSMENT
# =========================================================

@app.post("/api/emergency/assess")
def assess_emergency(
    request: EmergencyAssessment
):

    # -----------------------------------------------------
    # 1. AI analysis
    # -----------------------------------------------------

    ai_result = analyze_emergency(
        request.symptom_description
    )

    triage_level = ai_result.get(
        "triage_level",
        "Urgent",
    )

    required_resources = ai_result.get(
        "required_resources",
        [],
    )

    triage_normalized = str(
        triage_level
    ).strip().lower()

    # -----------------------------------------------------
    # 2. Emergency routing decision
    # -----------------------------------------------------

    should_route = triage_normalized in {
        "critical",
        "urgent",
    }

    hospitals: List[dict] = []

    if should_route:

        hospitals = rank_hospitals(
            patient_lat=request.patient_lat,
            patient_lon=request.patient_lon,
            required_resources=required_resources,
            triage_level=triage_level,
        )

    # -----------------------------------------------------
    # 3. Patient-facing message
    # -----------------------------------------------------

    if triage_normalized == "critical":

        patient_message = (
            "Emergency warning signs detected. "
            "Immediate professional medical evaluation "
            "is recommended."
        )

    elif triage_normalized == "urgent":

        patient_message = (
            "Prompt medical evaluation is recommended. "
            "EMERGIX has identified suitable hospitals "
            "using current availability."
        )

    else:

        patient_message = (
            "No immediate emergency routing was indicated "
            "based on the information provided. "
            "Seek clinical care if symptoms persist, "
            "worsen, or you are concerned."
        )

    # -----------------------------------------------------
    # 4. Save assessment
    # -----------------------------------------------------

    recommended_hospital_id = None

    if hospitals:

        recommended_hospital_id = (
            hospitals[0].get("id")
        )

    assessment_id = add_emergency_assessment(
        patient_username=request.patient_username,
        symptom_description=request.symptom_description,
        triage_level=triage_level,
        priority_score=ai_result.get(
            "priority_score",
            7.0,
        ),
        red_flags=ai_result.get(
            "red_flags",
            [],
        ),
        required_resources=required_resources,
        recommended_department=ai_result.get(
            "recommended_department",
            "Emergency Department",
        ),
        ai_summary=ai_result.get(
            "ai_summary",
            "",
        ),
        patient_lat=request.patient_lat,
        patient_lon=request.patient_lon,
        emergency_routing=should_route,
        recommended_hospital_id=(
            recommended_hospital_id
        ),
    )

    # -----------------------------------------------------
    # 5. Create hospital-specific alert
    # -----------------------------------------------------

    alert_id = None

    if should_route:

        recommended_hospital = (
            hospitals[0]
            if hospitals
            else None
        )

        alert_id = create_emergency_alert(
            patient_username=request.patient_username,
            triage_level=triage_level,
            ai_summary=ai_result.get(
                "ai_summary",
                "Emergency assessment requires "
                "prompt medical evaluation.",
            ),
            recommended_hospital=(
                recommended_hospital
            ),
        )

    # -----------------------------------------------------
    # 6. Complete response
    # -----------------------------------------------------

    return {
        "success": True,

        "assessment_id": assessment_id,

        "alert_id": alert_id,

        "assessment": {
            **ai_result,

            "patient_message": patient_message,

            "emergency_routing": should_route,

            "hospital_count": len(hospitals),

            "recommended_hospital": (
                hospitals[0]
                if hospitals
                else None
            ),
        },

        "recommended_hospitals": (
            hospitals[:5]
        ),
    }


# =========================================================
# HOSPITAL ALERTS
# =========================================================

@app.get("/api/alerts")
def alerts(hospital_id: Optional[int] = None):

    return {
        "success": True,
        "alerts": get_alerts(
            hospital_id=hospital_id
        ),
    }