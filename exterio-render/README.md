# Exterio Render

The photoreal renderer for Exterio, deployed on [Modal](https://modal.com) as one GPU web
endpoint. It takes the instant preview (the house with each chosen finish painted flat onto its
region) and returns a realistic version.

## How it works

1. The API sends the preview and a short prompt built from the finishes
   (`build_diffusion_prompt` in the backend).
2. **SDXL img2img** at a low strength (0.30) adds light, depth and texture but keeps the planned
   colours.
3. A **Canny-edge ControlNet** at full weight (1.0) holds every edge of the building where it is.

The defaults were tuned on a real house photo. At 0.42 the model drew tile lines into plain paint;
at 0.25 and below it changed nothing visible. A request may pass `strength` (0.15–0.6) and
`controlnet_scale` (0.3–1.2) to experiment; values outside those bounds are clamped.
4. The API pastes the original photo back outside the edited regions, so nothing but the finishes
   can change.

| Part | Model | Licence |
|---|---|---|
| Base | `stabilityai/stable-diffusion-xl-base-1.0` | CreativeML Open RAIL++-M |
| Edges | `diffusers/controlnet-canny-sdxl-1.0` | Open RAIL++-M |
| VAE | `madebyollin/sdxl-vae-fp16-fix` (the stock VAE returns black images in fp16) | MIT |

It runs on one A10G GPU. Weights are baked into the container image at build time. Containers
shut down after 5 idle minutes, so an idle renderer costs nothing. Measured on the sample house:
about 30 seconds for the first render after an idle spell (GPU start and model load), 7–8 seconds
while warm.

## Deploy

```bash
uv tool install modal --with "fastapi[standard]"
modal token new
```

Create the shared secret the API sends as a bearer token (keep the value; it goes in the API's
`.env` as `MODAL_RENDER_TOKEN`):

```bash
modal secret create exterio-render-auth RENDER_TOKEN="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
```

```bash
modal deploy render_app.py
```

The deploy prints the endpoint URL (`https://<workspace>--exterio-render-renderer-render.modal.run`).
Set it as `MODAL_RENDER_URL` in `exterio-backend/.env`. With both set, the API uses this
renderer instead of fal.ai.

## API

`POST /` with `Authorization: Bearer <RENDER_TOKEN>` and JSON
`{ "image_base64": "...", "prompt": "...", "negative_prompt": "...", "strength"?: 0.3, "controlnet_scale"?: 1.0 }`. Returns `image/jpeg`.
`401` for a wrong token, `422` for a missing prompt or image, `413` above 12 MB.

## Tests

```bash
uv run --with pytest --no-project python -m pytest
```

They cover the image sizing (`render_sizing.py`), the part that runs without a GPU.
