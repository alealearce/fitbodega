#!/usr/bin/env python3
"""Backfill latitude/longitude for listings that have a street address but no coords.

Uses the free Nominatim (OpenStreetMap) service. Rate-limited to ~1 req/sec
per their usage policy. Includes a meaningful User-Agent.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.parse
import urllib.request

NOMINATIM = "https://nominatim.openstreetmap.org/search"
UA = "yoga-founders-network/1.0 (hello@yogafoundersnetwork.com)"
DELAY_S = 1.1


def nominatim(q: str) -> tuple[float, float] | None:
    params = urllib.parse.urlencode({"q": q, "format": "json", "limit": 1})
    req = urllib.request.Request(
        f"{NOMINATIM}?{params}",
        headers={"User-Agent": UA, "Accept-Language": "en"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.loads(r.read())
    except Exception as e:
        print(f"  ! nominatim failed for {q!r}: {e}")
        return None
    if not data:
        return None
    try:
        return float(data[0]["lat"]), float(data[0]["lon"])
    except (KeyError, ValueError, IndexError):
        return None


def main() -> int:
    sup = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not sup or not key:
        print("error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required", file=sys.stderr)
        return 1

    url = f"{sup}/rest/v1/listings?select=id,name,address,city,country&latitude=is.null&address=not.is.null&limit=1000"
    req = urllib.request.Request(url, headers={"apikey": key, "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        rows = json.loads(r.read())
    print(f"Geocoding {len(rows)} listings…")

    geocoded = 0
    skipped = 0
    for row in rows:
        parts = [row.get("address"), row.get("city"), row.get("country")]
        q = ", ".join(p for p in parts if p)
        print(f"→ {row['name']:<40} {q}")
        coords = nominatim(q)

        # Try city-only as fallback if street-level fails
        if not coords and row.get("city"):
            time.sleep(DELAY_S)
            fallback_q = ", ".join(p for p in [row.get("city"), row.get("country")] if p)
            print(f"  retry city-only: {fallback_q}")
            coords = nominatim(fallback_q)

        if not coords:
            print(f"  - no match")
            skipped += 1
        else:
            lat, lon = coords
            print(f"  + {lat:.5f}, {lon:.5f}")
            patch = json.dumps({"latitude": lat, "longitude": lon}).encode()
            pr = urllib.request.Request(
                f"{sup}/rest/v1/listings?id=eq.{row['id']}",
                data=patch,
                method="PATCH",
                headers={
                    "apikey": key,
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
            )
            try:
                urllib.request.urlopen(pr, timeout=30)
                geocoded += 1
            except Exception as e:
                print(f"  ! patch failed: {e}")
                skipped += 1

        time.sleep(DELAY_S)

    print(f"\nGeocoded {geocoded}, skipped {skipped}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
