import { useState } from "react";
import {
  Siren,
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const hospitals = [
  {
    name: "Apollo Hospitals",
    area: "Greams Road",
    icu: 8,
    emergency: 14,
    ventilators: 5,
    wait: "8 min",
  },
  {
    name: "Rajiv Gandhi Govt General Hospital",
    area: "Park Town",
    icu: 6,
    emergency: 18,
    ventilators: 3,
    wait: "12 min",
  },
  {
    name: "MIOT International",
    area: "Manapakkam",
    icu: 5,
    emergency: 9,
    ventilators: 3,
    wait: "15 min",
  },
  {
    name: "Fortis Malar Hospital",
    area: "Adyar",
    icu: 3,
    emergency: 7,
    ventilators: 2,
    wait: "10 min",
  },
  {
    name: "Kauvery Hospital",
    area: "Alwarpet",
    icu: 4,
    emergency: 8,
    ventilators: 2,
    wait: "11 min",
  },
];

export default function EmergencyAssessment({ user }) {
  const [symptoms, setSymptoms] = useState("");
  const [severity, setSeverity] = useState("");
  const [conscious, setConscious] = useState("");
  const [breathing, setBreathing] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleAssessment = (e) => {
    e.preventDefault();

    if (!symptoms || !severity || !conscious || !breathing) {
      return;
    }

    setSubmitted(true);
  };

  const isCritical =
    severity === "critical" ||
    breathing === "severe" ||
    conscious === "unconscious";

  const recommendedHospital = isCritical
    ? hospitals[0]
    : hospitals[1];

  return (
    <div className="emergency-page">

      {/* HEADER */}

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
            EMERGIX will assess the situation and
            identify the most suitable emergency hospital.
          </p>
        </div>

        <div className="emergency-alert">
          <span></span>
          Emergency network ready
        </div>

      </div>


      {!submitted ? (

        <form
          className="assessment-form"
          onSubmit={handleAssessment}
        >

          {/* SYMPTOMS */}

          <div className="assessment-card">

            <div className="assessment-card-header">
              <div className="assessment-number">01</div>

              <div>
                <h3>What is happening?</h3>
                <p>
                  Describe the patient's current condition.
                </p>
              </div>
            </div>

            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Example: Severe chest pain, difficulty breathing, dizziness..."
              rows={4}
              required
            />

          </div>


          {/* SEVERITY */}

          <div className="assessment-card">

            <div className="assessment-card-header">
              <div className="assessment-number">02</div>

              <div>
                <h3>How serious is the condition?</h3>
                <p>
                  Select the option that best describes the situation.
                </p>
              </div>
            </div>

            <div className="option-grid">

              <button
                type="button"
                className={`option-button ${
                  severity === "stable" ? "selected" : ""
                }`}
                onClick={() => setSeverity("stable")}
              >
                <CheckCircle2 size={18} />
                <span>
                  <strong>Stable</strong>
                  <small>Symptoms are manageable</small>
                </span>
              </button>

              <button
                type="button"
                className={`option-button ${
                  severity === "serious" ? "selected" : ""
                }`}
                onClick={() => setSeverity("serious")}
              >
                <Activity size={18} />
                <span>
                  <strong>Serious</strong>
                  <small>Needs medical attention soon</small>
                </span>
              </button>

              <button
                type="button"
                className={`option-button critical ${
                  severity === "critical" ? "selected" : ""
                }`}
                onClick={() => setSeverity("critical")}
              >
                <AlertTriangle size={18} />
                <span>
                  <strong>Critical</strong>
                  <small>Immediate emergency care</small>
                </span>
              </button>

            </div>

          </div>


          {/* CONSCIOUSNESS */}

          <div className="assessment-card">

            <div className="assessment-card-header">
              <div className="assessment-number">03</div>

              <div>
                <h3>Is the patient conscious?</h3>
              </div>
            </div>

            <div className="option-grid two">

              <button
                type="button"
                className={`option-button ${
                  conscious === "conscious" ? "selected" : ""
                }`}
                onClick={() => setConscious("conscious")}
              >
                <CheckCircle2 size={18} />
                <span>
                  <strong>Yes</strong>
                  <small>Patient is conscious</small>
                </span>
              </button>

              <button
                type="button"
                className={`option-button critical ${
                  conscious === "unconscious" ? "selected" : ""
                }`}
                onClick={() => setConscious("unconscious")}
              >
                <AlertTriangle size={18} />
                <span>
                  <strong>No</strong>
                  <small>Patient is unconscious</small>
                </span>
              </button>

            </div>

          </div>


          {/* BREATHING */}

          <div className="assessment-card">

            <div className="assessment-card-header">
              <div className="assessment-number">04</div>

              <div>
                <h3>How is the patient's breathing?</h3>
              </div>
            </div>

            <div className="option-grid">

              <button
                type="button"
                className={`option-button ${
                  breathing === "normal" ? "selected" : ""
                }`}
                onClick={() => setBreathing("normal")}
              >
                <CheckCircle2 size={18} />
                <span>
                  <strong>Normal</strong>
                  <small>Breathing normally</small>
                </span>
              </button>

              <button
                type="button"
                className={`option-button ${
                  breathing === "difficult" ? "selected" : ""
                }`}
                onClick={() => setBreathing("difficult")}
              >
                <Activity size={18} />
                <span>
                  <strong>Difficult</strong>
                  <small>Some breathing difficulty</small>
                </span>
              </button>

              <button
                type="button"
                className={`option-button critical ${
                  breathing === "severe" ? "selected" : ""
                }`}
                onClick={() => setBreathing("severe")}
              >
                <AlertTriangle size={18} />
                <span>
                  <strong>Severe</strong>
                  <small>Severe breathing difficulty</small>
                </span>
              </button>

            </div>

          </div>


          {/* SUBMIT */}

          <button
            type="submit"
            className="assessment-submit"
          >
            <Siren size={19} />
            Analyze Emergency
            <ArrowRight size={18} />
          </button>

        </form>

      ) : (

        /* =========================================
           RESULT
        ========================================= */

        <div className="assessment-result">

          <div className="result-banner">

            <div className="result-icon">
              <CheckCircle2 size={26} />
            </div>

            <div>
              <span>EMERGIX ASSESSMENT COMPLETE</span>

              <h2>
                {isCritical
                  ? "Immediate emergency care recommended"
                  : "Emergency medical assessment recommended"}
              </h2>

              <p>
                Based on the information provided,
                EMERGIX has identified the following
                hospital for emergency response.
              </p>
            </div>

          </div>


          {/* RECOMMENDED HOSPITAL */}

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
                  {recommendedHospital.area}, Chennai
                </p>
              </div>

              <div className="recommendation-badge">
                BEST MATCH
              </div>

            </div>


            <div className="hospital-metrics">

              <div>
                <span>ICU BEDS</span>
                <strong>
                  {recommendedHospital.icu}
                </strong>
              </div>

              <div>
                <span>ER BEDS</span>
                <strong>
                  {recommendedHospital.emergency}
                </strong>
              </div>

              <div>
                <span>VENTILATORS</span>
                <strong>
                  {recommendedHospital.ventilators}
                </strong>
              </div>

              <div>
                <span>EST. WAIT</span>
                <strong>
                  {recommendedHospital.wait}
                </strong>
              </div>

            </div>


            <button
              className="dispatch-button"
              onClick={() => {
                alert(
                  `Emergency request sent to ${recommendedHospital.name}.`
                );
              }}
            >
              <Siren size={18} />
              Request Emergency Dispatch
              <ArrowRight size={18} />
            </button>

          </div>


          {/* EMERGENCY NOTICE */}

          <div className="emergency-notice">

            <AlertTriangle size={18} />

            <div>
              <strong>
                Emergency notice
              </strong>

              <p>
                This demo recommendation is based on
                the information entered. In a real emergency,
                contact your local emergency services.
              </p>
            </div>

          </div>


          <button
            className="new-assessment"
            onClick={() => {
              setSubmitted(false);
              setSymptoms("");
              setSeverity("");
              setConscious("");
              setBreathing("");
            }}
          >
            Start New Assessment
          </button>

        </div>

      )}

    </div>
  );
}