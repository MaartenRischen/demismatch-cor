#!/usr/bin/env python3
"""
Hypercomplete backup of the COR Supabase database via the public PostgREST API.

Dumps every anon-readable table (v2 = live spec, v1 = frozen reference) to JSON,
fully paginated, with per-row-count verification and a manifest.

Only the anon key is available locally, so this captures everything the public
API exposes (every row of every anon-readable table). A *server-side* dump that
also includes RLS-protected rows / functions / policies / storage would require
the service_role key or a Postgres connection string (pg_dump) -- neither is
present on this machine.
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZ3Nncm94ZGJsdGVvc3l4YXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTkyNjksImV4cCI6MjA5MDY5NTI2OX0.xuZOTQHtA8u1t8uBHwkcJevfniqf3QttioxFc1yKMMU"
BASE = "https://usgsgroxdblteosyxary.supabase.co/rest/v1"
PAGE = 1000

# table -> "v1" | "v2"
TABLES = {
    # v2 — live specification (read targets)
    "v2_foundations": "v2", "v2_researchers": "v2", "v2_foundation_researchers": "v2",
    "v2_works": "v2", "v2_extractions": "v2", "v2_convergences": "v2",
    "v2_mechanisms": "v2", "v2_mechanism_evidence": "v2", "v2_bridge_theses": "v2",
    "v2_empirical_demonstrations": "v2", "v2_applications": "v2", "v2_domains": "v2",
    "v2_gaps": "v2",
    # v1 — frozen reference
    "foundations": "v1", "researchers": "v1", "foundation_researchers": "v1",
    "works": "v1", "extractions": "v1", "convergences": "v1", "mechanisms": "v1",
    "mechanism_evidence": "v1", "domains": "v1", "gaps": "v1",
}


def req(url, extra_headers=None):
    headers = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
    if extra_headers:
        headers.update(extra_headers)
    r = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(r, timeout=60) as resp:
        return resp.read(), dict(resp.headers)


def exact_count(table):
    _, h = req(f"{BASE}/{table}?select=*&limit=1",
               {"Range": "0-0", "Prefer": "count=exact"})
    cr = h.get("Content-Range") or h.get("content-range") or ""
    return int(cr.split("/")[-1]) if "/" in cr else None


def order_col(table):
    """Pick a stable column to order by so offset pagination is consistent."""
    body, _ = req(f"{BASE}/{table}?select=*&limit=1")
    rows = json.loads(body)
    if not rows:
        return None
    keys = list(rows[0].keys())
    for pref in ("id", "uuid", "pk", "created_at", "slug", "code"):
        if pref in keys:
            return pref
    return keys[0]


def dump_table(table):
    expected = exact_count(table)
    col = order_col(table)
    order = f"&order={col}.asc" if col else ""
    rows = []
    offset = 0
    while True:
        body, _ = req(f"{BASE}/{table}?select=*{order}&limit={PAGE}&offset={offset}")
        page = json.loads(body)
        rows.extend(page)
        if len(page) < PAGE:
            break
        offset += PAGE
        time.sleep(0.05)
    columns = sorted({k for r in rows for k in r.keys()})
    return rows, expected, col, columns


def main():
    stamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    root = os.path.expanduser(f"~/Desktop/COR_DB_BACKUP_{stamp}")
    for sub in ("v1", "v2"):
        os.makedirs(os.path.join(root, sub), exist_ok=True)

    manifest = {
        "source": BASE,
        "project_ref": "usgsgroxdblteosyxary",
        "captured_at_utc": datetime.now(timezone.utc).isoformat(),
        "captured_via": "anon key / PostgREST (public API)",
        "note": ("Complete export of every anon-readable row of every anon-readable "
                 "table. RLS-protected rows, DB functions, policies, and storage are "
                 "NOT included (would require service_role / pg_dump)."),
        "tables": {},
    }
    total_rows = 0
    print(f"{'TABLE':32} {'VER':4} {'GOT':>7} {'EXPECT':>7}  OK")
    for table, ver in TABLES.items():
        rows, expected, col, columns = dump_table(table)
        path = os.path.join(root, ver, f"{table}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)
        ok = (expected is None) or (len(rows) == expected)
        total_rows += len(rows)
        manifest["tables"][table] = {
            "version": ver,
            "rows": len(rows),
            "expected": expected,
            "verified": ok,
            "ordered_by": col,
            "columns": columns,
            "file": f"{ver}/{table}.json",
            "bytes": os.path.getsize(path),
        }
        print(f"{table:32} {ver:4} {len(rows):7d} {str(expected):>7}  {'YES' if ok else '*** MISMATCH ***'}")

    manifest["total_tables"] = len(TABLES)
    manifest["total_rows"] = total_rows
    with open(os.path.join(root, "MANIFEST.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"\nTotal: {len(TABLES)} tables, {total_rows} rows")
    print(f"Backup root: {root}")
    # write path for the shell to pick up
    with open("/tmp/cor_backup_path.txt", "w") as f:
        f.write(root)


if __name__ == "__main__":
    main()
