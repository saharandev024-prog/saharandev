import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Download, Loader2, RefreshCw, X } from 'lucide-react';
import JSZip from 'jszip';
import FileDrop from '../components/FileDrop';

const fmtSize = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${(b / 1024).toFixed(0)} KB`);

const downloadBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

const Panel = ({ children }) => (
  <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 sm:p-7 space-y-5">{children}</div>
);

const UNITS = [
  { id: 'px', label: 'PX' },
  { id: 'cm', label: 'CM' },
  { id: 'mm', label: 'MM' },
  { id: 'in', label: 'Inch' },
];

// Popular size presets (passport photo, social square, prints)
const PRESETS = [
  { id: 'p3545', label: '3.5 × 4.5 CM', w: 3.5, h: 4.5, unit: 'cm' },
  { id: 'sq600', label: '600 × 600 PX', w: 600, h: 600, unit: 'px' },
  { id: 'in22', label: '2 × 2 Inch', w: 2, h: 2, unit: 'in' },
  { id: 'in46', label: '4 × 6 Inch', w: 4, h: 6, unit: 'in' },
];

const FORMATS = [
  { id: 'jpeg', label: 'JPEG', type: 'image/jpeg', ext: 'jpg' },
  { id: 'png', label: 'PNG', type: 'image/png', ext: 'png' },
  { id: 'webp', label: 'WebP', type: 'image/webp', ext: 'webp' },
];

const MAX_FILES = 10;

const r2 = (n) => Math.round(n * 100) / 100;
// Convert a value in the chosen unit to pixels (CM/MM/Inch need a DPI).
const toPx = (v, unit, dpi) =>
  unit === 'px' ? v : unit === 'cm' ? (v / 2.54) * dpi : unit === 'mm' ? (v / 25.4) * dpi : v * dpi;
const fromPx = (px, unit, dpi) =>
  unit === 'px' ? px : unit === 'cm' ? (px / dpi) * 2.54 : unit === 'mm' ? (px / dpi) * 25.4 : px / dpi;

const loadImg = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
    im.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    im.src = url;
  });

// Binary-search the encoder quality so the file lands at/under targetBytes at
// the HIGHEST quality possible (PNG has no quality knob -> encode as JPEG).
const encodeToTarget = async (canvas, type, targetBytes) => {
  if (type === 'image/png') type = 'image/jpeg';
  let lo = 0.1, hi = 0.95, best = null, smallest = null;
  for (let i = 0; i < 7; i++) {
    const q = (lo + hi) / 2;
    const blob = await new Promise((r) => canvas.toBlob(r, type, q));
    if (!blob) break;
    if (!smallest || blob.size < smallest.size) smallest = blob;
    if (blob.size <= targetBytes) { best = blob; lo = q; } else { hi = q; }
  }
  return best || smallest;
};

export default function ResizeTool() {
  const [files, setFiles] = useState([]);      // [{file, url, w, h}]
  const [unit, setUnit] = useState('px');
  const [dpi, setDpi] = useState(300);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [keepRatio, setKeepRatio] = useState(true);
  const [compressOn, setCompressOn] = useState(false);
  const [targetKB, setTargetKB] = useState(100);
  const [fmt, setFmt] = useState('jpeg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const first = files[0];

  const onFiles = async (list) => {
    const room = Math.max(0, MAX_FILES - files.length);
    const picked = list.slice(0, room);
    if (list.length > room) setError(`You can resize ${MAX_FILES} images at once — extra files were skipped.`);
    else setError('');
    const withDims = await Promise.all(picked.map(async (f) => {
      const url = URL.createObjectURL(f);
      const dims = await new Promise((res) => {
        const im = new Image();
        im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight });
        im.onerror = () => res({ w: 1, h: 1 });
        im.src = url;
      });
      return { file: f, url, w: dims.w, h: dims.h };
    }));
    const next = [...files, ...withDims];
    setFiles(next); setResults(null);
    // Prefill the boxes with the first image's own size (in the current unit).
    if (next.length && width === '' && height === '') {
      setWidth(String(r2(fromPx(next[0].w, unit, dpi))));
      setHeight(String(r2(fromPx(next[0].h, unit, dpi))));
    }
  };

  const onWidth = (v) => {
    setWidth(v);
    const wU = parseFloat(v);
    if (keepRatio && first && wU > 0) setHeight(String(r2((wU * first.h) / first.w)));
  };
  const onHeight = (v) => {
    setHeight(v);
    const hU = parseFloat(v);
    if (keepRatio && first && hU > 0) setWidth(String(r2((hU * first.w) / first.h)));
  };

  // Unit change: convert the typed values into the new unit; if nothing typed,
  // AUTO-FILL the photo's current size in the new unit (e.g. 3000px = 25.4cm).
  const changeUnit = (u) => {
    if (u === unit) return;
    const conv = (v) => {
      const n = parseFloat(v);
      return n > 0 ? String(r2(fromPx(toPx(n, unit, dpi), u, dpi))) : '';
    };
    const w = conv(width), h = conv(height);
    if (w || h) { setWidth(w); setHeight(h); }
    else if (first) {
      setWidth(String(r2(fromPx(first.w, u, dpi))));
      setHeight(String(r2(fromPx(first.h, u, dpi))));
    }
    setUnit(u);
  };

  // Live preview: what the output will look like with the chosen size/unit.
  const wU = parseFloat(width), hU = parseFloat(height);
  let prevW = 0, prevH = 0;
  if (first) {
    if (keepRatio) {
      if (wU > 0) { prevW = Math.max(1, Math.round(toPx(wU, unit, dpi))); prevH = Math.max(1, Math.round((prevW * first.h) / first.w)); }
      else if (hU > 0) { prevH = Math.max(1, Math.round(toPx(hU, unit, dpi))); prevW = Math.max(1, Math.round((prevH * first.w) / first.h)); }
    } else if (wU > 0 || hU > 0) {
      prevW = Math.max(1, Math.round(toPx(wU > 0 ? wU : hU, unit, dpi)));
      prevH = Math.max(1, Math.round(toPx(hU > 0 ? hU : wU, unit, dpi)));
    }
  }
  const previewAR = prevW > 0 && prevH > 0 ? prevW / prevH : first ? first.w / first.h : 1;

  const applyPreset = (p) => {
    setUnit(p.unit); setKeepRatio(false);
    setWidth(String(p.w)); setHeight(String(p.h));
  };

  const run = async () => {
    if (!files.length) { setError('Please add at least one image.'); return; }
    const wU = parseFloat(width), hU = parseFloat(height);
    if (!(wU > 0) && !(hU > 0)) { setError('Enter a width or height first.'); return; }
    setBusy(true); setError('');
    try {
      const F = FORMATS.find((f) => f.id === fmt);
      const doCompress = compressOn && Number(targetKB) > 0;
      const type = doCompress && F.type === 'image/png' ? 'image/jpeg' : F.type;
      const ext = doCompress && F.type === 'image/png' ? 'jpg' : F.ext;
      const out = [];
      for (const it of files) {
        const img = await loadImg(it.file);
        let tw, th;
        if (keepRatio) {
          if (wU > 0) { tw = Math.max(1, Math.round(toPx(wU, unit, dpi))); th = Math.max(1, Math.round((tw * img.naturalHeight) / img.naturalWidth)); }
          else { th = Math.max(1, Math.round(toPx(hU, unit, dpi))); tw = Math.max(1, Math.round((th * img.naturalWidth) / img.naturalHeight)); }
        } else {
          tw = Math.max(1, Math.round(toPx(wU > 0 ? wU : hU, unit, dpi)));
          th = Math.max(1, Math.round(toPx(hU > 0 ? hU : wU, unit, dpi)));
        }
        const canvas = document.createElement('canvas');
        canvas.width = tw; canvas.height = th;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        if (type !== 'image/png') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, tw, th); }
        ctx.drawImage(img, 0, 0, tw, th);
        const blob = doCompress
          ? await encodeToTarget(canvas, type, Number(targetKB) * 1024)
          : await new Promise((r) => canvas.toBlob(r, type, 0.92));
        if (!blob) throw new Error('encode failed');
        out.push({ name: `${it.file.name.replace(/\.[^.]+$/, '')}_${tw}x${th}.${ext}`, blob, url: URL.createObjectURL(blob), w: tw, h: th, orig: it.file.size });
      }
      setResults(out);
      if (out.length === 1) downloadBlob(out[0].blob, out[0].name);
    } catch (e) { setError('Could not resize one of these images. Try another file.'); }
    setBusy(false);
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    results.forEach((r) => zip.file(r.name, r.blob));
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, 'resized_images.zip');
  };

  const reset = () => { setFiles([]); setResults(null); setError(''); setWidth(''); setHeight(''); };

  /* -------- results view -------- */
  if (results) {
    return (
      <Panel>
        <div className="text-center">
          <div className="grid place-items-center w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-500"><Icons.CheckCircle2 className="w-7 h-7" /></div>
          <h3 className="font-display font-bold text-xl mt-3" data-testid="resize-done">Resized {results.length} image{results.length > 1 ? 's' : ''}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="resize-results">
          {results.map((r, i) => (
            <div key={r.name} className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex flex-col">
              <div className="grid place-items-center p-2 bg-white dark:bg-black/20"><img src={r.url} alt={r.name} className="max-h-28 object-contain" /></div>
              <div className="px-3 py-2 text-center border-t border-slate-200 dark:border-white/10">
                <p className="text-xs font-semibold truncate" title={r.name}>{r.name}</p>
                <p className="text-[11px] text-slate-400">{r.w} × {r.h} px · {fmtSize(r.orig)} → <b className="text-emerald-500">{fmtSize(r.blob.size)}</b></p>
                <button data-testid={`resize-download-${i}`} onClick={() => downloadBlob(r.blob, r.name)} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600"><Download className="w-3.5 h-3.5" /> Download</button>
              </div>
            </div>
          ))}
        </div>
        {results.length > 1 && (
          <button data-testid="resize-download-zip" onClick={downloadZip} className="w-full btn-primary text-white font-semibold py-4 rounded-xl inline-flex items-center justify-center gap-2">
            <Download className="w-5 h-5" /> Download all (ZIP)
          </button>
        )}
        <div className="text-center"><button onClick={reset} className="text-sm text-rose-500 font-semibold inline-flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Resize more images</button></div>
      </Panel>
    );
  }

  /* -------- main form (two-column like Photo Name & DOB: images left, controls right) -------- */
  return !files.length ? (
    <FileDrop accept="image/*" multiple onFiles={onFiles} label="Select images" hint={`Select or drag & drop images here · up to ${MAX_FILES} images at once`} />
  ) : (
    <Panel>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Left: live preview + selected images (sticky on desktop — no up/down scrolling) */}
        <div className="lg:sticky lg:top-20 self-start">
          {/* Live preview — adjusts to the chosen PX/CM/MM/Inch size */}
          {first && (
            <div className="mb-4">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/20 p-2 grid place-items-center">
                <div data-testid="resize-preview" className="relative overflow-hidden rounded-md bg-white dark:bg-white/5 mx-auto"
                  style={{ aspectRatio: `${previewAR}`, width: previewAR >= 1 ? '100%' : 'auto', height: previewAR >= 1 ? 'auto' : '260px', maxWidth: '100%', maxHeight: '280px' }}>
                  <img src={first.url} alt="preview" className={`w-full h-full ${keepRatio ? 'object-contain' : 'object-fill'}`} draggable={false} />
                </div>
              </div>
              <p className="hint text-center mt-1.5" data-testid="resize-preview-size">
                Current: {first.w} × {first.h} px
                {prevW > 0 && <> → Output: <b className="text-rose-500">{prevW} × {prevH} px</b>{unit !== 'px' && <> ({r2(fromPx(prevW, unit, dpi))} × {r2(fromPx(prevH, unit, dpi))} {unit === 'in' ? 'inch' : unit} @ {dpi} DPI)</>}</>}
                {files.length > 1 && <> · preview shows first image</>}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{files.length} image{files.length > 1 ? 's' : ''} added</p>
            <label className="text-xs font-semibold text-rose-500 cursor-pointer inline-flex items-center gap-1">
              <Icons.Plus className="w-3.5 h-3.5" /> Add more
              <input data-testid="resize-add-more" type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const fl = Array.from(e.target.files || []); if (fl.length) onFiles(fl); e.target.value = ''; }} />
            </label>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {files.map((it, i) => (
              <div key={`${it.file.name}-${i}`} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/20">
                <img src={it.url} alt="" className="w-full h-20 object-contain" />
                <span className="absolute bottom-0 inset-x-0 text-[9px] text-center bg-black/55 text-white py-0.5">{it.w}×{it.h}</span>
                <button data-testid={`resize-remove-${i}`} onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 grid place-items-center w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-500 transition-opacity"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          <p className="hint mt-2">Note:- You can resize {MAX_FILES} images at once.</p>
        </div>

        {/* Right: all controls */}
        <div className="space-y-5">
      {/* unit + dpi */}
      <div>
        <label className="block text-sm font-medium mb-2">Resize in</label>
        <div className="flex gap-2 flex-wrap">
          {UNITS.map((u) => (
            <button key={u.id} data-testid={`unit-${u.id}`} onClick={() => changeUnit(u.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${unit === u.id ? 'btn-primary text-white border-transparent' : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{u.label}</button>
          ))}
          {unit !== 'px' && (
            <select data-testid="dpi-select" value={dpi} onChange={(e) => setDpi(Number(e.target.value))} className="input w-auto text-sm">
              {[96, 150, 300, 600].map((d) => <option key={d} value={d}>{d} DPI</option>)}
            </select>
          )}
        </div>
        {unit !== 'px' && <p className="hint">CM/MM/Inch pixels mein convert hote hain selected DPI ke hisaab se (print ke liye 300 DPI best).</p>}
      </div>

      {/* quick presets */}
      <div>
        <label className="block text-sm font-medium mb-2">Quick presets</label>
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button key={p.id} data-testid={`preset-${p.id}`} onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 hover:border-rose-400 hover:text-rose-500 transition-colors">{p.label}</button>
          ))}
        </div>
      </div>

      {/* aspect ratio + dimensions */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <span className="text-sm font-medium">Maintain Aspect Ratio</span>
        <input data-testid="keep-ratio" type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} className="accent-rose-500 w-4 h-4" />
      </label>
      <div className="flex items-center gap-3">
        <input data-testid="resize-width" type="number" min="0" step="any" value={width} onChange={(e) => onWidth(e.target.value)} placeholder={`Width (${unit.toUpperCase()})`} className="input flex-1" />
        <X className="w-4 h-4 text-slate-400 shrink-0" />
        <input data-testid="resize-height" type="number" min="0" step="any" value={height} onChange={(e) => onHeight(e.target.value)} placeholder={`Height (${unit.toUpperCase()})`} className="input flex-1" />
      </div>

      {/* compress to specific size */}
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input data-testid="compress-toggle" type="checkbox" checked={compressOn} onChange={(e) => setCompressOn(e.target.checked)} className="accent-rose-500 w-4 h-4" />
          <span className="text-sm font-medium">Compress image to specific size</span>
        </label>
        {compressOn && (
          <div className="flex items-center gap-2 mt-2.5">
            <input data-testid="target-kb" type="number" min="1" value={targetKB} onChange={(e) => setTargetKB(e.target.value)} className="input w-32" placeholder="Ex. 100" />
            <span className="text-sm text-slate-500 font-medium">KB</span>
          </div>
        )}
      </div>

      {/* output format */}
      <div>
        <label className="block text-sm font-medium mb-2">Output</label>
        <div className="flex gap-2">
          {FORMATS.map((f) => (
            <button key={f.id} data-testid={`fmt-${f.id}`} onClick={() => setFmt(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${fmt === f.id ? 'btn-primary text-white border-transparent' : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-rose-500 font-medium" data-testid="tool-error">{error}</p>}
      <button data-testid="resize-btn" onClick={run} disabled={busy}
        className="w-full btn-primary text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70">
        {busy ? <><Loader2 className="w-5 h-5 animate-spin" /> Resizing...</> : <><Icons.Scaling className="w-5 h-5" /> Resize image{files.length > 1 ? 's' : ''}</>}
      </button>
        </div>
      </div>
    </Panel>
  );
}
