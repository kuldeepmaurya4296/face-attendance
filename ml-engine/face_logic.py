import face_recognition
import numpy as np
from fastapi import HTTPException

# For a real implementation, you would receive the base64 or raw image
# For this script we assume you pass an image path or raw bytes that we convert to numpy array

def get_face_embeddings(image_bytes: bytes) -> list[float]:
    import cv2
    import numpy as np

    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Convert to RGB (face_recognition needs RGB)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    try:
        # Find faces
        face_locations = face_recognition.face_locations(rgb_img)
        if not face_locations:
            raise HTTPException(status_code=400, detail="No face detected in the image.")

        if len(face_locations) > 1:
            raise HTTPException(status_code=400, detail="Multiple faces detected. Please make sure only one face is visible.")

        # Get encoding for the single face detected
        encodings = face_recognition.face_encodings(rgb_img, face_locations)
        if not encodings:
            raise HTTPException(status_code=400, detail="Could not extract face encodings.")
            
        return encodings[0].tolist()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face processing error: {str(e)}")

def compare_faces(known_embedding: list[float], unknown_embedding: list[float], tolerance: float = 0.5) -> bool:
    import numpy as np
    
    known = np.array(known_embedding)
    unknown = np.array(unknown_embedding)
    
    # Calculate distance
    distance = face_recognition.face_distance([known], unknown)[0]
    
    # Lower distance means closer match; if less than tolerance, it's a match
    return distance <= tolerance
