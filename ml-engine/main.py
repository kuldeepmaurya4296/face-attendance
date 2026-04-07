import os
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from vector_db import FaceVectorDB, HAS_FAISS

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
    from face_logic import get_face_embeddings, compare_faces
    from blink_logic import detect_blink
    HAS_ML_LIBS = True
    print("OK: ML Libraries (face_recognition, mediapipe) loaded successfully.")
    print(f"FAISS Status: {'LOADED' if HAS_FAISS else 'NOT LOADED - falling back to naive search'}")
except ImportError as e:
    HAS_ML_LIBS = False
    print(f"!!! ML Libraries missing: {e}. Running in MOCK MODE.")

BLINK_THRESH = float(os.getenv("BLINK_RATIO_THRESHOLD", 0.21))
CONFIDENCE_THRESH = float(os.getenv("MODEL_CONFIDENCE_THRESHOLD", 0.85))

# Setup Vector DB
vector_db = FaceVectorDB()

@app.get("/api/ml/health")
def health_check():
    return {
        "status": "ML Engine is running.",
        "mode": "REAL" if HAS_ML_LIBS else "MOCK",
        "faiss_enabled": HAS_FAISS
    }


@app.post("/api/ml/detect-blink")
async def detect_blink_endpoint(file: UploadFile = File(...)):
    """
    Check if the submitted frame contains a blink.
    Used by frontend to know when to auto-capture for Face ID.
    """
    if not HAS_ML_LIBS:
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
    Note: The frontend is responsible for capturing liveness (the actual blink) 
    before sending the final open-eye frame to this endpoint.
    """
    if not HAS_ML_LIBS:
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
    """
    if not HAS_ML_LIBS:
        return {"duplicate": False, "matched_user_id": None, "note": "MOCK_MODE"}

    image_bytes = await file.read()
    try:
        gallery = json.loads(gallery_data)
        current_embed = get_face_embeddings(image_bytes)
        
        # Biometric duplication threshold: 0.4 is standard for "Same Person"
        dup_tolerance = 0.4

        if HAS_FAISS:
            vector_db.build_index(gallery)
            match = vector_db.search(current_embed, tolerance=dup_tolerance)
            if match:
                print(f"DUPLICATE_DETECTED: Match with user_id: {match['user_id']}")
                return {
                    "duplicate": True,
                    "matched_user_id": match["user_id"]
                }
            return {"duplicate": False, "matched_user_id": None}
        else:
            # Naive fallback
            for item in gallery:
                if compare_faces(item["embeddings"], current_embed, tolerance=dup_tolerance):
                    print(f"DUPLICATE_DETECTED: Naive match with user_id: {item['user_id']}")
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
    Used for SELF MODE (Verification). 1:1 match.
    """
    if not HAS_ML_LIBS:
        return {"success": True, "liveness_pass": True, "face_match": True, "note": "MOCK_MODE"}

    image_bytes = await file.read()
    try:
        baseline_embed = json.loads(known_embeddings)
        blinked = detect_blink(image_bytes, BLINK_THRESH)
        current_embed = get_face_embeddings(image_bytes)
        tolerance = 1.0 - CONFIDENCE_THRESH
        match = compare_faces(baseline_embed, current_embed, tolerance=tolerance)
        
        return {"success": True, "liveness_pass": blinked, "face_match": match}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/ml/search")
async def search_face(
    file: UploadFile = File(...),
    gallery_data: str = Form(...) 
):
    """
    Used for KIOSK MODE (Identification). 1:N match.
    Matches 1 unknown face against a gallery of all users in the company.
    Uses FAISS (O(log N)) if available, otherwise naive search.
    """
    if not HAS_ML_LIBS:
        # Prevent incorrect mock-logins by defaulting to unknown instead of the first user
        return {"success": True, "liveness_pass": True, "user_id": "unknown", "note": "MOCK_MODE"}

    image_bytes = await file.read()
    try:
        gallery = json.loads(gallery_data)
        blinked = detect_blink(image_bytes, BLINK_THRESH)
        current_embed = get_face_embeddings(image_bytes)
        tolerance = 1.0 - CONFIDENCE_THRESH

        matched_user_id = None
        
        if HAS_FAISS:
            vector_db.build_index(gallery)
            match = vector_db.search(current_embed, tolerance=tolerance)
            if match:
                matched_user_id = match["user_id"]
        else:
            # Naive search fallback
            for item in gallery:
                if compare_faces(item["embeddings"], current_embed, tolerance=tolerance):
                    matched_user_id = item["user_id"]
                    break

        return {
            "success": True,
            "liveness_pass": blinked,
            "user_id": matched_user_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
