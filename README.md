# Gemini Reflection & Journal Studio

A secure, user-authenticated reflection and journaling web application powered by **Gemini 3.6 Flash** and **Cloud Firestore**. Built with React, TypeScript, Express, Tailwind CSS, and Firebase Authentication.

---

## 1. Overview & Architecture

- **User Identity**: Secure Google Sign-In via Firebase Authentication (Federated OAuth 2.0).
- **Backend Database**: User-isolated Cloud Firestore document storage at `/users/{userId}/interactions/{interactionId}`.
- **AI Processing Engine**: Server-side Gemini 3.6 Flash integration via `@google/genai` with a resilient multi-model fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`).
- **Secret Management**: Google Cloud Secret Manager / environment variables preventing browser API key leaks.

---

## 2. Prerequisites & Cloud APIs

Ensure the following Google Cloud APIs are enabled in your Google Cloud project:

```bash
# Set your active Google Cloud project
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud services
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com
```

---

## 3. Secret Management Setup

Create the `GEMINI_API_KEY` secret in Google Cloud Secret Manager and grant your Cloud Run compute service account access:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Retrieve your Google Cloud project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# 3. Grant the Cloud Run runtime service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Firestore Security Rules Configuration

Deploy the following security rules to ensure user data isolation (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile isolation
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User journal entries and multi-turn reflections isolation
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules using the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

---

## 5. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the unified development server (Express + Vite on port 3000)
npm run dev
```

---

## 6. Cloud Run Deployment Flow

Build and deploy the application container directly to Google Cloud Run with the Secret Manager binding:

```bash
# Deploy to Google Cloud Run
gcloud run deploy gemini-reflection-studio \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### Mandatory Campaign Labeling for Challenge Verification

Apply the required verification label to register your Cloud Run service:

```bash
gcloud run services update gemini-reflection-studio \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 7. Security Architecture & Threat Mitigations

| Threat Zone | Countermeasure Implemented |
| :--- | :--- |
| **Input Surfaces** | Defensive null-safe payload ingestion; input text length bounds; sanitized payload deserialization. |
| **Planning & Reasoning** | Rigid system instruction boundaries preventing prompt hijacking; multi-turn role separation. |
| **Tool / API Execution** | Server-side Express proxy (`/api/gemini/reflect`) ensuring `GEMINI_API_KEY` is never exposed to clients. |
| **Memory & State** | Owner-bound Cloud Firestore security rules guaranteeing zero cross-user access. |
| **Inter-System Communication** | Federated Google Sign-In with OAuth 2.0; tokens validated securely. |
