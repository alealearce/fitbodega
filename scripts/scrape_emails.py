#!/usr/bin/env python3
"""Backfill listing email addresses.

For every approved listing that lacks an `email`:
  1. If a `website` is on file, scrape the homepage + /contact /about pages
     for mailto links or text emails. Prefer emails on the listing's own
     domain.
  2. Otherwise (or as a fallback if scrape returns nothing), do a
     DuckDuckGo HTML search ("<name> <city> contact email") and scrape
     the top 3 result pages the same way.

Polite throttling: 1.2s between hosts. Skips noreply / wix / facebook /
google addresses and dummy spam patterns.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from typing import Iterable
from urllib.error import HTTPError, URLError

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0 Safari/537.36 "
    "yoga-founders-network/1.0 (hello@yogafoundersnetwork.com)"
)
DELAY_S = 1.2
TIMEOUT = 12

EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b")
MAILTO_RE = re.compile(r'mailto:([^\s"\'<>?#&]+)', re.I)

BLOCKED_DOMAINS = {
    "sentry.io", "wixpress.com", "wix.com", "squarespace.com",
    "shopify.com", "facebook.com", "gmail.com", "googlemail.com",
    "outlook.com", "yahoo.com", "hotmail.com", "icloud.com",
    "example.com", "domain.com",
}
BLOCKED_PREFIXES = (
    "noreply", "no-reply", "do-not-reply", "donotreply",
    "abuse", "postmaster", "mailer-daemon", "support@wix",
    "feedback", "spam", "privacy", "press@sentry",
)

CONTACT_PATHS = ["", "/contact", "/contact-us", "/contact/", "/about", "/about-us"]


def fetch(url: str) -> str | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            ct = r.headers.get("Content-Type", "")
            if "html" not in ct and "text" not in ct:
                return None
            raw = r.read(800_000)
            try:
                return raw.decode(r.headers.get_content_charset() or "utf-8", errors="ignore")
            except Exception:
                return raw.decode("utf-8", errors="ignore")
    except (HTTPError, URLError, TimeoutError, ConnectionResetError):
        return None
    except Exception:
        return None


def origin_of(url: str) -> str | None:
    try:
        p = urllib.parse.urlparse(url if "://" in url else "https://" + url)
        if not p.netloc:
            return None
        return f"{p.scheme or 'https'}://{p.netloc}"
    except Exception:
        return None


def domain_of_email(e: str) -> str:
    return e.rsplit("@", 1)[-1].lower()


def is_acceptable(email: str) -> bool:
    e = email.lower()
    if any(e.startswith(p) for p in BLOCKED_PREFIXES):
        return False
    dom = domain_of_email(e)
    if dom in BLOCKED_DOMAINS:
        return False
    # Reject suffixes that look like sample/template addresses
    if e in {"you@example.com", "name@email.com"}:
        return False
    if "..." in e or ".png" in e or ".jpg" in e:
        return False
    return True


def emails_from_html(html: str) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    for m in MAILTO_RE.findall(html):
        # mailto can have query string ?subject=...
        addr = m.split("?", 1)[0].strip().lower()
        if addr and addr not in seen and is_acceptable(addr):
            seen.add(addr)
            found.append(addr)
    for m in EMAIL_RE.findall(html):
        addr = m.strip().lower()
        if addr not in seen and is_acceptable(addr):
            seen.add(addr)
            found.append(addr)
    return found


def best_email(candidates: list[str], domain: str | None) -> str | None:
    if not candidates:
        return None
    # Score: own-domain > role-based local part > shorter
    role_prefixes = ("info@", "hello@", "contact@", "hi@", "team@", "office@", "studio@", "yoga@")

    def score(e: str) -> tuple[int, int, int]:
        own = domain and domain in domain_of_email(e)
        role = e.startswith(role_prefixes)
        # Lower = better
        return (0 if own else 1, 0 if role else 1, len(e))

    return sorted(candidates, key=score)[0]


def scrape_website(website: str) -> str | None:
    origin = origin_of(website)
    if not origin:
        return None
    domain = origin.split("://", 1)[1].lstrip("www.")
    all_emails: list[str] = []
    for path in CONTACT_PATHS:
        url = origin + path
        html = fetch(url)
        if not html:
            continue
        all_emails.extend(emails_from_html(html))
        time.sleep(DELAY_S)
        if any(domain in domain_of_email(e) for e in all_emails):
            break  # Found own-domain email; stop early
    return best_email(list(dict.fromkeys(all_emails)), domain)


def ddg_search(query: str, limit: int = 3) -> list[str]:
    q = urllib.parse.urlencode({"q": query})
    url = f"https://html.duckduckgo.com/html/?{q}"
    html = fetch(url)
    if not html:
        return []
    # Result-link href is wrapped in a redirect; capture the uddg= target URLs
    targets = re.findall(r'uddg=([^&"\']+)', html)
    out: list[str] = []
    seen: set[str] = set()
    for t in targets:
        try:
            decoded = urllib.parse.unquote(t)
        except Exception:
            continue
        # Skip cluster / image results
        if "duckduckgo.com" in decoded:
            continue
        host = origin_of(decoded)
        if not host or host in seen:
            continue
        seen.add(host)
        out.append(decoded)
        if len(out) >= limit:
            break
    return out


def main() -> int:
    sup = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not sup or not key:
        print("error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required", file=sys.stderr)
        return 1

    only_with_website = "--only-website" in sys.argv  # convenience flag

    select = "id,name,city,country,website"
    where = "status=eq.approved&email=is.null"
    if only_with_website:
        where += "&website=not.is.null"
    url = f"{sup}/rest/v1/listings?select={select}&{where}&limit=1000"
    req = urllib.request.Request(url, headers={"apikey": key, "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        rows = json.loads(r.read())

    print(f"Targeting {len(rows)} listings without email…\n")
    found_via_site = 0
    found_via_search = 0
    skipped = 0

    for i, row in enumerate(rows, 1):
        prefix = f"[{i}/{len(rows)}] {row['name'][:38]:<38}"
        email: str | None = None

        if row.get("website"):
            email = scrape_website(row["website"])

        if not email:
            q = " ".join(p for p in [row.get("name"), row.get("city"), "yoga", "email contact"] if p)
            urls = ddg_search(q, limit=3)
            time.sleep(DELAY_S)
            agg: list[str] = []
            for u in urls:
                html = fetch(u)
                if html:
                    agg.extend(emails_from_html(html))
                time.sleep(DELAY_S)
            domain_hint = None
            if row.get("website"):
                o = origin_of(row["website"])
                if o:
                    domain_hint = o.split("://", 1)[1].lstrip("www.")
            email = best_email(list(dict.fromkeys(agg)), domain_hint)
            if email:
                found_via_search += 1
        else:
            found_via_site += 1

        if not email:
            print(f"{prefix} — no email")
            skipped += 1
            continue

        print(f"{prefix} -> {email}")
        patch = json.dumps({"email": email}).encode()
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
        except Exception as e:
            print(f"   ! patch failed: {e}")

    total = found_via_site + found_via_search
    print(f"\nBackfilled {total} emails ({found_via_site} from listing website, "
          f"{found_via_search} from DDG search). Skipped {skipped}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
