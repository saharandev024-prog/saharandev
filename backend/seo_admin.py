"""Admin panel + SEO management: JWT auth, per-page SEO, site/analytics
settings, blog CRUD, and public sitemap.xml / robots.txt."""
import os
import uuid
import datetime as dt
from typing import Optional, List

import bcrypt
import jwt
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

router = APIRouter(prefix="/api", tags=["admin-seo"])

# --- DB (own client so this module stays self-contained) ---
_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]

ADMINS = _db.admin_users
SEO_PAGES = _db.seo_pages
SITE = _db.site_settings
BLOG = _db.blog_posts

JWT_ALG = "HS256"
TOKEN_HOURS = 24 * 7

DEFAULT_ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@lovepdf.com")
DEFAULT_ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@12345")

# All crawlable tool slugs (mirrors frontend mock.js TOOLS)
TOOL_SLUGS = [
    "merge-pdf", "split-pdf", "compress-pdf", "organize-pdf", "rotate-pdf",
    "jpg-to-pdf", "pdf-to-jpg", "page-numbers", "watermark-pdf", "extract-pages",
    "remove-pages", "protect-pdf", "unlock-pdf", "word-to-pdf", "pdf-to-word",
    "excel-to-pdf", "pdf-to-excel", "ppt-to-pdf", "pdf-to-ppt", "html-to-pdf",
    "sign-pdf", "ocr-pdf", "repair-pdf", "crop-pdf", "compare-pdf", "pdf-to-pdfa",
    "compress-image", "crop-image", "remove-background", "photo-text",
]

security = HTTPBearer(auto_error=False)


def _jwt_secret() -> str:
    return os.environ.get("ADMIN_JWT_SECRET", "change-me-in-env-please-32chars-min")


def _now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


# ---------------------------------------------------------------- auth utils
def _hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def _check_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8")[:72], hashed.encode("utf-8"))
    except Exception:
        return False


def _make_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=TOKEN_HOURS),
        "iat": dt.datetime.now(dt.timezone.utc),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALG)


async def current_admin(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    if creds is None or not creds.credentials:
        raise HTTPException(401, "Not authenticated.")
    try:
        payload = jwt.decode(creds.credentials, _jwt_secret(), algorithms=[JWT_ALG])
        email = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Session expired. Please log in again.")
    except Exception:
        raise HTTPException(401, "Invalid session.")
    admin = await ADMINS.find_one({"email": email})
    if not admin:
        raise HTTPException(401, "Account not found.")
    return email


async def ensure_default_admin():
    """Idempotently create the default admin account if none exists."""
    existing = await ADMINS.find_one({"email": DEFAULT_ADMIN_EMAIL})
    if not existing:
        await ADMINS.insert_one({
            "id": str(uuid.uuid4()),
            "email": DEFAULT_ADMIN_EMAIL,
            "password_hash": _hash_pw(DEFAULT_ADMIN_PASSWORD),
            "created_at": _now_iso(),
        })
    # ensure a site settings doc exists
    if not await SITE.find_one({"_id": "global"}):
        await SITE.insert_one({
            "_id": "global",
            "site_name": "LovePDF",
            "site_url": "",
            "default_og_image": "",
            "ga_measurement_id": "",
            "gsc_verification": "",
            "gtm_id": "",
            "twitter_handle": "",
            "organization_name": "LovePDF",
            "organization_logo": "",
            "robots_extra": "",
            "updated_at": _now_iso(),
        })


# ---------------------------------------------------------------- models
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ChangePwIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class SeoPageIn(BaseModel):
    path: str
    title: Optional[str] = ""
    description: Optional[str] = ""
    keywords: Optional[str] = ""
    og_title: Optional[str] = ""
    og_description: Optional[str] = ""
    og_image: Optional[str] = ""
    canonical: Optional[str] = ""
    noindex: bool = False


class SiteIn(BaseModel):
    site_name: Optional[str] = ""
    site_url: Optional[str] = ""
    default_og_image: Optional[str] = ""
    ga_measurement_id: Optional[str] = ""
    gsc_verification: Optional[str] = ""
    gtm_id: Optional[str] = ""
    twitter_handle: Optional[str] = ""
    organization_name: Optional[str] = ""
    organization_logo: Optional[str] = ""
    robots_extra: Optional[str] = ""


class BlogIn(BaseModel):
    slug: str
    title: str
    excerpt: Optional[str] = ""
    content: Optional[str] = ""
    cover_image: Optional[str] = ""
    meta_title: Optional[str] = ""
    meta_description: Optional[str] = ""
    keywords: Optional[str] = ""
    author: Optional[str] = "LovePDF Team"
    published: bool = False


def _clean(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


# ---------------------------------------------------------------- auth routes
@router.post("/admin/login")
async def admin_login(body: LoginIn):
    admin = await ADMINS.find_one({"email": body.email})
    if not admin or not _check_pw(body.password, admin.get("password_hash", "")):
        raise HTTPException(401, "Invalid email or password.")
    return {"access_token": _make_token(admin["email"]), "email": admin["email"]}


@router.get("/admin/me")
async def admin_me(email: str = Depends(current_admin)):
    return {"email": email}


@router.post("/admin/change-password")
async def change_password(body: ChangePwIn, email: str = Depends(current_admin)):
    admin = await ADMINS.find_one({"email": email})
    if not _check_pw(body.current_password, admin.get("password_hash", "")):
        raise HTTPException(400, "Current password is incorrect.")
    await ADMINS.update_one({"email": email}, {"$set": {"password_hash": _hash_pw(body.new_password)}})
    return {"ok": True}


# ---------------------------------------------------------------- SEO pages
@router.get("/admin/seo/pages")
async def list_seo_pages(email: str = Depends(current_admin)):
    docs = await SEO_PAGES.find({}, {"_id": 0}).to_list(1000)
    return {"pages": docs}


@router.put("/admin/seo/pages")
async def upsert_seo_page(body: SeoPageIn, email: str = Depends(current_admin)):
    data = body.model_dump()
    data["updated_at"] = _now_iso()
    await SEO_PAGES.update_one({"path": body.path}, {"$set": data}, upsert=True)
    return {"ok": True, "path": body.path}


@router.get("/seo/page")
async def public_seo_page(path: str):
    doc = await SEO_PAGES.find_one({"path": path}, {"_id": 0})
    return {"seo": doc or None}


# ---------------------------------------------------------------- site settings
@router.get("/admin/site")
async def get_site(email: str = Depends(current_admin)):
    doc = await SITE.find_one({"_id": "global"})
    return {"site": _clean(doc) if doc else {}}


@router.put("/admin/site")
async def update_site(body: SiteIn, email: str = Depends(current_admin)):
    data = body.model_dump()
    data["updated_at"] = _now_iso()
    await SITE.update_one({"_id": "global"}, {"$set": data}, upsert=True)
    return {"ok": True}


@router.get("/seo/site")
async def public_site():
    doc = await SITE.find_one({"_id": "global"})
    return {"site": _clean(doc) if doc else {}}


# ---------------------------------------------------------------- blog
@router.get("/admin/blog")
async def admin_list_blog(email: str = Depends(current_admin)):
    docs = await BLOG.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"posts": docs}


@router.post("/admin/blog")
async def create_blog(body: BlogIn, email: str = Depends(current_admin)):
    if await BLOG.find_one({"slug": body.slug}):
        raise HTTPException(400, "A post with this slug already exists.")
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = _now_iso()
    doc["updated_at"] = _now_iso()
    await BLOG.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@router.put("/admin/blog/{post_id}")
async def update_blog(post_id: str, body: BlogIn, email: str = Depends(current_admin)):
    existing = await BLOG.find_one({"id": post_id})
    if not existing:
        raise HTTPException(404, "Post not found.")
    clash = await BLOG.find_one({"slug": body.slug, "id": {"$ne": post_id}})
    if clash:
        raise HTTPException(400, "Another post already uses this slug.")
    data = body.model_dump()
    data["updated_at"] = _now_iso()
    await BLOG.update_one({"id": post_id}, {"$set": data})
    return {"ok": True}


@router.delete("/admin/blog/{post_id}")
async def delete_blog(post_id: str, email: str = Depends(current_admin)):
    res = await BLOG.delete_one({"id": post_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Post not found.")
    return {"ok": True}


@router.get("/blog")
async def public_blog_list():
    docs = await BLOG.find({"published": True}, {"_id": 0, "content": 0}).sort("created_at", -1).to_list(1000)
    return {"posts": docs}


@router.get("/blog/{slug}")
async def public_blog_detail(slug: str):
    doc = await BLOG.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Post not found.")
    return {"post": doc}


# ---------------------------------------------------------------- sitemap & robots
async def _base_url(request: Request) -> str:
    doc = await SITE.find_one({"_id": "global"})
    site_url = (doc or {}).get("site_url", "").strip() if doc else ""
    if site_url:
        return site_url.rstrip("/")
    return str(request.base_url).rstrip("/")


@router.get("/sitemap.xml")
async def sitemap(request: Request):
    base = await _base_url(request)
    urls = [f"{base}/", f"{base}/blog"]
    urls += [f"{base}/tool/{s}" for s in TOOL_SLUGS]
    posts = await BLOG.find({"published": True}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(1000)
    for p in posts:
        urls.append(f"{base}/blog/{p['slug']}")
    today = dt.date.today().isoformat()
    items = "\n".join(
        f"  <url><loc>{u}</loc><lastmod>{today}</lastmod><changefreq>weekly</changefreq></url>"
        for u in urls
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{items}\n"
        "</urlset>\n"
    )
    return Response(content=xml, media_type="application/xml")


@router.get("/robots.txt")
async def robots(request: Request):
    base = await _base_url(request)
    doc = await SITE.find_one({"_id": "global"})
    extra = (doc or {}).get("robots_extra", "") if doc else ""
    body = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin\n"
        f"{extra + chr(10) if extra else ''}"
        f"Sitemap: {base}/api/sitemap.xml\n"
    )
    return Response(content=body, media_type="text/plain")
