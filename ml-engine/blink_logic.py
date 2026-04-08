import numpy as np
import cv2
import os

# Using OpenCV Haar Cascades for Eyes
FACE_CASCADE_PATH = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
EYE_CASCADE_PATH = os.path.join(cv2.data.haarcascades, 'haarcascade_eye.xml')

face_cascade = cv2.CascadeClassifier(FACE_CASCADE_PATH)
eye_cascade = cv2.CascadeClassifier(EYE_CASCADE_PATH)

def detect_blink(image_bytes: bytes, blink_threshold: float = 0.2) -> bool:
    """
    Simulated Liveness via Eye Detection.
    If no eyes are detected within a face, it suggests a closed eye (blink) or a fake.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        return False
        
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 1. Find face first to limit eye search
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    if len(faces) == 0:
        return False
        
    (x, y, w, h) = faces[0]
    face_roi_gray = gray[y:y+h, x:x+w]
    
    # 2. Detect eyes in the top half of the face
    eyes = eye_cascade.detectMultiScale(face_roi_gray, 1.1, 10)
    
    # If 2 eyes detected, eyes are open
    # If 0 eyes detected (but face is there), it could be a blink
    # we return blinked = True if less than 2 eyes found
    return len(eyes) < 2

HAS_BLINK_LIBS = True # Using OpenCV now
