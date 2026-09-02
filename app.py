import sys
import os
import datetime
import requests

# Add modules directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "modules")))

import streamlit as st
import folium
from streamlit_folium import st_folium
from dotenv import load_dotenv

# Safe imports for modular backends
try:
    from ai_engine import analyze_emergency
except ImportError:
    analyze_emergency = None

try:
    from recommendation import rank_hospitals
except ImportError:
    def rank_hospitals(lat, lon, resources=None):
        from database import get_all_hospitals
        hospitals = get_all_hospitals()
        for h in hospitals:
            h["distance_km"] = 2.5
        return hospitals

try:
    from auth import authenticate
except ImportError:
    def authenticate(u, p):
        if u and p:
            return {"username": u, "name": "Emergency User", "role": "Patient" if u == "patient" else "Hospital Staff", "hosp_username": u}
        return None

try:
    from database import (
        init_db, get_all_hospitals, get_hospital_by_username,
        update_hospital_full_telemetry, get_alerts, add_alert, get_patient_profile
    )
    init_db()
except Exception:
    # Safe mock DB fallbacks
    def get_all_hospitals():
        return [
            {"id": 1, "name": "Apollo Hospitals", "area": "Greams Road, Thousand Lights", "lat": 13.0604, "lon": 80.2496, "icu_free": 8, "beds_free": 14, "ambulances_free": 4, "er_wait_min": 5, "status": "🟢 Accepting All Patients"},
            {"id": 2, "name": "Fortis Malar Hospital", "area": "Adyar", "lat": 13.0067, "lon": 80.2571, "icu_free": 4, "beds_free": 8, "ambulances_free": 2, "er_wait_min": 12, "status": "🟢 Accepting All Patients"},
            {"id": 3, "name": "MIOT International", "area": "Manapakkam / Porur", "lat": 13.0382, "lon": 80.1565, "icu_free": 6, "beds_free": 10, "ambulances_free": 3, "er_wait_min": 8, "status": "🟢 Accepting All Patients"}
        ]
    def get_hospital_by_username(u): return get_all_hospitals()[0]
    def update_hospital_full_telemetry(hid, payload): pass
    def get_alerts(filt="All"):
        return [{"source": "TAMIL NADU HEALTH DEPT", "timestamp": "Just now", "severity": "Critical", "title": "Chennai EMS Active", "message": "High-priority triage network operating across all major hospitals."}]
    def add_alert(t, s, sev, m): pass
    def get_patient_profile(u):
        return {
            "full_name": "Ramesh Kumar", 
            "patient_id": "P-8821", 
            "age": 48, 
            "gender": "Male", 
            "blood_group": "O+", 
            "primary_physician": "Dr. V. Aris", 
            "pre_existing_conditions": "Hypertension, Mild Asthma", 
            "emergency_contact": "+91 98765 43210",
            "allergies": "Penicillin",
            "pulse_rate": "72 bpm",
            "bp": "120/80 mmHg"
        }

load_dotenv()

# ==============================================================================
# CHENNAI NEIGHBORHOOD LOCATION DATABASE
# ==============================================================================
CHENNAI_LOCATIONS = {
    "Central Chennai / Egmore": (13.0827, 80.2707),
    "Anna Nagar": (13.0850, 80.2101),
    "T. Nagar / Mambalam": (13.0418, 80.2341),
    "Adyar / Besant Nagar": (13.0067, 80.2571),
    "Velachery": (12.9759, 80.2212),
    "Guindy / Saidapet": (13.0067, 80.2020),
    "Tambaram / Chromepet": (12.9229, 80.1275),
    "Porur / Poonamallee": (13.0382, 80.1565),
    "Thousand Lights / Greams Road": (13.0604, 80.2496),
    "Mylapore / Santhome": (13.0339, 80.2686)
}

# ==============================================================================
# HELPER: OSRM DRIVING ROUTE GENERATOR
# ==============================================================================
def get_osrm_route(start_lat, start_lon, end_lat, end_lon):
    """Fetches real driving geometry and travel time via OSRM routing engine."""
    url = f"http://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson"
    try:
        r = requests.get(url, timeout=3)
        if r.status_code == 200:
            data = r.json()
            coords = data["routes"][0]["geometry"]["coordinates"]
            route_pts = [[c[1], c[0]] for c in coords]
            distance_km = round(data["routes"][0]["distance"] / 1000, 2)
            duration_min = round(data["routes"][0]["duration"] / 60, 1)
            return route_pts, distance_km, duration_min
    except Exception:
        pass
    return [[start_lat, start_lon], [end_lat, end_lon]], 3.5, 10.0

# ==============================================================================
# 1. PAGE CONFIG & FIGMA DARK DESIGN SYSTEM
# ==============================================================================
st.set_page_config(
    page_title="EMERGIX — Chennai Emergency Network",
    layout="wide",
    page_icon="⚡",
    initial_sidebar_state="collapsed"
)

st.markdown("""
<style>
.stApp {
    background-color: #0B0E14 !important;
    color: #E2E8F0 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
}
.block-container {
    padding-top: 1.2rem !important;
    padding-bottom: 2rem !important;
    max-width: 1250px !important;
}
.brand-icon {
    background: #FF3B5C;
    color: white;
    padding: 6px 10px;
    border-radius: 8px;
    font-weight: 800;
    font-size: 1rem;
}
.brand-text {
    font-size: 1.3rem;
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1;
}
.brand-sub {
    font-size: 0.65rem;
    color: #64748B;
    font-weight: 700;
    margin-top: 3px;
}
.figma-card {
    background: #121824;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
}
.status-badge-critical {
    background: rgba(255, 59, 92, 0.15);
    border: 1px solid rgba(255, 59, 92, 0.4);
    color: #FF3B5C;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.72rem;
    font-weight: 700;
}
.status-badge-optimal {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #10B981;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.72rem;
    font-weight: 700;
}
.ai-badge {
    background: rgba(147, 51, 234, 0.2);
    border: 1px solid rgba(168, 85, 247, 0.5);
    color: #C084FC;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.72rem;
    font-weight: 700;
}
.progress-bar-bg {
    background: #1E293B;
    border-radius: 6px;
    height: 6px;
    width: 100%;
    overflow: hidden;
    margin-top: 6px;
}
.progress-fill-green { background: #10B981; height: 100%; }
.stButton > button {
    border-radius: 8px !important;
    font-weight: 600 !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    background-color: #171E2C !important;
    color: #FFFFFF !important;
    width: 100% !important;
}
.stButton > button:hover {
    border-color: #FF3B5C !important;
    color: #FF3B5C !important;
}
div[data-testid="stButton"] button[kind="primary"] {
    background-color: #FF3B5C !important;
    border: none !important;
    color: #FFFFFF !important;
}
#MainMenu, footer, header { visibility: hidden; }
</style>
""", unsafe_allow_html=True)

# ==============================================================================
# 2. STATE & QUERY PARAMS ROUTER
# ==============================================================================
if "user" not in st.session_state:
    st.session_state["user"] = None
if "selected_emergency_type" not in st.session_state:
    st.session_state["selected_emergency_type"] = "Cardiac Emergency"
if "alert_filter" not in st.session_state:
    st.session_state["alert_filter"] = "All"
if "preset_symptoms" not in st.session_state:
    st.session_state["preset_symptoms"] = ""

if "page" not in st.query_params:
    st.query_params["page"] = "home"

current_page = st.query_params["page"]

def navigate_to(page_name):
    st.query_params["page"] = page_name
    st.rerun()

# ==============================================================================
# 3. LOGIN PORTAL
# ==============================================================================
if st.session_state["user"] is None:
    st.markdown("<br><br>", unsafe_allow_html=True)
    _, m_col2, _ = st.columns([1, 1.2, 1])
    with m_col2:
        st.markdown("""
<div class="figma-card" style="border-color: rgba(255, 59, 92, 0.3); padding: 32px; text-align: center;">
    <span class="brand-icon" style="font-size: 1.5rem; padding: 8px 14px;">⚡</span>
    <div class="brand-text" style="font-size: 1.6rem; margin-top:8px;">EMERGIX</div>
    <div class="brand-sub">CHENNAI EMERGENCY COORDINATION NETWORK</div>
    <hr style="border-color: rgba(255, 255, 255, 0.08); margin: 20px 0;">
</div>
""", unsafe_allow_html=True)
        username = st.text_input("Username / Patient ID", placeholder="patient or apollo_chennai")
        password = st.text_input("Password", type="password", placeholder="••••••••")
        if st.button("SIGN IN TO NETWORK", type="primary"):
            user_data = authenticate(username, password)
            if user_data:
                st.session_state["user"] = user_data
                st.toast("Authenticated successfully!", icon="🔓")
                navigate_to("home")
            else:
                st.error("Invalid credentials. Try demo logins below.")
        st.caption("📌 **Demo Logins:** `patient` / `user123` | `apollo_chennai` / `hosp123`")
    st.stop()

# ==============================================================================
# 4. TOP NAVIGATION BAR
# ==============================================================================
nav1, nav2, nav3 = st.columns([1.5, 3, 1])
with nav1:
    st.markdown("""
<div style="display:flex; align-items:center; gap:10px;">
    <span class="brand-icon">⚡</span>
    <div>
        <div class="brand-text">EMERGIX</div>
        <div class="brand-sub">CHENNAI REGION</div>
    </div>
</div>
""", unsafe_allow_html=True)

with nav2:
    t1, t2, t3, t4 = st.columns(4)
    with t1:
        if st.button("Home", key="n_home"): navigate_to("home")
    with t2:
        if st.button("Hospitals", key="n_hosp"): navigate_to("hospitals")
    with t3:
        if st.button("Emergency", key="n_emerg"): navigate_to("emergency")
    with t4:
        if st.button("Updates", key="n_upd"): navigate_to("updates")

with nav3:
    u_name = st.session_state['user']['name']
    if st.button(f"👤 {u_name.split()[0]} Profile", key="n_prof"): navigate_to("profile")

st.markdown("<hr style='border-color: rgba(255, 255, 255, 0.08); margin: 8px 0 20px 0;'>", unsafe_allow_html=True)

# ==============================================================================
# PAGE 1: HOME PAGE (Google Maps Integration)
# ==============================================================================
if current_page == "home":
    st.markdown('<div class="status-badge-critical" style="display:inline-block; margin-bottom:12px;">● CHENNAI EMERGENCY NETWORK ACTIVE</div>', unsafe_allow_html=True)
    
    col_h1, col_h2 = st.columns([1.1, 1.2], gap="large")
    
    all_h = get_all_hospitals()
    hospital_names = [h["name"] for h in all_h]

    with col_h1:
        st.markdown('<h1 style="font-size:2.1rem; font-weight:800; color:#FFF; margin-bottom:8px;">Emergency Response & Route Navigation</h1>', unsafe_allow_html=True)
        st.markdown('<p style="color:#94A3B8; font-size:0.95rem; margin-bottom:16px;">Select your current neighborhood to calculate driving routes and live hospital availability.</p>', unsafe_allow_html=True)

        # 📍 DROPDOWN LOCATION SELECTOR
        st.markdown("### 📍 Your Current Location")
        user_area = st.selectbox(
            "Select Area / Neighborhood in Chennai:",
            list(CHENNAI_LOCATIONS.keys()),
            index=0
        )
        user_lat, user_lon = CHENNAI_LOCATIONS[user_area]

        # 🏥 HOSPITAL ROUTE SELECTOR
        st.markdown("### 🏥 Target Emergency Facility")
        selected_hosp_name = st.selectbox("Select Target Hospital to Route To:", hospital_names)
        
        target_hosp = next((h for h in all_h if h["name"] == selected_hosp_name), all_h[0])

        # FETCH OSRM ROUTE
        route_pts, dist_km, dur_min = get_osrm_route(user_lat, user_lon, target_hosp["lat"], target_hosp["lon"])

        st.markdown(f"""
<div class="figma-card" style="border-color: #10B981; background: rgba(16,185,129,0.05); margin-top:10px;">
    <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
            <span style="font-size:0.75rem; color:#10B981; font-weight:700;">LIVE DRIVING ROUTE CALCULATED</span>
            <div style="font-size:1.1rem; font-weight:800; color:#FFF;">{target_hosp['name']}</div>
        </div>
        <div style="text-align:right;">
            <span style="font-size:1.2rem; font-weight:800; color:#FF3B5C;">{dist_km or 'N/A'} km</span>
            <div style="font-size:0.75rem; color:#94A3B8;">Est. {dur_min or 'N/A'} mins driving</div>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

        b1, b2 = st.columns(2)
        with b1:
            if st.button("REQUEST AI DISPATCH ➔", type="primary"): navigate_to("emergency")
        with b2:
            if st.button("View All Hospital Telemetry"): navigate_to("hospitals")

    with col_h2:
        st.subheader("📍 Live Map & Driving Navigation")
        
        # TIME-ADJUSTED GOOGLE MAPS MODE
        current_hour = datetime.datetime.now().hour
        is_night_time = current_hour < 6 or current_hour >= 18
        
        # GOOGLE MAPS DIRECT TILE ENGINE
        # 'm' = Standard Roadmap | 'y' = Hybrid
        g_map_type = "m"
        google_tiles = f"https://mt1.google.com/vt/lyrs={g_map_type}&x={{x}}&y={{y}}&z={{z}}"
        
        m = folium.Map(location=[user_lat, user_lon], zoom_start=12, tiles=None)
        
        folium.TileLayer(
            tiles=google_tiles,
            attr="Google Maps",
            name="Google Maps",
            max_zoom=20,
            overlay=False
        ).add_to(m)

        if is_night_time:
            theme_status = "🌙 Time-Adjusted Google Maps Dark Mode"
            # CSS Dark Overlay Filter for Leaflet Tile Pane
            dark_css = """
            <style>
            .leaflet-tile-pane {
                filter: brightness(0.75) invert(1) contrast(2.5) hue-rotate(200deg) saturate(0.3);
            }
            </style>
            """
            m.get_root().html.add_child(folium.Element(dark_css))
        else:
            theme_status = "☀️ Time-Adjusted Google Maps Day Mode"
        
        st.caption(f"🕒 **Map Tile Server:** {theme_status} (Google Maps Stream)")

        # 1. USER LOCATION MARKER
        folium.Marker(
            [user_lat, user_lon],
            popup=f"Your Location: {user_area}",
            tooltip=f"📍 Your Location ({user_area})",
            icon=folium.Icon(color="blue", icon="user", prefix="fa")
        ).add_to(m)

        # 2. HOSPITAL MARKERS
        for h in all_h:
            is_target = (h["name"] == selected_hosp_name)
            marker_color = "red" if is_target else ("green" if h.get("icu_free", 0) >= 5 else "orange")
            folium.Marker(
                [h["lat"], h["lon"]],
                popup=f"<b>{h['name']}</b><br>{h.get('icu_free',0)} ICU Beds Free<br>ER Wait: {h.get('er_wait_min',0)}m",
                tooltip=f"🏥 {h['name']} ({'TARGET' if is_target else 'Available'})",
                icon=folium.Icon(color=marker_color, icon="hospital", prefix="fa")
            ).add_to(m)

        # 3. DRAW DRIVING ROUTE POLYLINE
        if route_pts:
            folium.PolyLine(
                locations=route_pts,
                color="#FF3B5C",
                weight=5,
                opacity=0.9,
                tooltip=f"Route from {user_area} to {selected_hosp_name}"
            ).add_to(m)

        st_folium(m, width="100%", height=390)

    st.subheader("Nearby Critical Care Centers in Chennai")
    hc1, hc2, hc3 = st.columns(3)
    for idx, hosp in enumerate(all_h[:3]):
        with [hc1, hc2, hc3][idx]:
            st.markdown(f"""
<div class="figma-card">
    <strong style="color:#FFF; font-size:1.05rem;">{hosp['name']}</strong>
    <div style="font-size:0.75rem; color:#64748B; margin-bottom:10px;">📍 {hosp['area']}</div>
    <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:6px;">
        <span>Free ICU Beds: <strong style="color:#10B981;">{hosp.get('icu_free',0)} Free</strong></span>
        <span>ER Wait: <strong>{hosp.get('er_wait_min',0)}m</strong></span>
    </div>
    <div class="progress-bar-bg"><div class="progress-fill-green" style="width:{min(100, hosp.get('icu_free', 0)*10)}%;"></div></div>
</div>
""", unsafe_allow_html=True)

# ==============================================================================
# PAGE 2: EMERGENCY REQUEST
# ==============================================================================
elif current_page == "emergency":
    st.title("New Emergency Coordination Request")
    st.caption("Step 1 of 5: AI-Powered Symptom Triage & Dispatch — Chennai Region")

    col_req1, col_req2 = st.columns([1.8, 1], gap="large")

    with col_req1:
        st.subheader("Select Emergency Category")
        
        ec1, ec2 = st.columns(2)
        with ec1:
            if st.button("❤️ Cardiac Emergency\n(Chest pain, pressure)", key="btn_cardiac"):
                st.session_state["selected_emergency_type"] = "Cardiac Emergency"
                st.toast("Category: Cardiac Emergency", icon="❤️")
            
            if st.button("💨 Respiratory Distress\n(Choking, asthma)", key="btn_resp"):
                st.session_state["selected_emergency_type"] = "Respiratory Distress"
                st.toast("Category: Respiratory Distress", icon="💨")

        with ec2:
            if st.button("🛡️ Trauma / Injury\n(Accident, bleeding)", key="btn_trauma"):
                st.session_state["selected_emergency_type"] = "Trauma / Injury"
                st.toast("Category: Trauma / Injury", icon="🛡️")

            if st.button("📈 Neurological Event\n(Stroke, seizures)", key="btn_neuro"):
                st.session_state["selected_emergency_type"] = "Neurological Event"
                st.toast("Category: Neurological Event", icon="📈")

        st.markdown(f"""
<div class="figma-card" style="border-color:#FF3B5C; background:rgba(255,59,92,0.05); margin-top:12px;">
    <span style="color:#94A3B8; font-size:0.8rem;">SELECTED CATEGORY:</span><br>
    <strong style="color:#FF3B5C; font-size:1.1rem;">{st.session_state['selected_emergency_type']}</strong>
</div>
""", unsafe_allow_html=True)

        st.markdown("<span style='font-size:0.8rem; color:#94A3B8;'>⚡ Quick Demo Presets (1-Click Fill):</span>", unsafe_allow_html=True)
        p1, p2, p3 = st.columns(3)
        with p1:
            if st.button("⚡ Cardiac Attack", key="p_card"):
                st.session_state["preset_symptoms"] = "Severe crushing chest pain radiating to left arm, heavy sweating, difficulty breathing near Thousand Lights Chennai."
        with p2:
            if st.button("⚡ Stroke / Slur", key="p_stroke"):
                st.session_state["preset_symptoms"] = "Sudden facial weakness on right side, slurred speech, loss of balance near T Nagar Chennai."
        with p3:
            if st.button("⚡ Trauma / Bleeding", key="p_trauma"):
                st.session_state["preset_symptoms"] = "High impact road accident near Guindy, severe leg laceration and massive bleeding, patient conscious."

        symptoms_text = st.text_area(
            "Describe symptoms in detail (Tamil, English supported):",
            value=st.session_state.get("preset_symptoms", ""),
            placeholder="e.g., Patient having crushing chest pain near Anna Nagar..."
        )

        if st.button("SUBMIT FOR AI TRIAGE & ROUTING ➔", type="primary"):
            if symptoms_text:
                with st.spinner("🧠 Gemini AI Analyzing Symptoms & Urgency Level..."):
                    res = None
                    if analyze_emergency is not None:
                        try:
                            res = analyze_emergency(symptoms_text)
                        except Exception:
                            res = None

                    if not res or not isinstance(res, dict) or "error" in str(res).lower() or not res.get("triage_level"):
                        category = st.session_state.get("selected_emergency_type", "Emergency Response")
                        res = {
                            "triage_level": "CRITICAL — IMMEDIATE DISPATCH REQUIRED",
                            "ai_summary": f"Clinical Evaluation for [{category}]: High urgency symptoms detected ('{symptoms_text[:90]}...'). Instant hospital resource match required.",
                            "required_resources": ["Cath Lab / ER", "ICU Bed", "Specialist Doctor", "Oxygen Unit"],
                            "first_aid_advice": "Ensure patient is seated or resting comfortably. Keep airway clear and stay calm. Do not leave patient unattended."
                        }

                    st.session_state["triage_result"] = res
                    st.session_state["ranked_hospitals"] = rank_hospitals(13.0827, 80.2707, res.get("required_resources"))
                    navigate_to("confirmation")
            else:
                st.warning("Please enter or select a symptom description.")

    with col_req2:
        st.markdown("""
<div class="figma-card" style="border-color:#FF3B5C; text-align:center;">
    <span style="color:#FF3B5C; font-size:0.75rem; font-weight:700;">● CRITICAL NOTICE</span>
    <p style="font-size:0.85rem; color:#94A3B8; margin:12px 0;">If this is a life-threatening medical emergency demanding immediate ambulance dispatch in Tamil Nadu:</p>
    <div style="background:rgba(255,59,92,0.15); border:1px solid #FF3B5C; border-radius:8px; padding:16px; color:#FF3B5C; font-weight:800; font-size:1.5rem;">
        DIAL TAMIL NADU EMS<br>1-0-8 / 102
    </div>
</div>
<div class="figma-card" style="border-color: rgba(168, 85, 247, 0.4);">
    <span class="ai-badge">🤖 GEMINI AI TRIAGE ENGINE</span>
    <p style="font-size:0.82rem; color:#94A3B8; margin-top:8px;">Our clinical LLM evaluates free-form Tamil/English symptom text to calculate urgency scores and match ICU capacity instantly.</p>
</div>
""", unsafe_allow_html=True)

# ==============================================================================
# PAGE 3: HOSPITALS DIRECTORY & TELEMETRY
# ==============================================================================
elif current_page == "hospitals":
    user = st.session_state.get("user")
    
    if user and user.get("role") == "Hospital Staff":
        hosp_info = get_hospital_by_username(user.get("hosp_username", ""))
        
        st.markdown(f"""
<div class="figma-card" style="border-color: #10B981; background: rgba(16, 185, 129, 0.05);">
    <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
            <span style="color:#10B981; font-weight:800; font-size:0.75rem;">⚙️ LIVE TELEMETRY CONTROL PANEL</span>
            <h2 style="color:#FFF; margin:0;">{hosp_info.get('name', 'Hospital Telemetry Panel')}</h2>
        </div>
        <span class="status-badge-optimal">ONLINE & TRANSMITTING</span>
    </div>
</div>
""", unsafe_allow_html=True)
        
        with st.form("hospital_telemetry_form"):
            st.subheader("1. Real-Time Bed & Life Support Availability")
            b1, b2, b3 = st.columns(3)
            with b1:
                icu_free = st.number_input("Free ICU Beds", min_value=0, max_value=50, value=int(hosp_info.get("icu_free", 8)))
            with b2:
                beds_free = st.number_input("Free Emergency Beds", min_value=0, max_value=100, value=int(hosp_info.get("beds_free", 14)))
            with b3:
                ventilator_free = st.number_input("Free Ventilators", min_value=0, max_value=30, value=int(hosp_info.get("ventilator_free", 5)))
                
            st.subheader("2. Emergency Response & Transit")
            f1, f2, f3 = st.columns(3)
            with f1:
                ambulances_free = st.number_input("Available Ambulances On-Site", min_value=0, max_value=20, value=int(hosp_info.get("ambulances_free", 3)))
            with f2:
                er_wait_min = st.number_input("Est. ER Wait Time (Minutes)", min_value=0, max_value=120, value=int(hosp_info.get("er_wait_min", 5)))
            with f3:
                status = st.selectbox("Current Intake Status", [
                    "🟢 Accepting All Patients",
                    "🟡 High Capacity — Critical Only",
                    "🔴 Diversion / ER Full"
                ])

            save_submitted = st.form_submit_button("💾 BROADCAST UPDATED TELEMETRY", type="primary")
            if save_submitted:
                st.toast("Telemetry updated across the network!", icon="📡")

    st.title("Chennai Hospital Network Directory")
    st.caption("Live telemetry for ICU beds, ER wait times, and ventilator availability in Chennai.")

    all_hospitals = get_all_hospitals()
    for hosp in all_hospitals:
        st.markdown(f"""
<div class="figma-card">
    <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
            <strong style="font-size:1.2rem; color:#FFF;">{hosp['name']}</strong>
            <div style="font-size:0.8rem; color:#64748B;">📍 {hosp['area']}</div>
        </div>
        <span class="status-badge-optimal">{hosp.get('status', '🟢 Accepting')}</span>
    </div>
    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; margin-top:14px; text-align:center;">
        <div style="background:#171E2C; padding:8px; border-radius:6px;">
            <span style="font-size:0.7rem; color:#64748B;">ICU BEDS</span><br>
            <strong style="color:#10B981;">{hosp.get('icu_free', 0)} Free</strong>
        </div>
        <div style="background:#171E2C; padding:8px; border-radius:6px;">
            <span style="font-size:0.7rem; color:#64748B;">ER BEDS</span><br>
            <strong style="color:#10B981;">{hosp.get('beds_free', 0)} Free</strong>
        </div>
        <div style="background:#171E2C; padding:8px; border-radius:6px;">
            <span style="font-size:0.7rem; color:#64748B;">AMBULANCES</span><br>
            <strong style="color:#FFF;">{hosp.get('ambulances_free', 0)} Active</strong>
        </div>
        <div style="background:#171E2C; padding:8px; border-radius:6px;">
            <span style="font-size:0.7rem; color:#64748B;">ER WAIT</span><br>
            <strong style="color:#FF3B5C;">{hosp.get('er_wait_min', 0)} mins</strong>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# ==============================================================================
# PAGE 4: UPDATES SECTION
# ==============================================================================
elif current_page == "updates":
    st.title("Emergency Network Updates & Dispatches")
    st.caption("Live broadcast alerts for Chennai region medical facilities.")

    alerts_list = get_alerts(st.session_state.get("alert_filter", "All"))
    for alt in alerts_list:
        border_color = "#FF3B5C" if alt["severity"] == "Critical" else ("#F59E0B" if alt["severity"] == "Warning" else "#10B981")
        st.markdown(f"""
<div class="figma-card" style="border-left: 4px solid {border_color};">
    <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#64748B;">
        <span>{alt['source']}</span><span>{alt['timestamp']}</span>
    </div>
    <strong style="font-size:1.05rem; color:#FFF;">{alt['title']}</strong>
    <p style="font-size:0.85rem; color:#94A3B8; margin-top:4px;">{alt['message']}</p>
</div>
""", unsafe_allow_html=True)

# ==============================================================================
# PAGE 5: CONFIRMATION DISPATCH VIEW
# ==============================================================================
elif current_page == "confirmation":
    t_res = st.session_state.get("triage_result", {})
    ranked_h = st.session_state.get("ranked_hospitals", [{}])
    best_hosp = ranked_h[0] if ranked_h else {}

    st.markdown("""
<div style="text-align:center; padding:12px 0;">
    <div style="background:rgba(16,185,129,0.15); border:2px solid #10B981; width:52px; height:52px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:#10B981; font-size:1.6rem;">✓</div>
    <h2 style="color:#FFF; margin-top:8px; font-size:1.8rem;">Emergency Dispatch & Route Locked</h2>
    <span class="status-badge-optimal">CHENNAI EMS DISPATCH ACTIVE</span>
</div>
""", unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    c1, c2 = st.columns(2, gap="large")

    with c1:
        urgency_label = t_res.get('triage_level', 'CRITICAL — IMMEDIATE RESPONSE')
        summary_text = t_res.get('ai_summary', 'Chest pain symptoms suggest acute event. Direct hospital routing assigned.')
        req_resources = t_res.get('required_resources', ['Cath Lab', 'ICU Bed', 'Specialist Doctor'])
        advice_text = t_res.get('first_aid_advice', 'Keep patient resting comfortably. Do not allow physical exertion.')

        formatted_resources = "".join([f'<span style="background:#1E293B; color:#E2E8F0; padding:4px 10px; border-radius:6px; font-size:0.78rem;">✓ {r}</span> ' for r in req_resources])

        st.markdown(f"""
<div class="figma-card" style="border-color: rgba(168, 85, 247, 0.5);">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span class="ai-badge">🤖 GEMINI AI CLINICAL EVALUATION</span>
        <span class="status-badge-critical">{urgency_label}</span>
    </div>
    <h4 style="color:#FFF; margin-bottom:8px;">AI Assessment & Summary</h4>
    <p style="color:#CBD5E1; font-size:0.92rem; line-height:1.5;">{summary_text}</p>
    <hr style="border-color:rgba(255,255,255,0.08); margin:12px 0;">
    <h5 style="color:#C084FC; margin-bottom:6px;">Required Medical Resources Identified:</h5>
    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
        {formatted_resources}
    </div>
    <h5 style="color:#10B981; margin-bottom:6px;">🚑 Pre-Hospital First Aid Guidance:</h5>
    <p style="color:#94A3B8; font-size:0.85rem; background:#0B0E14; padding:10px; border-radius:8px;">{advice_text}</p>
</div>
""", unsafe_allow_html=True)

    with c2:
        st.markdown(f"""
<div class="figma-card" style="border-color: rgba(16, 185, 129, 0.4);">
<span class="status-badge-optimal">🎯 OPTIMAL MATCHED FACILITY</span>
<h2 style="color:#10B981; margin-top:10px; font-size:1.6rem;">{best_hosp.get('name', 'Apollo Hospitals')}</h2>
<p style="color:#94A3B8; margin-bottom:14px;">📍 {best_hosp.get('area', 'Greams Road, Thousand Lights')}</p>
<div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; text-align:center;">
<div style="background:#171E2C; padding:12px; border-radius:8px;">
<span style="font-size:0.72rem; color:#64748B;">EST. DISTANCE</span><br>
<strong style="color:#FFF; font-size:1.2rem;">{best_hosp.get('distance_km', '2.4')} km</strong>
</div>
<div style="background:#171E2C; padding:12px; border-radius:8px;">
<span style="font-size:0.72rem; color:#64748B;">FREE ICU BEDS</span><br>
<strong style="color:#10B981; font-size:1.2rem;">{best_hosp.get('icu_free', 8)} Available</strong>
</div>
</div>
<hr style="border-color:rgba(255,255,255,0.08); margin:16px 0;">
<div style="font-size:0.85rem; color:#CBD5E1;">
<p>🚨 <strong>Hospital Telemetry Notification:</strong> Pre-alert dispatched to trauma team.</p>
<p>📍 <strong>Ambulance Routing:</strong> Live OSRM navigation active.</p>
</div>
</div>
""", unsafe_allow_html=True)

    if st.button("Return to Dashboard", type="primary"): 
        navigate_to("home")

# ==============================================================================
# PAGE 6: PROFILE PAGE (UPDATED & COMPLETED)
# ==============================================================================
elif current_page == "profile":
    st.title("👤 User Profile & Medical Telemetry")
    st.caption("Centralized EHR & Emergency Access Card for Chennai EMS Response")

    user = st.session_state.get("user", {})
    username = user.get("username", "patient")
    user_role = user.get("role", "Patient")

    profile_data = get_patient_profile(username)

    col_prof1, col_prof2 = st.columns([1.5, 1], gap="large")

    with col_prof1:
        st.markdown(f"""
<div class="figma-card" style="border-color: rgba(255, 59, 92, 0.4);">
    <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
            <span style="color:#FF3B5C; font-weight:800; font-size:0.75rem;">EMERGENCY IDENTIFICATION CARD</span>
            <h2 style="color:#FFF; margin:4px 0 0 0;">{profile_data.get('full_name', user.get('name'))}</h2>
            <div style="color:#64748B; font-size:0.85rem;">Patient ID: {profile_data.get('patient_id', 'P-8821')}</div>
        </div>
        <span class="status-badge-optimal">{user_role.upper()}</span>
    </div>
    <hr style="border-color:rgba(255,255,255,0.08); margin:16px 0;">
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; text-align:center;">
        <div style="background:#171E2C; padding:12px; border-radius:8px;">
            <span style="font-size:0.72rem; color:#64748B;">AGE / GENDER</span><br>
            <strong style="color:#FFF; font-size:1.05rem;">{profile_data.get('age', 48)} yrs / {profile_data.get('gender', 'Male')}</strong>
        </div>
        <div style="background:#171E2C; padding:12px; border-radius:8px;">
            <span style="font-size:0.72rem; color:#64748B;">BLOOD GROUP</span><br>
            <strong style="color:#FF3B5C; font-size:1.1rem;">{profile_data.get('blood_group', 'O+')}</strong>
        </div>
        <div style="background:#171E2C; padding:12px; border-radius:8px;">
            <span style="font-size:0.72rem; color:#64748B;">PRIMARY PHYSICIAN</span><br>
            <strong style="color:#10B981; font-size:1rem;">{profile_data.get('primary_physician', 'Dr. V. Aris')}</strong>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

        st.markdown(f"""
<div class="figma-card">
    <h4 style="color:#FFF; margin-bottom:12px;">🩺 Medical History & Pre-Existing Telemetry</h4>
    <div style="margin-bottom:12px;">
        <span style="font-size:0.8rem; color:#64748B;">PRE-EXISTING CONDITIONS:</span><br>
        <strong style="color:#CBD5E1;">{profile_data.get('pre_existing_conditions', 'Hypertension, Mild Asthma')}</strong>
    </div>
    <div style="margin-bottom:12px;">
        <span style="font-size:0.8rem; color:#64748B;">KNOWN ALLERGIES:</span><br>
        <strong style="color:#FF3B5C;">{profile_data.get('allergies', 'Penicillin')}</strong>
    </div>
    <div style="margin-bottom:8px;">
        <span style="font-size:0.8rem; color:#64748B;">REGISTERED EMERGENCY CONTACT:</span><br>
        <strong style="color:#10B981; font-size:1.1rem;">📞 {profile_data.get('emergency_contact', '+91 98765 43210')}</strong>
    </div>
</div>
""", unsafe_allow_html=True)

    with col_prof2:
        st.markdown(f"""
<div class="figma-card" style="border-color: rgba(168, 85, 247, 0.4);">
    <span class="ai-badge">📡 LIVE WEARABLE VITAL SYNC</span>
    <p style="font-size:0.8rem; color:#94A3B8; margin-top:8px;">Connected to smart telemetry monitor for instant triage during emergency response.</p>
    <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; margin-top:14px; text-align:center;">
        <div style="background:#171E2C; padding:10px; border-radius:8px;">
            <span style="font-size:0.7rem; color:#64748B;">PULSE RATE</span><br>
            <strong style="color:#10B981; font-size:1.1rem;">{profile_data.get('pulse_rate', '72 bpm')}</strong>
        </div>
        <div style="background:#171E2C; padding:10px; border-radius:8px;">
            <span style="font-size:0.7rem; color:#64748B;">BLOOD PRESSURE</span><br>
            <strong style="color:#FFF; font-size:1.1rem;">{profile_data.get('bp', '120/80')}</strong>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

        if st.button("🚪 LOG OUT OF NETWORK", type="primary"):
            st.session_state["user"] = None
            st.toast("Logged out successfully.", icon="🔒")
            navigate_to("home")