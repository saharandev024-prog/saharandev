import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import * as Icons from 'lucide-react';
import { ChevronRight, X, Download, Loader2, RefreshCw } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FileDrop from '../components/FileDrop';
import ResizeTool from './ResizeTool';
import { TOOLS, ICON_TILE } from '../mock';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/image`;

const CHECKER = {
  backgroundImage:
    'linear-gradient(45deg,#d8dbe2 25%,transparent 25%),linear-gradient(-45deg,#d8dbe2 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d8dbe2 75%),linear-gradient(-45deg,transparent 75%,#d8dbe2 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0,0 10px,10px -10px,-10px 0',
};

const fmtSize = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${(b / 1024).toFixed(0)} KB`);

// Measures an element's width live (resize + step changes) so fixed-size
// preview stages shrink to fit small/mobile screens instead of overflowing.
const useMeasure = () => {
  const [w, setW] = useState(0);
  const ref = useCallback((node) => {
    if (!node) return undefined;
    const update = () => setW(node.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
};

const downloadBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

const Panel = ({ children }) => (
  <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 sm:p-7 space-y-5">{children}</div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium mb-2">{label}</label>
    {children}
  </div>
);

const FileChip = ({ file, onRemove }) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-4 py-3">
    <Icons.Image className="w-5 h-5 text-rose-500" />
    <span className="text-sm truncate flex-1">{file.name}</span>
    <span className="text-xs text-slate-400">{fmtSize(file.size)}</span>
    <button data-testid="remove-image-btn" onClick={onRemove} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"><X className="w-4 h-4" /></button>
  </div>
);

const PrimaryBtn = ({ busy, busyText, text, icon: I, onClick, testId }) => (
  <button data-testid={testId} onClick={onClick} disabled={busy}
    className="w-full btn-primary text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70">
    {busy ? <><Loader2 className="w-5 h-5 animate-spin" /> {busyText}</> : <><I className="w-5 h-5" /> {text}</>}
  </button>
);

/* ---------------- Compress ---------------- */
const CompressTool = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [targetVal, setTargetVal] = useState(200);
  const [targetUnit, setTargetUnit] = useState('KB');
  const [maxWidth, setMaxWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const onFiles = (list) => {
    const f = list[0];
    setFile(f); setResult(null); setError('');
    setPreview(URL.createObjectURL(f));
  };

  const run = async () => {
    setBusy(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('target_bytes', Math.max(0, Math.round((Number(targetVal) || 0) * (targetUnit === 'MB' ? 1024 * 1024 : 1024))));
      fd.append('max_width', maxWidth);
      const res = await fetch(`${API}/compress`, { method: 'POST', body: fd });
      if (!res.ok) { const j = await res.json().catch(() => null); throw new Error(j?.detail || 'Compression failed.'); }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const m = cd.match(/filename="?([^";]+)"?/);
      const r = { blob, name: m ? m[1] : 'compressed.jpg', url: URL.createObjectURL(blob) };
      setResult(r);
      downloadBlob(r.blob, r.name);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  if (result) {
    const saved = Math.max(0, Math.round((1 - result.blob.size / file.size) * 100));
    return (
      <Panel>
        <div className="text-center space-y-3" data-testid="compress-result">
          <img src={result.url} alt="Compressed" className="max-h-72 mx-auto rounded-xl border border-slate-200 dark:border-white/10 object-contain" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {fmtSize(file.size)} → <b className="text-emerald-500">{fmtSize(result.blob.size)}</b> · saved {saved}%
          </p>
          <button data-testid="download-compressed-btn" onClick={() => downloadBlob(result.blob, result.name)} className="btn-primary text-white font-semibold px-6 py-3 rounded-xl inline-flex items-center gap-2"><Download className="w-4 h-4" /> Download {result.name}</button>
          <div><button onClick={() => { setFile(null); setResult(null); setPreview(null); }} className="text-sm text-rose-500 font-semibold inline-flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Compress another image</button></div>
        </div>
      </Panel>
    );
  }

  return !file ? (
    <FileDrop accept="image/jpeg,image/png,image/webp" multiple={false} onFiles={onFiles} label="Select image" hint="JPG, PNG or WebP · up to 20 MB" />
  ) : (
    <Panel>
      {preview && <div data-testid="file-preview" className="flex justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3"><img src={preview} alt="Preview" className="max-h-72 rounded-lg object-contain" /></div>}
      <FileChip file={file} onRemove={() => { setFile(null); setPreview(null); }} />
      <Field label="Compress this image to (choose your target size)">
        <div className="flex items-stretch gap-2">
          <input data-testid="target-size-input" type="number" min="1" value={targetVal} onChange={(e) => setTargetVal(e.target.value)} className="input flex-1" placeholder="e.g. 200" />
          <select data-testid="target-unit-select" value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} className="input w-24">
            <option value="KB">KB</option>
            <option value="MB">MB</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {[{ v: 50, u: 'KB' }, { v: 100, u: 'KB' }, { v: 200, u: 'KB' }, { v: 500, u: 'KB' }, { v: 1, u: 'MB' }, { v: 2, u: 'MB' }].map((p) => (
            <button key={`${p.v}${p.u}`} data-testid={`target-chip-${p.v}${p.u}`} onClick={() => { setTargetVal(p.v); setTargetUnit(p.u); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${Number(targetVal) === p.v && targetUnit === p.u ? 'btn-primary text-white border-transparent' : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{p.v} {p.u}</button>
          ))}
        </div>
        <p className="hint">Enter the size you want (for example <b>200 KB</b>). We'll bring your image at or below it while keeping the quality as high as possible — perfect for forms with strict size limits.</p>
      </Field>
      <Field label="Max width">
        <div className="flex gap-2 flex-wrap">
          {[{ v: 0, l: 'Original' }, { v: 1920, l: '1920px' }, { v: 1280, l: '1280px' }, { v: 800, l: '800px' }].map((o) => (
            <button key={o.v} onClick={() => setMaxWidth(o.v)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${maxWidth === o.v ? 'btn-primary text-white border-transparent' : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{o.l}</button>
          ))}
        </div>
      </Field>
      {error && <p className="text-sm text-rose-500 font-medium" data-testid="tool-error">{error}</p>}
      <PrimaryBtn testId="compress-btn" busy={busy} busyText="Compressing..." text="Compress image" icon={Icons.ImageDown} onClick={run} />
    </Panel>
  );
};

/* ---------------- Remove background ---------------- */
const BG_SWATCHES = ['#ffffff', '#000000', '#f43f5e', '#3b82f6', '#22c55e', '#facc15', '#a855f7', '#0f172a'];

const RemoveBgTool = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cutout, setCutout] = useState(null);     // transparent PNG { blob, url, name }
  const [composed, setComposed] = useState(null);  // final output { blob, url, name }
  const [bgMode, setBgMode] = useState('transparent'); // transparent | color | image
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgImage, setBgImage] = useState(null);     // custom background dataURL
  const [subjectScale, setSubjectScale] = useState(100); // subject (foreground) size %
  const [bgFit, setBgFit] = useState('cover');      // cover | contain | stretch
  const [subjectPos, setSubjectPos] = useState({ x: 0.5, y: 0.5 }); // subject centre (normalized)
  const bgInputRef = useRef(null);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const [bgWrapRef, bgWrapW] = useMeasure();

  const onFiles = (list) => {
    const f = list[0];
    setFile(f); setError(''); setCutout(null); setComposed(null);
    setBgMode('transparent'); setBgImage(null); setSubjectScale(100); setBgFit('cover'); setSubjectPos({ x: 0.5, y: 0.5 });
    setPreview(URL.createObjectURL(f));
  };

  const run = async () => {
    setBusy(true); setError('');
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch(`${API}/remove-bg`, { method: 'POST', body: fd });
      if (!res.ok) { const j = await res.json().catch(() => null); throw new Error(j?.detail || 'Background removal failed.'); }
      const blob = await res.blob();
      const name = file.name.replace(/\.[^.]+$/, '') + '_no_bg.png';
      const url = URL.createObjectURL(blob);
      const dims = await new Promise((resolve) => { const im = new Image(); im.onload = () => resolve({ w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => resolve({ w: 1, h: 1 }); im.src = url; });
      setSubjectPos({ x: 0.5, y: 0.5 });
      setCutout({ blob, url, name, w: dims.w, h: dims.h });
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const onBgImage = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { setBgImage(r.result); setBgMode('image'); };
    r.readAsDataURL(f);
  };

  // Drag the subject around the preview stage (pointer events = mouse + touch).
  const onSubjectMove = (e) => {
    const d = dragRef.current; if (!d) return;
    const dx = (e.clientX - d.startX) / d.rw;
    const dy = (e.clientY - d.startY) / d.rh;
    setSubjectPos({ x: Math.max(0, Math.min(1, d.ox + dx)), y: Math.max(0, Math.min(1, d.oy + dy)) });
  };
  const onSubjectUp = () => {
    dragRef.current = null;
    window.removeEventListener('pointermove', onSubjectMove);
    window.removeEventListener('pointerup', onSubjectUp);
  };
  const onSubjectDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: subjectPos.x, oy: subjectPos.y, rw: rect.width, rh: rect.height };
    window.addEventListener('pointermove', onSubjectMove);
    window.addEventListener('pointerup', onSubjectUp);
  };

  // Composite the transparent cutout over the chosen background (color / image
  // / none) whenever any option changes, producing the downloadable result.
  useEffect(() => {
    if (!cutout) { setComposed(null); return; }
    let cancelled = false;
    (async () => {
      const fg = new Image(); fg.src = cutout.url;
      await new Promise((res, rej) => { fg.onload = res; fg.onerror = rej; });
      const canvas = document.createElement('canvas');
      canvas.width = fg.naturalWidth; canvas.height = fg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (bgMode === 'color') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgMode === 'image' && bgImage) {
        const bg = new Image(); bg.src = bgImage;
        await new Promise((res, rej) => { bg.onload = res; bg.onerror = rej; });
        const ir = bg.naturalWidth / bg.naturalHeight;
        const cr = canvas.width / canvas.height;
        if (bgFit === 'stretch') {
          ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        } else if (bgFit === 'contain') {
          // fit the whole background inside the frame (letterbox the rest white)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          let dw, dh, dx, dy;
          if (ir > cr) { dw = canvas.width; dh = dw / ir; dx = 0; dy = (canvas.height - dh) / 2; }
          else { dh = canvas.height; dw = dh * ir; dx = (canvas.width - dw) / 2; dy = 0; }
          ctx.drawImage(bg, dx, dy, dw, dh);
        } else { // cover
          let dw, dh, dx, dy;
          if (ir > cr) { dh = canvas.height; dw = dh * ir; dx = (canvas.width - dw) / 2; dy = 0; }
          else { dw = canvas.width; dh = dw / ir; dx = 0; dy = (canvas.height - dh) / 2; }
          ctx.drawImage(bg, dx, dy, dw, dh);
        }
      }
      // Draw the subject (foreground) scaled by subjectScale and positioned by
      // the user's drag (subjectPos = centre, normalized 0..1).
      const s = Math.max(0.3, Math.min(1, subjectScale / 100));
      const fw = canvas.width * s;
      const fh = canvas.height * s;
      const fx = (subjectPos.x - s / 2) * canvas.width;
      const fy = (subjectPos.y - s / 2) * canvas.height;
      ctx.drawImage(fg, fx, fy, fw, fh);
      const transparent = bgMode === 'transparent';
      const type = transparent ? 'image/png' : 'image/jpeg';
      const ext = transparent ? 'png' : 'jpg';
      const blob = await new Promise((r) => canvas.toBlob(r, type, 0.95));
      if (cancelled || !blob) return;
      const base = cutout.name.replace(/_no_bg\.png$/, '');
      const tag = transparent ? 'no_bg' : bgMode === 'color' ? 'bg_color' : 'bg_image';
      setComposed({ blob, url: URL.createObjectURL(blob), name: `${base}_${tag}.${ext}` });
    })();
    return () => { cancelled = true; };
  }, [cutout, bgMode, bgColor, bgImage, subjectScale, bgFit, subjectPos]);

  const reset = () => { setFile(null); setCutout(null); setComposed(null); setPreview(null); setBgImage(null); setBgMode('transparent'); setSubjectScale(100); setBgFit('cover'); setSubjectPos({ x: 0.5, y: 0.5 }); };

  if (cutout) {
    const AR = (cutout.w || 1) / (cutout.h || 1);
    let stageW = Math.max(200, Math.min(420, (bgWrapW || 420) - 26)), stageH = stageW / AR;
    const maxH = 460;
    if (stageH > maxH) { stageH = maxH; stageW = stageH * AR; }
    const s = Math.max(0.3, Math.min(1, subjectScale / 100));
    const subLeft = (subjectPos.x - s / 2) * stageW;
    const subTop = (subjectPos.y - s / 2) * stageH;
    const bgFitClass = bgFit === 'cover' ? 'object-cover' : bgFit === 'contain' ? 'object-contain' : 'object-fill';
    return (
      <Panel>
        <div className="grid lg:grid-cols-2 gap-6 items-start" data-testid="removebg-result">
          {/* Preview stage — sticky on desktop so it stays visible; drag the subject to move it */}
          <div className="lg:sticky lg:top-20 self-start z-10">
            <div ref={bgWrapRef} className="flex justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3">
              <div ref={stageRef} data-testid="removebg-stage"
                className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 select-none"
                style={{ width: stageW, height: stageH, ...(bgMode === 'transparent' ? CHECKER : bgMode === 'color' ? { backgroundColor: bgColor } : { backgroundColor: '#ffffff' }) }}>
                {bgMode === 'image' && bgImage && (
                  <img src={bgImage} alt="background" draggable={false} className={`absolute inset-0 w-full h-full ${bgFitClass} pointer-events-none select-none`} />
                )}
                <img src={cutout.url} alt="subject" draggable={false} onPointerDown={onSubjectDown} data-testid="removebg-subject"
                  className="absolute cursor-move touch-none"
                  style={{ left: subLeft, top: subTop, width: stageW * s, height: stageH * s }} />
              </div>
            </div>
            <p className="hint text-center mt-2 flex items-center justify-center gap-1"><Icons.Move className="w-3.5 h-3.5" /> Drag the subject to reposition it on the background.</p>
          </div>

          {/* Controls */}
          <div className="space-y-5">
            <Field label="Background">
              <div className="flex gap-2 flex-wrap">
                {[{ id: 'transparent', l: 'Transparent' }, { id: 'color', l: 'Solid colour' }, { id: 'image', l: 'Custom image' }].map((m) => (
                  <button key={m.id} data-testid={`bg-mode-${m.id}`} onClick={() => setBgMode(m.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${bgMode === m.id ? 'btn-primary text-white border-transparent' : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{m.l}</button>
                ))}
              </div>
            </Field>

            {bgMode === 'color' && (
              <Field label="Background colour">
                <div className="flex items-center gap-2 flex-wrap">
                  <input data-testid="bg-color-picker" type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-10 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer bg-transparent" />
                  {BG_SWATCHES.map((c) => (
                    <button key={c} data-testid={`bg-swatch-${c}`} onClick={() => setBgColor(c)} className={`w-7 h-7 rounded-full border-2 ${bgColor.toLowerCase() === c ? 'border-rose-500' : 'border-slate-200 dark:border-white/20'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </Field>
            )}

            {bgMode === 'image' && (
              <Field label="Custom background image">
                <input ref={bgInputRef} data-testid="bg-image-input" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onBgImage} />
                <button data-testid="bg-image-upload-btn" onClick={() => bgInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-rose-400 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <Icons.UploadCloud className="w-5 h-5 text-rose-500" /> {bgImage ? 'Change background image' : 'Upload background image'}
                </button>
                {!bgImage && <p className="hint">Pick a JPG or PNG to place behind your subject.</p>}
              </Field>
            )}

            {bgMode === 'image' && bgImage && (
              <Field label="Background fit">
                <div className="flex gap-2 flex-wrap">
                  {[{ id: 'cover', l: 'Cover' }, { id: 'contain', l: 'Fit inside' }, { id: 'stretch', l: 'Stretch' }].map((m) => (
                    <button key={m.id} data-testid={`bg-fit-${m.id}`} onClick={() => setBgFit(m.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${bgFit === m.id ? 'btn-primary text-white border-transparent' : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{m.l}</button>
                  ))}
                </div>
                <p className="hint">Adjust how the background image fills the frame.</p>
              </Field>
            )}

            {bgMode !== 'transparent' && (
              <Field label={`Subject size: ${subjectScale}%`}>
                <input data-testid="subject-size-slider" type="range" min="30" max="100" step="1" value={subjectScale} onChange={(e) => setSubjectScale(Number(e.target.value))} className="w-full accent-rose-500" />
                <p className="hint">Shrink your subject so it fits neatly inside the background.</p>
              </Field>
            )}

            <button data-testid="download-nobg-btn" disabled={!composed} onClick={() => composed && downloadBlob(composed.blob, composed.name)}
              className="w-full btn-primary text-white font-semibold py-4 rounded-xl inline-flex items-center justify-center gap-2 disabled:opacity-70">
              <Download className="w-4 h-4" /> Download {bgMode === 'transparent' ? 'transparent PNG' : 'image'}
            </button>
            <div className="text-center"><button onClick={reset} className="text-sm text-rose-500 font-semibold inline-flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Try another photo</button></div>
          </div>
        </div>
      </Panel>
    );
  }

  return !file ? (
    <FileDrop accept="image/jpeg,image/png,image/webp" multiple={false} onFiles={onFiles} label="Select photo" hint="Works best with people, products and animals" />
  ) : (
    <Panel>
      {preview && <div data-testid="file-preview" className="flex justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3"><img src={preview} alt="Preview" className="max-h-72 rounded-lg object-contain" /></div>}
      <FileChip file={file} onRemove={() => { setFile(null); setPreview(null); }} />
      {error && <p className="text-sm text-rose-500 font-medium" data-testid="tool-error">{error}</p>}
      <PrimaryBtn testId="removebg-btn" busy={busy} busyText="Removing background..." text="Remove background" icon={Icons.Eraser} onClick={run} />
      <p className="hint text-center">Powered by AI · then choose a transparent, colour or custom-image background</p>
    </Panel>
  );
};

/* ---------------- Crop ---------------- */
const ASPECTS = [
  { id: 'free', label: 'Free', v: null },
  { id: '1:1', label: 'Square 1:1', v: 1 },
  { id: '4:3', label: '4:3', v: 4 / 3 },
  { id: '3:4', label: '3:4', v: 3 / 4 },
  { id: '16:9', label: '16:9', v: 16 / 9 },
  { id: '3:2', label: 'Photo 3:2', v: 3 / 2 },
];

const CropTool = () => {
  const [file, setFile] = useState(null);
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectId, setAspectId] = useState('free');
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const [areaPx, setAreaPx] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const aspect = useMemo(() => {
    if (customW > 0 && customH > 0) return Number(customW) / Number(customH);
    const a = ASPECTS.find((x) => x.id === aspectId);
    return a && a.v ? a.v : undefined;
  }, [aspectId, customW, customH]);

  const onFiles = (list) => { const f = list[0]; setFile(f); setSrc(URL.createObjectURL(f)); setResult(null); setError(''); setZoom(1); setCrop({ x: 0, y: 0 }); };
  const onCropComplete = useCallback((_, px) => setAreaPx(px), []);

  const apply = async () => {
    if (!areaPx) return;
    try {
      const img = new Image();
      img.src = src;
      await new Promise((r, j) => { img.onload = r; img.onerror = j; });
      const canvas = document.createElement('canvas');
      const outW = customW > 0 ? Number(customW) : Math.round(areaPx.width);
      const outH = customH > 0 ? Number(customH) : Math.round(areaPx.height);
      canvas.width = outW; canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, areaPx.x, areaPx.y, areaPx.width, areaPx.height, 0, 0, outW, outH);
      const isPng = /png$/i.test(file.type);
      const blob = await new Promise((r) => canvas.toBlob(r, isPng ? 'image/png' : 'image/jpeg', 0.92));
      const rr = { blob, name: file.name.replace(/\.[^.]+$/, '') + `_cropped.${isPng ? 'png' : 'jpg'}`, url: URL.createObjectURL(blob), w: outW, h: outH };
      setResult(rr);
      downloadBlob(rr.blob, rr.name);
    } catch (e) { setError('Could not crop this image.'); }
  };

  if (result) {
    return (
      <Panel>
        <div className="text-center space-y-3" data-testid="crop-result">
          <img src={result.url} alt="Cropped" className="max-h-72 mx-auto rounded-xl border border-slate-200 dark:border-white/10 object-contain" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{result.w} × {result.h} px · {fmtSize(result.blob.size)}</p>
          <button data-testid="download-cropped-btn" onClick={() => downloadBlob(result.blob, result.name)} className="btn-primary text-white font-semibold px-6 py-3 rounded-xl inline-flex items-center gap-2"><Download className="w-4 h-4" /> Download {result.name}</button>
          <div><button onClick={() => setResult(null)} className="text-sm text-rose-500 font-semibold inline-flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Adjust crop again</button></div>
        </div>
      </Panel>
    );
  }

  return !file ? (
    <FileDrop accept="image/*" multiple={false} onFiles={onFiles} label="Select image" hint="Crop to presets or exact pixel sizes" />
  ) : (
    <Panel>
      <div data-testid="crop-editor" className="relative w-full h-[380px] rounded-xl overflow-hidden bg-slate-900">
        <Cropper image={src} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
      </div>
      <Field label={`Zoom: ${zoom.toFixed(1)}x`}>
        <input data-testid="zoom-slider" type="range" min="1" max="4" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-rose-500" />
      </Field>
      <Field label="Preset sizes">
        <div className="flex gap-2 flex-wrap">
          {ASPECTS.map((a) => (
            <button key={a.id} data-testid={`aspect-${a.id}`} onClick={() => { setAspectId(a.id); setCustomW(''); setCustomH(''); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${aspectId === a.id && !customW ? 'btn-primary text-white border-transparent' : 'border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{a.label}</button>
          ))}
        </div>
      </Field>
      <Field label="Custom output size (px, optional)">
        <div className="flex items-center gap-2">
          <input data-testid="custom-width" type="number" min="1" placeholder="Width" value={customW} onChange={(e) => setCustomW(e.target.value)} className="input flex-1" />
          <span className="text-slate-400">×</span>
          <input data-testid="custom-height" type="number" min="1" placeholder="Height" value={customH} onChange={(e) => setCustomH(e.target.value)} className="input flex-1" />
        </div>
        <p className="hint">Fill both to lock the exact output dimensions (e.g. 600 × 600 for a profile photo).</p>
      </Field>
      <FileChip file={file} onRemove={() => { setFile(null); setSrc(null); }} />
      {error && <p className="text-sm text-rose-500 font-medium">{error}</p>}
      <PrimaryBtn testId="crop-apply-btn" busy={false} busyText="" text="Crop image" icon={Icons.Crop} onClick={apply} />
    </Panel>
  );
};

/* ---------------- Photo Name & DOB ---------------- */
const FONTS = [
  { id: "Georgia, 'Times New Roman', serif", label: 'Classic Serif' },
  { id: 'Arial, Helvetica, sans-serif', label: 'Clean Sans' },
  { id: "'Brush Script MT', 'Segoe Script', cursive", label: 'Handwriting' },
  { id: "'Comic Sans MS', 'Chalkboard SE', cursive", label: 'Playful' },
  { id: "Impact, 'Arial Black', sans-serif", label: 'Bold Impact' },
  { id: "'Courier New', monospace", label: 'Typewriter' },
];

const PhotoTextTool = () => {
  const [step, setStep] = useState('upload');        // upload | crop | edit
  const [file, setFile] = useState(null);
  const [src, setSrc] = useState(null);              // original object URL
  const [natural, setNatural] = useState({ w: 1, h: 1 }); // source image natural size
  const [box, setBox] = useState({ x: 0.2, y: 0.05, w: 0.6, h: 0.9 }); // crop rect (normalized)
  const [photo, setPhoto] = useState(null);          // cropped image { url, w, h }
  const [extraWhite, setExtraWhite] = useState(false);
  const [font, setFont] = useState(FONTS[0].id);     // shared font family (default: Classic Serif)
  const [name, setName] = useState({ text: '', size: 6, color: '#0f172a', scaleX: 1, pos: { x: 0.5, y: 0.5 }, manual: false });
  const [dob, setDob] = useState({ text: '', size: 4, color: '#0f172a', scaleX: 1, pos: { x: 0.5, y: 0.6 }, manual: false });
  const [outline, setOutline] = useState(false);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const cropStageRef = useRef(null);
  const cropDrag = useRef(null);
  const [stageWrapRef, stageWrapW] = useMeasure();   // edit-step stage container width
  const [cropWrapRef, cropWrapW] = useMeasure();     // crop-step container width
  // Extra white band height as a fraction of the photo WIDTH, driven by the
  // sizes of the texts that actually have content (so the band is only as tall
  // as the text needs). With no text yet, keep a strip for handwriting.
  const whiteBandFrac = () => {
    const sizes = [name.text.trim() ? name.size : 0, dob.text.trim() ? dob.size : 0];
    const total = sizes[0] + sizes[1];
    return (((total || name.size + dob.size) / 100) * 1.5);
  };
  // Geometry of the white band as a fraction of the TOTAL canvas height.
  const bandGeom = () => {
    const K = extraWhite ? whiteBandFrac() : 0;
    const rh = photo.h / photo.w;
    const imgFrac = rh / (rh + K);
    return { imgFrac, white: 1 - imgFrac };
  };
  // AUTO position: text stays centred in the white band until the user drags
  // it somewhere manually. Texts share the band evenly (1 text → dead centre).
  const autoPos = (which) => {
    if (!extraWhite) return which === 'name' ? { x: 0.5, y: 0.5 } : { x: 0.5, y: 0.62 };
    const { imgFrac, white } = bandGeom();
    const list = [name.text.trim() ? 'name' : null, dob.text.trim() ? 'dob' : null].filter(Boolean);
    const i = Math.max(0, list.indexOf(which));
    const n = Math.max(1, list.length);
    return { x: 0.5, y: imgFrac + white * ((i + 1) / (n + 1)) };
  };
  const effPos = (which, t) => (t.manual ? t.pos : autoPos(which));

  const onFiles = (list) => {
    const f = list[0]; setFile(f);
    const url = URL.createObjectURL(f); setSrc(url);
    setBox({ x: 0.2, y: 0.05, w: 0.6, h: 0.9 });
    const im = new Image();
    im.onload = () => { setNatural({ w: im.naturalWidth, h: im.naturalHeight }); setStep('crop'); };
    im.src = url;
  };

  // Custom crop box: drag to move, pull corner grips to resize (no zoom).
  const onCropMove = (e) => {
    const d = cropDrag.current; if (!d) return;
    const dnx = (e.clientX - d.startX) / d.rw;
    const dny = (e.clientY - d.startY) / d.rh;
    const MIN = 0.12;
    const b = { ...d.box0 };
    if (d.mode === 'move') {
      b.x = Math.max(0, Math.min(1 - d.box0.w, d.box0.x + dnx));
      b.y = Math.max(0, Math.min(1 - d.box0.h, d.box0.y + dny));
    } else {
      let { x, y, w, h } = d.box0; const hd = d.handle;
      if (hd.includes('e')) w = Math.max(MIN, Math.min(1 - x, d.box0.w + dnx));
      if (hd.includes('s')) h = Math.max(MIN, Math.min(1 - y, d.box0.h + dny));
      if (hd.includes('w')) { const nx = Math.max(0, Math.min(d.box0.x + d.box0.w - MIN, d.box0.x + dnx)); w = d.box0.w + (d.box0.x - nx); x = nx; }
      if (hd.includes('n')) { const ny = Math.max(0, Math.min(d.box0.y + d.box0.h - MIN, d.box0.y + dny)); h = d.box0.h + (d.box0.y - ny); y = ny; }
      b.x = x; b.y = y; b.w = w; b.h = h;
    }
    setBox(b);
  };
  const endCrop = () => { cropDrag.current = null; window.removeEventListener('pointermove', onCropMove); window.removeEventListener('pointerup', endCrop); };
  const startCrop = (mode, handle, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!cropStageRef.current) return;
    const rect = cropStageRef.current.getBoundingClientRect();
    cropDrag.current = { mode, handle, startX: e.clientX, startY: e.clientY, box0: { ...box }, rw: rect.width, rh: rect.height };
    window.addEventListener('pointermove', onCropMove);
    window.addEventListener('pointerup', endCrop);
  };

  const applyCrop = async () => {
    const img = new Image(); img.src = src;
    await new Promise((r, j) => { img.onload = r; img.onerror = j; });
    const sx = box.x * natural.w, sy = box.y * natural.h, sw = box.w * natural.w, sh = box.h * natural.h;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sw)); canvas.height = Math.max(1, Math.round(sh));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    setPhoto({ url: canvas.toDataURL('image/jpeg', 0.95), w: canvas.width, h: canvas.height });
    setStep('edit');
  };

  // Drag to move OR drag the corner grip to resize OR the side grip to stretch
  // (lamba) the name / dob text.
  const onDrag = (e) => {
    const d = dragRef.current; if (!d) return;
    const setter = d.which === 'name' ? setName : setDob;
    if (d.mode === 'resize') {
      const delta = (((e.clientX - d.startX) + (e.clientY - d.startY)) / 2) / d.rw * 100;
      const min = d.which === 'name' ? 3 : 2;
      const max = d.which === 'name' ? 20 : 18;
      setter((prev) => ({ ...prev, size: Math.max(min, Math.min(max, +(d.size0 + delta).toFixed(1))) }));
      return;
    }
    if (d.mode === 'stretch') {
      // Widen/narrow the text horizontally WITHOUT changing its height.
      const dsx = ((e.clientX - d.startX) / d.rw) * 3;
      setter((prev) => ({ ...prev, scaleX: Math.max(0.5, Math.min(3, +(d.sx0 + dsx).toFixed(2))) }));
      return;
    }
    const nx = Math.max(0, Math.min(1, d.ox + (e.clientX - d.startX) / d.rw));
    const ny = Math.max(0, Math.min(1, d.oy + (e.clientY - d.startY) / d.rh));
    setter((prev) => ({ ...prev, manual: true, pos: { x: nx, y: ny } }));
  };
  const endDrag = () => { dragRef.current = null; window.removeEventListener('pointermove', onDrag); window.removeEventListener('pointerup', endDrag); };
  const startDrag = (which, mode, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const t = which === 'name' ? name : dob;
    const p = effPos(which, t); // drag must start from the VISIBLE position (auto-centred text has a stale stored pos — using it made the text jump to the image centre on click)
    dragRef.current = { which, mode, startX: e.clientX, startY: e.clientY, ox: p.x, oy: p.y, size0: t.size, sx0: t.scaleX || 1, rw: rect.width, rh: rect.height };
    window.addEventListener('pointermove', onDrag);
    window.addEventListener('pointerup', endDrag);
  };

  const save = async () => {
    const img = new Image(); img.src = photo.url;
    await new Promise((r, j) => { img.onload = r; img.onerror = j; });
    const W = photo.w;
    const extra = extraWhite ? Math.round(W * whiteBandFrac()) : 0;
    const H = photo.h + extra;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, photo.h);
    const drawText = (which, t) => {
      if (!t.text.trim()) return;
      const fontPx = (W * t.size) / 100;
      const str = t.text.trim().toUpperCase();
      ctx.font = `bold ${fontPx}px ${font}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const p = effPos(which, t);              // auto-centred unless user moved it
      const x = p.x * W; const y = p.y * H;
      const sx = t.scaleX || 1;                // horizontal stretch (lamba)
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sx, 1);
      if (outline) { ctx.lineWidth = Math.max(2, fontPx / 10); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(str, 0, 0); }
      ctx.fillStyle = t.color; ctx.fillText(str, 0, 0);
      ctx.restore();
    };
    drawText('name', name); drawText('dob', dob);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.95));
    downloadBlob(blob, (file.name.replace(/\.[^.]+$/, '') || 'photo') + '_named.jpg');
  };

  // ---- Step 1: upload ----
  if (step === 'upload') {
    return <FileDrop accept="image/*" multiple={false} onFiles={onFiles} label="Select photo" hint="Passport-size photo — you'll crop it, then add name & DOB" />;
  }

  // ---- Step 2: crop (drag the grid box; no zoom) ----
  if (step === 'crop') {
    const maxW = Math.min(460, cropWrapW || 460), maxH = 400;
    let dispW = maxW, dispH = (maxW * natural.h) / natural.w;
    if (dispH > maxH) { dispH = maxH; dispW = (maxH * natural.w) / natural.h; }
    const corner = { nw: { left: -9, top: -9, cursor: 'nwse-resize' }, ne: { right: -9, top: -9, cursor: 'nesw-resize' }, sw: { left: -9, bottom: -9, cursor: 'nesw-resize' }, se: { right: -9, bottom: -9, cursor: 'nwse-resize' } };
    return (
      <Panel>
        <div ref={cropWrapRef} className="flex justify-center">
          <div ref={cropStageRef} data-testid="phototext-crop" className="relative select-none touch-none rounded-lg overflow-hidden bg-slate-900" style={{ width: dispW, height: dispH }}>
            <img src={src} alt="to crop" draggable={false} className="absolute inset-0 w-full h-full select-none pointer-events-none" />
            <div onPointerDown={(e) => startCrop('move', null, e)} data-testid="crop-box"
              className="absolute border-2 border-white cursor-move"
              style={{ left: box.x * dispW, top: box.y * dispH, width: box.w * dispW, height: box.h * dispH, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 w-full border-t border-white/50" style={{ top: '33.33%' }} />
                <div className="absolute left-0 w-full border-t border-white/50" style={{ top: '66.66%' }} />
                <div className="absolute top-0 h-full border-l border-white/50" style={{ left: '33.33%' }} />
                <div className="absolute top-0 h-full border-l border-white/50" style={{ left: '66.66%' }} />
              </div>
              {['nw', 'ne', 'sw', 'se'].map((hd) => (
                <span key={hd} data-testid={`crop-handle-${hd}`} onPointerDown={(e) => startCrop('resize', hd, e)}
                  className="absolute w-4 h-4 bg-white border-2 border-rose-500 rounded-sm touch-none" style={corner[hd]} />
              ))}
            </div>
          </div>
        </div>
        <p className="hint text-center">Drag the box to move it and pull the corner grips to resize your crop — no zoom needed.</p>
        <PrimaryBtn testId="phototext-crop-next" busy={false} busyText="" text="Continue to add text" icon={Icons.ArrowRight} onClick={applyCrop} />
        <div className="text-center"><button onClick={() => { setStep('upload'); setFile(null); setSrc(null); }} className="text-sm text-rose-500 font-semibold inline-flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Choose another photo</button></div>
      </Panel>
    );
  }

  // ---- Step 3: edit (draggable text) ----
  const AR = photo.w / photo.h;
  let stageW = Math.max(200, Math.min(340, (stageWrapW || 340) - 26)), imgH = stageW / AR;
  const maxImgH = 430;
  if (imgH > maxImgH) { imgH = maxImgH; stageW = imgH * AR; }
  const extraPx = extraWhite ? stageW * whiteBandFrac() : 0;
  const stageH = imgH + extraPx;

  const TextOverlay = ({ which, t }) => {
    const p = effPos(which, t);
    return (
      <div onPointerDown={(e) => startDrag(which, 'move', e)} data-testid={`drag-${which}`}
        className="group absolute touch-none select-none cursor-move whitespace-nowrap px-1.5 py-0.5 rounded-md border border-dashed border-rose-400/80"
        style={{
          left: p.x * stageW, top: p.y * stageH, transform: `translate(-50%, -50%) scaleX(${t.scaleX || 1})`,
          fontFamily: font, fontSize: (stageW * t.size) / 100, lineHeight: 1,
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em',
          color: t.color,
          ...(outline ? { textShadow: '0 0 2px rgba(0,0,0,0.7),0 0 2px rgba(0,0,0,0.7)' } : {}),
        }}>
        {t.text.trim()}
        <span data-testid={`resize-${which}`} onPointerDown={(e) => startDrag(which, 'resize', e)}
          title="Drag to resize (chhota / bada)" className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-rose-500 border border-white shadow cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity" />
        <span data-testid={`stretch-${which}`} onPointerDown={(e) => startDrag(which, 'stretch', e)}
          title="Drag left/right to stretch (lamba / patla)" className="absolute top-1/2 -right-3 -translate-y-1/2 w-4 h-2 rounded-full bg-sky-500 border border-white shadow cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };

  const swatches = ['#0f172a', '#ffffff', '#f43f5e', '#2563eb', '#059669', '#c026d3'];
  const ColorRow = ({ t, setT }) => (
    <div className="flex items-center gap-2 flex-wrap">
      <input data-testid={`${t === name ? 'name' : 'dob'}-color`} type="color" value={t.color} onChange={(e) => setT((p) => ({ ...p, color: e.target.value }))} className="w-11 h-9 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer bg-transparent" />
      {swatches.map((c) => (
        <button key={c} onClick={() => setT((p) => ({ ...p, color: c }))} className={`w-6 h-6 rounded-full border-2 ${t.color.toLowerCase() === c ? 'border-rose-500' : 'border-slate-200 dark:border-white/20'}`} style={{ backgroundColor: c }} />
      ))}
    </div>
  );

  return (
    <Panel>
      <div className="grid lg:grid-cols-2 gap-6 items-start" data-testid="phototext-edit">
        {/* Sticky preview stage (desktop only — stacks naturally on mobile) */}
        <div className="lg:sticky lg:top-20 self-start z-10">
          <div ref={stageWrapRef} className="flex justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3">
            <div ref={stageRef} data-testid="phototext-stage" className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-white select-none" style={{ width: stageW, height: stageH }}>
              <img src={photo.url} alt="photo" draggable={false} className="absolute top-0 left-0 pointer-events-none select-none" style={{ width: stageW, height: imgH }} />
              {extraWhite && <div className="absolute left-0 w-full bg-white" style={{ top: imgH, height: extraPx }} />}
              {name.text.trim() && <TextOverlay which="name" t={name} />}
              {dob.text.trim() && <TextOverlay which="dob" t={dob} />}
            </div>
          </div>
          <p className="hint text-center mt-2 flex items-center justify-center gap-1"><Icons.Move className="w-3.5 h-3.5" /> Drag text to move it · pink dot = size (chhota/bada) · blue dot = stretch (lamba). Text stays centred in the white space until you move it yourself.</p>
        </div>

        {/* Controls */}
        <div className="space-y-5">
          <Field label="Name">
            <input data-testid="name-input" value={name.text} onChange={(e) => setName((p) => ({ ...p, text: e.target.value }))} placeholder="e.g. Aarav Sharma" className="input" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Size: {name.size}%</label>
                <input data-testid="name-size" type="range" min="3" max="20" step="0.5" value={name.size} onChange={(e) => setName((p) => ({ ...p, size: Number(e.target.value) }))} className="w-full accent-rose-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Colour</label>
                <ColorRow t={name} setT={setName} />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Stretch (lamba): {Math.round((name.scaleX || 1) * 100)}%</label>
              <input data-testid="name-stretch" type="range" min="50" max="300" step="5" value={Math.round((name.scaleX || 1) * 100)} onChange={(e) => setName((p) => ({ ...p, scaleX: Number(e.target.value) / 100 }))} className="w-full accent-sky-500" />
            </div>
          </Field>

          <Field label="Date of birth / extra text">
            <input data-testid="dob-input" value={dob.text} onChange={(e) => setDob((p) => ({ ...p, text: e.target.value }))} placeholder="e.g. 14 June 2025" className="input" />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Size: {dob.size}%</label>
                <input data-testid="dob-size" type="range" min="2" max="18" step="0.5" value={dob.size} onChange={(e) => setDob((p) => ({ ...p, size: Number(e.target.value) }))} className="w-full accent-rose-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Colour</label>
                <ColorRow t={dob} setT={setDob} />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Stretch (lamba): {Math.round((dob.scaleX || 1) * 100)}%</label>
              <input data-testid="dob-stretch" type="range" min="50" max="300" step="5" value={Math.round((dob.scaleX || 1) * 100)} onChange={(e) => setDob((p) => ({ ...p, scaleX: Number(e.target.value) / 100 }))} className="w-full accent-sky-500" />
            </div>
          </Field>

          <Field label="Font style">
            <select data-testid="font-select" value={font} onChange={(e) => setFont(e.target.value)} className="input">
              {FONTS.map((f) => <option key={f.id} value={f.id} style={{ fontFamily: f.id }}>{f.label}</option>)}
            </select>
          </Field>

          <label data-testid="extra-white-label" className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3 cursor-pointer">
            <input data-testid="extra-white-checkbox" type="checkbox" checked={extraWhite} onChange={(e) => {
              const on = e.target.checked;
              // Jo position user ne set ki hai, vahi default rahe — checkbox
              // toggle se manual position RESET nahi hoti. Kyunki band add/remove
              // karne se total height badalti hai, manual y ko rescale karte hain
              // taaki text visually usi jagah rahe.
              const rh = photo.h / photo.w;
              const K = whiteBandFrac();
              const imgFracWithBand = rh / (rh + K);
              const keep = (p) => {
                if (!p.manual) return p;   // auto texts re-centre themselves in the band
                const y = on ? p.pos.y * imgFracWithBand : Math.min(0.98, p.pos.y / imgFracWithBand);
                return { ...p, pos: { x: p.pos.x, y } };
              };
              setExtraWhite(on);
              setName(keep); setDob(keep);
            }} className="accent-rose-500 w-4 h-4" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Add Extra White Space On Bottom</span>
          </label>

          {(name.manual || dob.manual) && (
            <button data-testid="recenter-text-btn" onClick={() => { setName((p) => ({ ...p, manual: false })); setDob((p) => ({ ...p, manual: false })); }}
              className="text-sm font-semibold text-rose-500 inline-flex items-center gap-1.5">
              <Icons.Crosshair className="w-4 h-4" /> Re-center text in the white space
            </button>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input data-testid="outline-toggle" type="checkbox" checked={outline} onChange={(e) => setOutline(e.target.checked)} className="accent-rose-500 w-4 h-4" />
            <span className="text-sm text-slate-600 dark:text-slate-300">Readability outline (dark stroke behind text)</span>
          </label>

          <PrimaryBtn testId="phototext-download-btn" busy={false} busyText="" text="Download photo" icon={Download} onClick={save} />
          <div className="text-center"><button onClick={() => setStep('crop')} className="text-sm text-rose-500 font-semibold inline-flex items-center gap-1"><Icons.Crop className="w-3.5 h-3.5" /> Re-crop photo</button></div>
        </div>
      </div>
    </Panel>
  );
};

/* ---------------- Page shell ---------------- */
export default function ImageToolPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const slug = pathname.split('/').pop();
  const tool = TOOLS.find((t) => t.slug === slug);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  useEffect(() => { if (!tool) navigate('/'); }, [tool, navigate]);
  if (!tool) return null;

  const Icon = Icons[tool.icon] || Icons.Image;
  const body = {
    'compress-image': <CompressTool />,
    'crop-image': <CropTool />,
    'remove-background': <RemoveBgTool />,
    'photo-text': <PhotoTextTool />,
    'resize-image': <ResizeTool />,
  }[slug];

  const related = TOOLS.filter((t) => t.slug !== slug && t.category === 'image');

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Header />
      <section className="relative overflow-hidden grid-hero border-b border-slate-200 dark:border-white/10">
        <div className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-rose-500/15 blur-[110px]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-8 text-center">
          <div className="flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-6">
            <Link to="/" className="hover:text-rose-500">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-700 dark:text-slate-200 font-medium">{tool.name}</span>
          </div>
          <div className={`grid place-items-center w-16 h-16 mx-auto rounded-2xl ${ICON_TILE[tool.color] || ICON_TILE.rose}`}>
            <Icon className="w-8 h-8" />
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl mt-5">{tool.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto leading-relaxed">{tool.desc}</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {body}
        {related.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-lg mb-4">More image tools</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {related.map((t) => {
                const RI = Icons[t.icon] || Icons.Image;
                return (
                  <Link key={t.slug} to={`/tool/${t.slug}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 hover:border-rose-300 dark:hover:border-rose-500/40 transition-colors">
                    <div className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${ICON_TILE[t.color] || ICON_TILE.rose}`}><RI className="w-5 h-5" /></div>
                    <span className="text-sm font-semibold">{t.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
