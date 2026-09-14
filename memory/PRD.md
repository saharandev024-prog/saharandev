# LovePDF — PRD & Progress

## Origin
Cloned from GitHub: sanjivkumar71771-commits/lovepdf into /app (React + FastAPI + MongoDB).
Free online PDF & image toolkit (merge/split/compress/convert/edit/sign + image tools).

## Session (2026-09-01) — Edit PDF fixes, Remove BG options, Homepage professional
User asked for BOTH tasks together.

### Implemented
- **Edit PDF — keep original font size + word wrap** (`frontend/src/lib/pdfUtils.js`, `EditPdfPage.jsx`):
  - Removed shrink-to-fit on screen; edited text now keeps its ORIGINAL font size.
  - Added `wrapTextToWidth()`; `applyPdfEdits` & `applyPdfTextEdits` now wrap long text onto new lines (cover box + alignment span all lines) instead of shrinking. Verified font size stable (43.056px) before/after.
- **Remove Background — background color picker + custom image** (`frontend/src/pages/ImageToolPage.jsx`):
  - After AI cutout (transparent PNG), user picks Transparent / Solid colour (picker+swatches) / Custom image (upload). Client-side canvas compositing; download PNG (transparent) or JPG (with bg).
- **Homepage professional** (`frontend/src/pages/Home.jsx`, `mock.js`):
  - Removed fake testimonials ("What people are saying") and fake stats (5.2B+, 4.9/5). STATS now honest.
  - 9-question FAQ section (HTML-formatted answers via dangerouslySetInnerHTML) placed directly below the tools grid.
  - Added `<Seo>` with FAQPage JSON-LD schema in head; meta description = "lovepdf.co.in." (also in public/index.html).

### Testing
- Testing agent iteration_1: all 6 behaviours PASS. Frontend 100%. Backend remove-bg returns image/png.
- Out-of-scope: /api/pdf/health reports some system binaries (soffice/gs/qpdf/tesseract/pdftoppm) not installed in preview env — unrelated to this task.

### Notes / Backlog
- FAQ content is a professional default set (9 PDF-related Q&As). User offered to provide own content — can be swapped into `FAQS` in `frontend/src/mock.js` anytime.
- Optional cleanup: unused `measureTextWidthPx` (EditPdfPage), unused `httpx`/`REMOVE_BG_URL` (image_tools.py).
- Backend requirements installed excluding emergentintegrations/litellm URL (unused, caused pip conflict).

## Session addendum (2026-09-01) — Exact FAQ + SSR-in-raw-HTML + drag subject
- **Homepage FAQ replaced** with user's exact 9 Q&As (`frontend/src/mock.js`). Answers now render ALWAYS in the DOM (CSS grid-rows collapse, not conditional JS mount) so crawlers read them — `frontend/src/pages/Home.jsx`.
- **Raw HTML SEO**: FAQPage JSON-LD added to `<head>` of `frontend/public/index.html`; static FAQ HTML (9 Q&As) placed inside `#root` so it is present in view-source of the served/built page. React JSON-LD (Seo jsonLd prop) removed to avoid duplication. Verified via curl: 1 ld+json FAQPage + all FAQ text present in raw HTML. NOTE: dev server caches index.html — a frontend restart is needed after editing public/index.html.
- **Remove Background drag-to-position**: subject is now a draggable element on an interactive preview stage (pointer events, normalized centre position); works with subject-size, bg-fit, colour/image modes. Composite mirrors the drag position. `frontend/src/pages/ImageToolPage.jsx`.

## Session addendum (2026-09-01) — Photo Name & DOB full rebuild
- Rebuilt `PhotoTextTool` (/tool/photo-text) in `frontend/src/pages/ImageToolPage.jsx` into a 3-step flow:
  1. Upload → 2. Crop (react-easy-crop, passport 35:45) → 3. Edit.
- Edit step: sticky two-column layout (preview left, controls right) — no repeated scrolling.
  - Name & DOB each have their own text, font-size slider and colour picker; shared font-family select.
  - "Add Extra White Space On Bottom" checkbox adds a white strip below the photo (for printing name/DOB under the face).
  - Name & DOB are DRAGGABLE on the preview via pointer events (normalized centre positions); download canvas mirrors positions at full resolution.
  - Download verified (JPEG output). testids: phototext-crop, phototext-crop-next, phototext-edit, phototext-stage, name-input, dob-input, name-size, dob-size, name-color, dob-color, font-select, extra-white-checkbox, drag-name, drag-dob, phototext-download-btn.
