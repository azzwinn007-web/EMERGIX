import math
from database import get_all_hospitals

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculates distance between coordinates in Kilometers."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def rank_hospitals(patient_lat=13.0827, patient_lon=80.2707, required_resources=None):
    """Ranks Chennai hospitals based on distance, free beds, and ER wait time."""
    hospitals = get_all_hospitals()
    ranked = []

    for h in hospitals:
        dist_km = haversine_distance(patient_lat, patient_lon, h['lat'], h['lon'])
        
        # Calculate dynamic readiness score
        score = 100.0
        score -= (dist_km * 4.0)          # Distance penalty
        score -= (h['er_wait_min'] * 1.5)  # Wait time penalty
        score += (h['icu_free'] * 3.0)     # ICU availability bonus
        score += (h['ambulances_free'] * 2.0)
        
        h_dict = dict(h)
        h_dict['distance_km'] = round(dist_km, 2)
        h_dict['score'] = round(score, 1)
        ranked.append(h_dict)

    # Sort descending by calculated readiness score
    ranked.sort(key=lambda x: x['score'], reverse=True)
    return ranked