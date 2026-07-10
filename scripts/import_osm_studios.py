#!/usr/bin/env python3
"""
Import yoga studio listings from OpenStreetMap (Overpass API) for major
US + Canadian cities. Inserts new rows into Supabase `listings` with
status='pending' so they show up in /admin for review.

Usage:
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python3 scripts/import_osm_studios.py
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from typing import Any

OVERPASS = "https://overpass-api.de/api/interpreter"

# (label, country, [south, west, north, east])
CITIES: list[tuple[str, str, list[float]]] = [
    # Canada
    ("Toronto",     "Canada", [43.58, -79.64, 43.86, -79.12]),
    ("Vancouver",   "Canada", [49.20, -123.26, 49.32, -123.02]),
    ("Montreal",    "Canada", [45.40, -73.98, 45.71, -73.47]),
    ("Calgary",     "Canada", [50.84, -114.32, 51.18, -113.86]),
    ("Ottawa",      "Canada", [45.25, -75.94, 45.54, -75.40]),
    ("Edmonton",    "Canada", [53.40, -113.71, 53.71, -113.27]),
    ("Quebec City", "Canada", [46.71, -71.42, 46.91, -71.10]),
    ("Winnipeg",    "Canada", [49.77, -97.34, 49.99, -96.96]),
    ("Hamilton",    "Canada", [43.17, -80.04, 43.34, -79.71]),
    ("Halifax",     "Canada", [44.55, -63.74, 44.78, -63.45]),
    # United States
    ("New York",      "United States", [40.49, -74.26, 40.92, -73.69]),
    ("Los Angeles",   "United States", [33.70, -118.67, 34.34, -118.16]),
    ("Chicago",       "United States", [41.64, -87.94, 42.02, -87.52]),
    ("Houston",       "United States", [29.52, -95.81, 30.11, -95.06]),
    ("Phoenix",       "United States", [33.29, -112.32, 33.92, -111.93]),
    ("Philadelphia",  "United States", [39.86, -75.28, 40.14, -74.95]),
    ("San Antonio",   "United States", [29.18, -98.80, 29.71, -98.30]),
    ("San Diego",     "United States", [32.53, -117.31, 33.11, -116.91]),
    ("Dallas",        "United States", [32.62, -96.99, 33.02, -96.46]),
    ("San Francisco", "United States", [37.70, -122.53, 37.83, -122.36]),
    ("Austin",        "United States", [30.10, -97.94, 30.52, -97.56]),
    ("Seattle",       "United States", [47.49, -122.46, 47.78, -122.22]),
    ("Denver",        "United States", [39.61, -105.11, 39.91, -104.60]),
    ("Boston",        "United States", [42.23, -71.19, 42.40, -70.92]),
    ("Portland",      "United States", [45.43, -122.84, 45.66, -122.46]),
    ("Miami",         "United States", [25.69, -80.32, 25.86, -80.13]),
    ("Atlanta",       "United States", [33.65, -84.55, 33.89, -84.29]),
    ("Nashville",     "United States", [36.03, -86.97, 36.40, -86.55]),
    ("Washington",    "United States", [38.79, -77.12, 38.99, -76.91]),
    ("Minneapolis",   "United States", [44.89, -93.33, 45.05, -93.19]),
]

USER_AGENT = "yoga-founders-network-importer/1.0 (hello@yogafoundersnetwork.com)"


def overpass_query(bbox: list[float]) -> dict[str, Any]:
    s, w, n, e = bbox
    q = f"""
[out:json][timeout:60];
(
  node["sport"="yoga"]({s},{w},{n},{e});
  way["sport"="yoga"]({s},{w},{n},{e});
  node["leisure"="fitness_centre"]["name"~"[Yy]oga"]({s},{w},{n},{e});
  way["leisure"="fitness_centre"]["name"~"[Yy]oga"]({s},{w},{n},{e});
  node["amenity"="studio"]["name"~"[Yy]oga"]({s},{w},{n},{e});
  way["amenity"="studio"]["name"~"[Yy]oga"]({s},{w},{n},{e});
  node["shop"]["name"~"[Yy]oga"]({s},{w},{n},{e});
  way["shop"]["name"~"[Yy]oga"]({s},{w},{n},{e});
);
out tags center;
""".strip()
    data = urllib.parse.urlencode({"data": q}).encode()
    req = urllib.request.Request(OVERPASS, data=data, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read())


def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:80]


def existing_signatures(sup_url: str, key: str) -> set[str]:
    """Names already in listings table, lowercased + stripped."""
    out: set[str] = set()
    offset = 0
    while True:
        url = f"{sup_url}/rest/v1/listings?select=name,city&offset={offset}&limit=1000"
        req = urllib.request.Request(url, headers={
            "apikey": key, "Authorization": f"Bearer {key}",
        })
        with urllib.request.urlopen(req, timeout=30) as r:
            rows = json.loads(r.read())
        for row in rows:
            n = (row.get("name") or "").strip().lower()
            c = (row.get("city") or "").strip().lower()
            if n:
                out.add(f"{n}|{c}")
        if len(rows) < 1000:
            break
        offset += 1000
    return out


def existing_slugs(sup_url: str, key: str) -> set[str]:
    out: set[str] = set()
    offset = 0
    while True:
        url = f"{sup_url}/rest/v1/listings?select=slug&offset={offset}&limit=1000"
        req = urllib.request.Request(url, headers={
            "apikey": key, "Authorization": f"Bearer {key}",
        })
        with urllib.request.urlopen(req, timeout=30) as r:
            rows = json.loads(r.read())
        for row in rows:
            if row.get("slug"):
                out.add(row["slug"])
        if len(rows) < 1000:
            break
        offset += 1000
    return out


def normalize_phone(p: str | None) -> str | None:
    if not p: return None
    p = p.strip()
    return p if p else None


def normalize_website(w: str | None) -> str | None:
    if not w: return None
    w = w.strip()
    if not w: return None
    if not re.match(r"^https?://", w, re.I):
        w = "https://" + w
    return w


def feature_to_row(feat: dict[str, Any], city_label: str, country: str, used_slugs: set[str]) -> dict[str, Any] | None:
    tags = feat.get("tags") or {}
    name = (tags.get("name") or "").strip()
    if not name:
        return None
    # Filter: must mention yoga in name OR be tagged sport=yoga
    if tags.get("sport") != "yoga" and "yoga" not in name.lower():
        return None

    lat = feat.get("lat") if feat.get("type") == "node" else (feat.get("center") or {}).get("lat")
    lon = feat.get("lon") if feat.get("type") == "node" else (feat.get("center") or {}).get("lon")

    addr_parts = [tags.get("addr:housenumber"), tags.get("addr:street")]
    address = " ".join(p for p in addr_parts if p) or None
    city = (tags.get("addr:city") or city_label).strip()
    website = normalize_website(tags.get("website") or tags.get("contact:website"))
    phone = normalize_phone(tags.get("phone") or tags.get("contact:phone"))
    email = (tags.get("email") or tags.get("contact:email") or "").strip().lower() or None

    base_slug = slugify(f"{name} {city}")
    slug = base_slug
    n = 2
    while slug in used_slugs:
        slug = f"{base_slug}-{n}"
        n += 1
    used_slugs.add(slug)

    return {
        "name": name,
        "slug": slug,
        "type": "studio",
        "status": "pending",
        "plan": "free",
        "city": city,
        "country": country,
        "address": address,
        "latitude": lat,
        "longitude": lon,
        "website": website,
        "phone": phone,
        "email": email,
    }


def chunked(seq: list, size: int):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def main() -> int:
    sup_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not sup_url or not key:
        print("error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in env", file=sys.stderr)
        return 1

    print(f"Loading existing listings from {sup_url} ...")
    seen = existing_signatures(sup_url, key)
    used_slugs = existing_slugs(sup_url, key)
    print(f"  {len(seen)} existing (name,city) pairs, {len(used_slugs)} slugs reserved")

    new_rows: list[dict[str, Any]] = []
    per_city_count: dict[str, int] = {}

    for label, country, bbox in CITIES:
        print(f"→ {label}, {country}  bbox={bbox}")
        try:
            data = overpass_query(bbox)
        except Exception as exc:
            print(f"  ! overpass failed: {exc}")
            time.sleep(3)
            continue

        elements = data.get("elements") or []
        rows_for_city = 0
        for feat in elements:
            row = feature_to_row(feat, label, country, used_slugs)
            if not row:
                continue
            sig = f"{row['name'].strip().lower()}|{row['city'].strip().lower()}"
            if sig in seen:
                continue
            seen.add(sig)
            new_rows.append(row)
            rows_for_city += 1

        per_city_count[label] = rows_for_city
        print(f"  +{rows_for_city} new from {len(elements)} OSM elements")
        time.sleep(2)  # be polite to Overpass

    print(f"\nReady to insert {len(new_rows)} new listings as 'pending'.")
    if not new_rows:
        return 0

    inserted = 0
    for batch in chunked(new_rows, 100):
        body = json.dumps(batch).encode()
        req = urllib.request.Request(
            f"{sup_url}/rest/v1/listings",
            data=body,
            method="POST",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                if 200 <= r.status < 300:
                    inserted += len(batch)
        except urllib.error.HTTPError as e:
            print(f"  ! insert batch failed: {e.code} {e.read()[:300]}")

    print(f"\nInserted {inserted} pending listings.")
    print("Per-city totals:")
    for label, _, _ in CITIES:
        print(f"  {label:<15} {per_city_count.get(label, 0)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
