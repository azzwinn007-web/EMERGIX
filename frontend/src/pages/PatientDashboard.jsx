import {
  Siren,
  Hospital,
  UserRound,
  ArrowRight,
  Activity,
  ShieldCheck,
} from "lucide-react";

import LiveMap from "../components/LiveMap";

export default function PatientDashboard({ user, onNavigate }) {
  return (
    <div className="dashboard-page">

      {/* HERO */}
      <div className="dashboard-hero">
        <div>
          <div className="dashboard-label">
            PATIENT COMMAND CENTER
          </div>

          <h1>
            Good to have you here
            {user?.name ? `, ${user.name}` : ""}.
          </h1>

          <p>
            Emergency intelligence, hospital availability,
            and medical support — all in one place.
          </p>
        </div>

        <div className="dashboard-security">
          <ShieldCheck size={16} />
          Profile secured
        </div>
      </div>


      {/* QUICK ACTIONS */}
      <div className="dashboard-actions">

        {/* EMERGENCY */}
        <button
          className="action-card emergency-action"
          onClick={() => onNavigate("emergency")}
        >
          <div className="action-icon">
            <Siren size={22} />
          </div>

          <div className="action-content">
            <span className="action-label">
              EMERGENCY
            </span>

            <h3>Request Emergency Help</h3>

            <p>
              Start an emergency assessment and
              find the most suitable hospital.
            </p>
          </div>

          <ArrowRight className="action-arrow" size={18} />
        </button>


        {/* HOSPITALS */}
        <button
          className="action-card hospital-action"
          onClick={() => onNavigate("hospitals")}
        >
          <div className="action-icon">
            <Hospital size={22} />
          </div>

          <div className="action-content">
            <span className="action-label">
              HOSPITAL NETWORK
            </span>

            <h3>Find Nearby Hospitals</h3>

            <p>
              View hospitals, availability,
              distance, and emergency readiness.
            </p>
          </div>

          <ArrowRight className="action-arrow" size={18} />
        </button>


        {/* PROFILE */}
        <button
          className="action-card profile-action"
          onClick={() => onNavigate("profile")}
        >
          <div className="action-icon">
            <UserRound size={22} />
          </div>

          <div className="action-content">
            <span className="action-label">
              MEDICAL PROFILE
            </span>

            <h3>View Medical Profile</h3>

            <p>
              Access your emergency medical
              information and health records.
            </p>
          </div>

          <ArrowRight className="action-arrow" size={18} />
        </button>

      </div>


      {/* LIVE NETWORK */}
      <div className="network-section">

        <div className="section-heading">
          <div>
            <div className="section-label">
              LIVE NETWORK
            </div>

            <h2>Emergency Response Network</h2>

            <p>
              Real-time location, hospitals,
              availability, and road routes.
            </p>
          </div>

          <div className="network-status">
            <span></span>
            Live
          </div>
        </div>


        {/* REAL LIVE MAP */}
        <LiveMap />

      </div>


      {/* SYSTEM INFORMATION */}
      <div className="dashboard-footer">

        <div>
          <Activity size={15} />
          EMERGIX intelligence network
        </div>

        <span>
          Live hospital locations and road routes enabled
        </span>

      </div>

    </div>
  );
}