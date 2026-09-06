import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const CHENNAI_FALLBACK = {
  lat: 13.0827,
  lon: 80.2707,
};


// =====================================================
// DISTANCE
// =====================================================

function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}


// =====================================================
// MAP CONTROLLER
// =====================================================

function MapController({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const bounds = points.map((point) => [
      point.lat,
      point.lon,
    ]);

    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 13,
    });
  }, [map, points]);

  return null;
}


// =====================================================
// LIVE MAP
// =====================================================

function LiveMap() {
  const [userLocation, setUserLocation] =
    useState(null);

  const [locationStatus, setLocationStatus] =
    useState("Detecting your location...");

  const [hospitals, setHospitals] =
    useState([]);

  const [routes, setRoutes] =
    useState({});

  const [hospitalLoading, setHospitalLoading] =
    useState(true);

  const [hospitalError, setHospitalError] =
    useState("");

  // ===================================================
  // GET HOSPITALS FROM BACKEND
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    async function loadHospitals() {
      try {
        setHospitalLoading(true);
        setHospitalError("");

        const response = await fetch(
          `${API_URL}/api/hospitals`
        );

        if (!response.ok) {
          throw new Error(
            "Hospital API request failed"
          );
        }

        const data = await response.json();

        if (
          !cancelled &&
          data.success &&
          Array.isArray(data.hospitals)
        ) {
          setHospitals(data.hospitals);
        }
      } catch (error) {
        console.error(
          "Hospital loading error:",
          error
        );

        if (!cancelled) {
          setHospitalError(
            "Unable to load live hospital data."
          );
        }
      } finally {
        if (!cancelled) {
          setHospitalLoading(false);
        }
      }
    }

    loadHospitals();

    return () => {
      cancelled = true;
    };
  }, []);


  // ===================================================
  // GET USER LOCATION
  // ===================================================

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation(CHENNAI_FALLBACK);

      setLocationStatus(
        "Location unavailable — showing Chennai network"
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });

        setLocationStatus(
          "Using your current location"
        );
      },

      () => {
        setUserLocation(CHENNAI_FALLBACK);

        setLocationStatus(
          "Location permission unavailable — showing Chennai"
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);


  // ===================================================
  // CALCULATE NEAREST HOSPITALS
  // ===================================================

  const nearestHospitals = useMemo(() => {
    if (!userLocation) {
      return hospitals;
    }

    return hospitals
      .map((hospital) => ({
        ...hospital,

        distance: calculateDistance(
          userLocation.lat,
          userLocation.lon,
          hospital.lat,
          hospital.lon
        ),
      }))
      .sort(
        (a, b) => a.distance - b.distance
      );
  }, [userLocation, hospitals]);


  // ===================================================
  // LOAD ROAD ROUTES
  // ===================================================

  useEffect(() => {
    if (
      !userLocation ||
      nearestHospitals.length === 0
    ) {
      return;
    }

    const selectedHospitals =
      nearestHospitals.slice(0, 3);

    let cancelled = false;

    async function loadRoutes() {
      const newRoutes = {};

      for (const hospital of selectedHospitals) {
        try {
          const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${userLocation.lon},${userLocation.lat};` +
            `${hospital.lon},${hospital.lat}` +
            `?overview=full&geometries=geojson`;

          const response = await fetch(url);

          if (!response.ok) {
            continue;
          }

          const data = await response.json();

          if (
            data.routes &&
            data.routes.length > 0
          ) {
            const route =
              data.routes[0];

            newRoutes[hospital.id] =
              route.geometry.coordinates.map(
                ([lon, lat]) => [
                  lat,
                  lon,
                ]
              );
          }
        } catch (error) {
          console.error(
            "Route error:",
            error
          );
        }
      }

      if (!cancelled) {
        setRoutes(newRoutes);
      }
    }

    loadRoutes();

    return () => {
      cancelled = true;
    };
  }, [userLocation, nearestHospitals]);


  // ===================================================
  // WAIT FOR LOCATION
  // ===================================================

  if (!userLocation) {
    return (
      <div
        className="map-loading"
        style={{
          minHeight: "520px",
          width: "100%",
        }}
      >
        <div className="map-loading-spinner"></div>

        <span>
          {locationStatus}
        </span>
      </div>
    );
  }


  // ===================================================
  // MAP POINTS
  // ===================================================

  const mapPoints = [
    {
      lat: userLocation.lat,
      lon: userLocation.lon,
    },

    ...nearestHospitals.map(
      (hospital) => ({
        lat: hospital.lat,
        lon: hospital.lon,
      })
    ),
  ];


  // ===================================================
  // MAP
  // ===================================================

  return (
    <div
      className="live-map-wrapper"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "560px",
        height: "560px",
        borderRadius: "18px",
        overflow: "hidden",
      }}
    >

      <MapContainer
        center={[
          userLocation.lat,
          userLocation.lon,
        ]}
        zoom={12}
        scrollWheelZoom={true}
        className="live-leaflet-map"
        style={{
          width: "100%",
          height: "100%",
          minHeight: "560px",
        }}
      >

        {/* OPENSTREETMAP */}

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        {/* AUTOMATIC VIEW */}

        <MapController
          points={mapPoints}
        />


        {/* =================================================
            USER LOCATION
        ================================================= */}

        <CircleMarker
          center={[
            userLocation.lat,
            userLocation.lon,
          ]}
          radius={11}
          pathOptions={{
            color: "#ffffff",
            fillColor: "#ef4444",
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Popup>
            <div className="hospital-popup">

              <strong>
                Your Location
              </strong>

              <span>
                {locationStatus}
              </span>

            </div>
          </Popup>
        </CircleMarker>


        {/* =================================================
            HOSPITAL MARKERS
        ================================================= */}

        {nearestHospitals.map(
          (hospital, index) => (

            <CircleMarker
              key={hospital.id}
              center={[
                hospital.lat,
                hospital.lon,
              ]}
              radius={
                index === 0 ? 10 : 8
              }
              pathOptions={{
                color: "#ffffff",
                fillColor:
                  index === 0
                    ? "#06b6d4"
                    : "#0891b2",
                fillOpacity: 1,
                weight: 2,
              }}
            >

              <Popup>

                <div className="hospital-popup">

                  <strong>
                    {hospital.name}
                  </strong>

                  <span>
                    {hospital.area}
                  </span>

                  <hr />

                  <span>
                    Distance:{" "}
                    {hospital.distance
                      ?.toFixed(2)}{" "}
                    km
                  </span>

                  <span>
                    ICU beds:{" "}
                    {hospital.icu_free ?? 0}
                  </span>

                  <span>
                    Free beds:{" "}
                    {hospital.beds_free ?? 0}
                  </span>

                  <span>
                    Ventilators:{" "}
                    {hospital.ventilator_free ?? 0}
                  </span>

                  <span>
                    Ambulances:{" "}
                    {hospital.ambulances_free ?? 0}
                  </span>

                  <span>
                    ER wait:{" "}
                    {hospital.er_wait_min ?? 0} min
                  </span>

                  <span>
                    Oxygen:{" "}
                    {hospital.oxygen_pct ?? 0}%
                  </span>

                  <b>
                    {hospital.status ||
                      "Status unavailable"}
                  </b>

                </div>

              </Popup>

            </CircleMarker>
          )
        )}


        {/* =================================================
            ROAD ROUTES
        ================================================= */}

        {nearestHospitals
          .slice(0, 3)
          .map((hospital, index) => {

            const route =
              routes[hospital.id];

            if (!route) {
              return null;
            }

            return (
              <Polyline
                key={
                  `route-${hospital.id}`
                }
                positions={route}
                pathOptions={{
                  color:
                    index === 0
                      ? "#ef4444"
                      : "#06b6d4",
                  weight:
                    index === 0 ? 5 : 3,
                  opacity:
                    index === 0
                      ? 0.9
                      : 0.6,
                }}
              />
            );
          })}

      </MapContainer>


      {/* =================================================
          MAP STATUS
      ================================================= */}

      <div className="map-location-status">

        <span className="map-status-dot"></span>

        {hospitalLoading
          ? "Loading live hospital network..."
          : locationStatus}

      </div>


      {/* =================================================
          NEAREST HOSPITAL CARD
      ================================================= */}

      {nearestHospitals.length > 0 && (

        <div className="nearest-hospital-card">

          <span className="nearest-label">
            NEAREST HOSPITAL
          </span>

          <strong>
            {nearestHospitals[0].name}
          </strong>

          <span>
            {nearestHospitals[0].distance
              ?.toFixed(1)}{" "}
            km away
          </span>

        </div>

      )}


      {/* =================================================
          LIVE DATA ERROR
      ================================================= */}

      {hospitalError && (

        <div
          style={{
            position: "absolute",
            left: "16px",
            bottom: "16px",
            zIndex: 1000,
            padding: "8px 12px",
            borderRadius: "8px",
            background:
              "rgba(20, 20, 25, 0.9)",
            fontSize: "11px",
          }}
        >
          {hospitalError}
        </div>

      )}

    </div>
  );
}

export default LiveMap;