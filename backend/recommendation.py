import math
from database import get_all_hospitals


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in kilometres."""
    R = 6371.0

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def _normalise_resources(required_resources):
    """Normalize resource names for matching."""
    if not required_resources:
        return []

    normalized = []

    for resource in required_resources:
        value = str(resource).strip().lower()

        if value:
            normalized.append(value)

    return list(dict.fromkeys(normalized))


def _hospital_supports_resource(hospital, resource):
    """
    Check whether a hospital currently appears capable of
    supporting a requested emergency resource.
    """

    resource = resource.lower()

    if "icu" in resource:
        return hospital.get("icu_free", 0) > 0

    if "ventilator" in resource:
        return hospital.get("ventilator_free", 0) > 0

    if "ambulance" in resource:
        return hospital.get("ambulances_free", 0) > 0

    if "oxygen" in resource:
        return hospital.get("oxygen_pct", 0) >= 90

    if "blood" in resource:
        status = str(hospital.get("blood_status", "")).lower()

        return status in {
            "optimal",
            "available",
            "good",
            "adequate",
        }

    if "ct" in resource:
        return bool(hospital.get("ct_scanner_active", 0))

    if "emergency" in resource or "er" in resource:
        return hospital.get("status") != "🔴 Emergency Only"

    # Department names such as Cardiology, Trauma, Neurology,
    # General Ward, etc. cannot be reliably verified from the
    # current telemetry schema, so we do not incorrectly reject
    # a hospital for them.
    return True


def _resource_match_score(hospital, required_resources):
    """
    Calculate how many requested resources the hospital currently
    appears able to provide.
    """

    resources = _normalise_resources(required_resources)

    if not resources:
        return 1.0

    matched = 0

    for resource in resources:
        if _hospital_supports_resource(hospital, resource):
            matched += 1

    return matched / len(resources)


def rank_hospitals(
    patient_lat=13.0827,
    patient_lon=80.2707,
    required_resources=None,
    triage_level="Critical",
):
    """
    Rank hospitals using:
      - requested emergency resources
      - ICU/beds
      - ER waiting time
      - ambulance availability
      - distance
      - hospital operating status

    Moderate/non-emergency cases are intentionally not routed
    through emergency hospital recommendations.
    """

    level = str(triage_level or "").strip().lower()

    # ---------------------------------------------------------
    # No emergency routing for moderate cases.
    # ---------------------------------------------------------
    if level in {
        "moderate",
        "low",
        "non-emergency",
        "non emergency",
    }:
        return []

    hospitals = get_all_hospitals()
    required_resources = _normalise_resources(required_resources)

    ranked = []

    for hospital in hospitals:
        h = dict(hospital)

        # -----------------------------------------------------
        # Skip hospitals that are not accepting patients.
        # -----------------------------------------------------
        status = str(h.get("status", "")).lower()

        if "closed" in status or "not accepting" in status:
            continue

        # -----------------------------------------------------
        # Basic capacity checks.
        # -----------------------------------------------------
        beds_free = int(h.get("beds_free", 0) or 0)
        icu_free = int(h.get("icu_free", 0) or 0)

        resource_match = _resource_match_score(
            h,
            required_resources,
        )

        # -----------------------------------------------------
        # If ICU is explicitly required, hospital needs
        # an available ICU bed.
        # -----------------------------------------------------
        icu_required = any(
            "icu" in resource
            for resource in required_resources
        )

        if icu_required and icu_free <= 0:
            continue

        # -----------------------------------------------------
        # General hospital capacity safeguard.
        # -----------------------------------------------------
        if beds_free <= 0 and not icu_required:
            continue

        # -----------------------------------------------------
        # Distance.
        # -----------------------------------------------------
        distance_km = haversine_distance(
            patient_lat,
            patient_lon,
            h.get("lat", patient_lat),
            h.get("lon", patient_lon),
        )

        # -----------------------------------------------------
        # Build readiness score.
        # -----------------------------------------------------
        score = 50.0

        # Resource capability is the most important factor.
        score += resource_match * 35.0

        # ICU availability.
        score += min(icu_free, 20) * 1.5

        # General beds.
        score += min(beds_free, 40) * 0.5

        # Ambulances.
        score += min(
            int(h.get("ambulances_free", 0) or 0),
            10,
        ) * 1.5

        # Lower ER wait is better.
        er_wait = max(
            0,
            int(h.get("er_wait_min", 0) or 0),
        )

        score -= min(er_wait, 60) * 0.8

        # Nearby hospitals receive a moderate bonus.
        score -= min(distance_km, 30) * 2.0

        # Oxygen availability.
        oxygen_pct = int(h.get("oxygen_pct", 0) or 0)

        if "oxygen" in " ".join(required_resources):
            if oxygen_pct >= 95:
                score += 8
            elif oxygen_pct >= 90:
                score += 4
            else:
                score -= 15

        # Blood availability.
        if any("blood" in r for r in required_resources):
            blood_status = str(
                h.get("blood_status", "")
            ).lower()

            if blood_status == "optimal":
                score += 8
            elif blood_status in {"available", "good", "adequate"}:
                score += 4
            else:
                score -= 10

        # CT availability.
        if any("ct" in r for r in required_resources):
            if h.get("ct_scanner_active", 0):
                score += 8
            else:
                score -= 12

        # -----------------------------------------------------
        # Add recommendation metadata.
        # -----------------------------------------------------
        h["distance_km"] = round(distance_km, 2)
        h["resource_match"] = round(resource_match * 100)
        h["score"] = round(score, 1)

        # Human-readable reason for the frontend.
        reasons = []

        if resource_match >= 1:
            reasons.append("Required resources available")
        elif resource_match > 0:
            reasons.append("Some required resources available")

        if icu_free > 0:
            reasons.append(f"{icu_free} ICU beds available")

        if beds_free > 0:
            reasons.append(f"{beds_free} beds available")

        reasons.append(
            f"{er_wait} min ER wait"
        )

        reasons.append(
            f"{round(distance_km, 1)} km away"
        )

        h["recommendation_reason"] = ", ".join(reasons)

        ranked.append(h)

    # ---------------------------------------------------------
    # Highest readiness first.
    # ---------------------------------------------------------
    ranked.sort(
        key=lambda x: (
            x["score"],
            x["resource_match"],
            -x["distance_km"],
        ),
        reverse=True,
    )

    return ranked