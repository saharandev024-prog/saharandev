import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

const FileDrop = ({ accept = '.pdf', multiple = true, onFiles, label = 'Select PDF files', hint = 'or drop files here' }) => {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handle = useCallback((list) => {
    const files = Array.from(list || []);
    if (files.length && onFiles) onFiles(files);
  }, [onFiles]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center transition-all ${drag ? 'border-rose-400 bg-rose-500/5 scale-[1.01]' : 'border-slate-300 dark:border-white/15 hover:border-rose-300 dark:hover:border-rose-500/40 bg-slate-50/60 dark:bg-white/[0.02]'}`}
    >
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden"
        onChange={(e) => handle(e.target.files)} />
      <div className="grid place-items-center w-16 h-16 mx-auto rounded-2xl btn-primary text-white mb-5 animate-floaty">
        <UploadCloud className="w-8 h-8" />
      </div>
      <button type="button" className="btn-primary text-white font-semibold px-6 py-3 rounded-xl transition">{label}</button>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
        <FileText className="w-4 h-4" /> {hint}
      </p>
    </div>
  );
};

export default FileDrop;
