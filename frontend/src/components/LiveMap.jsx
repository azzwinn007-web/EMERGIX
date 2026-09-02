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


// =====================================================
// HOSPITAL DATA
// These coordinates come from your existing emergix.db
// =====================================================

const hospitals = [
  {
    id: 1,
    name: "Apollo Hospitals",
    area: "Greams Road, Thousand Lights",
    lat: 13.0603,
    lon: 80.2512,
    icu: 12,
    emergencyBeds: 28,
    ventilators: 8,
    ambulances: 5,
    wait: 4,
    status: "Accepting All Patients",
  },

  {
    id: 2,
    name: "Rajiv Gandhi Govt General Hospital",
    area: "Park Town, Central",
    lat: 13.0817,
    lon: 80.2782,
    icu: 4,
    emergencyBeds: 15,
    ventilators: 5,
    ambulances: 8,
    wait: 12,
    status: "Critical Only",
  },

  {
    id: 3,
    name: "MIOT International",
    area: "Manapakkam",
    lat: 13.0232,
    lon: 80.1873,
    icu: 15,
    emergencyBeds: 32,
    ventilators: 10,
    ambulances: 6,
    wait: 5,
    status: "Accepting All Patients",
  },

  {
    id: 4,
    name: "Fortis Malar Hospital",
    area: "Adyar",
    lat: 13.0067,
    lon: 80.257,
    icu: 6,
    emergencyBeds: 10,
    ventilators: 4,
    ambulances: 3,
    wait: 8,
    status: "Accepting All Patients",
  },

  {
    id: 5,
    name: "Kauvery Hospital",
    area: "Alwarpet",
    lat: 13.0336,
    lon: 80.2505,
    icu: 9,
    emergencyBeds: 18,
    ventilators: 6,
    ambulances: 4,
    wait: 6,
    status: "Accepting All Patients",
  },
];


// =====================================================
// DISTANCE CALCULATION
// =====================================================

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}


// =====================================================
// MAP CONTROLLER
// Automatically fits map to user + hospitals
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
      padding: [40, 40],
    });
  }, [map, points]);

  return null;
}


// =====================================================
// LIVE MAP COMPONENT
// =====================================================

function LiveMap() {

  const [userLocation, setUserLocation] = useState(null);

  const [locationStatus, setLocationStatus] =
    useState("Detecting your location...");

  const [routes, setRoutes] = useState({});


  // ===================================================
  // GET REAL USER LOCATION
  // ===================================================

  useEffect(() => {

    if (!navigator.geolocation) {

      setLocationStatus(
        "Location unavailable — showing Chennai network"
      );

      setUserLocation({
        lat: 13.0827,
        lon: 80.2707,
      });

      return;
    }


    navigator.geolocation.getCurrentPosition(

      (position) => {

        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        setUserLocation(location);

        setLocationStatus(
          "Using your current location"
        );
      },

      () => {

        // Chennai fallback

        setUserLocation({
          lat: 13.0827,
          lon: 80.2707,
        });

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
  // FIND NEAREST HOSPITALS
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
      .sort((a, b) => a.distance - b.distance);

  }, [userLocation]);


  // ===================================================
  // GET REAL ROAD ROUTES FROM OSRM
  // ===================================================

  useEffect(() => {

    if (!userLocation) return;

    const selectedHospitals =
      nearestHospitals.slice(0, 3);


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

            const route = data.routes[0];

            newRoutes[hospital.id] =
              route.geometry.coordinates.map(
                ([lon, lat]) => [lat, lon]
              );

          }

        } catch (error) {

          console.error(
            "Route error:",
            error
          );

        }

      }


      setRoutes(newRoutes);

    }


    loadRoutes();

  }, [userLocation, nearestHospitals]);


  // ===================================================
  // WAIT FOR LOCATION
  // ===================================================

  if (!userLocation) {

    return (

      <div className="map-loading">

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

    ...nearestHospitals,
  ];


  return (

    <div className="live-map-wrapper">

      <MapContainer
        center={[
          userLocation.lat,
          userLocation.lon,
        ]}
        zoom={12}
        scrollWheelZoom={true}
        className="live-leaflet-map"
      >

        {/* OPENSTREETMAP */}

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        {/* AUTOMATIC VIEW */}

        <MapController
          points={mapPoints}
        />


        {/* ==========================================
            USER LOCATION
        ========================================== */}

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

            <strong>
              Your Location
            </strong>

            <br />

            {locationStatus}

          </Popup>

        </CircleMarker>


        {/* ==========================================
            HOSPITAL MARKERS
        ========================================== */}

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
                    {hospital.distance?.toFixed(2)}
                    {" "}km
                  </span>

                  <span>
                    ICU beds: {hospital.icu}
                  </span>

                  <span>
                    Emergency beds:{" "}
                    {hospital.emergencyBeds}
                  </span>

                  <span>
                    Ventilators:{" "}
                    {hospital.ventilators}
                  </span>

                  <span>
                    Ambulances:{" "}
                    {hospital.ambulances}
                  </span>

                  <span>
                    ER wait:{" "}
                    {hospital.wait} min
                  </span>

                  <b>
                    {hospital.status}
                  </b>

                </div>

              </Popup>

            </CircleMarker>

          )
        )}


        {/* ==========================================
            REAL ROAD ROUTES
        ========================================== */}

        {nearestHospitals
          .slice(0, 3)
          .map((hospital, index) => {

            const route =
              routes[hospital.id];

            if (!route) return null;

            return (

              <Polyline
                key={`route-${hospital.id}`}
                positions={route}
                pathOptions={{
                  color:
                    index === 0
                      ? "#ef4444"
                      : "#06b6d4",
                  weight:
                    index === 0 ? 5 : 3,
                  opacity:
                    index === 0 ? 0.9 : 0.6,
                }}
              />

            );

          })}

      </MapContainer>


      {/* ==========================================
          MAP STATUS
      ========================================== */}

      <div className="map-location-status">

        <span className="map-status-dot"></span>

        {locationStatus}

      </div>


      {/* ==========================================
          NEAREST HOSPITAL CARD
      ========================================== */}

      {nearestHospitals.length > 0 && (

        <div className="nearest-hospital-card">

          <span className="nearest-label">
            NEAREST HOSPITAL
          </span>

          <strong>
            {nearestHospitals[0].name}
          </strong>

          <span>
            {nearestHospitals[0].distance?.toFixed(1)}
            {" "}km away
          </span>

        </div>

      )}

    </div>

  );
}

export default LiveMap;