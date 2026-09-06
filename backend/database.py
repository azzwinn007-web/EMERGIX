import sqlite3
import os
from datetime import datetime
import uuid

DB_PATH = "emergix.db"


# =========================================================
# DATABASE INITIALIZATION
# =========================================================

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # -----------------------------------------------------
    # 1. Users & Authentication
    # -----------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL
        )
    """)

    # -----------------------------------------------------
    # 2. Patient Profiles
    # -----------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            patient_id TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            blood_group TEXT,
            emergency_contact_name TEXT,
            emergency_contact_phone TEXT,
            pre_existing_conditions TEXT,
            allergies TEXT,
            primary_physician TEXT,
            insurance_provider TEXT
        )
    """)

    # -----------------------------------------------------
    # 3. Hospitals Telemetry
    # -----------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hospitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            name TEXT NOT NULL,
            area TEXT NOT NULL,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            icu_free INTEGER DEFAULT 0,
            icu_total INTEGER DEFAULT 25,
            beds_free INTEGER DEFAULT 0,
            beds_total INTEGER DEFAULT 50,
            ventilator_free INTEGER DEFAULT 0,
            ambulances_free INTEGER DEFAULT 0,
            er_wait_min INTEGER DEFAULT 10,
            status TEXT DEFAULT '🟢 Accepting All Patients',
            oxygen_pct INTEGER DEFAULT 95,
            blood_status TEXT DEFAULT 'Optimal',
            ct_scanner_active INTEGER DEFAULT 1
        )
    """)

    # -----------------------------------------------------
    # 4. Alerts
    #
    # target_hospital_id:
    #   NULL = network-wide alert
    #   hospital ID = hospital-specific alert
    # -----------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            source TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            target_hospital_id INTEGER
        )
    """)

    # -----------------------------------------------------
    # Migration for older emergix.db files.
    # -----------------------------------------------------

    cursor.execute("PRAGMA table_info(alerts)")

    alert_columns = [
        row[1]
        for row in cursor.fetchall()
    ]

    if "target_hospital_id" not in alert_columns:
        cursor.execute("""
            ALTER TABLE alerts
            ADD COLUMN target_hospital_id INTEGER
        """)

    # -----------------------------------------------------
    # 5. Emergency Assessments
    # -----------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS emergency_assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_username TEXT,
            symptom_description TEXT NOT NULL,
            triage_level TEXT NOT NULL,
            priority_score REAL NOT NULL,
            red_flags TEXT,
            required_resources TEXT,
            recommended_department TEXT,
            ai_summary TEXT,
            patient_lat REAL,
            patient_lon REAL,
            emergency_routing INTEGER DEFAULT 0,
            recommended_hospital_id INTEGER,
            created_at TEXT NOT NULL
        )
    """)

    # =====================================================
    # SEED DEMO DATA
    # =====================================================

    cursor.execute("SELECT COUNT(*) FROM users")

    if cursor.fetchone()[0] == 0:

        # -------------------------------------------------
        # Demo patient
        # -------------------------------------------------

        cursor.execute("""
            INSERT INTO users (
                username,
                password,
                name,
                role
            )
            VALUES (?, ?, ?, ?)
        """, (
            "patient",
            "user123",
            "Rahul Sharma",
            "Patient"
        ))

        # -------------------------------------------------
        # Demo Apollo hospital account
        # -------------------------------------------------

        cursor.execute("""
            INSERT INTO users (
                username,
                password,
                name,
                role
            )
            VALUES (?, ?, ?, ?)
        """, (
            "apollo_chennai",
            "hosp123",
            "Apollo Hospitals Staff",
            "Hospital Staff"
        ))

        # -------------------------------------------------
        # Demo patient profile
        # -------------------------------------------------

        cursor.execute("""
            INSERT INTO patients (
                username,
                patient_id,
                full_name,
                age,
                gender,
                blood_group,
                emergency_contact_name,
                emergency_contact_phone,
                pre_existing_conditions,
                allergies,
                primary_physician,
                insurance_provider
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "patient",
            "EMX-PAT-600001",
            "Rahul Sharma",
            34,
            "Male",
            "O+",
            "Priya Sharma (Wife)",
            "+91 98765 43210",
            "Asthma, Mild Hypertension",
            "Penicillin, Peanuts",
            "Dr. Aris (Chennai Clinic)",
            "Star Health Comprehensive"
        ))

        # -------------------------------------------------
        # Chennai hospitals
        # -------------------------------------------------

        chennai_hospitals = [
            (
                "apollo_chennai",
                "Apollo Hospitals",
                "Greams Road, Thousand Lights",
                13.0603,
                80.2512,
                12,
                30,
                28,
                60,
                8,
                5,
                4,
                "🟢 Accepting All Patients",
                98,
                "Optimal",
                1
            ),
            (
                "rgggh_chennai",
                "Rajiv Gandhi Govt General Hospital",
                "Park Town, Central",
                13.0817,
                80.2782,
                4,
                40,
                15,
                100,
                5,
                8,
                12,
                "🟡 High Capacity — Critical Only",
                85,
                "Low O-Negative",
                1
            ),
            (
                "miot_chennai",
                "MIOT International",
                "Manapakkam",
                13.0232,
                80.1873,
                15,
                25,
                32,
                50,
                10,
                6,
                5,
                "🟢 Accepting All Patients",
                95,
                "Optimal",
                1
            ),
            (
                "fortis_chennai",
                "Fortis Malar Hospital",
                "Adyar",
                13.0067,
                80.2570,
                6,
                18,
                10,
                30,
                4,
                3,
                8,
                "🟢 Accepting All Patients",
                90,
                "Optimal",
                1
            ),
            (
                "kauvery_chennai",
                "Kauvery Hospital",
                "Alwarpet",
                13.0336,
                80.2505,
                9,
                20,
                18,
                40,
                6,
                4,
                6,
                "🟢 Accepting All Patients",
                92,
                "Optimal",
                1
            )
        ]

        cursor.executemany("""
            INSERT INTO hospitals (
                username,
                name,
                area,
                lat,
                lon,
                icu_free,
                icu_total,
                beds_free,
                beds_total,
                ventilator_free,
                ambulances_free,
                er_wait_min,
                status,
                oxygen_pct,
                blood_status,
                ct_scanner_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, chennai_hospitals)

        # -------------------------------------------------
        # Initial network-wide alerts
        # -------------------------------------------------

        cursor.executemany("""
            INSERT INTO alerts (
                title,
                source,
                severity,
                message,
                timestamp,
                target_hospital_id
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, [
            (
                "Mass Casualty Alert — Kathipara Junction",
                "CHENNAI TRAFFIC POLICE & EMS",
                "Critical",
                "Multi-vehicle collision reported near Kathipara Flyover. Trauma cases rerouted to MIOT and Fortis Malar.",
                "10 min ago",
                None
            ),
            (
                "ICU High Capacity Warning — RGGGH",
                "CHENNAI HEALTH COMMAND",
                "Warning",
                "Rajiv Gandhi General Hospital ICU beds at 90% capacity. Non-critical emergency triage redirected.",
                "25 min ago",
                None
            ),
            (
                "Heat Wave Medical Advisory",
                "TAMIL NADU HEALTH DEPT",
                "Normal",
                "High humidity and temperatures reported across Chennai coastal area. Dehydration triage centers open.",
                "1 hour ago",
                None
            )
        ])

    # =====================================================
    # ENSURE ALL HOSPITAL STAFF ACCOUNTS EXIST
    # =====================================================

    hospital_staff_accounts = [
        (
            "apollo_chennai",
            "hosp123",
            "Apollo Hospitals Staff",
            "Hospital Staff",
        ),
        (
            "rgggh_chennai",
            "rgggh123",
            "Rajiv Gandhi Govt General Hospital Staff",
            "Hospital Staff",
        ),
        (
            "miot_chennai",
            "miot123",
            "MIOT International Staff",
            "Hospital Staff",
        ),
        (
            "fortis_chennai",
            "fortis123",
            "Fortis Malar Hospital Staff",
            "Hospital Staff",
        ),
        (
            "kauvery_chennai",
            "kauvery123",
            "Kauvery Hospital Staff",
            "Hospital Staff",
        ),
    ]

    for username, password, name, role in hospital_staff_accounts:

        cursor.execute("""
            INSERT OR IGNORE INTO users (
                username,
                password,
                name,
                role
            )
            VALUES (?, ?, ?, ?)
        """, (
            username,
            password,
            name,
            role,
        ))

    conn.commit()
    conn.close()


# =========================================================
# HOSPITAL FUNCTIONS
# =========================================================

def get_all_hospitals():

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM hospitals
        ORDER BY id
    """)

    rows = [
        dict(row)
        for row in cursor.fetchall()
    ]

    conn.close()

    return rows


def get_hospital_by_username(username):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM hospitals
        WHERE username = ?
    """, (username,))

    row = cursor.fetchone()

    conn.close()

    return dict(row) if row else None


def update_hospital_full_telemetry(hosp_id, data):

    conn = sqlite3.connect(DB_PATH)

    cursor = conn.cursor()

    cursor.execute("""
        UPDATE hospitals
        SET
            icu_free = ?,
            beds_free = ?,
            ventilator_free = ?,
            ambulances_free = ?,
            er_wait_min = ?,
            status = ?,
            oxygen_pct = ?,
            blood_status = ?,
            ct_scanner_active = ?
        WHERE id = ?
    """, (
        data["icu_free"],
        data["beds_free"],
        data["ventilator_free"],
        data["ambulances_free"],
        data["er_wait_min"],
        data["status"],
        data["oxygen_pct"],
        data["blood_status"],
        data["ct_scanner_active"],
        hosp_id
    ))

    conn.commit()
    conn.close()


# =========================================================
# PATIENT FUNCTIONS
# =========================================================

def get_patient_profile(username):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM patients
        WHERE username = ?
    """, (username,))

    row = cursor.fetchone()

    conn.close()

    return dict(row) if row else None


def create_patient_account(
    username,
    password_hash,
    full_name,
    age=None,
    gender=None,
    blood_group=None,
    emergency_contact_name=None,
    emergency_contact_phone=None,
    pre_existing_conditions=None,
    allergies=None,
    primary_physician=None,
    insurance_provider=None
):

    username = str(username).strip()
    full_name = str(full_name).strip()

    if not username or not full_name:
        return {
            "success": False,
            "message": "Username and full name are required."
        }

    conn = sqlite3.connect(DB_PATH)

    try:

        cursor = conn.cursor()

        cursor.execute("""
            SELECT id
            FROM users
            WHERE username = ?
        """, (username,))

        if cursor.fetchone():
            return {
                "success": False,
                "message": "Username already exists."
            }

        patient_id = (
            "EMX-PAT-"
            + str(uuid.uuid4().int)[:8]
        )

        cursor.execute("""
            INSERT INTO users (
                username,
                password,
                name,
                role
            )
            VALUES (?, ?, ?, ?)
        """, (
            username,
            password_hash,
            full_name,
            "Patient"
        ))

        cursor.execute("""
            INSERT INTO patients (
                username,
                patient_id,
                full_name,
                age,
                gender,
                blood_group,
                emergency_contact_name,
                emergency_contact_phone,
                pre_existing_conditions,
                allergies,
                primary_physician,
                insurance_provider
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            username,
            patient_id,
            full_name,
            age,
            gender,
            blood_group,
            emergency_contact_name,
            emergency_contact_phone,
            pre_existing_conditions,
            allergies,
            primary_physician,
            insurance_provider
        ))

        conn.commit()

        return {
            "success": True,
            "username": username,
            "patient_id": patient_id,
        }

    except sqlite3.IntegrityError:

        conn.rollback()

        return {
            "success": False,
            "message": (
                "Unable to create account. "
                "Username may already exist."
            )
        }

    except Exception as exc:

        conn.rollback()

        print(
            f"Patient registration error: {exc}"
        )

        return {
            "success": False,
            "message": (
                "Unable to create patient account."
            )
        }

    finally:
        conn.close()


# =========================================================
# ALERT FUNCTIONS
# =========================================================

def get_alerts(
    filter_severity=None,
    hospital_id=None
):
    """
    Retrieve alerts.

    For a hospital:
      - network-wide alerts are visible
      - alerts targeted to that hospital are visible
      - alerts targeted to another hospital are hidden
    """

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    conditions = []
    parameters = []

    if hospital_id is not None:

        conditions.append(
            "(target_hospital_id IS NULL OR target_hospital_id = ?)"
        )

        parameters.append(hospital_id)

    if (
        filter_severity
        and filter_severity != "All"
    ):

        conditions.append(
            "severity = ?"
        )

        parameters.append(
            filter_severity
        )

    query = """
        SELECT *
        FROM alerts
    """

    if conditions:

        query += (
            " WHERE "
            + " AND ".join(conditions)
        )

    query += """
        ORDER BY id DESC
    """

    cursor.execute(
        query,
        parameters
    )

    rows = [
        dict(row)
        for row in cursor.fetchall()
    ]

    conn.close()

    return rows


def add_alert(
    title,
    source,
    severity,
    message,
    timestamp="Just now",
    target_hospital_id=None
):

    conn = sqlite3.connect(DB_PATH)

    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO alerts (
            title,
            source,
            severity,
            message,
            timestamp,
            target_hospital_id
        )
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        title,
        source,
        severity,
        message,
        timestamp,
        target_hospital_id
    ))

    alert_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return alert_id


# =========================================================
# EMERGENCY ASSESSMENT FUNCTIONS
# =========================================================

def add_emergency_assessment(
    patient_username,
    symptom_description,
    triage_level,
    priority_score,
    red_flags,
    required_resources,
    recommended_department,
    ai_summary,
    patient_lat,
    patient_lon,
    emergency_routing,
    recommended_hospital_id=None
):

    conn = sqlite3.connect(DB_PATH)

    cursor = conn.cursor()

    red_flags_text = ", ".join(
        str(item)
        for item in (red_flags or [])
    )

    resources_text = ", ".join(
        str(item)
        for item in (required_resources or [])
    )

    created_at = datetime.now().isoformat(
        timespec="seconds"
    )

    cursor.execute("""
        INSERT INTO emergency_assessments (
            patient_username,
            symptom_description,
            triage_level,
            priority_score,
            red_flags,
            required_resources,
            recommended_department,
            ai_summary,
            patient_lat,
            patient_lon,
            emergency_routing,
            recommended_hospital_id,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        patient_username,
        symptom_description,
        triage_level,
        priority_score,
        red_flags_text,
        resources_text,
        recommended_department,
        ai_summary,
        patient_lat,
        patient_lon,
        1 if emergency_routing else 0,
        recommended_hospital_id,
        created_at
    ))

    assessment_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return assessment_id


def get_emergency_assessments(
    patient_username=None,
    limit=20
):

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    if patient_username:

        cursor.execute("""
            SELECT *
            FROM emergency_assessments
            WHERE patient_username = ?
            ORDER BY id DESC
            LIMIT ?
        """, (
            patient_username,
            limit
        ))

    else:

        cursor.execute("""
            SELECT *
            FROM emergency_assessments
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))

    rows = [
        dict(row)
        for row in cursor.fetchall()
    ]

    conn.close()

    return rows


def create_emergency_alert(
    patient_username,
    triage_level,
    ai_summary,
    recommended_hospital=None
):

    severity = str(
        triage_level or "Urgent"
    ).strip()

    if severity.lower() == "critical":

        alert_severity = "Critical"

    elif severity.lower() == "urgent":

        alert_severity = "Warning"

    else:

        return None

    patient_label = (
        patient_username
        or "Anonymous Patient"
    )

    hospital_name = (
        recommended_hospital.get("name")
        if recommended_hospital
        else "Nearest suitable facility"
    )

    hospital_area = (
        recommended_hospital.get("area")
        if recommended_hospital
        else ""
    )

    target_hospital_id = (
        recommended_hospital.get("id")
        if recommended_hospital
        else None
    )

    title = (
        f"{alert_severity} Emergency Assessment"
    )

    message = (
        f"Emergency assessment submitted for "
        f"{patient_label}. "
        f"Triage: {severity}. "
        f"{ai_summary}"
    )

    if hospital_name:

        message += (
            f" Recommended facility: "
            f"{hospital_name}"
        )

    if hospital_area:

        message += (
            f" ({hospital_area})"
        )

    return add_alert(
        title=title,
        source="EMERGIX AI TRIAGE",
        severity=alert_severity,
        message=message,
        timestamp="Just now",
        target_hospital_id=target_hospital_id
    )


# =========================================================
# INITIALIZE DATABASE
# =========================================================

init_db()


# =========================================================
# DIRECT EXECUTION
# =========================================================

if __name__ == "__main__":

    print(
        "EMERGIX database initialized successfully."
    )

    print(
        f"Database: {os.path.abspath(DB_PATH)}"
    )

    print(
        f"Hospitals loaded: "
        f"{len(get_all_hospitals())}"
    )