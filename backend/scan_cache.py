"""Scan result cache.

Uses Supabase (Postgres) when SUPABASE_URL + SUPABASE_SERVICE_KEY are set —
required for public deployment where local disk is ephemeral. Falls back to
a local JSON file for development.

Supabase table (run once in the SQL editor):

    create table if not exists scan_cache (
        key text primary key,
        result jsonb not null,
        created_at timestamptz not null default now()
    );
    alter table scan_cache enable row level security;
    -- no public policies: only the service role key (backend) can read/write
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path

import requests

logger = logging.getLogger("arogya.cache")

_LOCAL_FILE = Path(__file__).resolve().parent / "scan_cache.json"
_MAX_LOCAL_ENTRIES = 500


def _supabase_url() -> str:
    # Read at call time: .env is loaded by app_main after this module is imported
    return (os.getenv("SUPABASE_URL") or "").rstrip("/")


def _service_key() -> str:
    return os.getenv("SUPABASE_SERVICE_KEY") or ""


def _supabase_enabled() -> bool:
    return bool(_supabase_url() and _service_key())


def _headers() -> dict[str, str]:
    key = _service_key()
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def cache_get(key: str) -> dict | None:
    if _supabase_enabled():
        try:
            resp = requests.get(
                f"{_supabase_url()}/rest/v1/scan_cache",
                params={"key": f"eq.{key}", "select": "result"},
                headers=_headers(),
                timeout=6,
            )
            resp.raise_for_status()
            rows = resp.json()
            if rows:
                return rows[0]["result"]
        except requests.RequestException as exc:
            logger.warning("Supabase cache read failed: %s", exc)
        return None

    try:
        return json.loads(_LOCAL_FILE.read_text(encoding="utf-8")).get(key)
    except (OSError, json.JSONDecodeError):
        return None


def cache_set(key: str, result: dict) -> None:
    if _supabase_enabled():
        try:
            resp = requests.post(
                f"{_supabase_url()}/rest/v1/scan_cache",
                params={"on_conflict": "key"},
                headers={**_headers(), "Prefer": "resolution=merge-duplicates"},
                json={"key": key, "result": result},
                timeout=6,
            )
            resp.raise_for_status()
        except requests.RequestException as exc:
            logger.warning("Supabase cache write failed: %s", exc)
        return

    try:
        cache = json.loads(_LOCAL_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        cache = {}
    cache[key] = result
    if len(cache) > _MAX_LOCAL_ENTRIES:
        for old_key in list(cache.keys())[: len(cache) - _MAX_LOCAL_ENTRIES]:
            cache.pop(old_key, None)
    try:
        _LOCAL_FILE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
    except OSError as exc:
        logger.warning("Could not write local scan cache: %s", exc)
