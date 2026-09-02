import sqlite3
import os

DB_PATH = "emergix.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Users & Authentication
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL
        )
    """)

    # 2. Patient Profile & Clinical Telemetry
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

    # 3. Chennai Hospitals Telemetry
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

    # 4. Emergency Alerts & Live Dispatches
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            source TEXT NOT NULL,
            severity TEXT NOT NULL, -- 'Critical', 'Warning', 'Normal'
            message TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)

    # Seed Default Data if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        # Seed Users
        cursor.execute("INSERT INTO users (username, password, name, role) VALUES ('patient', 'user123', 'Rahul Sharma', 'Patient')")
        cursor.execute("INSERT INTO users (username, password, name, role) VALUES ('apollo_chennai', 'hosp123', 'Apollo Hospitals Staff', 'Hospital Staff')")

        # Seed Patient Clinical Data
        cursor.execute("""
            INSERT INTO patients (
                username, patient_id, full_name, age, gender, blood_group,
                emergency_contact_name, emergency_contact_phone, pre_existing_conditions,
                allergies, primary_physician, insurance_provider
            ) VALUES (
                'patient', 'EMX-PAT-600001', 'Rahul Sharma', 34, 'Male', 'O+',
                'Priya Sharma (Wife)', '+91 98765 43210', 'Asthma, Mild Hypertension',
                'Penicillin, Peanuts', 'Dr. Aris (Chennai Clinic)', 'Star Health Comprehensive'
            )
        """)

        # Seed Chennai Hospitals
        chennai_hospitals = [
            ('apollo_chennai', 'Apollo Hospitals', 'Greams Road, Thousand Lights', 13.0603, 80.2512, 12, 30, 28, 60, 8, 5, 4, '🟢 Accepting All Patients', 98, 'Optimal', 1),
            ('rgggh_chennai', 'Rajiv Gandhi Govt General Hospital', 'Park Town, Central', 13.0817, 80.2782, 4, 40, 15, 100, 5, 8, 12, '🟡 High Capacity — Critical Only', 85, 'Low O-Negative', 1),
            ('miot_chennai', 'MIOT International', 'Manapakkam', 13.0232, 80.1873, 15, 25, 32, 50, 10, 6, 5, '🟢 Accepting All Patients', 95, 'Optimal', 1),
            ('fortis_chennai', 'Fortis Malar Hospital', 'Adyar', 13.0067, 80.2570, 6, 18, 10, 30, 4, 3, 8, '🟢 Accepting All Patients', 90, 'Optimal', 1),
            ('kauvery_chennai', 'Kauvery Hospital', 'Alwarpet', 13.0336, 80.2505, 9, 20, 18, 40, 6, 4, 6, '🟢 Accepting All Patients', 92, 'Optimal', 1)
        ]

        cursor.executemany("""
            INSERT INTO hospitals (
                username, name, area, lat, lon, icu_free, icu_total, beds_free, beds_total,
                ventilator_free, ambulances_free, er_wait_min, status, oxygen_pct, blood_status, ct_scanner_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, chennai_hospitals)

        # Seed Alerts
        cursor.executemany("""
            INSERT INTO alerts (title, source, severity, message, timestamp) VALUES (?, ?, ?, ?, ?)
        """, [
            ("Mass Casualty Alert — Kathipara Junction", "CHENNAI TRAFFIC POLICE & EMS", "Critical", "Multi-vehicle collision reported near Kathipara Flyover. Trauma cases rerouted to MIOT and Fortis Malar.", "10 min ago"),
            ("ICU High Capacity Warning — RGGGH", "CHENNAI HEALTH COMMAND", "Warning", "Rajiv Gandhi General Hospital ICU beds at 90% capacity. Non-critical emergency triage redirected.", "25 min ago"),
            ("Heat Wave Medical Advisory", "TAMIL NADU HEALTH DEPT", "Normal", "High humidity and temperatures reported across Chennai coastal area. Dehydration triage centers open.", "1 hour ago")
        ])

    conn.commit()
    conn.close()

def get_all_hospitals():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hospitals")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def get_hospital_by_username(username):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hospitals WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_patient_profile(username):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_alerts(filter_severity=None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    if filter_severity and filter_severity != "All":
        cursor.execute("SELECT * FROM alerts WHERE severity = ? ORDER BY id DESC", (filter_severity,))
    else:
        cursor.execute("SELECT * FROM alerts ORDER BY id DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def add_alert(title, source, severity, message, timestamp="Just now"):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO alerts (title, source, severity, message, timestamp) VALUES (?, ?, ?, ?, ?)",
                   (title, source, severity, message, timestamp))
    conn.commit()
    conn.close()

def update_hospital_full_telemetry(hosp_id, data):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE hospitals 
        SET icu_free = ?, beds_free = ?, ventilator_free = ?, ambulances_free = ?,
            er_wait_min = ?, status = ?, oxygen_pct = ?, blood_status = ?, ct_scanner_active = ?
        WHERE id = ?
    """, (
        data['icu_free'], data['beds_free'], data['ventilator_free'], data['ambulances_free'],
        data['er_wait_min'], data['status'], data['oxygen_pct'], data['blood_status'],
        data['ct_scanner_active'], hosp_id
    ))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized with Chennai emergency data!")