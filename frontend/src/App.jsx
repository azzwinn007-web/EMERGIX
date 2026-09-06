import { useState } from "react";

import {
  LayoutDashboard,
  Siren,
  Hospital,
  Radio,
  UserRound,
  LogOut,
  Activity,
} from "lucide-react";

import PortalSelect from "./pages/PortalSelect";
import PatientLogin from "./pages/PatientLogin";
import HospitalLogin from "./pages/HospitalLogin";
import PatientDashboard from "./pages/PatientDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import EmergencyAssessment from "./pages/EmergencyAssessment";
import Hospitals from "./pages/Hospitals";
import Updates from "./pages/Updates";
import Profile from "./pages/Profile";

function App() {
  const [portal, setPortal] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  const handleLogin = (user) => {
    console.log("Logged in user:", user);
    setCurrentUser(user);
    setLoggedIn(true);
    setPage("dashboard");
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setCurrentUser(null);
    setPortal(null);
    setPage("dashboard");
  };

  if (!portal) {
    return <PortalSelect onSelect={setPortal} />;
  }

  if (!loggedIn) {
    if (portal === "patient") {
      return (
        <PatientLogin
          onLogin={handleLogin}
          onBack={() => setPortal(null)}
        />
      );
    }

    return (
      <HospitalLogin
        onLogin={handleLogin}
        onBack={() => setPortal(null)}
      />
    );
  }

  const navigation =
    portal === "patient"
      ? [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
          },
          {
            id: "emergency",
            label: "Emergency",
            icon: Siren,
          },
          {
            id: "hospitals",
            label: "Hospitals",
            icon: Hospital,
          },
          {
            id: "updates",
            label: "Live Updates",
            icon: Radio,
          },
          {
            id: "profile",
            label: "Medical Profile",
            icon: UserRound,
          },
        ]
      : [
          {
            id: "dashboard",
            label: "Command Center",
            icon: LayoutDashboard,
          },
          {
            id: "updates",
            label: "Live Updates",
            icon: Radio,
          },
        ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={22} />
          </div>

          <div>
            <h1>EMERGIX</h1>
            <span>Emergency Intelligence</span>
          </div>
        </div>

        <div className="portal-label">
          {portal === "patient"
            ? "PATIENT PORTAL"
            : "HOSPITAL COMMAND"}
        </div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`nav-item ${
                  page === item.id ? "active" : ""
                }`}
                onClick={() => setPage(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="nav-item logout"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              EMERGENCY RESPONSE NETWORK
            </p>

            <h2>
              {page === "dashboard" &&
                portal === "hospital" &&
                "Hospital Command Center"}

              {page === "emergency" &&
                "Emergency Response"}

              {page === "hospitals" &&
                "Hospital Network"}

              {page === "updates" &&
                "Live Updates"}

              {page === "profile" &&
                "Medical Profile"}
            </h2>
          </div>

          <div className="system-status">
            <span className="status-dot"></span>
            Network Operational
          </div>
        </header>

        <section className="page-container">
          {page === "dashboard" &&
            portal === "patient" && (
              <PatientDashboard
                user={currentUser}
                onNavigate={setPage}
              />
            )}

          {page === "dashboard" &&
            portal === "hospital" && (
              <HospitalDashboard user={currentUser} />
            )}

          {page === "emergency" &&
            portal === "patient" && (
              <EmergencyAssessment user={currentUser} />
            )}

          {page === "hospitals" &&
            portal === "patient" && (
              <Hospitals />
            )}

          {page === "updates" && <Updates />}

          {page === "profile" &&
            portal === "patient" && (
              <Profile user={currentUser} />
            )}
        </section>
      </main>
    </div>
  );
}

export default App;