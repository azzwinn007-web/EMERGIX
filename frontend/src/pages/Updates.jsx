import { useEffect, useState } from "react";

import {
  Radio,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Activity,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Updates() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      setError("");

      const response = await fetch(`${API_URL}/api/alerts`);

      if (!response.ok) {
        throw new Error("Alerts API unavailable");
      }

      const data = await response.json();

      if (data.success) {
        setAlerts(data.alerts || []);
      } else {
        setError(data.message || "Unable to load live updates.");
      }
    } catch (err) {
      console.error("Alerts loading error:", err);
      setError(
        "Unable to connect to the EMERGIX live update network."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function refreshAlerts() {
    setRefreshing(true);
    loadAlerts();
  }

  function getAlertIcon(severity) {
    if (severity === "Critical") {
      return <AlertTriangle size={20} />;
    }

    if (severity === "Warning") {
      return <AlertTriangle size={20} />;
    }

    return <CheckCircle size={20} />;
  }

  function getAlertClass(severity) {
    if (severity === "Critical") {
      return "update-card critical";
    }

    if (severity === "Warning") {
      return "update-card warning";
    }

    return "update-card normal";
  }

  if (loading) {
    return (
      <div className="updates-loading">
        <Activity size={36} />

        <h3>Loading Live Updates</h3>

        <p>
          Connecting to the EMERGIX emergency network...
        </p>
      </div>
    );
  }

  return (
    <div className="updates-page">

      {/* HEADER */}
      <div className="updates-header">

        <div>
          <span className="section-label">
            EMERGENCY NETWORK
          </span>

          <h1>Live Updates</h1>

          <p>
            Real-time emergency alerts and healthcare
            network intelligence.
          </p>
        </div>

        <div className="updates-header-actions">

          <div className="network-status">
            <span></span>
            LIVE
          </div>

          <button
            className="updates-refresh"
            onClick={refreshAlerts}
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


      {/* NETWORK BAR */}
      <div className="updates-network-bar">

        <div>
          <Radio size={19} />

          <div>
            <strong>
              EMERGIX Emergency Intelligence Network
            </strong>

            <span>
              Monitoring emergency events across Chennai
            </span>
          </div>
        </div>

        <span className="updates-count">
          {alerts.length} ACTIVE UPDATES
        </span>

      </div>


      {/* ERROR */}
      {error && (
        <div className="updates-error">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}


      {/* ALERTS */}
      <div className="updates-list">

        {alerts.length === 0 ? (
          <div className="updates-empty">
            <CheckCircle size={36} />

            <h3>No Active Alerts</h3>

            <p>
              The emergency network is currently stable.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={getAlertClass(alert.severity)}
            >

              <div className="update-icon">
                {getAlertIcon(alert.severity)}
              </div>

              <div className="update-content">

                <div className="update-top">

                  <span className="update-severity">
                    {alert.severity}
                  </span>

                  <span className="update-time">
                    <Clock size={12} />
                    {alert.timestamp}
                  </span>

                </div>

                <h3>
                  {alert.title}
                </h3>

                <p>
                  {alert.message}
                </p>

                <span className="update-source">
                  SOURCE: {alert.source}
                </span>

              </div>

            </div>
          ))
        )}

      </div>

    </div>
  );
}