import { useEffect, useState } from "react";

import {
  Hospital,
  Bed,
  Ambulance,
  Wind,
  Clock,
  MapPin,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHospitals();
  }, []);

  async function loadHospitals() {
    try {
      setError("");

      const response = await fetch(`${API_URL}/api/hospitals`);

      if (!response.ok) {
        throw new Error("Hospital API unavailable");
      }

      const data = await response.json();

      if (data.success) {
        setHospitals(data.hospitals || []);
      } else {
        setError(data.message || "Unable to load hospitals.");
      }
    } catch (err) {
      console.error("Hospital loading error:", err);
      setError(
        "Unable to connect to EMERGIX hospital network. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    loadHospitals();
  }

  function getStatusClass(status) {
    if (status?.includes("🟢")) {
      return "hospital-status accepting";
    }

    if (status?.includes("🟡")) {
      return "hospital-status limited";
    }

    if (status?.includes("🔴")) {
      return "hospital-status critical";
    }

    return "hospital-status";
  }

  if (loading) {
    return (
      <div className="hospital-loading">
        <Activity size={34} />

        <h3>Loading Hospital Network</h3>

        <p>
          Connecting to live Chennai emergency telemetry...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hospital-error">

        <AlertTriangle size={40} />

        <h3>Hospital Network Offline</h3>

        <p>{error}</p>

        <button
          className="hospital-refresh-button"
          onClick={handleRefresh}
        >
          <RefreshCw size={16} />
          Try Again
        </button>

      </div>
    );
  }

  return (
    <div className="hospitals-page">

      {/* HEADER */}
      <div className="hospitals-header">

        <div>
          <span className="section-label">
            LIVE HOSPITAL NETWORK
          </span>

          <h1>
            Emergency-Ready Hospitals
          </h1>

          <p>
            Real-time hospital capacity and emergency
            readiness across Chennai.
          </p>
        </div>

        <div className="hospitals-header-right">

          <div className="network-status">
            <span></span>
            LIVE
          </div>

          <button
            className="hospital-refresh-button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={refreshing ? "spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

        </div>

      </div>


      {/* SUMMARY */}
      <div className="hospital-summary">

        <div className="hospital-summary-card">
          <Hospital size={19} />

          <div>
            <span>HOSPITALS</span>
            <strong>{hospitals.length}</strong>
          </div>
        </div>

        <div className="hospital-summary-card">
          <Bed size={19} />

          <div>
            <span>ICU AVAILABLE</span>

            <strong>
              {hospitals.reduce(
                (total, hospital) =>
                  total + Number(hospital.icu_free || 0),
                0
              )}
            </strong>
          </div>
        </div>

        <div className="hospital-summary-card">
          <Ambulance size={19} />

          <div>
            <span>AMBULANCES</span>

            <strong>
              {hospitals.reduce(
                (total, hospital) =>
                  total +
                  Number(hospital.ambulances_free || 0),
                0
              )}
            </strong>
          </div>
        </div>

        <div className="hospital-summary-card">
          <Activity size={19} />

          <div>
            <span>NETWORK STATUS</span>

            <strong className="online-text">
              ONLINE
            </strong>
          </div>
        </div>

      </div>


      {/* HOSPITAL CARDS */}
      <div className="hospitals-grid">

        {hospitals.map((hospital) => (

          <div
            className="hospital-card"
            key={hospital.id}
          >

            {/* CARD HEADER */}
            <div className="hospital-card-header">

              <div className="hospital-main-icon">
                <Hospital size={22} />
              </div>

              <div className="hospital-name">

                <h3>
                  {hospital.name}
                </h3>

                <p>
                  <MapPin size={12} />
                  {hospital.area}
                </p>

              </div>

            </div>


            {/* STATUS */}
            <div className={getStatusClass(hospital.status)}>
              {hospital.status}
            </div>


            {/* CAPACITY */}
            <div className="hospital-capacity-grid">

              <div className="capacity-item">

                <Bed size={17} />

                <span>ICU</span>

                <strong>
                  {hospital.icu_free}
                </strong>

                <small>
                  / {hospital.icu_total} free
                </small>

              </div>


              <div className="capacity-item">

                <Hospital size={17} />

                <span>ER BEDS</span>

                <strong>
                  {hospital.beds_free}
                </strong>

                <small>
                  / {hospital.beds_total} free
                </small>

              </div>


              <div className="capacity-item">

                <Wind size={17} />

                <span>VENTILATORS</span>

                <strong>
                  {hospital.ventilator_free}
                </strong>

                <small>
                  available
                </small>

              </div>


              <div className="capacity-item">

                <Ambulance size={17} />

                <span>AMBULANCES</span>

                <strong>
                  {hospital.ambulances_free}
                </strong>

                <small>
                  available
                </small>

              </div>


              <div className="capacity-item">

                <Clock size={17} />

                <span>ER WAIT</span>

                <strong>
                  {hospital.er_wait_min}
                </strong>

                <small>
                  minutes
                </small>

              </div>

            </div>


            {/* ADDITIONAL STATUS */}
            <div className="hospital-details">

              <div>
                <span>Oxygen</span>

                <strong>
                  {hospital.oxygen_pct}%
                </strong>
              </div>

              <div>
                <span>Blood Supply</span>

                <strong>
                  {hospital.blood_status}
                </strong>
              </div>

              <div>
                <span>CT Scanner</span>

                <strong>
                  {Number(hospital.ct_scanner_active) === 1
                    ? "Active"
                    : "Offline"}
                </strong>
              </div>

            </div>


            {/* READY INDICATOR */}
            <div className="hospital-ready">

              {hospital.status?.includes("🔴") ? (
                <>
                  <AlertTriangle size={14} />
                  Emergency intake restricted
                </>
              ) : hospital.status?.includes("🟡") ? (
                <>
                  <AlertTriangle size={14} />
                  Critical cases prioritized
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  Emergency intake available
                </>
              )}

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}