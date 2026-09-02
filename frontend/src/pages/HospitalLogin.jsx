import {
  Activity,
  ArrowLeft,
  Hospital,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

function HospitalLogin({ onLogin, onBack }) {
  return (
    <div className="login-screen hospital-login-screen">

      <div className="login-glow hospital-glow"></div>

      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={17} />
        Back
      </button>

      <div className="login-card">

        <div className="login-logo hospital-logo">
          <Hospital size={24} />
        </div>

        <div className="login-heading">
          <span className="login-label">HOSPITAL COMMAND</span>

          <h1>Command center.</h1>

          <p>
            Manage emergency capacity and coordinate incoming cases.
          </p>
        </div>

        <div className="login-form">

          <div className="input-group">
            <label>HOSPITAL ID</label>

            <div className="input-wrapper">
              <Hospital size={17} />

              <input
                type="text"
                placeholder="Enter hospital ID"
              />
            </div>
          </div>

          <div className="input-group">
            <label>PASSWORD</label>

            <div className="input-wrapper">
              <LockKeyhole size={17} />

              <input
                type="password"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button className="login-button hospital-login" onClick={onLogin}>
            Enter Command Center
          </button>

        </div>

        <div className="login-security">
          <ShieldCheck size={15} />

          <span>
            Authorized hospital personnel only
          </span>
        </div>

      </div>

      <div className="login-footer">
        EMERGIX • HOSPITAL RESPONSE NETWORK
      </div>

    </div>
  );
}

export default HospitalLogin;