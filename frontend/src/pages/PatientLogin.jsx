import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  LockKeyhole,
  UserRound,
  ShieldCheck,
  UserPlus,
  Phone,
  CalendarDays,
  Droplets,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const selectStyle = {
  flex: 1,
  background: "#0b1118",
  border: "none",
  outline: "none",
  color: "#e6f7ff",
  fontSize: "12px",
  width: "100%",
};

const optionStyle = {
  background: "#0b1118",
  color: "#e6f7ff",
};

export default function PatientLogin({ onLogin, onBack }) {
  const [mode, setMode] = useState("login");

  // Login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registration
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [emergencyContactName, setEmergencyContactName] =
    useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] =
    useState("");
  const [conditions, setConditions] = useState("");
  const [allergies, setAllergies] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
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
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Invalid username or password."
        );
        return;
      }

      console.log(
        "Patient login successful:",
        data.user
      );

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

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
            full_name: fullName.trim(),
            age: age ? Number(age) : null,
            gender: gender || null,
            blood_group: bloodGroup || null,
            emergency_contact_name:
              emergencyContactName.trim() || null,
            emergency_contact_phone:
              emergencyContactPhone.trim() || null,
            pre_existing_conditions:
              conditions.trim() || null,
            allergies:
              allergies.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to create your account."
        );
        return;
      }

      setSuccess(
        "Account created successfully. Signing you in..."
      );

      if (data.user) {
        setTimeout(() => {
          onLogin(data.user);
        }, 600);
      } else {
        setMode("login");
        setPassword("");
      }
    } catch (err) {
      console.error(
        "Registration error:",
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
    <div className="login-screen">

      <div className="login-glow"></div>

      <button
        className="back-button"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div
        className="login-card"
        style={{
          maxWidth:
            mode === "register"
              ? "620px"
              : undefined,
        }}
      >

        {/* LOGO */}

        <div className="login-logo">
          <Activity size={25} />
        </div>


        {/* HEADING */}

        <div className="login-heading">

          <div className="login-label">
            PATIENT PORTAL
          </div>

          <h1>
            {mode === "login"
              ? "Patient Login"
              : "Create Patient Account"}
          </h1>

          <p>
            {mode === "login"
              ? "Access your EMERGIX emergency profile and medical information."
              : "Create your EMERGIX profile so your emergency information is ready when needed."}
          </p>

        </div>


        {/* MODE SWITCH */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "8px",
            marginBottom: "22px",
          }}
        >

          <button
            type="button"
            onClick={() =>
              switchMode("login")
            }
            style={{
              padding: "10px 12px",
              borderRadius: "9px",
              border:
                mode === "login"
                  ? "1px solid rgba(0, 210, 255, 0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
              background:
                mode === "login"
                  ? "rgba(0, 210, 255, 0.08)"
                  : "transparent",
              color:
                mode === "login"
                  ? "#7dd3fc"
                  : "rgba(255,255,255,0.6)",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Sign In
          </button>


          <button
            type="button"
            onClick={() =>
              switchMode("register")
            }
            style={{
              padding: "10px 12px",
              borderRadius: "9px",
              border:
                mode === "register"
                  ? "1px solid rgba(0, 210, 255, 0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
              background:
                mode === "register"
                  ? "rgba(0, 210, 255, 0.08)"
                  : "transparent",
              color:
                mode === "register"
                  ? "#7dd3fc"
                  : "rgba(255,255,255,0.6)",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Create Account
          </button>

        </div>


        {/* =====================================================
            LOGIN
        ===================================================== */}

        {mode === "login" ? (

          <form
            className="login-form"
            onSubmit={handleLogin}
          >

            {/* USERNAME */}

            <div className="input-group">

              <label>
                USERNAME
              </label>

              <div className="input-wrapper">

                <UserRound size={17} />

                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value
                    )
                  }
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}

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


            {/* ERROR */}

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


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-button patient-login"
              disabled={loading}
            >
              {loading
                ? "AUTHENTICATING..."
                : "Sign In"}
            </button>

          </form>

        ) : (

          /* =====================================================
             REGISTRATION
          ===================================================== */

          <form
            className="login-form"
            onSubmit={handleRegister}
          >

            {/* ACCOUNT DETAILS */}

            <div
              style={{
                fontSize: "10px",
                letterSpacing: "0.12em",
                color: "#22d3ee",
                marginBottom: "12px",
                fontWeight: 600,
              }}
            >
              ACCOUNT DETAILS
            </div>


            {/* USERNAME */}

            <div className="input-group">

              <label>
                USERNAME
              </label>

              <div className="input-wrapper">

                <UserRound size={17} />

                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value
                    )
                  }
                  placeholder="Choose a username"
                  autoComplete="username"
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}

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
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  style={{
                    flex: 1,
                  }}
                />

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


            {/* FULL NAME */}

            <div className="input-group">

              <label>
                FULL NAME
              </label>

              <div className="input-wrapper">

                <UserRound size={17} />

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(
                      e.target.value
                    )
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />

              </div>

            </div>


            {/* AGE + GENDER */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "12px",
              }}
            >

              {/* AGE */}

              <div className="input-group">

                <label>
                  AGE
                </label>

                <div className="input-wrapper">

                  <CalendarDays
                    size={17}
                  />

                  <input
                    type="number"
                    value={age}
                    onChange={(e) =>
                      setAge(
                        e.target.value
                      )
                    }
                    placeholder="Age"
                    min="0"
                    max="120"
                  />

                </div>

              </div>


              {/* GENDER */}

              <div className="input-group">

                <label>
                  GENDER
                </label>

                <div className="input-wrapper">

                  <UserRound
                    size={17}
                  />

                  <select
                    value={gender}
                    onChange={(e) =>
                      setGender(
                        e.target.value
                      )
                    }
                    style={selectStyle}
                  >

                    <option
                      value=""
                      style={
                        optionStyle
                      }
                    >
                      Select
                    </option>

                    <option
                      value="Male"
                      style={
                        optionStyle
                      }
                    >
                      Male
                    </option>

                    <option
                      value="Female"
                      style={
                        optionStyle
                      }
                    >
                      Female
                    </option>

                    <option
                      value="Other"
                      style={
                        optionStyle
                      }
                    >
                      Other
                    </option>

                  </select>

                </div>

              </div>

            </div>


            {/* BLOOD GROUP */}

            <div className="input-group">

              <label>
                BLOOD GROUP
              </label>

              <div className="input-wrapper">

                <Droplets size={17} />

                <select
                  value={bloodGroup}
                  onChange={(e) =>
                    setBloodGroup(
                      e.target.value
                    )
                  }
                  style={selectStyle}
                >

                  <option
                    value=""
                    style={optionStyle}
                  >
                    Select blood group
                  </option>

                  <option
                    value="A+"
                    style={optionStyle}
                  >
                    A+
                  </option>

                  <option
                    value="A-"
                    style={optionStyle}
                  >
                    A-
                  </option>

                  <option
                    value="B+"
                    style={optionStyle}
                  >
                    B+
                  </option>

                  <option
                    value="B-"
                    style={optionStyle}
                  >
                    B-
                  </option>

                  <option
                    value="AB+"
                    style={optionStyle}
                  >
                    AB+
                  </option>

                  <option
                    value="AB-"
                    style={optionStyle}
                  >
                    AB-
                  </option>

                  <option
                    value="O+"
                    style={optionStyle}
                  >
                    O+
                  </option>

                  <option
                    value="O-"
                    style={optionStyle}
                  >
                    O-
                  </option>

                </select>

              </div>

            </div>


            {/* EMERGENCY CONTACT */}

            <div
              style={{
                fontSize: "10px",
                letterSpacing: "0.12em",
                color: "#22d3ee",
                margin:
                  "8px 0 12px",
                fontWeight: 600,
              }}
            >
              EMERGENCY CONTACT
            </div>


            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "12px",
              }}
            >

              <div className="input-group">

                <label>
                  CONTACT NAME
                </label>

                <div className="input-wrapper">

                  <UserRound
                    size={17}
                  />

                  <input
                    type="text"
                    value={
                      emergencyContactName
                    }
                    onChange={(e) =>
                      setEmergencyContactName(
                        e.target.value
                      )
                    }
                    placeholder="Contact name"
                  />

                </div>

              </div>


              <div className="input-group">

                <label>
                  PHONE
                </label>

                <div className="input-wrapper">

                  <Phone size={17} />

                  <input
                    type="tel"
                    value={
                      emergencyContactPhone
                    }
                    onChange={(e) =>
                      setEmergencyContactPhone(
                        e.target.value
                      )
                    }
                    placeholder="Phone number"
                  />

                </div>

              </div>

            </div>


            {/* MEDICAL INFORMATION */}

            <div
              style={{
                fontSize: "10px",
                letterSpacing: "0.12em",
                color: "#22d3ee",
                margin:
                  "8px 0 12px",
                fontWeight: 600,
              }}
            >
              MEDICAL INFORMATION
            </div>


            <div className="input-group">

              <label>
                EXISTING CONDITIONS
              </label>

              <div className="input-wrapper">

                <Activity size={17} />

                <input
                  type="text"
                  value={conditions}
                  onChange={(e) =>
                    setConditions(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Asthma, diabetes"
                />

              </div>

            </div>


            <div className="input-group">

              <label>
                ALLERGIES
              </label>

              <div className="input-wrapper">

                <Activity size={17} />

                <input
                  type="text"
                  value={allergies}
                  onChange={(e) =>
                    setAllergies(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Penicillin, peanuts"
                />

              </div>

            </div>


            {/* ERROR */}

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


            {/* SUCCESS */}

            {success && (
              <div
                style={{
                  marginBottom: "14px",
                  padding: "10px 12px",
                  borderRadius: "9px",
                  border:
                    "1px solid rgba(34, 197, 94, 0.25)",
                  background:
                    "rgba(34, 197, 94, 0.08)",
                  color: "#4ade80",
                  fontSize: "11px",
                  lineHeight: "1.5",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2
                  size={15}
                />

                {success}

              </div>
            )}


            {/* REGISTER */}

            <button
              type="submit"
              className="login-button patient-login"
              disabled={loading}
            >

              {loading ? (
                "CREATING ACCOUNT..."
              ) : (
                <>
                  <UserPlus size={17} />
                  Create Patient Account
                </>
              )}

            </button>

          </form>

        )}


        {/* SECURITY */}

        <div className="login-security">

          <ShieldCheck size={14} />

          <span>
            Secure EMERGIX authentication
          </span>

        </div>

      </div>


      {/* FOOTER */}

      <div className="login-footer">
        EMERGIX • EMERGENCY INTELLIGENCE NETWORK
      </div>

    </div>
  );
}