import {
  Activity,
  ArrowRight,
  Hospital,
  ShieldCheck,
  Siren,
  UserRound,
} from "lucide-react";

function PortalSelect({ onSelect }) {
  return (
    <div className="portal-screen">

      {/* Background decoration */}
      <div className="portal-glow portal-glow-one"></div>
      <div className="portal-glow portal-glow-two"></div>

      {/* Header */}
      <header className="portal-header">

        <div className="portal-brand">
          <div className="portal-brand-icon">
            <Activity size={23} />
          </div>

          <div>
            <div className="portal-brand-name">EMERGIX</div>
            <div className="portal-brand-subtitle">
              Emergency Intelligence Network
            </div>
          </div>
        </div>

        <div className="secure-badge">
          <ShieldCheck size={15} />
          Secure Network
        </div>

      </header>

      {/* Main */}
      <main className="portal-main">

        <div className="portal-heading">

          <div className="live-pill">
            <span></span>
            SYSTEM OPERATIONAL
          </div>

          <h1>
            Right Care.
            <br />
            <span>Right Hospital.</span>
          </h1>

          <p>
            Intelligent emergency coordination connecting patients,
            hospitals and emergency response teams in real time.
          </p>

        </div>

        {/* Portal Cards */}
        <div className="portal-cards">

          {/* Patient */}
          <button
            className="portal-card patient-card"
            onClick={() => onSelect("patient")}
          >

            <div className="portal-card-top">

              <div className="portal-card-icon">
                <UserRound size={24} />
              </div>

              <ArrowRight className="portal-arrow" size={20} />

            </div>

            <div className="portal-card-content">

              <span className="portal-card-label">
                FOR PATIENTS
              </span>

              <h2>Patient Portal</h2>

              <p>
                Request emergency assistance, view nearby hospitals,
                and share your medical information with responders.
              </p>

            </div>

            <div className="portal-card-footer">
              <Siren size={15} />
              Emergency assistance
            </div>

          </button>

          {/* Hospital */}
          <button
            className="portal-card hospital-card"
            onClick={() => onSelect("hospital")}
          >

            <div className="portal-card-top">

              <div className="portal-card-icon">
                <Hospital size={24} />
              </div>

              <ArrowRight className="portal-arrow" size={20} />

            </div>

            <div className="portal-card-content">

              <span className="portal-card-label">
                FOR HOSPITALS
              </span>

              <h2>Hospital Command</h2>

              <p>
                Monitor hospital capacity, update emergency resources,
                and coordinate incoming emergency cases.
              </p>

            </div>

            <div className="portal-card-footer">
              <Activity size={15} />
              Live capacity management
            </div>

          </button>

        </div>

        <div className="portal-footer">

          <span>
            EMERGIX RESPONSE NETWORK
          </span>

          <span className="footer-separator">•</span>

          <span>
            Real-time emergency coordination
          </span>

        </div>

      </main>

    </div>
  );
}

export default PortalSelect;