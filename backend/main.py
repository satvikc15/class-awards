from __future__ import annotations

from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from motor.motor_asyncio import AsyncIOMotorClient

from .models import (
    AdminPassRequest,
    SubmitNominationsRequest,
    SubmitVotesRequest,
)
from .settings import Settings


ALLOWED_CATEGORY_IDS = {str(i) for i in range(1, 44)}

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

    # Store the nominator details in a separate collection for reference
    nominators_col = mongo_client[settings.mongodb_db]["nominators"]
    await nominators_col.update_one(
        {"_id": user_id_lower},
        {"$set": {"user_id": user_id, "username": username}},
        upsert=True,
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
        {"$set": {"user_id": user_id, "username": username}},
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
