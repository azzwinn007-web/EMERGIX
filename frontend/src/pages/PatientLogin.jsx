import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  LockKeyhole,
  UserRound,
  ShieldCheck,
} from "lucide-react";

const API_URL = "http://localhost:8000";

export default function PatientLogin({ onLogin, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Invalid username or password.");
        return;
      }

      console.log("Patient login successful:", data.user);

      onLogin(data.user);

    } catch (err) {
      console.error("Login error:", err);
      setError(
        "Unable to connect to EMERGIX server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">

      {/* Background glow */}
      <div className="login-glow"></div>

      {/* Back button */}
      <button
        className="back-button"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Login card */}
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <Activity size={25} />
        </div>

        {/* Heading */}
        <div className="login-heading">

          <div className="login-label">
            PATIENT PORTAL
          </div>

          <h1>Patient Login</h1>

          <p>
            Access your EMERGIX emergency profile
            and medical information.
          </p>

        </div>

        {/* Form */}
        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          {/* Username */}
          <div className="input-group">

            <label>USERNAME</label>

            <div className="input-wrapper">

              <UserRound size={17} />

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />

            </div>

          </div>

          {/* Password */}
          <div className="input-group">

            <label>PASSWORD</label>

            <div className="input-wrapper">

              <LockKeyhole size={17} />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

            </div>

          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginBottom: "14px",
                padding: "10px 12px",
                borderRadius: "9px",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                background: "rgba(239, 68, 68, 0.07)",
                color: "#f87171",
                fontSize: "11px",
                lineHeight: "1.5",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="login-button patient-login"
            disabled={loading}
          >
            {loading ? "AUTHENTICATING..." : "Sign In"}
          </button>

        </form>

        {/* Security */}
        <div className="login-security">

          <ShieldCheck size={14} />

          <span>
            Secure EMERGIX authentication
          </span>

        </div>

      </div>

      {/* Footer */}
      <div className="login-footer">
        EMERGIX • EMERGENCY INTELLIGENCE NETWORK
      </div>

    </div>
  );
}