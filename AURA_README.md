# 📂 Aura SaaS - Unified Codebase Structure

The application has been completely reorganized into a single, structured **Next.js Project** within the `frontend/` directory. All external dependencies (legacy backend and separate ML services) are now managed from this single codebase.

## 🏗️ New Project Hierarchy
Your application now resides entirely within `frontend/`:

```
frontend/
│
├── ml-engine/         # Integrated Python ML Logic (Sidecar)
├── src/
│   ├── app/           # Unitary Next.js App Router (UI & API)
│   ├── models/        # Unified Mongoose Database Models
│   ├── lib/           # Database & Auth Helpers (Singleton)
│   ├── components/    # Reusable UI Blocks
│   └── instrumentation.ts # Process Lifecycle Manager
├── .env                # Centralized Shared Configuration
└── package.json       # The single manager for all services
```

## 🚀 Getting Started (Zero Setup)
Since everything is now unified, you only need to run commands within the `frontend/` folder:

### 1. Installation
Installs all Node dependencies and Python ML requirements in one go:
```bash
cd frontend
npm run install:all
```

### 2. Development Mode
Starts the Next.js server AND the ML Engine concurrently as a background process:
```bash
cd frontend
npm run dev
```

### 3. Production Build
Creates an optimized Next.js build:
```bash
cd frontend
npm run build
```

## 🛠️ Key Improvements
1.  **Singleton ML Engine:** The Python engine is no longer a separate manual process. It is spawned automatically by Next.js thanks to `instrumentation.ts`.
2.  **Internal API Proxy:** All ML calls now go through `/api/ml/...` on the main server. No more CORS issues or hardcoded `localhost:8000` URLs.
3.  **Cleanup:** Your legacy root-level assets (`backend/`, root `package.json`, etc.) have been removed to ensure a clean, modern codebase.

> [!SUCCESS]
> Your application is now a "pure" fullstack Next.js project. You can now deploy or manage it as a single unit!
