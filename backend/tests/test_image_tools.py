"""Backend integration tests for image tools (compress). remove-bg quota-limited; skipped."""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api/image"

BIG_JPG = "/tmp/big.jpg"


# ---------- Compress ----------
def test_compress_jpg_reduces_size():
    with open(BIG_JPG, "rb") as f:
        original = f.read()
    r = requests.post(
        f"{API}/compress",
        files={"file": ("big.jpg", original, "image/jpeg")},
        data={"quality": 60, "max_width": 0},
        timeout=90,
    )
    assert r.status_code == 200, r.text
    assert r.headers["content-type"].startswith("image/")
    assert len(r.content) > 0
    # Should be smaller than original at quality 60 for a ~1.4MB JPG
    assert len(r.content) < len(original), f"Compressed ({len(r.content)}) not smaller than original ({len(original)})"
    # PIL should decode the response
    from PIL import Image
    im = Image.open(io.BytesIO(r.content))
    im.verify()


def test_compress_rejects_non_image():
    r = requests.post(
        f"{API}/compress",
        files={"file": ("notes.txt", b"hello world this is not an image", "text/plain")},
        data={"quality": 75},
        timeout=30,
    )
    assert r.status_code >= 400 and r.status_code < 500, r.status_code


def test_compress_max_width_resizes():
    with open(BIG_JPG, "rb") as f:
        data = f.read()
    r = requests.post(
        f"{API}/compress",
        files={"file": ("big.jpg", data, "image/jpeg")},
        data={"quality": 80, "max_width": 800},
        timeout=90,
    )
    assert r.status_code == 200, r.text
    from PIL import Image
    im = Image.open(io.BytesIO(r.content))
    assert im.width <= 800, f"Width {im.width} not <= 800"


# ---------- Remove BG (skipped to preserve quota; main agent already curl-verified) ----------
@pytest.mark.skip(reason="remove.bg quota limited; validated separately by main agent")
def test_remove_bg():
    pass
