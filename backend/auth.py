import sqlite3
import hashlib

from database import (
    DB_PATH,
    get_patient_profile,
    get_hospital_by_username,
    create_patient_account,
)


# =========================================================
# PASSWORD HELPERS
# =========================================================

def _hash_password(password: str) -> str:
    return hashlib.sha256(
        password.encode("utf-8")
    ).hexdigest()


def _is_hashed_password(password: str) -> bool:
    if not password:
        return False

    if len(password) != 64:
        return False

    try:
        int(password, 16)
        return True
    except ValueError:
        return False


# =========================================================
# LOGIN
# =========================================================

def authenticate(username, password):

    username = str(username).strip()

    if not username or not password:
        return None

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM users
        WHERE username = ?
        """,
        (username,),
    )

    user = cursor.fetchone()

    conn.close()

    if not user:
        return None

    user_dict = dict(user)
    stored_password = user_dict["password"]

    # Keep existing demo accounts working.
    if _is_hashed_password(stored_password):
        password_valid = (
            _hash_password(password)
            == stored_password
        )
    else:
        password_valid = (
            password == stored_password
        )

    if not password_valid:
        return None

    if user_dict["role"] == "Patient":

        user_dict["patient_profile"] = (
            get_patient_profile(username)
        )

    elif user_dict["role"] == "Hospital Staff":

        user_dict["hosp_username"] = username

        user_dict["hospital_profile"] = (
            get_hospital_by_username(username)
        )

    # Never send password to frontend.
    user_dict.pop("password", None)

    return user_dict


# =========================================================
# PATIENT REGISTRATION
# =========================================================

def register_patient(
    username,
    password,
    full_name,
    age=None,
    gender=None,
    blood_group=None,
    emergency_contact_name=None,
    emergency_contact_phone=None,
    pre_existing_conditions=None,
    allergies=None,
    primary_physician=None,
    insurance_provider=None,
):

    username = str(username).strip()
    password = str(password)
    full_name = str(full_name).strip()

    if not username:
        return {
            "success": False,
            "message": "Username is required.",
        }

    if len(username) < 3:
        return {
            "success": False,
            "message": "Username must be at least 3 characters.",
        }

    if len(password) < 6:
        return {
            "success": False,
            "message": "Password must be at least 6 characters.",
        }

    if not full_name:
        return {
            "success": False,
            "message": "Full name is required.",
        }

    allowed = (
        "abcdefghijklmnopqrstuvwxyz"
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "0123456789"
        "_-."
    )

    if any(
        character not in allowed
        for character in username
    ):
        return {
            "success": False,
            "message": (
                "Username may contain only letters, "
                "numbers, underscores, hyphens, and periods."
            ),
        }

    password_hash = _hash_password(password)

    return create_patient_account(
        username=username,
        password_hash=password_hash,
        full_name=full_name,
        age=age,
        gender=gender,
        blood_group=blood_group,
        emergency_contact_name=emergency_contact_name,
        emergency_contact_phone=emergency_contact_phone,
        pre_existing_conditions=pre_existing_conditions,
        allergies=allergies,
        primary_physician=primary_physician,
        insurance_provider=insurance_provider,
    )