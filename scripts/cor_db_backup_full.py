#!/usr/bin/env python3
"""
FULL COR Supabase backup using the service_role key (RLS-bypassing).

Reads the key from env var COR_SR (never hardcoded / never written to repo).
Captures, for the project:
  * every row of every table/view in the PostgREST-exposed schema (RLS bypassed)
  * the real column names + types (from the OpenAPI spec, not inferred)
  * the raw OpenAPI spec
  * Storage buckets + object listings (if any)
  * Auth users (if any)
Verifies row counts and diffs them against a prior anon backup if given.

Usage:
  COR_SR=<service_role_jwt> python3 scripts/cor_db_backup_full.py [prior_anon_backup_dir]
"""
import json, os, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone

REF = "usgsgroxdblteosyxary"
HOST = f"https://{REF}.supabase.co"
BASE = f"{HOST}/rest/v1"
PAGE = 1000
KEY = os.environ["COR_SR"]
HDRS = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}


def req(url, headers=None, method="GET", data=None):
    h = dict(HDRS)
    if headers:
        h.update(headers)
    body = json.dumps(data).encode() if data is not None else None
    r = urllib.request.Request(url, headers=h, method=method, data=body)
    with urllib.request.urlopen(r, timeout=90) as resp:
        return resp.read(), dict(resp.headers), resp.status


def try_req(url, **kw):
    try:
        b, h, s = req(url, **kw)
        return json.loads(b) if b else None, s, None
    except urllib.error.HTTPError as e:
        return None, e.code, e.read().decode(errors="replace")[:300]
    except Exception as e:
        return None, None, str(e)[:300]


def exact_count(table):
    _, h, _ = req(f"{BASE}/{table}?select=*&limit=1",
                  {"Range": "0-0", "Prefer": "count=exact"})
    cr = h.get("Content-Range", "")
    return int(cr.split("/")[-1]) if "/" in cr else None


def order_col(cols):
    for pref in ("id", "uuid", "pk", "created_at", "slug", "code"):
        if pref in cols:
            return pref
    return cols[0] if cols else None


def dump_table(table, spec_cols):
    expected = exact_count(table)
    col = order_col(spec_cols or [])
    order = f"&order={col}.asc" if col else ""
    rows, offset = [], 0
    while True:
        b, _, _ = req(f"{BASE}/{table}?select=*{order}&limit={PAGE}&offset={offset}")
        page = json.loads(b)
        rows.extend(page)
        if len(page) < PAGE:
            break
        offset += PAGE
        time.sleep(0.04)
    return rows, expected, col


def main():
    prior = sys.argv[1] if len(sys.argv) > 1 else None
    prior_counts = {}
    if prior and os.path.exists(os.path.join(prior, "MANIFEST.json")):
        pm = json.load(open(os.path.join(prior, "MANIFEST.json")))
        prior_counts = {t: d["rows"] for t, d in pm["tables"].items()}

    spec = json.load(open("/tmp/cor_spec_sr.json"))
    defs = spec.get("definitions", {})
    tables = sorted(defs.keys())
    # column name -> type map per table
    schema = {t: {c: p.get("format", p.get("type", "?"))
                  for c, p in defs[t].get("properties", {}).items()}
              for t in tables}

    stamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    root = os.path.expanduser(f"~/Desktop/COR_DB_BACKUP_FULL_{stamp}")
    for sub in ("v1", "v2", "schema", "_meta"):
        os.makedirs(os.path.join(root, sub), exist_ok=True)

    # raw spec + per-table schema
    json.dump(spec, open(os.path.join(root, "_meta", "openapi.json"), "w"),
              ensure_ascii=False, indent=2)
    json.dump(schema, open(os.path.join(root, "schema", "columns.json"), "w"),
              ensure_ascii=False, indent=2)

    manifest = {
        "source": BASE, "project_ref": REF,
        "captured_at_utc": datetime.now(timezone.utc).isoformat(),
        "captured_via": "service_role key / PostgREST (RLS bypassed)",
        "tables": {},
    }
    total = 0
    print(f"{'TABLE':32} {'VER':4} {'ROWS':>7} {'EXPECT':>7} {'vsANON':>8}")
    for t in tables:
        ver = "v2" if t.startswith("v2_") else "v1"
        rows, expected, col = dump_table(t, list(schema[t].keys()))
        path = os.path.join(root, ver, f"{t}.json")
        json.dump(rows, open(path, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
        ok = expected is None or len(rows) == expected
        diff = ""
        if t in prior_counts:
            d = len(rows) - prior_counts[t]
            diff = "same" if d == 0 else f"+{d}" if d > 0 else str(d)
        total += len(rows)
        manifest["tables"][t] = {
            "version": ver, "rows": len(rows), "expected": expected,
            "verified": ok, "ordered_by": col,
            "columns": schema[t], "anon_rows": prior_counts.get(t),
            "rls_hidden_rows": (len(rows) - prior_counts[t]) if t in prior_counts else None,
            "file": f"{ver}/{t}.json", "bytes": os.path.getsize(path),
        }
        flag = "" if ok else "  *** COUNT MISMATCH ***"
        print(f"{t:32} {ver:4} {len(rows):7d} {str(expected):>7} {diff:>8}{flag}")

    # ---- Storage ----
    storage = {}
    buckets, sc, err = try_req(f"{HOST}/storage/v1/bucket")
    if isinstance(buckets, list):
        storage["buckets"] = buckets
        storage["objects"] = {}
        for b in buckets:
            name = b.get("name") or b.get("id")
            objs, _, _ = try_req(f"{HOST}/storage/v1/object/list/{name}",
                                 method="POST",
                                 data={"prefix": "", "limit": 1000,
                                       "sortBy": {"column": "name", "order": "asc"}})
            storage["objects"][name] = objs if isinstance(objs, list) else []
        nobj = sum(len(v) for v in storage["objects"].values())
        print(f"\nStorage: {len(buckets)} bucket(s), {nobj} object(s)")
    else:
        storage = {"error": f"status={sc}", "detail": err}
        print(f"\nStorage: not accessible (status={sc})")
    json.dump(storage, open(os.path.join(root, "_meta", "storage.json"), "w"),
              ensure_ascii=False, indent=2)

    # ---- Auth users ----
    users_all, page = [], 1
    auth_err = None
    while True:
        u, sc, err = try_req(f"{HOST}/auth/v1/admin/users?page={page}&per_page=1000")
        if u is None:
            auth_err = f"status={sc} {err}"
            break
        batch = u.get("users", u) if isinstance(u, dict) else u
        if not batch:
            break
        users_all.extend(batch)
        if len(batch) < 1000:
            break
        page += 1
    json.dump(users_all if not auth_err else {"error": auth_err},
              open(os.path.join(root, "_meta", "auth_users.json"), "w"),
              ensure_ascii=False, indent=2)
    print(f"Auth users: {len(users_all)}" if not auth_err
          else f"Auth users: not accessible ({auth_err})")

    manifest["total_tables"] = len(tables)
    manifest["total_rows"] = total
    manifest["storage_buckets"] = len(storage.get("buckets", [])) if "buckets" in storage else 0
    manifest["auth_users"] = len(users_all)
    json.dump(manifest, open(os.path.join(root, "MANIFEST.json"), "w"),
              ensure_ascii=False, indent=2)

    print(f"\nTotal: {len(tables)} tables, {total} rows")
    print(f"Backup root: {root}")
    open("/tmp/cor_backup_full_path.txt", "w").write(root)


if __name__ == "__main__":
    main()
