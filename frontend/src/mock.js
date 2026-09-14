// Mock data for PDFPro Studio landing + tools.
// `engine` tells the ToolPage which client-side handler to use.
// engine values with a handler currently work fully client-side.

export const CATEGORIES = [
  { id: 'all', label: 'All tools' },
  { id: 'organize', label: 'Organize' },
  { id: 'optimize', label: 'Optimize' },
  { id: 'convert-to', label: 'Convert to PDF' },
  { id: 'convert-from', label: 'Convert from PDF' },
  { id: 'edit', label: 'Edit' },
  { id: 'security', label: 'Security' },
  { id: 'image', label: 'Image tools' },
];

export const TOOLS = [
  { slug: 'merge-pdf', name: 'Merge PDF', desc: 'Combine PDFs and images (JPG, PNG) into one single document in the order you want.', icon: 'Combine', color: 'rose', category: 'organize', engine: 'merge', ready: true },
  { slug: 'split-pdf', name: 'Split PDF', desc: 'Extract page ranges or split one PDF into several separate files.', icon: 'Scissors', color: 'amber', category: 'organize', engine: 'split', ready: true },
  { slug: 'compress-pdf', name: 'Compress PDF', desc: 'Reduce file size while keeping the best possible quality.', icon: 'Minimize2', color: 'emerald', category: 'optimize', engine: 'compress', ready: true },
  { slug: 'organize-pdf', name: 'Organize PDF', desc: 'Reorder, rotate and delete pages to arrange your document.', icon: 'LayoutGrid', color: 'violet', category: 'organize', engine: 'organize', ready: true },
  { slug: 'rotate-pdf', name: 'Rotate PDF', desc: 'Rotate one or all pages exactly the way you need them.', icon: 'RotateCw', color: 'sky', category: 'organize', engine: 'rotate', ready: true },
  { slug: 'jpg-to-pdf', name: 'JPG to PDF', desc: 'Convert JPG, PNG and other images into a single PDF file.', icon: 'Image', color: 'orange', category: 'convert-to', engine: 'jpg-to-pdf', ready: true },
  { slug: 'pdf-to-jpg', name: 'PDF to JPG', desc: 'Turn each PDF page into a high quality JPG image.', icon: 'FileImage', color: 'fuchsia', category: 'convert-from', engine: 'pdf-to-jpg', ready: true },
  { slug: 'edit-pdf', name: 'Edit PDF', desc: 'Click any text in your PDF to edit it inline, then download the updated file.', icon: 'PenLine', color: 'rose', category: 'edit', engine: 'edit', ready: true },
  { slug: 'page-numbers', name: 'Page Numbers', desc: 'Insert page numbers into your PDF with custom positions.', icon: 'Hash', color: 'teal', category: 'edit', engine: 'page-numbers', ready: true },
  { slug: 'watermark-pdf', name: 'Watermark', desc: 'Stamp an image or text watermark over your PDF pages.', icon: 'Stamp', color: 'indigo', category: 'edit', engine: 'watermark', ready: true },
  { slug: 'extract-pages', name: 'Extract Pages', desc: 'Pull selected pages out of a PDF into a brand new file.', icon: 'FileOutput', color: 'rose', category: 'organize', engine: 'extract', ready: true },
  { slug: 'remove-pages', name: 'Remove Pages', desc: 'Delete the pages you do not need and keep the rest.', icon: 'FileMinus', color: 'red', category: 'organize', engine: 'remove', ready: true },
  { slug: 'protect-pdf', name: 'Protect PDF', desc: 'Encrypt your PDF with a password to keep it private.', icon: 'Lock', color: 'slate', category: 'security', engine: 'protect', ready: false },
  { slug: 'unlock-pdf', name: 'Unlock PDF', desc: 'Remove the password and restrictions from your PDF.', icon: 'LockOpen', color: 'emerald', category: 'security', engine: 'unlock', ready: false },
  { slug: 'word-to-pdf', name: 'Word to PDF', desc: 'Convert DOC and DOCX documents into polished PDF files.', icon: 'FileText', color: 'blue', category: 'convert-to', engine: 'word-to-pdf', ready: false },
  { slug: 'pdf-to-word', name: 'PDF to Word', desc: 'Turn your PDF into an editable DOCX Word document.', icon: 'FileType', color: 'blue', category: 'convert-from', engine: 'pdf-to-word', ready: false },
  { slug: 'excel-to-pdf', name: 'Excel to PDF', desc: 'Convert XLS and XLSX spreadsheets into PDF documents.', icon: 'Sheet', color: 'emerald', category: 'convert-to', engine: 'excel-to-pdf', ready: false },
  { slug: 'pdf-to-excel', name: 'PDF to Excel', desc: 'Extract tables from a PDF straight into a spreadsheet.', icon: 'Table', color: 'emerald', category: 'convert-from', engine: 'pdf-to-excel', ready: false },
  { slug: 'ppt-to-pdf', name: 'PowerPoint to PDF', desc: 'Convert PPT and PPTX slide decks into PDF files.', icon: 'Presentation', color: 'orange', category: 'convert-to', engine: 'ppt-to-pdf', ready: false },
  { slug: 'pdf-to-ppt', name: 'PDF to PowerPoint', desc: 'Turn a PDF into an editable PowerPoint presentation.', icon: 'MonitorPlay', color: 'orange', category: 'convert-from', engine: 'pdf-to-ppt', ready: false },
  { slug: 'html-to-pdf', name: 'HTML to PDF', desc: 'Convert any webpage or HTML into a clean PDF file.', icon: 'Code2', color: 'cyan', category: 'convert-to', engine: 'html-to-pdf', ready: false },
  { slug: 'sign-pdf', name: 'Sign PDF', desc: 'Draw or type your signature and place it anywhere on your PDF.', icon: 'PenTool', color: 'violet', category: 'edit', engine: 'sign', ready: true },
  { slug: 'ocr-pdf', name: 'OCR PDF', desc: 'Make scanned PDFs searchable and selectable with OCR.', icon: 'ScanText', color: 'fuchsia', category: 'convert-from', engine: 'ocr', ready: false },
  { slug: 'repair-pdf', name: 'Repair PDF', desc: 'Recover data from a damaged or corrupted PDF file.', icon: 'Wrench', color: 'amber', category: 'optimize', engine: 'repair', ready: false },
  { slug: 'crop-pdf', name: 'Crop PDF', desc: 'Trim margins and crop the visible area of your pages.', icon: 'Crop', color: 'teal', category: 'edit', engine: 'crop', ready: false },
  { slug: 'compare-pdf', name: 'Compare PDF', desc: 'Spot the differences between two PDF documents.', icon: 'GitCompare', color: 'sky', category: 'edit', engine: 'compare', ready: false },
  { slug: 'pdf-to-pdfa', name: 'PDF to PDF/A', desc: 'Convert PDF to PDF/A for long term archiving.', icon: 'Archive', color: 'slate', category: 'optimize', engine: 'pdfa', ready: false },
  { slug: 'compress-image', name: 'Compress Image', desc: 'Reduce JPG, PNG or WebP file size while keeping great quality.', icon: 'ImageDown', color: 'emerald', category: 'image', engine: 'img-compress', ready: true },
  { slug: 'crop-image', name: 'Crop Image', desc: 'Crop photos to custom dimensions or preset sizes like square and 16:9.', icon: 'Crop', color: 'orange', category: 'image', engine: 'img-crop', ready: true },
  { slug: 'remove-background', name: 'Remove Background', desc: 'Automatically remove the background from any photo with AI.', icon: 'Eraser', color: 'violet', category: 'image', engine: 'img-removebg', ready: true },
  { slug: 'photo-text', name: 'Photo Name & DOB', desc: 'Add a name, date of birth or any text on a photo with fonts and colors.', icon: 'Baby', color: 'rose', category: 'image', engine: 'img-text', ready: true },
  { slug: 'resize-image', name: 'Resize Image Pixel/CM', desc: 'Resize images in pixels, cm, mm or inch — batch up to 10 images, optional KB target size.', icon: 'Scaling', color: 'sky', category: 'image', engine: 'img-resize', ready: true },
];

export const STATS = [
  { value: '30+', label: 'Powerful tools' },
  { value: '100%', label: 'Free to use' },
  { value: 'Private', label: 'Files stay in your browser' },
  { value: 'No sign-up', label: 'Start instantly' },
];

export const STEPS = [
  { icon: 'Upload', title: 'Drop your files', text: 'Drag and drop or pick files from your device. Nothing leaves your browser for the instant tools.' },
  { icon: 'Settings2', title: 'Choose options', text: 'Set page ranges, quality, order or watermark — tweak everything to fit your needs.' },
  { icon: 'Download', title: 'Download result', text: 'Process in a click and download your finished PDF instantly, ready to share.' },
];

export const FEATURES = [
  { icon: 'Zap', title: 'Blazing fast', text: 'Core tools run right in your browser, so results are ready in a blink — no waiting in queues.' },
  { icon: 'ShieldCheck', title: 'Private by design', text: 'Instant tools process files locally. Your documents stay yours, always.' },
  { icon: 'Infinity', title: 'No limits, no fuss', text: 'Merge, split and convert as many files as you like. No sign up required to get started.' },
  { icon: 'Sparkles', title: 'Beautiful & simple', text: 'A clean, modern workspace that makes even the fiddly PDF jobs feel effortless.' },
];

export const FAQS = [
  { q: 'Do I need to create an account to use LovePDF?', a: 'No. All tools work without sign-up or login. Upload a file, use the tool, and download your result in one visit — no email, no password, no account required.' },
  { q: 'Is LovePDF really free?', a: 'Yes, every tool is free to use with no hidden charges, no watermarks added to your files, and no daily usage cap for normal personal use.' },
  { q: 'Are my files safe? Where do they go?', a: "Your files are processed directly in your browser using your device's own processing power. They are never uploaded to our servers, which means we never see or store your documents." },
  { q: 'What file formats are supported?', a: 'LovePDF supports PDF along with common conversion formats: JPG/PNG images, Word (.docx), Excel (.xlsx), and PowerPoint (.pptx). Exact input/output formats vary by tool.' },
  { q: 'Can I use LovePDF on my phone?', a: 'Yes. The site works directly in your mobile browser — no app download needed. Every tool is built to work on both desktop and mobile.' },
  { q: 'Does compressing a PDF reduce quality?', a: 'Compression mainly optimizes embedded images and removes redundant data. Text stays sharp. Very high compression levels can slightly soften embedded photos, but text-heavy PDFs show little to no visible quality loss.' },
  { q: 'Can I merge PDFs in a specific order?', a: 'Yes. After uploading multiple files, drag to reorder them before merging — the final PDF follows the order you set.' },
  { q: 'Will converting PDF to Word keep my formatting?', a: 'The tool preserves layout, fonts, tables, and images as closely as possible, but very complex layouts may need minor manual adjustment afterward — a limitation of PDF-to-Word conversion in general.' },
  { q: 'What happens to my file after I close the tab?', a: 'If processing is local, your file exists only in that browser tab and is gone once you close it or refresh — nothing is stored anywhere.' },
];

export const ICON_TILE = {
  rose: 'bg-rose-500/12 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400',
  amber: 'bg-amber-500/12 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400',
  emerald: 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  violet: 'bg-violet-500/12 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  sky: 'bg-sky-500/12 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  orange: 'bg-orange-500/12 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400',
  fuchsia: 'bg-fuchsia-500/12 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-400',
  teal: 'bg-teal-500/12 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
  indigo: 'bg-indigo-500/12 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
  red: 'bg-red-500/12 text-red-500 dark:bg-red-500/15 dark:text-red-400',
  blue: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  cyan: 'bg-cyan-500/12 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400',
  slate: 'bg-slate-500/12 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300',
};


// Server-side tools: engine -> { endpoint, accept, output, kind, fields }
// kind: 'file' (single upload), 'html' (url/html input), 'compare' (two files)
export const SERVER_TOOLS = {
  'word-to-pdf': { endpoint: 'office-to-pdf', accept: '.doc,.docx,.odt,.rtf,.txt', kind: 'file' },
  'excel-to-pdf': { endpoint: 'office-to-pdf', accept: '.xls,.xlsx,.ods,.csv', kind: 'file' },
  'ppt-to-pdf': { endpoint: 'office-to-pdf', accept: '.ppt,.pptx,.odp', kind: 'file' },
  'pdf-to-word': { endpoint: 'pdf-to-word', accept: '.pdf', kind: 'file', fields: ['lang'] },
  'pdf-to-excel': { endpoint: 'pdf-to-excel', accept: '.pdf', kind: 'file', fields: ['lang'] },
  'pdf-to-ppt': { endpoint: 'pdf-to-ppt', accept: '.pdf', kind: 'file' },
  'html-to-pdf': { endpoint: 'html-to-pdf', kind: 'html' },
  'ocr-pdf': { endpoint: 'ocr', accept: '.pdf', kind: 'file', fields: ['lang'] },
  'protect-pdf': { endpoint: 'protect', accept: '.pdf', kind: 'file', fields: ['password'] },
  'unlock-pdf': { endpoint: 'unlock', accept: '.pdf', kind: 'file', fields: ['password'] },
  'repair-pdf': { endpoint: 'repair', accept: '.pdf', kind: 'file' },
  'pdf-to-pdfa': { endpoint: 'pdfa', accept: '.pdf', kind: 'file' },
  'crop-pdf': { endpoint: 'crop', accept: '.pdf', kind: 'file', fields: ['margin'] },
  'compare-pdf': { endpoint: 'compare', accept: '.pdf', kind: 'compare' },
};

export const OCR_LANGS = [
  { id: 'eng', label: 'English' },
  { id: 'hin', label: 'Hindi' },
  { id: 'fra', label: 'French' },
  { id: 'deu', label: 'German' },
  { id: 'spa', label: 'Spanish' },
];
