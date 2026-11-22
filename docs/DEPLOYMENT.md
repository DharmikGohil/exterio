# Deployment

Exterio runs as two pieces: the API (`exterio-backend`, a Docker image) on **Railway**, with a
persistent volume for the database and photos, and the web app (`exterio-frontend`, a static
Vite build) on **Vercel**. The photoreal renderer (`exterio-render`) is already deployed on Modal.

Deploy the API first (the web app needs its address), then the web app, then tell the API the
web app's address.

## 1. API on Railway

1. New project → **Deploy from GitHub repo** → `DharmikGohil/exterio`.
2. Service settings → **Root directory** `exterio-backend`. Railway then reads
   `exterio-backend/railway.json`: it builds the Dockerfile, runs one replica (SQLite needs a
   single writer) and waits for `/api/health-check`.
3. **Volume**: add one to the service, mounted at `/app/data`. The database (`app.db`) and every
   uploaded photo, preview and render live there; without it they are lost on each deploy.
4. **Variables** (service → Variables):

   | Variable | Value | Secret |
   |---|---|---|
   | `JWT_SECRET` | a long random string: `python -c "import secrets; print(secrets.token_urlsafe(48))"` | yes |
   | `CORS_ORIGINS` | the Vercel address from step 2, e.g. `https://exterio.vercel.app` (set after step 2) | no |
   | `RAILWAY_RUN_UID` | `0` (the volume is owned by root; the image's own user cannot write to it otherwise) | no |
   | `ANTHROPIC_API_KEY` | the Claude key (Auto-detect) | yes |
   | `ANTHROPIC_GATEWAY_URL` | the Anthropic-compatible gateway address, if one is used | yes |
   | `ANTHROPIC_MODEL` | `claude-opus-5-5` | no |
   | `GOOGLE_VERTEX_CREDENTIALS` | the whole service-account key JSON, pasted as the value (photo check and advisor) | yes |
   | `MODAL_RENDER_URL` | the Modal renderer's address | no |
   | `MODAL_RENDER_TOKEN` | the `RENDER_TOKEN` of the `exterio-render-auth` Modal secret | yes |
   | `DEMO_ACCOUNT_EMAIL`, `DEMO_ACCOUNT_PASSWORD` | the published reviewer sign-in (defaults: `demo@example.com` / `review-2026`) | no, it is published |

   `APP_ENV=production`, `DATABASE_URL` and `STORAGE_DIR` are already set by the Dockerfile.
   In production the API refuses to start without a private `JWT_SECRET`.
5. **Networking** → Generate domain. Check `https://<api-domain>/api/health-check` returns
   `{"status":"ok"}` and `https://<api-domain>/api/docs` opens.

On the first start the API creates the database, the demo account and its four sample houses.

## 2. Web app on Vercel

1. Add new project → import `DharmikGohil/exterio`.
2. **Root directory** `exterio-frontend`. Vercel detects Vite; `exterio-frontend/vercel.json`
   sends every route to `index.html` so links into the studio work on reload.
3. Environment variable `VITE_API_BASE_URL` = `https://<api-domain>` (no trailing slash). It is
   built into the app, so redeploy after changing it.
4. Deploy, then put the Vercel address into the API's `CORS_ORIGINS` (step 1.4) and let Railway
   redeploy.

## 3. Check the live app

- The sign-in page loads, and **Try it with a sample house** signs in to the demo account with
  its four houses at their stages.
- Upload a photo; Auto-detect streams parts onto it; a finish, the estimate and the PDF work;
  the advisor answers; Generate render returns a photoreal image (the first after an idle spell
  takes about 30 s while Modal starts the GPU).

## Keys never go in the repository

Every secret above is set in the host's settings only. `exterio-backend/.env` is git-ignored and
only used locally.
