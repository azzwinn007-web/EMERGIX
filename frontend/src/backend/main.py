from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from auth import authenticate
from database import (
    get_all_hospitals,
    get_hospital_by_username,
    update_hospital_full_telemetry,
    get_alerts,
    get_patient_profile,
)

app = FastAPI(title="EMERGIX API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


class HospitalTelemetry(BaseModel):
    icu_free: int
    beds_free: int
    ventilator_free: int
    ambulances_free: int
    er_wait_min: int
    status: str
    oxygen_pct: int
    blood_status: str
    ct_scanner_active: int


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "EMERGIX API",
    }


# ================================
# AUTHENTICATION
# ================================

@app.post("/api/auth/login")
def login(request: LoginRequest):

    user = authenticate(
        request.username,
        request.password
    )

    if not user:
        return {
            "success": False,
            "message": "Invalid username or password"
        }

    return {
        "success": True,
        "user": user
    }


# ================================
# PATIENT PROFILE
# ================================

@app.get("/api/patients/{username}")
def patient_profile(username: str):

    patient = get_patient_profile(username)

    if not patient:
        return {
            "success": False,
            "message": "Patient profile not found"
        }

    return {
        "success": True,
        "patient": patient
    }


# ================================
# HOSPITALS
# ================================

@app.get("/api/hospitals")
def hospitals():

    return {
        "success": True,
        "hospitals": get_all_hospitals()
    }


@app.get("/api/hospitals/{hospital_id}")
def hospital(hospital_id: int):

    all_hospitals = get_all_hospitals()

    for item in all_hospitals:

        if item["id"] == hospital_id:

            return {
                "success": True,
                "hospital": item
            }

    return {
        "success": False,
        "message": "Hospital not found"
    }


# ================================
# HOSPITAL STAFF
# ================================

@app.get("/api/hospitals/staff/{username}")
def hospital_staff(username: str):

    hospital = get_hospital_by_username(username)

    if not hospital:

        return {
            "success": False,
            "message": "Hospital profile not found"
        }

    return {
        "success": True,
        "hospital": hospital
    }


# ================================
# HOSPITAL TELEMETRY UPDATE
# ================================

@app.put("/api/hospitals/{hospital_id}/telemetry")
def update_hospital(
    hospital_id: int,
    data: HospitalTelemetry
):

    all_hospitals = get_all_hospitals()

    exists = any(
        item["id"] == hospital_id
        for item in all_hospitals
    )

    if not exists:

        return {
            "success": False,
            "message": "Hospital not found"
        }

    update_hospital_full_telemetry(
        hospital_id,
        data.model_dump()
    )

    updated_hospitals = get_all_hospitals()

    for item in updated_hospitals:

        if item["id"] == hospital_id:

            return {
                "success": True,
                "message": "Hospital telemetry updated",
                "hospital": item
            }

    return {
        "success": False,
        "message": "Update failed"
    }


# ================================
# LIVE ALERTS
# ================================

@app.get("/api/alerts")
def alerts():

    return {
        "success": True,
        "alerts": get_alerts()
    }