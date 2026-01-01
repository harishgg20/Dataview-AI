# 🚀 Deployment Guide

This application is designed as a **Split Stack**:
- **Backend (Python/FastAPI)**: Must run on a server that supports persistent processes (e.g., **Render**, **Railway**, **AWS EC2**). *Not Vercel.*
- **Frontend (Next.js)**: Can run on **Vercel**, **Netlify**, or anywhere.

---

## Part 1: Deploy Backend (Render.com)
*Recommended for Free Tier support.*

1.  **Sign up** at [render.com](https://render.com/).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub Repository (`harishgg20/Dataview-AI`).
4.  **Configure Settings**:
    *   **Root Directory**: `backend` (⚠️ Crucial!)
    *   **Runtime**: Python 3
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5.  **Environment Variables** (Scroll down to "Advanced"):
    *   `GEMINI_API_KEY`: Your Google Gemini API Key.
    *   `SECRET_KEY`: A random string (e.g., generated via `openssl rand -hex 32`).
    *   `ACCESS_TOKEN_EXPIRE_MINUTES`: `11520` (8 days).
    *   `FRONTEND_URL`: `https://your-vercel-app.vercel.app` (You will get this in Part 2. Initially set to `*` or update later).
    *   *(Optional)* `DATABASE_URL`: Connection string if you have an external Postgres DB (e.g. from Supabase or Neon). If you skip this, it might default to SQLite inside the container, but data will be lost on restart. **For production, use a managed Postgres Database.** Render offers a free Postgres database too!
        *   **Tip**: Create a "New PostgreSQL" on Render first, copy the `Internal Connection String`, and paste it here as `DATABASE_URL`.
6.  Click **Deploy Web Service**.
7.  **Wait** for it to go live. Copy the URL (e.g., `https://ai-data-analyst-backend.onrender.com`).

---

## Part 2: Deploy Frontend (Vercel)

1.  **Sign up** at [vercel.com](https://vercel.com/).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub Repository (`harishgg20/Dataview-AI`).
4.  **Configure Project**:
    *   **Framework Preset**: Next.js (Default).
    *   **Root Directory**: Click "Edit" and select `frontend`. (⚠️ Crucial!)
5.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: The URL of your Backend from Part 1 (e.g., `https://ai-data-analyst-backend.onrender.com`). **Do not add a trailing slash.**
6.  Click **Deploy**.

---

## Part 3: Final Wiring

1.  Once Vercel gives you the live domain (e.g., `https://ai-data-analyst.vercel.app`), go back to **Render Dashboard**.
2.  Update the `FRONTEND_URL` environment variable to this Vercel domain.
3.  **Redeploy** the backend (Manual Deploy -> Clear Cache & Deploy) to ensure CORS settings are updated.

---

## 🛡️ Note on Database (Important)
Your local setup uses Docker Compose to spin up a Postgres Database.
On **Render**, you must create a **PostgreSQL Service** separately and link it.
1. Create New -> PostgreSQL on Render.
2. Copy the `Internal DB URL`.
3. Go to your Backend Service -> Environment -> Add `DATABASE_URL` = (the URL you copied).
4. Run migrations if necessary (or the app might auto-create tables on start if `alembic` isn't fully strict).
