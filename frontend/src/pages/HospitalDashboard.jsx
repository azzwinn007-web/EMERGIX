import { useEffect, useState } from "react";
import {
  Hospital,
  Activity,
  Bed,
  Ambulance,
  Wind,
  Clock,
  Save,
  CheckCircle,
  AlertTriangle,
  Bell,
  RefreshCw,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function HospitalDashboard({ user }) {
  const [hospital, setHospital] = useState(null);
  const [form, setForm] = useState(null);

  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadHospital();
  }, [user]);

  useEffect(() => {
    if (!hospital?.id) return;

    loadAlerts(hospital.id);

    const interval = setInterval(() => {
      loadAlerts(hospital.id);
    }, 10000);

    return () => clearInterval(interval);
  }, [hospital?.id]);

  async function loadHospital() {
    try {
      setError("");

      const username =
        user?.username ||
        user?.hosp_username ||
        user?.user?.username ||
        "apollo_chennai";

      const response = await fetch(
        `${API_URL}/api/hospitals/staff/${username}`
      );

      if (!response.ok) {
        throw new Error("Hospital API unavailable");
      }

      const data = await response.json();

      if (!data.success || !data.hospital) {
        setError(
          data.message || "Hospital profile not found."
        );
        return;
      }

      setHospital(data.hospital);
      setForm(data.hospital);
    } catch (err) {
      console.error("Hospital loading error:", err);
      setError(
        "Unable to connect to EMERGIX server."
      );
    }
  }

  async function loadAlerts(hospitalId) {
    try {
      setAlertsLoading(true);

      const response = await fetch(
        `${API_URL}/api/alerts?hospital_id=${hospitalId}`
      );

      if (!response.ok) {
        throw new Error("Alerts API unavailable");
      }

      const data = await response.json();

      if (
        data.success &&
        Array.isArray(data.alerts)
      ) {
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error("Alert loading error:", err);
    } finally {
      setAlertsLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  }

  async function saveTelemetry() {
    if (!form) return;

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/hospitals/${form.id}/telemetry`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            icu_free: Number(form.icu_free),
            beds_free: Number(form.beds_free),
            ventilator_free: Number(
              form.ventilator_free
            ),
            ambulances_free: Number(
              form.ambulances_free
            ),
            er_wait_min: Number(
              form.er_wait_min
            ),
            status: form.status,
            oxygen_pct: Number(
              form.oxygen_pct
            ),
            blood_status: form.blood_status,
            ct_scanner_active: Number(
              form.ct_scanner_active
            ),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Telemetry API unavailable"
        );
      }

      const data = await response.json();

      if (!data.success) {
        setError(
          data.message ||
            "Unable to save telemetry."
        );
        return;
      }

      setHospital(data.hospital);
      setForm(data.hospital);
      setSaved(true);

      if (data.hospital?.id) {
        loadAlerts(data.hospital.id);
      }
    } catch (err) {
      console.error(
        "Telemetry save error:",
        err
      );

      setError(
        "Unable to connect to EMERGIX server."
      );
    } finally {
      setSaving(false);
    }
  }

  if (error && !form) {
    return (
      <div className="placeholder-page">
        <Hospital size={42} />

        <h3>
          Hospital Command Center
        </h3>

        <p>{error}</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="placeholder-page">
        <Activity size={42} />

        <h3>
          Loading Hospital Command...
        </h3>

        <p>
          Connecting to live hospital
          telemetry...
        </p>
      </div>
    );
  }

  const emergencyAlerts = alerts.filter(
    (alert) =>
      alert.severity === "Critical" ||
      alert.severity === "Warning"
  );

  return (
    <div className="hospital-command">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="command-header">

        <div>
          <span className="section-label">
            HOSPITAL COMMAND CENTER
          </span>

          <h1>{form.name}</h1>

          <p>{form.area}</p>
        </div>

        <div className="command-live">
          <span></span>
          LIVE TELEMETRY
        </div>

      </div>


      {/* =================================================
          HOSPITAL-SPECIFIC EMERGENCY INTAKE
      ================================================= */}

      <div
        style={{
          marginBottom: "24px",
          padding: "18px",
          borderRadius: "16px",
          border:
            "1px solid rgba(239,68,68,0.16)",
          background:
            "rgba(239,68,68,0.035)",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "14px",
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >

            <Bell size={18} />

            <div>

              <span className="section-label">
                EMERGENCY INTAKE
              </span>

              <h3
                style={{
                  margin:
                    "4px 0 0",
                }}
              >
                Incoming alerts for {form.name}
              </h3>

            </div>

          </div>


          <button
            type="button"
            onClick={() =>
              loadAlerts(form.id)
            }
            disabled={alertsLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 10px",
              borderRadius: "8px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              background:
                "rgba(255,255,255,0.03)",
              color: "inherit",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            <RefreshCw size={13} />
            Refresh
          </button>

        </div>


        {alertsLoading ? (

          <p
            style={{
              fontSize: "12px",
              opacity: 0.65,
            }}
          >
            Loading emergency alerts...
          </p>

        ) : emergencyAlerts.length === 0 ? (

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px",
              borderRadius: "10px",
              background:
                "rgba(255,255,255,0.025)",
              fontSize: "12px",
              opacity: 0.7,
            }}
          >
            <CheckCircle size={16} />
            No active emergency alerts for this hospital.
          </div>

        ) : (

          <div
            style={{
              display: "grid",
              gap: "10px",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >

            {emergencyAlerts
              .slice(0, 10)
              .map((alert) => {

                const isCritical =
                  alert.severity === "Critical";

                return (
                  <div
                    key={alert.id}
                    style={{
                      padding: "14px",
                      borderRadius: "12px",
                      border:
                        isCritical
                          ? "1px solid rgba(239,68,68,0.28)"
                          : "1px solid rgba(245,158,11,0.2)",
                      background:
                        isCritical
                          ? "rgba(239,68,68,0.065)"
                          : "rgba(245,158,11,0.055)",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: "10px",
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          gap: "9px",
                        }}
                      >

                        <AlertTriangle
                          size={17}
                        />

                        <div>

                          <strong
                            style={{
                              fontSize:
                                "13px",
                            }}
                          >
                            {alert.title}
                          </strong>

                          <div
                            style={{
                              marginTop:
                                "4px",
                              fontSize:
                                "10px",
                              opacity:
                                0.6,
                            }}
                          >
                            {alert.source}
                          </div>

                        </div>

                      </div>


                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          letterSpacing:
                            "0.08em",
                          padding: "5px 7px",
                          borderRadius:
                            "999px",
                          background:
                            isCritical
                              ? "rgba(239,68,68,0.14)"
                              : "rgba(245,158,11,0.12)",
                        }}
                      >
                        {alert.severity.toUpperCase()}
                      </span>

                    </div>


                    <p
                      style={{
                        margin:
                          "10px 0 6px",
                        fontSize:
                          "11px",
                        lineHeight:
                          1.55,
                      }}
                    >
                      {alert.message}
                    </p>


                    <span
                      style={{
                        fontSize: "10px",
                        opacity: 0.5,
                      }}
                    >
                      {alert.timestamp}
                    </span>

                  </div>
                );
              })}

          </div>
        )}

      </div>


      {/* =================================================
          TELEMETRY
      ================================================= */}

      <div className="telemetry-grid">

        <div className="telemetry-card">

          <Bed size={22} />

          <span>ICU BEDS</span>

          <input
            type="number"
            min="0"
            value={form.icu_free}
            onChange={(e) =>
              updateField(
                "icu_free",
                e.target.value
              )
            }
          />

          <small>
            of {form.icu_total} total
          </small>

        </div>


        <div className="telemetry-card">

          <Hospital size={22} />

          <span>
            EMERGENCY BEDS
          </span>

          <input
            type="number"
            min="0"
            value={form.beds_free}
            onChange={(e) =>
              updateField(
                "beds_free",
                e.target.value
              )
            }
          />

          <small>
            of {form.beds_total} total
          </small>

        </div>


        <div className="telemetry-card">

          <Wind size={22} />

          <span>
            VENTILATORS
          </span>

          <input
            type="number"
            min="0"
            value={form.ventilator_free}
            onChange={(e) =>
              updateField(
                "ventilator_free",
                e.target.value
              )
            }
          />

        </div>


        <div className="telemetry-card">

          <Ambulance size={22} />

          <span>
            AMBULANCES
          </span>

          <input
            type="number"
            min="0"
            value={form.ambulances_free}
            onChange={(e) =>
              updateField(
                "ambulances_free",
                e.target.value
              )
            }
          />

        </div>


        <div className="telemetry-card">

          <Clock size={22} />

          <span>
            ER WAIT TIME
          </span>

          <input
            type="number"
            min="0"
            value={form.er_wait_min}
            onChange={(e) =>
              updateField(
                "er_wait_min",
                e.target.value
              )
            }
          />

          <small>
            minutes
          </small>

        </div>


        <div className="telemetry-card">

          <Activity size={22} />

          <span>
            OXYGEN
          </span>

          <input
            type="number"
            min="0"
            max="100"
            value={form.oxygen_pct}
            onChange={(e) =>
              updateField(
                "oxygen_pct",
                e.target.value
              )
            }
          />

          <small>
            percent
          </small>

        </div>

      </div>


      {/* =================================================
          COMMAND PANEL
      ================================================= */}

      <div className="command-panel">

        <div>

          <span className="section-label">
            HOSPITAL STATUS
          </span>

          <h3>
            Emergency acceptance status
          </h3>

          <select
            value={form.status}
            onChange={(e) =>
              updateField(
                "status",
                e.target.value
              )
            }
          >

            <option value="🟢 Accepting All Patients">
              🟢 Accepting All Patients
            </option>

            <option value="🟡 High Capacity — Critical Only">
              🟡 High Capacity — Critical Only
            </option>

            <option value="🔴 Not Accepting Patients">
              🔴 Not Accepting Patients
            </option>

          </select>

        </div>


        <div>

          <span className="section-label">
            BLOOD SUPPLY
          </span>

          <h3>
            Current blood availability
          </h3>

          <select
            value={form.blood_status}
            onChange={(e) =>
              updateField(
                "blood_status",
                e.target.value
              )
            }
          >

            <option value="Optimal">
              Optimal
            </option>

            <option value="Limited">
              Limited
            </option>

            <option value="Critical">
              Critical
            </option>

          </select>

        </div>


        <div>

          <span className="section-label">
            CT SCANNER
          </span>

          <h3>
            Scanner availability
          </h3>

          <select
            value={
              form.ct_scanner_active
            }
            onChange={(e) =>
              updateField(
                "ct_scanner_active",
                Number(
                  e.target.value
                )
              )
            }
          >

            <option value={1}>
              Active
            </option>

            <option value={0}>
              Offline
            </option>

          </select>

        </div>

      </div>


      {/* =================================================
          SAVE
      ================================================= */}

      <button
        className="save-telemetry"
        onClick={saveTelemetry}
        disabled={saving}
      >

        {saved ? (
          <>
            <CheckCircle size={18} />
            Telemetry Saved
          </>
        ) : (
          <>
            <Save size={18} />

            {saving
              ? "Saving..."
              : "Save Live Telemetry"}
          </>
        )}

      </button>

    </div>
  );
}