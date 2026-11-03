import os
import sys
import uvicorn

# Ensure utf-8 encoding on Windows console
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    print("=" * 70)
    print("🍲 SharePlate — Hyperlocal Real-Time Food Availability & Live GPS Map")
    print("=" * 70)
    print(f"👉 Local Web Application:   http://localhost:{port}")
    print(f"👉 Interactive Swagger API: http://localhost:{port}/docs")
    print(f"👉 Live WebSocket Feed:     ws://localhost:{port}/ws/live-feed")
    print("=" * 70)
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)


