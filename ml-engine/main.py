import os
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load `.env` from the project root instead of this directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = FastAPI(title="ML Face & Blink Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional imports for real logic; fall back to mock if missing
try:
    from face_logic import get_face_embeddings, compare_faces, HAS_FACE_REC
    HAS_FACE_LOGIC = HAS_FACE_REC
except ImportError:
    HAS_FACE_LOGIC = False

try:
    from blink_logic import detect_blink, HAS_BLINK_LIBS
    HAS_BLINK_LOGIC = HAS_BLINK_LIBS
except ImportError:
    HAS_BLINK_LOGIC = False

print(f"--- ML ENGINE STARTUP ---")
print(f"FACE_LOGIC:  {'REAL' if HAS_FACE_LOGIC else 'MOCK'}")
print(f"BLINK_LOGIC: {'REAL' if HAS_BLINK_LOGIC else 'MOCK'}")
print(f"--------------------------")

BLINK_THRESH = float(os.getenv("BLINK_RATIO_THRESHOLD", 0.18))  # Tightened default
CONFIDENCE_THRESH = float(os.getenv("MODEL_CONFIDENCE_THRESHOLD", 0.85))

@app.get("/api/ml/health")
def health_check():
    return {
        "status": "ML Engine is running.",
        "face_mode": "REAL" if HAS_FACE_LOGIC else "MOCK",
        "blink_mode": "REAL" if HAS_BLINK_LOGIC else "MOCK"
    }


@app.post("/api/ml/detect-blink")
async def detect_blink_endpoint(file: UploadFile = File(...)):
    """
    Check if the submitted frame contains a blink.
    Used by frontend to know when to auto-capture for Face ID.
    Returns: { blinked: true/false }
    """
    if not HAS_BLINK_LOGIC:
        return {"blinked": True, "note": "MOCK_MODE"}

    image_bytes = await file.read()
    try:
        blinked = detect_blink(image_bytes, BLINK_THRESH)
        return {"blinked": blinked}
    except Exception as e:
        return {"blinked": False, "error": str(e)}


@app.post("/api/ml/register")
async def register_face(file: UploadFile = File(...)):
    """
    Extract face embeddings from an image.
    The face becomes the user's unique Face ID.
    """
    if not HAS_FACE_LOGIC:
        return {"success": True, "embeddings": [0.1] * 128, "note": "MOCK_MODE"}
        
    image_bytes = await file.read()
    try:
        embeddings = get_face_embeddings(image_bytes)
        return {"success": True, "embeddings": embeddings}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/ml/check-duplicate")
async def check_duplicate_face(
    file: UploadFile = File(...),
    gallery_data: str = Form(...)
):
    """
    Check if a face already exists in the gallery (duplicate prevention).
    gallery_data: JSON string of format [{"user_id": "...", "embeddings": [...]}, ...]
    Returns: { duplicate: true/false, matched_user_id: "..." or null }
    """
    if not HAS_FACE_LOGIC:
        return {"duplicate": False, "matched_user_id": None, "note": "MOCK_MODE"}

    image_bytes = await file.read()
    try:
        gallery = json.loads(gallery_data)
        current_embed = get_face_embeddings(image_bytes)
        tolerance = 1.0 - CONFIDENCE_THRESH

        for item in gallery:
            match = compare_faces(item["embeddings"], current_embed, tolerance=tolerance)
            # print(f"Comparing with {item['user_id']}: {match}") 
            if match:
                return {
                    "duplicate": True,
                    "matched_user_id": item["user_id"]
                }

        return {"duplicate": False, "matched_user_id": None}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/ml/verify")
async def verify_face(
    file: UploadFile = File(...),
    known_embeddings: str = Form(...) 
):
    """
    Used for SELF MODE (Verification). 
    Matches 1 unknown face against 1 known face (or list for that user).
    """
    if not HAS_FACE_LOGIC or not HAS_BLINK_LOGIC:
        return {"success": True, "liveness_pass": True, "face_match": True, "note": "MOCK_MODE"}

    image_bytes = await file.read()
    try:
        baseline_embed = json.loads(known_embeddings)
        blinked = detect_blink(image_bytes, BLINK_THRESH)
        current_embed = get_face_embeddings(image_bytes)
        tolerance = 1.0 - CONFIDENCE_THRESH
        match = compare_faces(baseline_embed, current_embed, tolerance=tolerance)
        
        # We consider it a liveness pass if the face was detected and eyes are open (since this is the post-blink frame)
        return {"success": True, "liveness_pass": not blinked, "face_match": match}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/ml/search")
async def search_face(
    file: UploadFile = File(...),
    gallery_data: str = Form(...) 
):
    """
    Used for KIOSK MODE (Identification).
    Matches 1 unknown face against a gallery of all users in the company.
    gallery_data: JSON string of format [{"user_id": "...", "embeddings": [...]}, ...]
    """
    if not HAS_FACE_LOGIC or not HAS_BLINK_LOGIC:
        # Mock: match the first user in the gallery for demo
        gallery = json.loads(gallery_data)
        user_id = gallery[0]["user_id"] if gallery else "unknown"
        return {"success": True, "liveness_pass": True, "user_id": user_id, "note": "MOCK_MODE"}

    image_bytes = await file.read()
    try:
        gallery = json.loads(gallery_data)
        blinked = detect_blink(image_bytes, BLINK_THRESH)
        current_embed = get_face_embeddings(image_bytes)
        tolerance = 1.0 - CONFIDENCE_THRESH

        matched_user_id = None
        for item in gallery:
            if compare_faces(item["embeddings"], current_embed, tolerance=tolerance):
                matched_user_id = item["user_id"]
                break

        return {
            "success": True,
            "liveness_pass": not blinked, # Eyes should be open in the capture frame
            "user_id": matched_user_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
