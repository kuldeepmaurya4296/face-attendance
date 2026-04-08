import numpy as np
import cv2
import os
from fastapi import HTTPException

# Using OpenCV Haar Cascades
CASCADE_PATH = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
EYE_CASCADE_PATH = os.path.join(cv2.data.haarcascades, 'haarcascade_eye.xml')

face_cascade = cv2.CascadeClassifier(CASCADE_PATH)
eye_cascade = cv2.CascadeClassifier(EYE_CASCADE_PATH)

def get_face_embeddings(image_bytes: bytes) -> list[float]:
    """
    Robust Face 'Embedding' using OpenCV with Alignment and LBP-like features.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image data.")
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 1. Detect Face
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    if len(faces) == 0:
        raise HTTPException(status_code=400, detail="No face detected. Please face the camera clearly.")
        
    # Take the largest face if multiple
    (x, y, w, h) = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[0]
    
    face_roi = gray[y:y+h, x:x+w]
    
    # 2. Face Alignment (Try to find eyes to level the face)
    eyes = eye_cascade.detectMultiScale(face_roi, 1.1, 10)
    if len(eyes) >= 2:
        # Sort eyes by x-coordinate
        eyes = sorted(eyes, key=lambda e: e[0])
        left_eye, right_eye = eyes[0], eyes[1]
        
        # Calculate angle between eyes
        dy = (right_eye[1] + right_eye[3]/2) - (left_eye[1] + left_eye[3]/2)
        dx = (right_eye[0] + right_eye[2]/2) - (left_eye[0] + left_eye[2]/2)
        angle = np.degrees(np.arctan2(dy, dx))
        
        # Rotate to align eyes horizontally
        M = cv2.getRotationMatrix2D((w/2, h/2), angle, 1)
        face_roi = cv2.warpAffine(face_roi, M, (w, h))

    # 3. Descriptor Extraction
    # Resize to standard size
    face_resized = cv2.resize(face_roi, (100, 100))
    
    # Apply Histogram Equalization for lighting robustness
    face_equalized = cv2.equalizeHist(face_resized)
    
    # Apply a light Gaussian blur to reduce noise
    face_blurred = cv2.GaussianBlur(face_equalized, (3, 3), 0)
    
    # Use Global features: Flattened pixel array (normalized)
    embedding = face_blurred.flatten().astype(float) / 255.0
    
    return embedding.tolist()

def compare_faces(known_embedding: list[float], unknown_embedding: list[float], tolerance: float = 0.5) -> bool:
    """
    Compares two face descriptors using Correlation and MSE.
    Increased robustness via hybrid check.
    """
    known = np.array(known_embedding)
    unknown = np.array(unknown_embedding)
    
    if len(known) != len(unknown):
        return False
        
    # Pearson Correlation Coefficient
    # 1.0 = Perfect match, 0.0 = No correlation
    correlation = np.corrcoef(known, unknown)[0, 1]
    
    # Mean Squared Error (MSE)
    # Lower is better match
    mse = np.mean((known - unknown) ** 2)
    
    # Calibration for 100x100 equalized images:
    # Scale: Correlation (0..1), MSE (0..1, lower is better)
    
    # We use a weighted score or simple OR logic for better recall
    # If correlation is very high, it's a match.
    # If correlation is decent AND MSE is low, it's a match.
    
    is_match = False
    if correlation > 0.85: # Very high correlation - almost certainly the same
        is_match = True
    elif correlation > 0.65 and mse < 0.12: # Decent correlation and low error
        is_match = True
        
    # print(f"DEBUG: Corr={correlation:.3f}, MSE={mse:.4f} -> Match={is_match}")
    
    return is_match

HAS_FACE_REC = True
