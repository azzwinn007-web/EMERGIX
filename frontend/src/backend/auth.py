import sqlite3
from database import DB_PATH, get_patient_profile, get_hospital_by_username

def authenticate(username, password):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    user = cursor.fetchone()
    conn.close()

    if user:
        user_dict = dict(user)
        if user_dict["role"] == "Patient":
            user_dict["patient_profile"] = get_patient_profile(username)
        elif user_dict["role"] == "Hospital Staff":
            user_dict["hosp_username"] = username
            user_dict["hospital_profile"] = get_hospital_by_username(username)
        return user_dict
    return None