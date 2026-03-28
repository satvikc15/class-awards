from __future__ import annotations

import os
import csv
import random
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict

import pyotp
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient

from models import (
    AdminPassRequest,
    GetDraftRequest,
    RemoveNominatorRequest,
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
    "nominators_lower": [],  # list of lowercase submitter names
    "finalists": {},  # categoryId -> [ nomineeLower, ... ]
    "votes": {},  # categoryId -> { nomineeLower -> count }
    "voted_lower": [],  # list of lowercase voter names
}


def normalize_name(name: str) -> str:
    return name.strip()

def normalize_roll(roll: str) -> str:
    return "".join(ch for ch in normalize_name(roll) if ch.isdigit())


def normalize_name_lower(name: str) -> str:
    return normalize_name(name).lower()


def compute_top3(nominee_counts: Dict[str, int]) -> list[str]:
    # Match the frontend behavior (count-desc), with deterministic tie-break.
    sorted_items = sorted(
        nominee_counts.items(),
        key=lambda kv: (-int(kv[1]), kv[0]),
    )
    return [k for k, _ in sorted_items[:3]]

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
        If you did not request this, you can safely ignore this email.
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
async def verify_otp(req: VerifyOtpRequest) -> dict[str, Any]:
    roll = normalize_name(req.roll)
    otp = normalize_name(req.otp)
    if not roll or not otp:
        raise HTTPException(status_code=400, detail="Roll and OTP are required")

    record = await otp_collection.find_one({"_id": roll})
    if not record:
        raise HTTPException(status_code=400, detail="No OTP found. Please request one first.")

    # Check expiry (5 minutes)
    created = record.get("created_at")
    if created and (datetime.utcnow() - created).total_seconds() > 300:
        await otp_collection.delete_one({"_id": roll})
        raise HTTPException(status_code=410, detail="OTP has expired. Please request a new one.")

    # Check attempts (max 5)
    attempts = record.get("attempts", 0)
    if attempts >= 5:
        await otp_collection.delete_one({"_id": roll})
        raise HTTPException(status_code=429, detail="Too many attempts. Please request a new OTP.")

    # Increment attempts
    await otp_collection.update_one({"_id": roll}, {"$inc": {"attempts": 1}})

    if record.get("otp") != otp:
        raise HTTPException(status_code=401, detail=f"Incorrect OTP. {4 - attempts} attempts remaining.")

    # OTP verified — delete it so it can't be reused
    await otp_collection.delete_one({"_id": roll})

    return {"ok": True, "email": record.get("email", "")}


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"ok": "true"}


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


@app.get("/api/nominations/nominators/check")
async def check_nominator(name: str = Query(..., min_length=1)) -> dict[str, bool]:
    name_lower = normalize_name_lower(name)
    state = await get_state()
    return {"exists": name_lower in set(state.get("nominators_lower", []))}


@app.post("/api/nominations/submit")
async def submit_nominations(req: SubmitNominationsRequest) -> dict[str, Any]:
    state = await get_state()
    if state.get("phase") != "nominating":
        raise HTTPException(status_code=409, detail="Nominations are closed")

    # Support both new (user_id) and legacy (name) fields
    user_id = normalize_name(req.user_id or req.name)
    username = normalize_name(req.username) if req.username else ""
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    user_id_lower = normalize_name_lower(user_id)

    if user_id_lower in set(state.get("nominators_lower", [])):
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

    await collection.update_one(
        {"_id": DEFAULT_STATE["_id"]},
        {
            "$inc": inc,
            "$addToSet": {"nominators_lower": user_id_lower},
        },
        upsert=True,
    )

    # Store the nominator details + their picks so we can reverse if needed
    normalized_picks = {}
    for cid, nominee in picks.items():
        if cid not in ALLOWED_CATEGORY_IDS:
            continue
        nominee_norm = normalize_roll(nominee)
        if nominee_norm:
            normalized_picks[cid] = nominee_norm

    nominators_col = mongo_client[settings.mongodb_db]["nominators"]
    await nominators_col.update_one(
        {"_id": user_id_lower},
        {"$set": {"user_id": user_id, "username": username, "email": req.email, "picks": normalized_picks}},
        upsert=True,
    )

    return {"ok": True}


# ─── Draft-based nomination flow ────────────────────

@app.post("/api/nominations/draft/save")
async def save_draft(req: SaveDraftRequest) -> dict[str, Any]:
    """Save (upsert) partial nomination picks as a draft.
    Rejects if the user has already finalized."""
    state = await get_state()
    if state.get("phase") != "nominating":
        raise HTTPException(status_code=409, detail="Nominations are closed")

    user_id = normalize_name(req.user_id)
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    user_id_lower = normalize_name_lower(user_id)

    # Check if already finalized
    existing = await drafts_collection.find_one({"_id": user_id_lower})
    if existing and existing.get("is_final"):
        raise HTTPException(status_code=409, detail="You have already submitted final nominations")

    # Normalize picks
    normalized_picks: Dict[str, str] = {}
    for cid, nominee in (req.picks or {}).items():
        if cid not in ALLOWED_CATEGORY_IDS:
            continue
        nominee_norm = normalize_roll(nominee)
        if nominee_norm:
            normalized_picks[cid] = nominee_norm

    await drafts_collection.update_one(
        {"_id": user_id_lower},
        {
            "$set": {
                "user_id": user_id,
                "username": normalize_name(req.username) if req.username else "",
                "email": req.email,
                "picks": normalized_picks,
                "is_final": False,
                "updated_at": datetime.utcnow(),
            }
        },
        upsert=True,
    )

    return {"ok": True}


@app.post("/api/nominations/draft/get")
async def get_draft(req: GetDraftRequest) -> dict[str, Any]:
    """Return the user's current draft (or empty if none exists)."""
    user_id = normalize_name(req.user_id)
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    user_id_lower = normalize_name_lower(user_id)

    doc = await drafts_collection.find_one({"_id": user_id_lower})
    if not doc:
        return {"ok": True, "picks": {}, "is_final": False}

    return {
        "ok": True,
        "picks": doc.get("picks", {}),
        "is_final": doc.get("is_final", False),
    }


@app.post("/api/nominations/draft/finalize")
async def finalize_draft(req: GetDraftRequest) -> dict[str, Any]:
    """Lock the draft and apply the nominations to the global tally."""
    state = await get_state()
    if state.get("phase") != "nominating":
        raise HTTPException(status_code=409, detail="Nominations are closed")

    user_id = normalize_name(req.user_id)
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    user_id_lower = normalize_name_lower(user_id)

    doc = await drafts_collection.find_one({"_id": user_id_lower})
    if not doc:
        raise HTTPException(status_code=404, detail="No draft found. Please save your nominations first.")
    if doc.get("is_final"):
        raise HTTPException(status_code=409, detail="Nominations already submitted")

    picks = doc.get("picks", {})
    if not picks:
        raise HTTPException(status_code=400, detail="No nominations in draft")

    # Check if already in nominators (edge case / double-submit guard)
    if user_id_lower in set(state.get("nominators_lower", [])):
        # Mark draft as final anyway
        await drafts_collection.update_one(
            {"_id": user_id_lower}, {"$set": {"is_final": True}}
        )
        raise HTTPException(status_code=409, detail="You have already submitted nominations")

    # Build increment operations for the global tally
    inc: Dict[str, int] = {}
    for cid, nominee_norm in picks.items():
        if cid in ALLOWED_CATEGORY_IDS and nominee_norm:
            inc[f"nominations.{cid}.{nominee_norm}"] = inc.get(f"nominations.{cid}.{nominee_norm}", 0) + 1

    if not inc:
        raise HTTPException(status_code=400, detail="No valid nominations found in draft")

    # Apply to global state
    await collection.update_one(
        {"_id": DEFAULT_STATE["_id"]},
        {
            "$inc": inc,
            "$addToSet": {"nominators_lower": user_id_lower},
        },
        upsert=True,
    )

    # Store in nominators collection (for reverse on admin remove)
    nominators_col = mongo_client[settings.mongodb_db]["nominators"]
    await nominators_col.update_one(
        {"_id": user_id_lower},
        {"$set": {
            "user_id": doc.get("user_id", user_id),
            "username": doc.get("username", ""),
            "email": doc.get("email", ""),
            "picks": picks,
        }},
        upsert=True,
    )

    # Mark draft as final
    await drafts_collection.update_one(
        {"_id": user_id_lower}, {"$set": {"is_final": True}}
    )

    return {"ok": True}


@app.post("/api/admin/login")
async def admin_login(req: AdminPassRequest) -> dict[str, bool]:
    require_admin(req.adminPass)
    return {"ok": True}


@app.post("/api/admin/state")
async def admin_state(req: AdminPassRequest) -> dict[str, Any]:
    require_admin(req.adminPass)
    state = await get_state()
    phase = state.get("phase", "nominating")
    return {
        "phase": phase,
        "nominations": state.get("nominations", {}) if phase == "nominating" else state.get("nominations", {}),
        "finalists": state.get("finalists", {}) if phase in ("voting", "results") else {},
        "votes": state.get("votes", {}) if phase in ("voting", "results") else {},
        "nominators_lower": state.get("nominators_lower", []),
    }


@app.post("/api/admin/nominators")
async def admin_nominators(req: AdminPassRequest) -> dict[str, Any]:
    require_admin(req.adminPass)
    nominators_col = mongo_client[settings.mongodb_db]["nominators"]
    cursor = nominators_col.find({})
    noms = []
    async for nom in cursor:
        noms.append({
            "roll": nom["_id"],
            "user_id": nom.get("user_id"),
            "username": nom.get("username"),
            "email": nom.get("email"),
            "picks": nom.get("picks", {})
        })
    return {"ok": True, "nominators": noms}


@app.post("/api/admin/remove-nominator")
async def admin_remove_nominator(req: RemoveNominatorRequest) -> dict[str, Any]:
    """Remove a nominator by roll number so they can nominate again.
    Reverses their nomination counts if their picks were stored."""
    require_admin(req.adminPass)
    state = await get_state()
    if state.get("phase") != "nominating":
        raise HTTPException(status_code=409, detail="Can only remove nominators during the nominating phase")

    roll = normalize_name(req.roll)
    roll_lower = normalize_name_lower(req.roll)
    if not roll:
        raise HTTPException(status_code=400, detail="Roll number is required")

    # Check if the roll exists in nominators_lower
    if roll_lower not in set(state.get("nominators_lower", [])):
        raise HTTPException(status_code=404, detail=f"Roll '{roll}' has not nominated")

    # Try to find their stored picks to reverse the counts
    nominators_col = mongo_client[settings.mongodb_db]["nominators"]
    record = await nominators_col.find_one({"_id": roll_lower})
    picks = (record or {}).get("picks", {}) if record else {}

    # Build decrement operations to reverse nomination counts
    dec: Dict[str, int] = {}
    for cid, nominee_norm in picks.items():
        if cid in ALLOWED_CATEGORY_IDS and nominee_norm:
            dec[f"nominations.{cid}.{nominee_norm}"] = dec.get(f"nominations.{cid}.{nominee_norm}", 0) - 1

    update_ops: Dict[str, Any] = {
        "$pull": {"nominators_lower": roll_lower},
    }
    if dec:
        update_ops["$inc"] = dec

    await collection.update_one(
        {"_id": DEFAULT_STATE["_id"]},
        update_ops,
    )

    # Remove the nominator record
    await nominators_col.delete_one({"_id": roll_lower})

    # Reset the draft so the user can re-nominate
    await drafts_collection.update_one(
        {"_id": roll_lower},
        {"$set": {"is_final": False}},
    )

    return {"ok": True, "reversed_picks": bool(dec)}


@app.post("/api/admin/finalize")
async def admin_finalize(req: AdminPassRequest) -> dict[str, Any]:
    require_admin(req.adminPass)
    state = await get_state()
    if state.get("phase") != "nominating":
        raise HTTPException(status_code=409, detail="Cannot finalize unless phase is nominating")

    nominations: Dict[str, Any] = state.get("nominations", {}) or {}
    finalists: Dict[str, Any] = {}
    for cid in sorted(ALLOWED_CATEGORY_IDS, key=lambda s: int(s)):
        counts: Dict[str, int] = nominations.get(cid, {}) or {}
        finalists[cid] = compute_top3(counts)

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
async def admin_lock_voting(req: AdminPassRequest) -> dict[str, Any]:
    require_admin(req.adminPass)
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


@app.get("/api/votes/voted/check")
async def check_voted(name: str = Query(..., min_length=1)) -> dict[str, bool]:
    name_lower = normalize_name_lower(name)
    state = await get_state()
    return {"exists": name_lower in set(state.get("voted_lower", []))}


@app.post("/api/votes/submit")
async def submit_votes(req: SubmitVotesRequest) -> dict[str, Any]:
    state = await get_state()
    if state.get("phase") != "voting":
        raise HTTPException(status_code=409, detail="Voting is not open")

    # Support both new (user_id) and legacy (name) fields
    user_id = normalize_name(req.user_id or req.name)
    username = normalize_name(req.username) if req.username else ""
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    user_id_lower = normalize_name_lower(user_id)

    if user_id_lower in set(state.get("voted_lower", [])):
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
        await collection.update_one(
            {"_id": DEFAULT_STATE["_id"]},
            {
                "$inc": inc,
                "$addToSet": {"voted_lower": user_id_lower},
            },
            upsert=True,
        )
    else:
        # No valid votes provided (e.g. user skipped everything). Still lock them in.
        await collection.update_one(
            {"_id": DEFAULT_STATE["_id"]},
            {"$addToSet": {"voted_lower": user_id_lower}},
            upsert=True,
        )

    # Store the voter details in a separate collection for reference
    voters_col = mongo_client[settings.mongodb_db]["voters"]
    await voters_col.update_one(
        {"_id": user_id_lower},
        {"$set": {"user_id": user_id, "username": username, "email": req.email}},
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
