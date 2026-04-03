import cv2
import mediapipe as mp
import numpy as np
import base64

def calculate_ear(eye_landmarks: list) -> float:
    # Compute the euclidean distances between the two sets of vertical eye landmarks
    p2_minus_p6 = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
    p3_minus_p5 = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
    
    # Compute the euclidean distance between the horizontal eye landmark
    p1_minus_p4 = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
    
    # Calculate the eye aspect ratio (EAR)
    ear = (p2_minus_p6 + p3_minus_p5) / (2.0 * p1_minus_p4)
    return ear

def detect_blink(image_bytes: bytes, blink_threshold: float = 0.21) -> bool:
    """
    Returns True if an eye is closed (i.e. EAR is below the threshold), indicating a blink.
    In a real-life video stream, you would verify this state drops below the threshold
    and then rises above it across multiple frames. Here, we parse a single frame.
    """
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)

    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    results = face_mesh.process(rgb_image)
    if not results.multi_face_landmarks:
        return False # No face found
    
    landmarks = results.multi_face_landmarks[0].landmark

    def to_pixel_coords(landmark_list):
        return np.array([
            [landmarks[idx].x * image.shape[1], landmarks[idx].y * image.shape[0]] 
            for idx in landmark_list
        ])

    # Right eye landmarks (using standard MediaPipe FaceMesh indices)
    right_eye_indices = [33, 160, 158, 133, 153, 144]
    # Left eye landmarks
    left_eye_indices = [362, 385, 387, 263, 373, 380]

    right_eye_cords = to_pixel_coords(right_eye_indices)
    left_eye_cords = to_pixel_coords(left_eye_indices)

    ear_right = calculate_ear(right_eye_cords)
    ear_left = calculate_ear(left_eye_cords)
    
    ear_avg = (ear_left + ear_right) / 2.0
    
    # If eye aspect ratio goes below threshold, it's considered a blink
    return bool(ear_avg < blink_threshold)
