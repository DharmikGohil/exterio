"""ASGI entry point: `uvicorn bootstrap.server:app`."""

import uvicorn

from bootstrap.app import create_app
from bootstrap.env import load_settings

settings = load_settings()
app = create_app(settings)

if __name__ == "__main__":
    uvicorn.run("bootstrap.server:app", host="0.0.0.0", port=settings.port)
