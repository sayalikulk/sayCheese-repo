# Deploy DayAdapt to GCP (Cloud Run)

Both frontend and backend run on **Cloud Run**. Deploy from local files—no git push required.

---

## Installation

**1. Google Cloud SDK** (required for deploy)

- **macOS (Homebrew):** `brew install google-cloud-sdk`
- **macOS / Linux:** [Install script](https://cloud.google.com/sdk/docs/install-sdk)
- **Windows:** [Installer](https://cloud.google.com/sdk/docs/install-sdk#windows)

Verify: `gcloud --version`

**2. GCP project**

- Create a project at [console.cloud.google.com](https://console.cloud.google.com)
- Enable billing (required for Cloud Run)
- Note your project ID

**3. Node.js** (optional; only if you run the app locally)

- [nodejs.org](https://nodejs.org) (v18+)
- Or: `brew install node`

---

## Quick Start

```bash
# 0. One-time setup
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com

# 1. Backend (replace placeholders)
cd backend
gcloud run deploy dayadapt-api --source . --region us-central1 --allow-unauthenticated \
  --set-env-vars "API_BASE_URL=/api/v1,FIREBASE_PROJECT_ID=YOUR_PROJECT_ID,JWT_SECRET=YOUR_SECRET_32_CHARS,CLAUDE_API_KEY=YOUR_CLAUDE_KEY,JWT_EXPIRES_IN=7d"

# 2. Note the backend URL (e.g. https://dayadapt-api-xxxxx-uc.a.run.app)

# 3. Frontend
cd ../frontend
echo "VITE_API_BASE_URL=https://YOUR-BACKEND-URL/api/v1" > .env.production
gcloud run deploy dayadapt-fe --source . --region us-central1 --allow-unauthenticated
```

**Firebase:** Grant the Cloud Run service account **Cloud Datastore User** (or use Secret Manager for a service account JSON). Add `CLAUDE_API_KEY` for recommendations.

---

## Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`)
- GCP project with billing enabled
- Firebase project (same as GCP project)

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
```

---

## 1. Deploy Backend

```bash
cd backend
gcloud run deploy dayadapt-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "API_BASE_URL=/api/v1,FIREBASE_PROJECT_ID=YOUR_PROJECT_ID,JWT_SECRET=YOUR_JWT_SECRET_MIN_32_CHARS,CLAUDE_API_KEY=YOUR_CLAUDE_KEY,JWT_EXPIRES_IN=7d"
```

**Optional env vars:** `FIREBASE_SERVICE_ACCOUNT_PATH`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `OPEN_METEO_WEATHER_URL`, `DEBUG_VISION`, `DEBUG_PREFILTER`, `DEBUG_RECOMMENDATIONS`, `CORS_ORIGINS`

**Firebase on Cloud Run:** If you don't set `FIREBASE_SERVICE_ACCOUNT_PATH`, the backend uses Application Default Credentials (ADC). Grant the Cloud Run service account:

- **Cloud Datastore User** (Firestore)
- **Firebase Admin** (or Storage Object Admin if using Storage)

Or mount a service account JSON via Secret Manager:

```bash
# Create secret from your service account JSON
gcloud secrets create firebase-sa --data-file=./serviceAccountKey.json

# Deploy with secret (Cloud Run mounts it as a file)
gcloud run deploy dayadapt-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "FIREBASE_PROJECT_ID=YOUR_PROJECT_ID,FIREBASE_SERVICE_ACCOUNT_PATH=/secrets/firebase-sa/sa.json" \
  --set-secrets "/secrets/firebase-sa=firebase-sa:latest"
```

**Note:** With `--set-secrets`, the secret is mounted at a path. Adjust `FIREBASE_SERVICE_ACCOUNT_PATH` to that path.

After deploy, note the backend URL, e.g. `https://dayadapt-api-xxxxx-uc.a.run.app`.

---

## 2. Deploy Frontend

Set `VITE_API_BASE_URL` to your backend URL (including `/api/v1`). Two options:

**Option A: `.env.production` (simplest)**

```bash
cd frontend
echo "VITE_API_BASE_URL=https://dayadapt-api-xxxxx-uc.a.run.app/api/v1" > .env.production
gcloud run deploy dayadapt-fe \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

**Option B: Cloud Build with substitution**

```bash
cd frontend
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_API_BASE_URL=https://dayadapt-api-xxxxx-uc.a.run.app/api/v1,_REGION=us-central1
```

Create the Artifact Registry repo first (one-time):

```bash
gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format=docker --location=us-central1
```

---

## 3. CORS

- **Backend → Frontend:** CORS allows `*.run.app` and `*.a.run.app` by default. For custom domains, set `CORS_ORIGINS` (comma-separated).
- **Frontend → Open-Meteo / Nominatim:** These APIs support CORS; no changes needed.
- **Backend → Claude / Open-Meteo:** Server-to-server; CORS does not apply.

---

## 4. Environment Variables

| Service | Variable | Required |
|---------|----------|----------|
| Backend | `FIREBASE_PROJECT_ID` | Yes |
| Backend | `JWT_SECRET` | Yes (min 32 chars) |
| Backend | `CLAUDE_API_KEY` or `ANTHROPIC_API_KEY` | Yes (for recommendations & vision) |
| Backend | `FIREBASE_SERVICE_ACCOUNT_PATH` | No (uses ADC if omitted) |
| Backend | `JWT_EXPIRES_IN` | No (default: 7d) |
| Backend | `API_BASE_URL` | No (default: /api/v1) |
| Backend | `FIREBASE_API_KEY` | No |
| Backend | `FIREBASE_AUTH_DOMAIN` | No |
| Backend | `FIREBASE_STORAGE_BUCKET` | No |
| Backend | `FIREBASE_MESSAGING_SENDER_ID` | No |
| Backend | `FIREBASE_APP_ID` | No |
| Backend | `CORS_ORIGINS` | No (Cloud Run URLs allowed by default) |
| Backend | `DEBUG_VISION`, `DEBUG_PREFILTER`, `DEBUG_RECOMMENDATIONS` | No |
| Frontend | `VITE_API_BASE_URL` | Yes (build-time) |

---

## 5. Custom Domains (Optional)

1. Map a custom domain to each Cloud Run service in the GCP Console.
2. Add the frontend domain to backend `CORS_ORIGINS`, e.g. `https://app.yourdomain.com`.
