"""Backend tests for the background-removal bug fix (rembg preloaded at startup)."""
import io
import os
import time

import pytest
import requests
from dotenv import dotenv_values

_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _env.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE_URL}/api"


def _make_png(size=(200, 200)):
    from PIL import Image, ImageDraw
    im = Image.new("RGB", size, "white")
    d = ImageDraw.Draw(im)
    d.rectangle([50, 50, 150, 150], fill=(220, 30, 30))
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


class TestRemoveBg:
    """POST /api/image/remove-bg"""

    def test_health_all_tools_true(self):
        r = requests.get(f"{API}/pdf/health", timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, dict)
        tools = data.get("tools", data)
        falsy = {k: v for k, v in tools.items() if v is False}
        assert not falsy, f"Tools reported unavailable: {falsy} | full={data}"

    def test_remove_bg_png_returns_transparent_png(self):
        png = _make_png()
        t0 = time.time()
        r = requests.post(
            f"{API}/image/remove-bg",
            files={"file": ("square.png", png, "image/png")},
            timeout=120,
        )
        elapsed = time.time() - t0
        assert r.status_code == 200, r.text[:500]
        assert r.headers["content-type"] == "image/png", r.headers
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n", "Response is not a PNG"
        assert len(r.content) > 100, f"PNG too small: {len(r.content)}"
        from PIL import Image
        im = Image.open(io.BytesIO(r.content))
        assert im.mode == "RGBA", f"Expected RGBA, got {im.mode}"
        alpha = im.getchannel("A")
        assert alpha.getextrema()[0] == 0, "No fully transparent pixels found (bg not removed)"
        assert "attachment" in r.headers.get("content-disposition", "")
        assert elapsed < 60, f"Request took too long: {elapsed:.1f}s"
        print(f"remove-bg elapsed: {elapsed:.2f}s size={len(r.content)}")

    def test_remove_bg_jpeg_ok_and_fast_second_call(self):
        from PIL import Image
        im = Image.new("RGB", (180, 180), (240, 240, 240))
        from PIL import ImageDraw
        ImageDraw.Draw(im).ellipse([40, 40, 140, 140], fill=(20, 60, 200))
        buf = io.BytesIO()
        im.save(buf, format="JPEG")
        t0 = time.time()
        r = requests.post(
            f"{API}/image/remove-bg",
            files={"file": ("circle.jpg", buf.getvalue(), "image/jpeg")},
            timeout=120,
        )
        elapsed = time.time() - t0
        assert r.status_code == 200, r.text[:500]
        out = Image.open(io.BytesIO(r.content))
        assert out.mode == "RGBA"
        assert elapsed < 30, f"Warm call slow: {elapsed:.1f}s"
        print(f"warm remove-bg elapsed: {elapsed:.2f}s")

    def test_remove_bg_rejects_non_image(self):
        r = requests.post(
            f"{API}/image/remove-bg",
            files={"file": ("notes.txt", b"not an image at all", "text/plain")},
            timeout=60,
        )
        assert r.status_code == 415, f"Expected 415, got {r.status_code}: {r.text[:300]}"

    def test_remove_bg_missing_file(self):
        r = requests.post(f"{API}/image/remove-bg", timeout=60)
        assert r.status_code == 422, r.status_code
