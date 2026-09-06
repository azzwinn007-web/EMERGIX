import { useEffect, useState } from "react";

import {
  UserRound,
  HeartPulse,
  Droplets,
  Phone,
  ShieldCheck,
  Stethoscope,
  AlertTriangle,
  LoaderCircle,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const username = user?.username || "patient";

      const response = await fetch(
        `${API_URL}/api/patients/${username}`
      );

      if (!response.ok) {
        throw new Error("Profile API unavailable");
      }

      const data = await response.json();

      if (data.success) {
        setProfile(data.patient);
      } else {
        setError(data.message || "Unable to load medical profile.");
      }
    } catch (err) {
      console.error("Profile loading error:", err);
      setError(
        "Unable to connect to EMERGIX medical profile service."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <LoaderCircle size={36} />
        <h3>Loading Medical Profile</h3>
        <p>
          Retrieving your emergency medical information...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <AlertTriangle size={40} />
        <h3>Profile Unavailable</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="profile-page">

      {/* HEADER */}

      <div className="profile-header">

        <div>
          <span className="section-label">
            EMERGENCY MEDICAL PROFILE
          </span>

          <h1>Medical Profile</h1>

          <p>
            Critical medical information available to
            emergency responders.
          </p>
        </div>

        <div className="profile-secure">
          <ShieldCheck size={17} />
          SECURE PROFILE
        </div>

      </div>


      {/* PATIENT IDENTITY */}

      <div className="profile-identity">

        <div className="profile-avatar">
          <UserRound size={30} />
        </div>

        <div className="profile-identity-info">
          <span>PATIENT</span>

          <h2>
            {profile?.full_name || user?.name || "Patient"}
          </h2>

          <p>
            Patient ID:{" "}
            <strong>
              {profile?.patient_id || "EMX-PAT-600001"}
            </strong>
          </p>
        </div>

        <div className="profile-blood">
          <Droplets size={18} />
          <div>
            <span>BLOOD GROUP</span>
            <strong>
              {profile?.blood_group || "—"}
            </strong>
          </div>
        </div>

      </div>


      {/* BASIC INFORMATION */}

      <div className="profile-section">

        <div className="profile-section-title">
          <UserRound size={18} />
          <div>
            <h3>Personal Information</h3>
            <span>Patient identification details</span>
          </div>
        </div>

        <div className="profile-grid">

          <div className="profile-field">
            <span>FULL NAME</span>
            <strong>{profile?.full_name || "—"}</strong>
          </div>

          <div className="profile-field">
            <span>AGE</span>
            <strong>
              {profile?.age ? `${profile.age} years` : "—"}
            </strong>
          </div>

          <div className="profile-field">
            <span>GENDER</span>
            <strong>{profile?.gender || "—"}</strong>
          </div>

          <div className="profile-field">
            <span>PATIENT ID</span>
            <strong>{profile?.patient_id || "—"}</strong>
          </div>

        </div>

      </div>


      {/* MEDICAL INFORMATION */}

      <div className="profile-section">

        <div className="profile-section-title">
          <HeartPulse size={18} />
          <div>
            <h3>Emergency Medical Information</h3>
            <span>Critical information for emergency care</span>
          </div>
        </div>

        <div className="profile-medical-grid">

          <div className="medical-box">
            <span>PRE-EXISTING CONDITIONS</span>

            <strong>
              {profile?.pre_existing_conditions || "None recorded"}
            </strong>
          </div>

          <div className="medical-box alert-box">
            <span>ALLERGIES</span>

            <strong>
              {profile?.allergies || "None recorded"}
            </strong>
          </div>

          <div className="medical-box">
            <span>PRIMARY PHYSICIAN</span>

            <strong>
              {profile?.primary_physician || "Not recorded"}
            </strong>
          </div>

          <div className="medical-box">
            <span>INSURANCE PROVIDER</span>

            <strong>
              {profile?.insurance_provider || "Not recorded"}
            </strong>
          </div>

        </div>

      </div>


      {/* EMERGENCY CONTACT */}

      <div className="profile-section">

        <div className="profile-section-title">
          <Phone size={18} />
          <div>
            <h3>Emergency Contact</h3>
            <span>Contact person for emergency situations</span>
          </div>
        </div>

        <div className="contact-card">

          <div className="contact-icon">
            <Phone size={19} />
          </div>

          <div>
            <span>EMERGENCY CONTACT</span>

            <h3>
              {profile?.emergency_contact_name || "Not recorded"}
            </h3>

            <p>
              {profile?.emergency_contact_phone || "No phone number"}
            </p>
          </div>

        </div>

      </div>


      {/* FOOTER */}

      <div className="profile-footer">

        <ShieldCheck size={16} />

        <span>
          This information is securely available to authorized
          EMERGIX emergency response personnel.
        </span>

      </div>

    </div>
  );
}