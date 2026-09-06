import { useState } from "react";
import {
  Siren,
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function EmergencyAssessment({ user }) {
  const [symptoms, setSymptoms] = useState("");
  const [severity, setSeverity] = useState("");
  const [conscious, setConscious] = useState("");
  const [breathing, setBreathing] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [result, setResult] = useState(null);

  const resetAssessment = () => {
    setSubmitted(false);
    setLoading(false);
    setError("");
    setResult(null);

    setSymptoms("");
    setSeverity("");
    setConscious("");
    setBreathing("");
  };

  const buildSymptomDescription = () => {
    return `
Patient reported symptoms:
${symptoms}

Patient-selected severity:
${severity || "Not specified"}

Consciousness:
${conscious === "conscious"
        ? "Patient is conscious"
        : conscious === "unconscious"
          ? "Patient is unconscious"
          : "Not specified"}

Breathing:
${breathing === "normal"
        ? "Breathing normally"
        : breathing === "difficult"
          ? "Some breathing difficulty"
          : breathing === "severe"
            ? "Severe breathing difficulty"
            : "Not specified"}
    `.trim();
  };

  const handleAssessment = async (e) => {
    e.preventDefault();

    if (
      !symptoms.trim() ||
      !severity ||
      !conscious ||
      !breathing
    ) {
      setError(
        "Please complete all assessment fields before continuing."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      let patientLat = 13.0827;
      let patientLon = 80.2707;

      // Try browser geolocation.
      // If unavailable/denied, Chennai defaults are retained.
      if (navigator.geolocation) {
        try {
          const position = await new Promise(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                  enableHighAccuracy: true,
                  timeout: 5000,
                  maximumAge: 60000,
                }
              );
            }
          );

          patientLat = position.coords.latitude;
          patientLon = position.coords.longitude;
        } catch {
          // Keep Chennai fallback location.
        }
      }

      const patientUsername =
        user?.username ||
        user?.patient_username ||
        user?.user?.username ||
        "patient";

      const response = await fetch(
        `${API_URL}/api/emergency/assess`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            symptom_description:
              buildSymptomDescription(),

            patient_lat: patientLat,
            patient_lon: patientLon,

            patient_username:
              patientUsername,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.message ||
            "Emergency assessment failed."
        );
      }

      setResult(data);
      setSubmitted(true);
    } catch (err) {
      console.error(
        "Emergency assessment error:",
        err
      );

      setError(
        "Unable to connect to the EMERGIX emergency assessment service. Make sure the backend is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  };

  const assessment =
    result?.assessment || null;

  const recommendedHospital =
    assessment?.recommended_hospital || null;

  const recommendedHospitals =
    result?.recommended_hospitals || [];

  const triageLevel =
    assessment?.triage_level ||
    "Urgent";

  const normalizedTriage =
    String(triageLevel)
      .trim()
      .toLowerCase();

  const isCritical =
    normalizedTriage === "critical";

  const isUrgent =
    normalizedTriage === "urgent";

  const isModerate =
    normalizedTriage === "moderate";

  return (
    <div className="emergency-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="emergency-header">

        <div>
          <div className="emergency-label">
            <Siren size={14} />
            EMERGENCY ASSESSMENT
          </div>

          <h1>
            Tell us what is happening.
          </h1>

          <p>
            EMERGIX analyzes the reported symptoms
            and current hospital capacity to support
            emergency decision-making.
          </p>
        </div>

        <div className="emergency-alert">
          <span></span>
          Emergency network ready
        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          className="emergency-notice"
          style={{
            marginBottom: "20px",
          }}
        >
          <AlertTriangle size={18} />

          <div>
            <strong>
              Assessment error
            </strong>

            <p>
              {error}
            </p>
          </div>
        </div>
      )}


      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (

        <div className="assessment-result">

          <div className="result-banner">

            <div className="result-icon">
              <Loader2
                size={26}
                className="spin"
              />
            </div>

            <div>

              <span>
                EMERGIX AI ANALYSIS
              </span>

              <h2>
                Analyzing emergency condition...
              </h2>

              <p>
                Evaluating symptoms, emergency indicators,
                patient location, and current hospital
                availability.
              </p>

            </div>

          </div>

        </div>

      ) : !submitted ? (

        /* =================================================
           ASSESSMENT FORM
        ================================================= */

        <form
          className="assessment-form"
          onSubmit={handleAssessment}
        >

          {/* =================================================
             SYMPTOMS
          ================================================= */}

          <div className="assessment-card">

            <div className="assessment-card-header">

              <div className="assessment-number">
                01
              </div>

              <div>
                <h3>
                  What is happening?
                </h3>

                <p>
                  Describe the patient's current condition.
                </p>
              </div>

            </div>

            <textarea
              value={symptoms}
              onChange={(e) =>
                setSymptoms(e.target.value)
              }
              placeholder="Example: Severe chest pain, difficulty breathing, dizziness..."
              rows={4}
              required
            />

          </div>


          {/* =================================================
             SEVERITY
          ================================================= */}

          <div className="assessment-card">

            <div className="assessment-card-header">

              <div className="assessment-number">
                02
              </div>

              <div>
                <h3>
                  How serious is the condition?
                </h3>

                <p>
                  Select the option that best describes
                  the situation.
                </p>
              </div>

            </div>

            <div className="option-grid">

              <button
                type="button"
                className={`option-button ${
                  severity === "stable"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSeverity("stable")
                }
              >
                <CheckCircle2 size={18} />

                <span>
                  <strong>
                    Stable
                  </strong>

                  <small>
                    Symptoms are manageable
                  </small>
                </span>
              </button>


              <button
                type="button"
                className={`option-button ${
                  severity === "serious"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSeverity("serious")
                }
              >
                <Activity size={18} />

                <span>
                  <strong>
                    Serious
                  </strong>

                  <small>
                    Needs medical attention soon
                  </small>
                </span>
              </button>


              <button
                type="button"
                className={`option-button critical ${
                  severity === "critical"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSeverity("critical")
                }
              >
                <AlertTriangle size={18} />

                <span>
                  <strong>
                    Critical
                  </strong>

                  <small>
                    Immediate emergency care
                  </small>
                </span>
              </button>

            </div>

          </div>


          {/* =================================================
             CONSCIOUSNESS
          ================================================= */}

          <div className="assessment-card">

            <div className="assessment-card-header">

              <div className="assessment-number">
                03
              </div>

              <div>
                <h3>
                  Is the patient conscious?
                </h3>
              </div>

            </div>


            <div className="option-grid two">

              <button
                type="button"
                className={`option-button ${
                  conscious === "conscious"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setConscious("conscious")
                }
              >
                <CheckCircle2 size={18} />

                <span>
                  <strong>
                    Yes
                  </strong>

                  <small>
                    Patient is conscious
                  </small>
                </span>
              </button>


              <button
                type="button"
                className={`option-button critical ${
                  conscious === "unconscious"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setConscious("unconscious")
                }
              >
                <AlertTriangle size={18} />

                <span>
                  <strong>
                    No
                  </strong>

                  <small>
                    Patient is unconscious
                  </small>
                </span>
              </button>

            </div>

          </div>


          {/* =================================================
             BREATHING
          ================================================= */}

          <div className="assessment-card">

            <div className="assessment-card-header">

              <div className="assessment-number">
                04
              </div>

              <div>
                <h3>
                  How is the patient's breathing?
                </h3>
              </div>

            </div>


            <div className="option-grid">

              <button
                type="button"
                className={`option-button ${
                  breathing === "normal"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setBreathing("normal")
                }
              >
                <CheckCircle2 size={18} />

                <span>
                  <strong>
                    Normal
                  </strong>

                  <small>
                    Breathing normally
                  </small>
                </span>
              </button>


              <button
                type="button"
                className={`option-button ${
                  breathing === "difficult"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setBreathing("difficult")
                }
              >
                <Activity size={18} />

                <span>
                  <strong>
                    Difficult
                  </strong>

                  <small>
                    Some breathing difficulty
                  </small>
                </span>
              </button>


              <button
                type="button"
                className={`option-button critical ${
                  breathing === "severe"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setBreathing("severe")
                }
              >
                <AlertTriangle size={18} />

                <span>
                  <strong>
                    Severe
                  </strong>

                  <small>
                    Severe breathing difficulty
                  </small>
                </span>
              </button>

            </div>

          </div>


          {/* =================================================
             SUBMIT
          ================================================= */}

          <button
            type="submit"
            className="assessment-submit"
            disabled={loading}
          >
            <Siren size={19} />

            Analyze Emergency

            <ArrowRight size={18} />
          </button>

        </form>

      ) : (

        /* =================================================
           RESULT
        ================================================= */

        <div className="assessment-result">

          {/* =================================================
             RESULT BANNER
          ================================================= */}

          <div className="result-banner">

            <div className="result-icon">

              {isCritical ? (
                <AlertTriangle size={26} />
              ) : isUrgent ? (
                <Activity size={26} />
              ) : (
                <CheckCircle2 size={26} />
              )}

            </div>


            <div>

              <span>
                EMERGIX ASSESSMENT COMPLETE
              </span>

              <h2>

                {isCritical
                  ? "Immediate emergency care recommended"
                  : isUrgent
                    ? "Prompt medical evaluation recommended"
                    : "No immediate emergency routing indicated"}

              </h2>

              <p>
                {assessment?.patient_message}
              </p>

            </div>

          </div>


          {/* =================================================
             AI SUMMARY
          ================================================= */}

          <div className="recommended-hospital">

            <div className="recommended-header">

              <div>

                <span className="section-label">
                  AI TRIAGE RESULT
                </span>

                <h2>
                  {triageLevel}
                </h2>

                <p>
                  Priority score:{" "}
                  <strong>
                    {assessment?.priority_score ?? "—"}
                  </strong>
                  {" / 10"}
                </p>

              </div>


              <div className="recommendation-badge">
                {isCritical
                  ? "CRITICAL"
                  : isUrgent
                    ? "URGENT"
                    : "MODERATE"}
              </div>

            </div>


            <div
              style={{
                marginTop: "20px",
              }}
            >

              <span className="section-label">
                AI SUMMARY
              </span>

              <p
                style={{
                  marginTop: "8px",
                  lineHeight: 1.6,
                }}
              >
                {assessment?.ai_summary}
              </p>

            </div>


            {/* RED FLAGS */}

            {assessment?.red_flags?.length > 0 && (

              <div
                style={{
                  marginTop: "20px",
                }}
              >

                <span className="section-label">
                  DETECTED WARNING SIGNS
                </span>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "10px",
                  }}
                >

                  {assessment.red_flags.map(
                    (flag, index) => (
                      <span
                        key={`${flag}-${index}`}
                        style={{
                          padding:
                            "7px 10px",
                          borderRadius:
                            "999px",
                          background:
                            "rgba(255, 80, 80, 0.10)",
                          fontSize:
                            "12px",
                        }}
                      >
                        {flag}
                      </span>
                    )
                  )}

                </div>

              </div>

            )}


            {/* REQUIRED RESOURCES */}

            {assessment?.required_resources?.length >
              0 && (

              <div
                style={{
                  marginTop: "20px",
                }}
              >

                <span className="section-label">
                  REQUIRED RESOURCES
                </span>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "10px",
                  }}
                >

                  {assessment.required_resources.map(
                    (resource, index) => (
                      <span
                        key={`${resource}-${index}`}
                        style={{
                          padding:
                            "7px 10px",
                          borderRadius:
                            "999px",
                          background:
                            "rgba(80, 130, 255, 0.10)",
                          fontSize:
                            "12px",
                        }}
                      >
                        {resource}
                      </span>
                    )
                  )}

                </div>

              </div>

            )}

          </div>


          {/* =================================================
             MODERATE / NO EMERGENCY ROUTING
          ================================================= */}

          {isModerate && (

            <div className="emergency-notice">

              <CheckCircle2 size={18} />

              <div>

                <strong>
                  No immediate emergency routing
                </strong>

                <p>
                  Based on the information provided,
                  EMERGIX did not identify an immediate
                  emergency requiring hospital routing.
                  Seek clinical care if symptoms persist,
                  worsen, or you are concerned.
                </p>

              </div>

            </div>

          )}


          {/* =================================================
             RECOMMENDED HOSPITAL
          ================================================= */}

          {recommendedHospital && (

            <div className="recommended-hospital">

              <div className="recommended-header">

                <div>

                  <span className="section-label">
                    RECOMMENDED HOSPITAL
                  </span>

                  <h2>
                    {recommendedHospital.name}
                  </h2>

                  <p>
                    <MapPin size={14} />
                    {recommendedHospital.area},
                    {" Chennai"}
                  </p>

                </div>


                <div className="recommendation-badge">
                  BEST MATCH
                </div>

              </div>


              <div className="hospital-metrics">

                <div>
                  <span>
                    ICU BEDS
                  </span>

                  <strong>
                    {recommendedHospital.icu_free ??
                      "—"}
                  </strong>
                </div>


                <div>
                  <span>
                    FREE BEDS
                  </span>

                  <strong>
                    {recommendedHospital.beds_free ??
                      "—"}
                  </strong>
                </div>


                <div>
                  <span>
                    VENTILATORS
                  </span>

                  <strong>
                    {
                      recommendedHospital.ventilator_free ??
                      "—"
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    ER WAIT
                  </span>

                  <strong>
                    {recommendedHospital.er_wait_min !=
                    null
                      ? `${recommendedHospital.er_wait_min} min`
                      : "—"}
                  </strong>
                </div>

              </div>


              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "15px",
                  fontSize: "13px",
                }}
              >

                <span>
                  Distance:{" "}
                  <strong>
                    {recommendedHospital.distance_km ??
                      "—"}
                    km
                  </strong>
                </span>

                <span>
                  Resource match:{" "}
                  <strong>
                    {recommendedHospital.resource_match ??
                      "—"}
                    %
                  </strong>
                </span>

                <span>
                  Readiness score:{" "}
                  <strong>
                    {recommendedHospital.score ??
                      "—"}
                  </strong>
                </span>

              </div>


              {recommendedHospital.recommendation_reason && (
                <p
                  style={{
                    marginTop: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  {recommendedHospital.recommendation_reason}
                </p>
              )}


              <button
                className="dispatch-button"
                onClick={() => {
                  alert(
                    `Emergency request recorded for ${recommendedHospital.name}.`
                  );
                }}
              >
                <Siren size={18} />

                Request Emergency Dispatch

                <ArrowRight size={18} />
              </button>

            </div>

          )}


          {/* =================================================
             ALL MATCHED HOSPITALS
          ================================================= */}

          {recommendedHospitals.length > 1 && (

            <div className="recommended-hospital">

              <div className="recommended-header">

                <div>

                  <span className="section-label">
                    OTHER SUITABLE HOSPITALS
                  </span>

                  <h2>
                    Emergency Network Matches
                  </h2>

                </div>

              </div>


              <div
                style={{
                  display: "grid",
                  gap: "10px",
                  marginTop: "16px",
                }}
              >

                {recommendedHospitals
                  .slice(1, 5)
                  .map((hospital) => (

                    <div
                      key={hospital.id}
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: "12px",
                        padding:
                          "14px",
                        border:
                          "1px solid rgba(255,255,255,0.08)",
                        borderRadius:
                          "12px",
                      }}
                    >

                      <div>

                        <strong>
                          {hospital.name}
                        </strong>

                        <div
                          style={{
                            marginTop:
                              "4px",
                            fontSize:
                              "12px",
                            opacity:
                              0.75,
                          }}
                        >
                          {hospital.area}
                        </div>

                      </div>


                      <div
                        style={{
                          textAlign:
                            "right",
                          fontSize:
                            "12px",
                          opacity:
                            0.8,
                        }}
                      >

                        <div>
                          {hospital.distance_km} km
                        </div>

                        <div>
                          ER:{" "}
                          {hospital.er_wait_min} min
                        </div>

                      </div>

                    </div>

                  ))}

              </div>

            </div>

          )}


          {/* =================================================
             EMERGENCY NOTICE
          ================================================= */}

          {!isModerate && (

            <div className="emergency-notice">

              <AlertTriangle size={18} />

              <div>

                <strong>
                  Emergency notice
                </strong>

                <p>
                  EMERGIX provides emergency-support
                  guidance based on the information
                  provided. It does not provide a
                  confirmed medical diagnosis. In a
                  real emergency, contact local
                  emergency services.
                </p>

              </div>

            </div>

          )}


          {/* =================================================
             NEW ASSESSMENT
          ================================================= */}

          <button
            className="new-assessment"
            onClick={resetAssessment}
          >
            Start New Assessment
          </button>

        </div>

      )}

    </div>
  );
}