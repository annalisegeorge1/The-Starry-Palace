#!/usr/bin/env python3
"""PostgREST security smoke tests against an EPHEMERAL synthetic database only.

Uses a newly generated CI-only HMAC key. No user accounts, production secrets,
Supabase keys, or private writing are required or loaded.
PostgREST validates real signed JWTs; Supabase GoTrue and Storage are not used.
"""
import base64
import hashlib
import hmac
import json
import os
import time
import urllib.error
import urllib.request

ROOT = "http://127.0.0.1:3000"
SECRET = os.environ["PALACE_TEST_JWT_SECRET"].encode("utf-8")
OWNER = "00000000-0000-0000-0000-000000000001"
ADULT = "00000000-0000-0000-0000-000000000002"
YOUNG = "00000000-0000-0000-0000-000000000003"
EDITOR = "00000000-0000-0000-0000-000000000004"
PUBLIC = "10000000-0000-0000-0000-000000000001"
PRIVATE = "10000000-0000-0000-0000-000000000002"
MEMBERS = "10000000-0000-0000-0000-000000000003"
ADULT_WORK = "10000000-0000-0000-0000-000000000004"
DRAFT_CHAPTER = "20000000-0000-0000-0000-000000000002"
EDITOR_CHAPTER = "20000000-0000-0000-0000-000000000005"
checks = 0


def b64(value):
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def token(user, *, signing_secret=SECRET, expires_in=600):
    header = b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    claims = {"role": "authenticated", "sub": user, "exp": int(time.time()) + expires_in}
    payload = b64(json.dumps(claims, separators=(",", ":")).encode())
    message = f"{header}.{payload}"
    signature = b64(hmac.new(signing_secret, message.encode("ascii"), hashlib.sha256).digest())
    return f"{message}.{signature}"


def call(path, *, user=None, raw_jwt=None, verb="GET", body=None, prefer=None, profile=None):
    headers = {"Accept": "application/json"}
    if profile:
        headers["Accept-Profile" if verb in ("GET", "HEAD") else "Content-Profile"] = profile
    if user:
        headers["Authorization"] = "Bearer " + token(user)
    if raw_jwt:
        headers["Authorization"] = "Bearer " + raw_jwt
    if body is not None:
        headers["Content-Type"] = "application/json"
    if prefer:
        headers["Prefer"] = prefer
    req = urllib.request.Request(
        ROOT + path,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers=headers,
        method=verb,
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            code, raw = resp.status, resp.read()
    except urllib.error.HTTPError as e:
        code, raw = e.code, e.read()
    try:
        value = json.loads(raw.decode("utf-8")) if raw.strip() else None
    except ValueError:
        value = raw.decode("utf-8", errors="replace")[:400]
    return code, value


def expect(name, path, *, user=None, raw_jwt=None, verb="GET", body=None,
           status=200, predicate=None, prefer=None, profile=None):
    global checks
    code, value = call(path, user=user, raw_jwt=raw_jwt,
                       verb=verb, body=body, prefer=prefer, profile=profile)
    if code != status or (predicate is not None and not predicate(value)):
        raise AssertionError(f"{name}: expected {status} and predicate, got status={code}, body={value!r}")
    checks += 1


def rpc(name, params, *, user=None, predicate=None):
    return expect(name, "/rpc/" + name, user=user, verb="POST",
                  body=params, predicate=predicate)


def age_count(count):
    return lambda values: isinstance(values, list) and len(values) == count


def praise_kind(kind, qty):
    return lambda v: isinstance(v, dict) and v.get("counts", {}).get(kind) == qty


expect("Guest reads one public work", "/works?select=id", predicate=age_count(1))
expect("Guest reads one public chapter", "/chapters?select=id", predicate=age_count(1))
expect("Younger member sees only 12+/13+", "/works?select=id", user=YOUNG, predicate=age_count(2))
expect("Younger member chapter visibility", "/chapters?select=id", user=YOUNG, predicate=age_count(2))
expect("Adult sees public 12+/13+/18+", "/works?select=id", user=ADULT, predicate=age_count(3))
expect("Adult is denied private draft", "/works?select=id&id=eq." + PRIVATE,
       user=ADULT, predicate=age_count(0))
expect("Editor sees assigned private chapter", "/chapters?select=id&id=eq." + EDITOR_CHAPTER,
       user=EDITOR, predicate=age_count(1))
expect("Author sees own draft", "/works?select=id&id=eq." + PRIVATE,
       user=OWNER, predicate=age_count(1))

expect("Adult cannot PATCH author's private draft", "/works?id=eq." + PRIVATE,
       user=ADULT, verb="PATCH", body={"visibility": "public"},
       prefer="return=representation", predicate=age_count(0))
expect("Author can safely PATCH own private draft", "/works?id=eq." + PRIVATE,
       user=OWNER, verb="PATCH", body={"visibility": "private"},
       prefer="return=representation", predicate=age_count(1))

rpc("get_palace_praise_state", {"p_target_kind": "work", "p_target_id": PRIVATE},
    predicate=praise_kind("crown", 0))
rpc("get_palace_praise_state", {"p_target_kind": "work", "p_target_id": PRIVATE},
    user=OWNER, predicate=praise_kind("crown", 1))
rpc("get_palace_praise_state", {"p_target_kind": "work", "p_target_id": ADULT_WORK},
    user=YOUNG, predicate=praise_kind("star", 0))
rpc("get_palace_praise_state", {"p_target_kind": "work", "p_target_id": ADULT_WORK},
    user=ADULT, predicate=praise_kind("star", 1))

rpc("get_reading_room_bookmark_counts", {"p_work_ids": [ADULT_WORK]},
    predicate=age_count(0))
rpc("get_reading_room_bookmark_counts", {"p_work_ids": [ADULT_WORK]},
    user=ADULT, predicate=lambda v: isinstance(v, list) and len(v) == 1 and v[0]["bookmark_count"] == 1)

rpc("get_grand_palace_identity", {"p_member": OWNER},
    user=ADULT, predicate=lambda v: v is None)
rpc("get_grand_palace_identity", {"p_member": OWNER},
    user=OWNER, predicate=lambda v: isinstance(v, dict) and v.get("palace_name") == "Synthetic Palace")

rpc("get_work_lore", {"p_work_id": PUBLIC},
    predicate=lambda v: isinstance(v, list) and len(v) == 1
                        and v[0]["unlock_chapter_id"] is None
                        and v[0]["unlock_chapter"] is None)
rpc("get_work_lore", {"p_work_id": PUBLIC},
    user=OWNER, predicate=lambda v: isinstance(v, list) and len(v) == 1
                                    and v[0]["unlock_chapter_id"] == DRAFT_CHAPTER)

rpc("search_palace_tags_v2", {"p_query": "DraftOnlyTag", "p_category": "genre", "p_limit": 10},
    predicate=lambda v: isinstance(v, list) and len(v) == 1 and v[0]["usage_count"] == 0)
rpc("search_palace_tags_v2", {"p_query": "AdultTag", "p_category": "genre", "p_limit": 10},
    user=ADULT, predicate=lambda v: isinstance(v, list) and len(v) == 1 and v[0]["usage_count"] == 2)
rpc("search_palace_tags_v2", {"p_query": "AdultTag", "p_category": "genre", "p_limit": 10},
    user=YOUNG, predicate=lambda v: isinstance(v, list) and len(v) == 1 and v[0]["usage_count"] == 0)

expect("Forged JWT signature is rejected", "/works?select=id",
       raw_jwt=token(OWNER, signing_secret=b"bad-secret-not-the-ci-key"),
       status=401)
expect("Expired JWT is rejected", "/works?select=id",
       raw_jwt=token(OWNER, expires_in=-3600), status=401)


# Test-only PostgREST additionally exposes the synthetic storage.objects table.
# This is an HTTP/JWT check of PostgreSQL metadata RLS, NOT the managed Supabase
# Storage download, signed-URL, transformation or upload service.
def storage_count(bucket, expected, *, user=None, label=None):
    name = label or (user or "guest")
    expect(f"Storage metadata {bucket} ({name})",
           "/objects?select=bucket_id,name&bucket_id=eq." + bucket,
           user=user, profile="storage", predicate=age_count(expected))


storage_count("comic-covers", 1, label="guest public covers only")
storage_count("comic-pages", 1, label="guest public reader page only")
storage_count("comic-originals", 0, label="guest cannot read original artwork")
storage_count("palace-chat-photos", 0, label="guest cannot read private chat photos")
storage_count("comic-covers", 2, user=YOUNG)
storage_count("comic-pages", 1, user=YOUNG)
storage_count("comic-originals", 0, user=YOUNG)
storage_count("palace-chat-photos", 0, user=YOUNG)
storage_count("comic-covers", 3, user=ADULT)
storage_count("comic-pages", 2, user=ADULT)
storage_count("comic-originals", 1, user=ADULT, label="only own original")
storage_count("palace-chat-photos", 1, user=ADULT, label="direct chat member")
storage_count("comic-originals", 0, user=EDITOR)
storage_count("palace-chat-photos", 1, user=EDITOR, label="group chat member")
storage_count("comic-originals", 3, user=OWNER, label="owner original assets")
storage_count("palace-chat-photos", 3, user=OWNER, label="owner direct + group photos")
# Neither a stranger nor a public reader can upload into someone else's folder.
expect("Unrelated user cannot insert into another creator's originals",
       "/objects?select=bucket_id,name", user=YOUNG, profile="storage",
       verb="POST",
       body={"bucket_id": "comic-originals",
             "name": OWNER + "/unauthorised-ci-example.png"},
       status=403)

print(f"PASS: {checks} synthetic HTTP/JWT/PostgREST access-control checks.")
