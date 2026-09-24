import os
import sys
import urllib.parse

# Add the backend directory to sys.path so 'app' module can be imported
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

class VercelPathFixMiddleware:
    """
    ASGI middleware that restores the original request path when Vercel serverless
    rewrites incoming requests to /api/index.py.
    """
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            path = scope.get("path", "")
            if path in ("/api/index.py", "/api/index", "/api/index/"):
                headers = dict(scope.get("headers", []))
                # Check Vercel original URL headers
                orig = (
                    headers.get(b"x-vercel-original-url") or
                    headers.get(b"x-matched-path") or
                    headers.get(b"x-forwarded-uri")
                )
                if orig:
                    orig_path = orig.decode("utf-8").split("?")[0]
                    scope["path"] = orig_path
                    scope["raw_path"] = orig_path.encode("utf-8")
                else:
                    # Fallback to query parameter rewrite ?__path__=...
                    qs = scope.get("query_string", b"").decode("utf-8")
                    params = urllib.parse.parse_qs(qs)
                    if "__path__" in params and params["__path__"]:
                        subpath = params["__path__"][0].lstrip("/")
                        new_path = f"/api/{subpath}"
                        scope["path"] = new_path
                        scope["raw_path"] = new_path.encode("utf-8")

                        # Clean query parameters so endpoints receive only their intended query params
                        cleaned_params = [(k, v) for k, vals in params.items() if k != "__path__" for v in vals]
                        scope["query_string"] = urllib.parse.urlencode(cleaned_params).encode("utf-8")
                    else:
                        scope["path"] = "/api"
                        scope["raw_path"] = b"/api"

        await self.asgi_app(scope, receive, send)

# Wrap FastAPI app with ASGI middleware
handler = VercelPathFixMiddleware(app)
app = handler
