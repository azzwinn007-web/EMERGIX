import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  Hospital,
  LockKeyhole,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function HospitalLogin({ onLogin, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Invalid hospital ID or password."
        );
        return;
      }

      // Make sure this is actually a hospital account.
      if (
        data.user?.role !== "Hospital Staff"
      ) {
        setError(
          "This account is not authorized for the hospital command center."
        );
        return;
      }

      console.log(
        "Hospital login successful:",
        data.user
      );

      onLogin(data.user);

    } catch (err) {
      console.error(
        "Hospital login error:",
        err
      );

      setError(
        "Unable to connect to EMERGIX server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen hospital-login-screen">

      {/* Background glow */}
      <div className="login-glow hospital-glow"></div>


      {/* Back */}
      <button
        className="back-button"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft size={17} />
        Back
      </button>


      {/* Login card */}
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo hospital-logo">
          <Hospital size={24} />
        </div>


        {/* Heading */}
        <div className="login-heading">

          <span className="login-label">
            HOSPITAL COMMAND
          </span>

          <h1>
            Command center.
          </h1>

          <p>
            Manage emergency capacity and
            coordinate incoming cases.
          </p>

        </div>


        {/* Form */}
        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          {/* Hospital ID */}
          <div className="input-group">

            <label>
              HOSPITAL ID
            </label>

            <div className="input-wrapper">

              <Hospital size={17} />

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                placeholder="Enter hospital ID"
                autoComplete="username"
                required
              />

            </div>

          </div>


          {/* Password */}
          <div className="input-group">

            <label>
              PASSWORD
            </label>

            <div className="input-wrapper">

              <LockKeyhole size={17} />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                style={{
                  flex: 1,
                }}
              />

              {/* Show / hide password */}
              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                style={{
                  background:
                    "transparent",
                  border: "none",
                  padding: "3px",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  cursor: "pointer",
                  color:
                    "rgba(255,255,255,0.5)",
                }}
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>

            </div>

          </div>


          {/* Error */}
          {error && (
            <div
              style={{
                marginBottom: "14px",
                padding: "10px 12px",
                borderRadius: "9px",
                border:
                  "1px solid rgba(239, 68, 68, 0.2)",
                background:
                  "rgba(239, 68, 68, 0.07)",
                color: "#f87171",
                fontSize: "11px",
                lineHeight: "1.5",
              }}
            >
              {error}
            </div>
          )}


          {/* Login */}
          <button
            type="submit"
            className="login-button hospital-login"
            disabled={loading}
          >

            {loading ? (
              "AUTHENTICATING..."
            ) : (
              <>
                <LogIn size={17} />
                Enter Command Center
              </>
            )}

          </button>

        </form>


        {/* Demo credential hint */}
        <div
          style={{
            marginTop: "16px",
            padding: "10px 12px",
            borderRadius: "9px",
            background:
              "rgba(255,255,255,0.03)",
            border:
              "1px solid rgba(255,255,255,0.06)",
            fontSize: "10px",
            lineHeight: "1.6",
            color:
              "rgba(255,255,255,0.55)",
          }}
        >
          <strong
            style={{
              color:
                "rgba(255,255,255,0.75)",
            }}
          >
            Demo access:
          </strong>{" "}
          apollo_chennai / hosp123
        </div>


        {/* Security */}
        <div className="login-security">

          <ShieldCheck size={15} />

          <span>
            Authorized hospital personnel only
          </span>

        </div>

      </div>


      {/* Footer */}
      <div className="login-footer">
        <Activity size={13} />
        EMERGIX • HOSPITAL RESPONSE NETWORK
      </div>

    </div>
  );
}

export default HospitalLogin;