# Deployment

Exterio runs as two pieces: the API (`exterio-backend`, a Docker image) on **Railway**, with a
persistent volume for the database and photos, and the web app (`exterio-frontend`, a static
Vite build) on **Vercel**. The photoreal renderer (`exterio-render`) is already deployed on Modal.

Deploy the API first (the web app needs its address), then the web app, then tell the API the
web app's address.

## Live

- Web app: <https://exterio.dharmikgohil.in> (Vercel project `exterio`, root `exterio-frontend`;
  also at <https://exterio-mu.vercel.app>)
- API: <https://exterio-api.dharmikgohil.in> (Railway service `exterio`, root `exterio-backend`,
  volume at `/app/data`; also at <https://exterio-production.up.railway.app>); interactive docs at
  `/api/docs`
- DNS (Cloudflare, `dharmikgohil.in`): `exterio` CNAME to Vercel, `exterio-api` CNAME to Railway
  plus its `_railway-verify.exterio-api` TXT record. Both CNAMEs are **DNS only**: Vercel and
  Railway issue their own certificates, which Cloudflare's proxy would get in the way of.
- `VITE_API_BASE_URL` on Vercel is `https://exterio-api.dharmikgohil.in`; `CORS_ORIGINS` on Railway
  lists both web addresses.

The Railway service was created from the public repository URL, so a push to `main` does not
redeploy it on its own: redeploy from the service's Deployments tab (or connect GitHub there).
Check the Vercel project's Git settings the same way.

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
   | `GOOGLE_VERTEX_CREDENTIALS` | the whole service-account key JSON, pasted as the value (photo check, advisor and photoreal render) | yes |
   | `PHOTOREAL_RENDERER` | `gemini` (default; Gemini renders first, Modal is the fallback) | no |
   | `MODAL_RENDER_URL` | the Modal renderer's address (fallback renderer) | no |
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
  the advisor answers; Generate render returns a photoreal image in about 10 to 15 s (Gemini; if
  it is busy, Modal takes over, and its first render after an idle spell takes about 50 s).

## Keys never go in the repository

Every secret above is set in the host's settings only. `exterio-backend/.env` is git-ignored and
only used locally.
