# 👤 Aura Face Attendance System

A professional, high-performance Face Recognition Attendance System built with **Next.js** and an integrated **Python ML Engine**. This application provides a unified solution for managing employee attendance using biometric face identification and liveness detection.

---

## 🚀 Features

-   **Biometric Enrollment**: Seamless face registration with high-accuracy embedding extraction.
-   **Liveness Detection**: Integrated blink detection logic to prevent spoofing using static images.
-   **Flexible Matching**:
    -   **Self Mode (1:1):** Verify individual users against their stored biometric data.
    -   **Kiosk Mode (1:N):** Automatically identify any registered user from a single frame.
-   **Automated Sidecar:** The Python ML service starts automatically with the Next.js server.
-   **Role-Based Access:** Dedicated dashboards for Administrators and Employees.
-   **Reporting:** Export attendance logs directly to Excel/CSV.
-   **Modern UI:** Sleek, responsive interface built with Tailwind CSS and Lucide icons.

---

## 🏗️ Project Architecture

The application uses a **Sidecar Architecture** where the Next.js server manages the UI and Business Logic, while a Python FastAPI process handles the heavy-duty Machine Learning tasks.

```text
face-attendance/
├── ml-engine/           # Python Machine Learning Service (FastAPI)
│   ├── main.py         # ML API Endpoints
│   ├── face_logic.py   # Face matching and embedding extraction
│   └── blink_logic.py  # Liveness/Blink detection algorithm
├── src/
│   ├── app/            # Next.js App Router (UI & API Routes)
│   ├── components/     # High-quality React components
│   ├── lib/            # Shared services (DB, Encryption, ML Proxy)
│   └── instrumentation.ts # Lifecycle manager (starts the ML Sidecar)
├── .env                # Unified configuration for both JS and Python
└── package.json        # Main project configuration
```

---

## 🛠️ How it Works

1.  **Startup:** When you run `npm run dev`, Next.js initializes. The `instrumentation.ts` file detects the environment and spawns the `ml-engine` as a background process on port 8000.
2.  **Capture:** The frontend captures a frame from the user's webcam.
3.  **Blink Detection:** The frame is sent to the ML Engine to verify if the user blinked (ensuring it's a real person).
4.  **Identification:** Once liveness is verified, the face embeddings are compared against the database:
    -   If a match is found, attendance is marked.
    -   If no match is found, access is denied.
5.  **Data Management:** All biometric data is encrypted and stored in MongoDB.

---

## 💻 Local Setup & Installation

### Prerequisites
-   **Node.js**: v18 or higher.
-   **Python**: v3.12 or higher.
-   **MongoDB**: A running MongoDB instance (Local or Atlas).

### 1. Clone the Repository
```bash
git clone https://github.com/kuldeepmaurya4296/face-attendance.git
cd face-attendance
```

### 2. Configuration (`.env`)
Create a `.env` file in the root directory (or use the existing one) and ensure the following variables are set:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NEXT_PUBLIC_ML_SERVICE_URL=http://127.0.0.1:8000
```

### 3. Installation

#### For Windows:
```powershell
# Install Node dependencies and Python packages
npm run install:all
```

#### For Mac/Linux:
Ensure you have `python3` and `pip` installed, then:
```bash
npm install
cd ml-engine
python3 -m pip install -r requirements.txt
cd ..
```

---

## 🏃 Running the Application

### Development Mode
This starts both the Next.js frontend and the Python ML sidecar concurrently.

```bash
npm run dev
```
-   **Frontend:** [http://localhost:3000](http://localhost:3000)
-   **ML Engine Health:** [http://localhost:8000/api/ml/health](http://localhost:8000/api/ml/health)

### Production Mode
```bash
npm run build
npm start
```

---

## 🔧 Platform Specific Notes

### Windows
The project uses `py -3.12` in `instrumentation.ts` by default. If you have a different python command (like `python`), you may need to update the spawn command in `instrumentation.ts`.

### MacOS
Ensure you have the necessary libraries for `dlib` and `opencv`. You might need to install `cmake` and `boost` via Homebrew:
```bash
brew install cmake boost
```

---

## 🛡️ Security & Privacy
-   **Face Embeddings:** We do not store raw images. We only store 128-dimensional mathematical vectors representing the face.
-   **Encryption:** Sensitive data is encrypted before being stored in the database.
-   **Liveness:** Blink detection prevents simple photo-spoofing attacks.
