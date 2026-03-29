from __future__ import annotations

import os
import csv
import json
import random
import smtplib
import hmac
import hashlib
import base64
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient

from models import (
    AdminPassRequest,
    SaveDraftRequest,
    SendOtpRequest,
    SubmitNominationsRequest,
    SubmitVotesRequest,
    VerifyOtpRequest,
)
from settings import Settings


ALLOWED_CATEGORY_IDS = {str(i) for i in range(1, 50)}

DEFAULT_STATE: Dict[str, Any] = {
    "_id": "singleton",
    "phase": "nominating",  # nominating | voting | results
    "nominations": {},  # categoryId -> { nomineeLower -> count }
    "nominators_lower": [],  # stores anonymized subject hashes
    "finalists": {},  # categoryId -> [ nomineeLower, ... ]
    "votes": {},  # categoryId -> { nomineeLower -> count }
    "voted_lower": [],  # stores anonymized subject hashes
}


def normalize_name(name: str) -> str:
    return name.strip()

def normalize_roll(roll: str) -> str:
    if "|" in roll:
        parts = roll.split("|")
        norm_parts = ["".join(ch for ch in p.strip() if ch.isdigit()) for p in parts]
        return "|".join(norm_parts)
    return "".join(ch for ch in normalize_name(roll) if ch.isdigit())


def normalize_name_lower(name: str) -> str:
    return normalize_name(name).lower()


def utcnow() -> datetime:
    return datetime.utcnow()


def compute_subject_hash(roll: str) -> str:
    normalized = normalize_roll(roll)
    if not normalized:
        raise HTTPException(status_code=400, detail="Invalid roll number")
    return hmac.new(
        settings.session_secret.encode("utf-8"),
        normalized.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def sign_session(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    body = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
    sig = hmac.new(settings.session_secret.encode("utf-8"), body.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{body}.{sig}"


def unsign_session(token: str) -> dict[str, Any] | None:
    try:
        body, sig = token.rsplit(".", 1)
    except ValueError:
        return None
    expected = hmac.new(settings.session_secret.encode("utf-8"), body.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return None
    padded = body + "=" * (-len(body) % 4)
    try:
        payload = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")))
    except Exception:
        return None
    if int(payload.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
        return None
    return payload


def issue_session(response: Response, *, role: str, roll: str = "") -> None:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.session_ttl_hours)
    payload: dict[str, Any] = {
        "role": role,
        "exp": int(expires_at.timestamp()),
    }
    if role == "student":
        normalized_roll = normalize_roll(roll)
        payload["roll"] = normalized_roll
        payload["subject"] = compute_subject_hash(normalized_roll)
    token = sign_session(payload)
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="strict",
        max_age=settings.session_ttl_hours * 3600,
        path="/",
    )


def clear_session(response: Response) -> None:
    response.delete_cookie(settings.session_cookie_name, path="/")


def get_session(request: Request) -> dict[str, Any]:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = unsign_session(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    return payload


def require_student_session(request: Request) -> dict[str, Any]:
    payload = get_session(request)
    if payload.get("role") != "student":
        raise HTTPException(status_code=403, detail="Student session required")
    return payload


def require_admin_session(request: Request) -> dict[str, Any]:
    payload = get_session(request)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin session required")
    return payload


def compute_top5(nominee_counts: Dict[str, int]) -> list[str]:
    # Match the frontend behavior (count-desc), with deterministic tie-break.
    sorted_items = sorted(
        nominee_counts.items(),
        key=lambda kv: (-int(kv[1]), kv[0]),
    )
    return [k for k, _ in sorted_items[:5]]

def load_student_emails() -> Dict[str, str]:
    emails = {}
    csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "students.csv")
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                roll = row.get("Roll Number", "").strip()
                email = row.get("Permanent Email ID ", "").strip()
                if roll and email:
                    norm_roll = normalize_roll(roll)
                    if norm_roll:
                        emails[norm_roll] = email
    except Exception as e:
        print("Warning: failed to load students.csv:", e)
    return emails

STUDENT_EMAILS = load_student_emails()

app = FastAPI(title="Class Awards API")

settings = Settings()

mongo_client = AsyncIOMotorClient(settings.mongodb_uri)
collection = mongo_client[settings.mongodb_db][settings.mongodb_collection]

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins(),
    # Keep this false so `CORS_ORIGINS="*"` works in browsers.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def ensure_state_doc() -> None:
    await collection.update_one(
        {"_id": DEFAULT_STATE["_id"]},
        {"$setOnInsert": DEFAULT_STATE},
        upsert=True,
    )


async def get_state() -> Dict[str, Any]:
    await ensure_state_doc()
    doc = await collection.find_one({"_id": DEFAULT_STATE["_id"]})
    # Should never be None because ensure_state_doc uses $setOnInsert
    return doc or dict(DEFAULT_STATE)


def require_admin(admin_pass: str) -> None:
    if admin_pass != settings.admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin password")


# ─── OTP helpers ─────────────────────────────────────
otp_collection = mongo_client[settings.mongodb_db]["otp_store"]
drafts_collection = mongo_client[settings.mongodb_db]["nomination_drafts"]
subjects_collection = mongo_client[settings.mongodb_db]["subjects"]


def generate_otp() -> str:
    """Generate a 6-digit numeric OTP."""
    return "{:06d}".format(random.randint(0, 999999))


def send_otp_email_sync(to_email: str, otp_code: str) -> None:
    """Send OTP email via SMTP. This is a blocking call."""
    if not settings.smtp_user or not settings.smtp_pass:
        raise HTTPException(status_code=500, detail="SMTP not configured (missing user or pass)")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Class Awards — Your verification code is {otp_code}"
    # Use From address if provided, otherwise fallback to smtp_user
    sender = settings.smtp_from or settings.smtp_user
    msg["From"] = sender
    msg["To"] = to_email

    html = f"""\
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #eee; border-radius: 16px;">
      <h2 style="color: #f5c842; text-align: center; margin-bottom: 24px;">🏆 Class Awards</h2>
      <p style="text-align: center; color: #333; font-size: 16px;">Your verification code is:</p>
      <div style="text-align: center; font-size: 38px; font-weight: 900; letter-spacing: 0.2em;
                  color: #1a1000; background: #fef9e7; border: 2px solid #f5c842;
                  padding: 20px 32px; border-radius: 14px; margin: 24px auto; display: inline-block;">
        {otp_code}
      </div>
      <p style="text-align: center; color: #777; font-size: 13px; line-height: 1.5; margin-top: 24px;">
        This code expires in 5 minutes.<br/>
        If this isn't generated by you, you can safely ignore this email.
      </p>
    </div>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        # Port 465 is for SSL from the start; 587 is for STARTTLS
        if settings.smtp_port == 465:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15) as server:
                server.login(settings.smtp_user, settings.smtp_pass)
                server.sendmail(sender, to_email, msg.as_string())
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_pass)
                server.sendmail(sender, to_email, msg.as_string())
    except Exception as e:
        print(f"CRITICAL: SMTP Error: {str(e)}")
        raise e


@app.post("/api/otp/send")
async def send_otp(req: SendOtpRequest) -> dict[str, Any]:
    roll = normalize_roll(req.roll)
    if not roll:
        raise HTTPException(status_code=400, detail="Roll is required")
        
    email = STUDENT_EMAILS.get(roll)
    if not email:
        raise HTTPException(status_code=400, detail="No email registered for this roll number")

    # Rate limit: don't allow resend within 60 seconds
    existing = await otp_collection.find_one({"_id": roll})
    if existing:
        created = existing.get("created_at")
        if created and (datetime.utcnow() - created).total_seconds() < 60:
            raise HTTPException(status_code=429, detail="Please wait before requesting a new OTP")

    otp_code = generate_otp()

    # Store OTP in MongoDB with TTL
    await otp_collection.update_one(
        {"_id": roll},
        {
            "$set": {
                "otp": otp_code,
                "email": email,
                "created_at": datetime.utcnow(),
                "attempts": 0,
            }
        },
        upsert=True,
    )

    # Send the email asynchronously without blocking the event loop
    try:
        import asyncio
        await asyncio.to_thread(send_otp_email_sync, email, otp_code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

    return {"ok": True, "message": "OTP sent to your email", "email": email}


@app.post("/api/otp/verify")
async def verify_otp(req: VerifyOtpRequest, response: Response) -> dict[str, Any]:
    roll = normalize_roll(req.roll)
    otp = normalize_name(req.otp)
    if not roll or not otp:
        raise HTTPException(status_code=400, detail="Roll and OTP are required")

    record = await otp_collection.find_one({"_id": roll})
    if not record:
        raise HTTPException(status_code=400, detail="No OTP found. Please request one first.")

    created = record.get("created_at")
    if created and (datetime.utcnow() - created).total_seconds() > 300:
        await otp_collection.delete_one({"_id": roll})
        raise HTTPException(status_code=410, detail="OTP has expired. Please request a new one.")

    attempts = record.get("attempts", 0)
    if attempts >= 5:
        await otp_collection.delete_one({"_id": roll})
        raise HTTPException(status_code=429, detail="Too many attempts. Please request a new OTP.")

    await otp_collection.update_one({"_id": roll}, {"$inc": {"attempts": 1}})

    if record.get("otp") != otp:
        raise HTTPException(status_code=401, detail=f"Incorrect OTP. {4 - attempts} attempts remaining.")

    await otp_collection.delete_one({"_id": roll})
    subject_hash = compute_subject_hash(roll)
    await subjects_collection.update_one(
        {"_id": subject_hash},
        {
            "$setOnInsert": {
                "nomination_submitted": False,
                "vote_submitted": False,
                "created_at": utcnow(),
            },
            "$set": {"updated_at": utcnow()},
        },
        upsert=True,
    )
    issue_session(response, role="student", roll=roll)
    return {"ok": True, "roll": roll}


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"ok": "true"}


@app.post("/api/auth/logout")
async def logout(response: Response) -> dict[str, bool]:
    clear_session(response)
    return {"ok": True}


@app.get("/api/me/status")
async def me_status(request: Request) -> dict[str, Any]:
    payload = get_session(request)
    state = await get_state()
    if payload.get("role") == "admin":
        return {
            "authenticated": True,
            "admin": True,
            "phase": state.get("phase", "nominating"),
        }

    subject_hash = payload["subject"]
    doc = await subjects_collection.find_one({"_id": subject_hash}) or {}
    return {
        "authenticated": True,
        "admin": False,
        "roll": payload.get("roll", ""),
        "phase": state.get("phase", "nominating"),
        "nomination_submitted": bool(doc.get("nomination_submitted")),
        "vote_submitted": bool(doc.get("vote_submitted")),
    }


@app.get("/api/public/state")
async def public_state() -> dict[str, Any]:
    state = await get_state()
    phase = state.get("phase", "nominating")
    if phase == "nominating":
        return {"phase": phase, "finalists": {}, "votes": {}}
    return {
        "phase": phase,
        "finalists": state.get("finalists", {}),
        "votes": state.get("votes", {}),
    }


@app.post("/api/nominations/submit")
async def submit_nominations(req: SubmitNominationsRequest, request: Request) -> dict[str, Any]:
    state = await get_state()
    if state.get("phase") != "nominating":
        raise HTTPException(status_code=409, detail="Nominations are closed")

    session = require_student_session(request)
    subject_hash = session["subject"]
    subject_doc = await subjects_collection.find_one({"_id": subject_hash}) or {}
    if subject_doc.get("nomination_submitted"):
        raise HTTPException(status_code=409, detail="You have already submitted nominations")

    picks = req.picks or {}
    if len(picks) == 0:
        raise HTTPException(status_code=400, detail="At least one nomination is required")

    inc: Dict[str, int] = {}
    for cid, nominee in picks.items():
        if cid not in ALLOWED_CATEGORY_IDS:
            continue  # ignore unknown category ids
        nominee_norm = normalize_roll(nominee)
        if not nominee_norm:
            continue
        inc[f"nominations.{cid}.{nominee_norm}"] = inc.get(f"nominations.{cid}.{nominee_norm}", 0) + 1

    if not inc:
        raise HTTPException(status_code=400, detail="No valid nominations found")

    result = await collection.update_one(
        {"_id": DEFAULT_STATE["_id"], "phase": "nominating", "nominators_lower": {"$ne": subject_hash}},
        {
            "$inc": inc,
            "$addToSet": {"nominators_lower": subject_hash},
        },
        upsert=True,
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=409, detail="You have already submitted nominations")
    await subjects_collection.update_one(
        {"_id": subject_hash},
        {"$set": {"nomination_submitted": True, "updated_at": utcnow()}},
        upsert=True,
    )

    return {"ok": True}


# ─── Draft-based nomination flow ────────────────────

@app.post("/api/nominations/draft/save")
async def save_draft(req: SaveDraftRequest, request: Request) -> dict[str, Any]:
    state = await get_state()
    if state.get("phase") != "nominating":
        raise HTTPException(status_code=409, detail="Nominations are closed")

    session = require_student_session(request)
    subject_hash = session["subject"]
    subject_doc = await subjects_collection.find_one({"_id": subject_hash}) or {}
    if subject_doc.get("nomination_submitted"):
        raise HTTPException(status_code=409, detail="You have already submitted final nominations")

    normalized_picks: Dict[str, str] = {}
    for cid, nominee in (req.picks or {}).items():
        if cid not in ALLOWED_CATEGORY_IDS:
            continue
        nominee_norm = normalize_roll(nominee)
        if nominee_norm:
            normalized_picks[cid] = nominee_norm

    await drafts_collection.update_one(
        {"_id": subject_hash},
        {
            "$set": {
                "picks": normalized_picks,
                "updated_at": utcnow(),
            }
        },
        upsert=True,
    )

    return {"ok": True}


@app.get("/api/nominations/draft")
async def get_draft(request: Request) -> dict[str, Any]:
    session = require_student_session(request)
    subject_hash = session["subject"]
    subject_doc = await subjects_collection.find_one({"_id": subject_hash}) or {}
    if subject_doc.get("nomination_submitted"):
        return {"ok": True, "picks": {}, "is_final": True}

    doc = await drafts_collection.find_one({"_id": subject_hash})
    if not doc:
        return {"ok": True, "picks": {}, "is_final": False}

    return {
        "ok": True,
        "picks": doc.get("picks", {}),
        "is_final": False,
    }


@app.post("/api/nominations/draft/finalize")
async def finalize_draft(request: Request) -> dict[str, Any]:
    state = await get_state()
    if state.get("phase") != "nominating":
        raise HTTPException(status_code=409, detail="Nominations are closed")

    session = require_student_session(request)
    subject_hash = session["subject"]
    subject_doc = await subjects_collection.find_one({"_id": subject_hash}) or {}
    if subject_doc.get("nomination_submitted"):
        raise HTTPException(status_code=409, detail="Nominations already submitted")

    doc = await drafts_collection.find_one({"_id": subject_hash})
    if not doc:
        raise HTTPException(status_code=404, detail="No draft found. Please save your nominations first.")

    picks = doc.get("picks", {})
    if not picks:
        raise HTTPException(status_code=400, detail="No nominations in draft")

    inc: Dict[str, int] = {}
    for cid, nominee_norm in picks.items():
        if cid in ALLOWED_CATEGORY_IDS and nominee_norm:
            inc[f"nominations.{cid}.{nominee_norm}"] = inc.get(f"nominations.{cid}.{nominee_norm}", 0) + 1

    if not inc:
        raise HTTPException(status_code=400, detail="No valid nominations found in draft")

    result = await collection.update_one(
        {"_id": DEFAULT_STATE["_id"], "phase": "nominating", "nominators_lower": {"$ne": subject_hash}},
        {
            "$inc": inc,
            "$addToSet": {"nominators_lower": subject_hash},
        },
        upsert=True,
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=409, detail="You have already submitted nominations")
    await subjects_collection.update_one(
        {"_id": subject_hash},
        {"$set": {"nomination_submitted": True, "updated_at": utcnow()}},
        upsert=True,
    )
    await drafts_collection.delete_one({"_id": subject_hash})

    return {"ok": True}


@app.post("/api/admin/login")
async def admin_login(req: AdminPassRequest, response: Response) -> dict[str, bool]:
    require_admin(req.adminPass)
    issue_session(response, role="admin")
    return {"ok": True}


@app.get("/api/admin/state")
async def admin_state(request: Request) -> dict[str, Any]:
    require_admin_session(request)
    state = await get_state()
    phase = state.get("phase", "nominating")
    return {
        "phase": phase,
        "nominations": state.get("nominations", {}) if phase == "nominating" else state.get("nominations", {}),
        "finalists": state.get("finalists", {}) if phase in ("voting", "results") else {},
        "votes": state.get("votes", {}) if phase in ("voting", "results") else {},
        "nomination_count": len(state.get("nominators_lower", [])),
        "vote_count": len(state.get("voted_lower", [])),
    }


@app.post("/api/admin/finalize")
async def admin_finalize(request: Request) -> dict[str, Any]:
    require_admin_session(request)
    state = await get_state()
    if state.get("phase") != "nominating":
        raise HTTPException(status_code=409, detail="Cannot finalize unless phase is nominating")

    nominations: Dict[str, Any] = state.get("nominations", {}) or {}
    finalists: Dict[str, Any] = {}
    for cid in sorted(ALLOWED_CATEGORY_IDS, key=lambda s: int(s)):
        counts: Dict[str, int] = nominations.get(cid, {}) or {}
        finalists[cid] = compute_top5(counts)

    await collection.update_one(
        {"_id": DEFAULT_STATE["_id"]},
        {
            "$set": {
                "phase": "voting",
                "finalists": finalists,
                # Clear vote-related data for a clean voting round.
                "votes": {},
                "voted_lower": [],
            }
        },
        upsert=True,
    )

    return {"phase": "voting", "finalists": finalists}


@app.post("/api/admin/lock-voting")
async def admin_lock_voting(request: Request) -> dict[str, Any]:
    require_admin_session(request)
    state = await get_state()
    if state.get("phase") != "voting":
        raise HTTPException(status_code=409, detail="Voting is not currently open")

    await collection.update_one(
        {"_id": DEFAULT_STATE["_id"]},
        {"$set": {"phase": "results"}},
        upsert=True,
    )
    state2 = await get_state()
    return {
        "phase": "results",
        "finalists": state2.get("finalists", {}),
        "votes": state2.get("votes", {}),
    }


@app.post("/api/admin/reset")
async def admin_reset(request: Request) -> dict[str, Any]:
    require_admin_session(request)
    
    # Reset main state to defaults
    await collection.update_one(
        {"_id": DEFAULT_STATE["_id"]},
        {"$set": {
            "phase": DEFAULT_STATE["phase"],
            "nominations": DEFAULT_STATE["nominations"],
            "nominators_lower": DEFAULT_STATE["nominators_lower"],
            "finalists": DEFAULT_STATE["finalists"],
            "votes": DEFAULT_STATE["votes"],
            "voted_lower": DEFAULT_STATE["voted_lower"],
        }},
        upsert=True,
    )
    
    # Clear all other collections
    await drafts_collection.delete_many({})
    
    await subjects_collection.delete_many({})
    await mongo_client[settings.mongodb_db]["nominators"].delete_many({})
    await mongo_client[settings.mongodb_db]["voters"].delete_many({})
    
    # Optional: Clear OTPs
    await otp_collection.delete_many({})
    
    return {"ok": True, "message": "System reset successfully"}


@app.post("/api/votes/submit")
async def submit_votes(req: SubmitVotesRequest, request: Request) -> dict[str, Any]:
    state = await get_state()
    if state.get("phase") != "voting":
        raise HTTPException(status_code=409, detail="Voting is not open")

    session = require_student_session(request)
    subject_hash = session["subject"]
    subject_doc = await subjects_collection.find_one({"_id": subject_hash}) or {}
    if subject_doc.get("vote_submitted"):
        raise HTTPException(status_code=409, detail="You have already voted!")

    votes = req.votes or {}
    current_finalists: Dict[str, Any] = state.get("finalists", {}) or {}
    inc: Dict[str, int] = {}
    for cid, nominee in votes.items():
        if cid not in ALLOWED_CATEGORY_IDS:
            continue
        nominee_norm = normalize_roll(nominee)
        if not nominee_norm:
            continue
        allowed_for_cat = current_finalists.get(cid, []) or []
        # Only count votes for active finalists in this category.
        if nominee_norm not in allowed_for_cat:
            continue
        inc[f"votes.{cid}.{nominee_norm}"] = inc.get(f"votes.{cid}.{nominee_norm}", 0) + 1

    if inc:
        result = await collection.update_one(
            {"_id": DEFAULT_STATE["_id"], "phase": "voting", "voted_lower": {"$ne": subject_hash}},
            {
                "$inc": inc,
                "$addToSet": {"voted_lower": subject_hash},
            },
            upsert=True,
        )
    else:
        result = await collection.update_one(
            {"_id": DEFAULT_STATE["_id"], "phase": "voting", "voted_lower": {"$ne": subject_hash}},
            {"$addToSet": {"voted_lower": subject_hash}},
            upsert=True,
        )
    if result.modified_count == 0:
        raise HTTPException(status_code=409, detail="You have already voted!")
    await subjects_collection.update_one(
        {"_id": subject_hash},
        {"$set": {"vote_submitted": True, "updated_at": utcnow()}},
        upsert=True,
    )

    return {"ok": True, "incApplied": bool(inc)}

# --- FRONTEND SERVING ---
# Define where the built frontend files will live
dist_dir = os.path.join(os.path.dirname(__file__), "..", "dist")

# If the dist folder exists (e.g., after running build.sh), serve it
if os.path.exists(dist_dir):
    # Serve assets (js, css, images) from the /assets directory
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")
    
    # Catch-all route to serve the main index.html for any non-API routes
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Prevent catching API routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        # Check if requesting a specific file that isn't in /assets (e.g. favicon.ico, students.csv)
        file_path = os.path.join(dist_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Otherwise, return the main index.html for client-side routing
        return FileResponse(os.path.join(dist_dir, "index.html"))
