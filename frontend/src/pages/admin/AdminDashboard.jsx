import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminApi, clearToken, getToken } from '../../lib/adminApi';
import { TOOLS } from '../../mock';
import {
  Search, Globe, FileText, BarChart3, KeyRound, LogOut, Loader2, Save,
  Plus, Trash2, Pencil, ExternalLink, CheckCircle2, X,
} from 'lucide-react';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const PAGE_LIST = [
  { path: '/', label: 'Home', dTitle: 'LovePDF — Free Online PDF & Image Tools', dDesc: 'Merge, split, compress and convert PDFs and images online for free. Fast, secure and easy to use.' },
  { path: '/blog', label: 'Blog', dTitle: 'Blog — Tips & Guides | LovePDF', dDesc: 'Guides and tutorials for working with PDFs and images.' },
  ...TOOLS.map((t) => ({ path: `/tool/${t.slug}`, label: t.name, dTitle: `${t.name} — Free Online Tool | LovePDF`, dDesc: t.desc })),
];

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const Toast = ({ msg, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-lg text-sm" data-testid="toast">
    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
  </div>
);

const TabBtn = ({ active, onClick, icon: Icon, label, testId }) => (
  <button data-testid={testId} onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${active ? 'bg-rose-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}>
    <Icon className="w-4 h-4" /> {label}
  </button>
);

/* ---------------- Pages SEO tab ---------------- */
const PagesTab = ({ toast }) => {
  const [overrides, setOverrides] = useState({});
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(PAGE_LIST[0].path);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminApi.listSeoPages().then((d) => {
      const map = {};
      (d.pages || []).forEach((p) => { map[p.path] = p; });
      setOverrides(map);
    }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const o = overrides[sel] || {};
    setForm({
      title: o.title || '', description: o.description || '', keywords: o.keywords || '',
      og_title: o.og_title || '', og_description: o.og_description || '', og_image: o.og_image || '',
      canonical: o.canonical || '', noindex: !!o.noindex,
    });
  }, [sel, overrides]);

  const meta = PAGE_LIST.find((p) => p.path === sel) || {};
  const list = PAGE_LIST.filter((p) => p.label.toLowerCase().includes(q.toLowerCase()) || p.path.includes(q.toLowerCase()));

  const save = async () => {
    setBusy(true);
    try {
      await adminApi.saveSeoPage({ path: sel, ...form });
      toast('SEO saved for ' + meta.label);
      load();
    } catch (e) { toast(e.message); }
    setBusy(false);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-6">
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-3 h-fit max-h-[70vh] overflow-auto">
        <div className="relative mb-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input data-testid="page-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages…" className="input w-full pl-9 py-2 text-sm" />
        </div>
        {list.map((p) => (
          <button key={p.path} data-testid={`page-item-${p.path}`} onClick={() => setSel(p.path)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${sel === p.path ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}>
            <span className="truncate">{p.label}</span>
            {overrides[p.path] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Customised" />}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
        <div>
          <h3 className="font-bold text-lg">{meta.label}</h3>
          <p className="text-xs text-slate-400">{sel}</p>
        </div>
        <Field label="Meta title" hint={`Default: ${meta.dTitle}`}>
          <input data-testid="seo-title" value={form.title || ''} onChange={set('title')} placeholder={meta.dTitle} className="input w-full" />
        </Field>
        <Field label="Meta description" hint={`Default: ${meta.dDesc}`}>
          <textarea data-testid="seo-description" value={form.description || ''} onChange={set('description')} placeholder={meta.dDesc} rows={3} className="input w-full" />
        </Field>
        <Field label="Keywords (comma separated)">
          <input data-testid="seo-keywords" value={form.keywords || ''} onChange={set('keywords')} placeholder="merge pdf, combine pdf, pdf merger" className="input w-full" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Open Graph title"><input value={form.og_title || ''} onChange={set('og_title')} className="input w-full" /></Field>
          <Field label="Social share image URL"><input value={form.og_image || ''} onChange={set('og_image')} placeholder="https://…/image.jpg" className="input w-full" /></Field>
        </div>
        <Field label="Open Graph description"><textarea value={form.og_description || ''} onChange={set('og_description')} rows={2} className="input w-full" /></Field>
        <Field label="Canonical URL (optional)"><input value={form.canonical || ''} onChange={set('canonical')} placeholder="Leave blank to auto-generate" className="input w-full" /></Field>
        <label className="flex items-center gap-2 text-sm">
          <input data-testid="seo-noindex" type="checkbox" checked={!!form.noindex} onChange={set('noindex')} className="accent-rose-500 w-4 h-4" />
          Hide this page from search engines (noindex)
        </label>
        <button data-testid="save-seo-btn" onClick={save} disabled={busy} className="btn-primary text-white font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save SEO
        </button>
      </div>
    </div>
  );
};

/* ---------------- Site & Analytics tab ---------------- */
const SiteTab = ({ toast }) => {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { adminApi.getSite().then((d) => setForm(d.site || {})).catch(() => setForm({})); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = async () => {
    setBusy(true);
    try { await adminApi.saveSite(form); toast('Site settings saved'); } catch (e) { toast(e.message); }
    setBusy(false);
  };
  const copy = (t) => { navigator.clipboard?.writeText(t); toast('Copied: ' + t); };

  if (!form) return <p className="text-slate-400">Loading…</p>;
  const origin = (form.site_url || BACKEND || '').replace(/\/$/, '');

  return (
    <div className="max-w-2xl space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Site name"><input value={form.site_name || ''} onChange={set('site_name')} className="input w-full" /></Field>
        <Field label="Site URL (your live domain)" hint="Used for sitemap & canonical URLs"><input data-testid="site-url" value={form.site_url || ''} onChange={set('site_url')} placeholder="https://yourdomain.com" className="input w-full" /></Field>
      </div>
      <Field label="Default social share image (Open Graph)"><input value={form.default_og_image || ''} onChange={set('default_og_image')} placeholder="https://…/og-image.jpg" className="input w-full" /></Field>

      <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4">
        <p className="font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-rose-500" /> Analytics & Search Console</p>
        <Field label="Google Analytics 4 Measurement ID" hint="Paste it here later — e.g. G-XXXXXXX"><input data-testid="ga-id" value={form.ga_measurement_id || ''} onChange={set('ga_measurement_id')} placeholder="G-XXXXXXXXXX" className="input w-full" /></Field>
        <Field label="Google Tag Manager ID (optional)"><input value={form.gtm_id || ''} onChange={set('gtm_id')} placeholder="GTM-XXXXXXX" className="input w-full" /></Field>
        <Field label="Google Search Console verification code" hint="The content value of the google-site-verification meta tag"><input data-testid="gsc-code" value={form.gsc_verification || ''} onChange={set('gsc_verification')} placeholder="abcd1234…" className="input w-full" /></Field>
        <Field label="Twitter/X handle"><input value={form.twitter_handle || ''} onChange={set('twitter_handle')} placeholder="@lovepdf" className="input w-full" /></Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Organization name (schema)"><input value={form.organization_name || ''} onChange={set('organization_name')} className="input w-full" /></Field>
        <Field label="Organization logo URL"><input value={form.organization_logo || ''} onChange={set('organization_logo')} className="input w-full" /></Field>
      </div>
      <Field label="Extra robots.txt rules (optional)"><textarea value={form.robots_extra || ''} onChange={set('robots_extra')} rows={2} placeholder="Disallow: /private" className="input w-full" /></Field>

      <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 p-5 text-sm space-y-2">
        <p className="font-semibold">Submit these to Google Search Console:</p>
        <button onClick={() => copy(`${origin}/api/sitemap.xml`)} className="flex items-center gap-2 text-rose-500 hover:underline"><ExternalLink className="w-3.5 h-3.5" /> {origin}/api/sitemap.xml</button>
        <button onClick={() => copy(`${origin}/api/robots.txt`)} className="flex items-center gap-2 text-rose-500 hover:underline"><ExternalLink className="w-3.5 h-3.5" /> {origin}/api/robots.txt</button>
      </div>

      <button data-testid="save-site-btn" onClick={save} disabled={busy} className="btn-primary text-white font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-60">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save settings
      </button>
    </div>
  );
};

/* ---------------- Blog tab ---------------- */
const emptyPost = { slug: '', title: '', excerpt: '', content: '', cover_image: '', meta_title: '', meta_description: '', keywords: '', author: 'LovePDF Team', published: false };

const BlogTab = ({ toast }) => {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null); // null=list, {} or post = editor
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => { adminApi.listBlog().then((d) => setPosts(d.posts || [])).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setEditing((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const startNew = () => setEditing({ ...emptyPost });
  const startEdit = (p) => setEditing({ ...p });

  const save = async () => {
    const payload = { ...editing };
    if (!payload.slug) payload.slug = slugify(payload.title || '');
    if (!payload.title || !payload.slug) { toast('Title is required'); return; }
    setBusy(true);
    try {
      if (editing.id) await adminApi.updateBlog(editing.id, payload);
      else await adminApi.createBlog(payload);
      toast('Post saved');
      setEditing(null); load();
    } catch (e) { toast(e.message); }
    setBusy(false);
  };

  const del = async (p) => {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    try { await adminApi.deleteBlog(p.id); toast('Post deleted'); load(); } catch (e) { toast(e.message); }
  };

  if (editing) {
    return (
      <div className="max-w-3xl space-y-4">
        <button onClick={() => setEditing(null)} className="text-sm text-rose-500 font-semibold">← Back to posts</button>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title"><input data-testid="post-title" value={editing.title} onChange={set('title')} className="input w-full" /></Field>
          <Field label="Slug (URL)" hint="Auto-filled from title if left blank"><input data-testid="post-slug" value={editing.slug} onChange={set('slug')} placeholder="how-to-merge-pdf" className="input w-full" /></Field>
        </div>
        <Field label="Excerpt (short summary)"><textarea value={editing.excerpt} onChange={set('excerpt')} rows={2} className="input w-full" /></Field>
        <Field label="Cover image URL"><input value={editing.cover_image} onChange={set('cover_image')} className="input w-full" /></Field>
        <Field label="Content (HTML supported)"><textarea data-testid="post-content" value={editing.content} onChange={set('content')} rows={10} placeholder="<p>Write your article here…</p>" className="input w-full font-mono text-sm" /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Meta title (SEO)"><input value={editing.meta_title} onChange={set('meta_title')} className="input w-full" /></Field>
          <Field label="Author"><input value={editing.author} onChange={set('author')} className="input w-full" /></Field>
        </div>
        <Field label="Meta description (SEO)"><textarea value={editing.meta_description} onChange={set('meta_description')} rows={2} className="input w-full" /></Field>
        <Field label="Keywords"><input value={editing.keywords} onChange={set('keywords')} className="input w-full" /></Field>
        <label className="flex items-center gap-2 text-sm">
          <input data-testid="post-published" type="checkbox" checked={!!editing.published} onChange={set('published')} className="accent-rose-500 w-4 h-4" /> Published (visible on the site)
        </label>
        <button data-testid="save-post-btn" onClick={save} disabled={busy} className="btn-primary text-white font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save post
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button data-testid="new-post-btn" onClick={startNew} className="btn-primary text-white font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2"><Plus className="w-4 h-4" /> New article</button>
      {posts.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-slate-400">No articles yet. Create your first SEO article!</div>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} data-testid={`post-row-${p.slug}`} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{p.title}</p>
                <p className="text-xs text-slate-400 truncate">/blog/{p.slug}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${p.published ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'}`}>{p.published ? 'Published' : 'Draft'}</span>
              <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5" title="Edit"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => del(p)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------- Account tab ---------------- */
const AccountTab = ({ toast, email }) => {
  const [cur, setCur] = useState(''); const [nw, setNw] = useState(''); const [busy, setBusy] = useState(false);
  const save = async () => {
    if (nw.length < 6) { toast('New password must be at least 6 characters'); return; }
    setBusy(true);
    try { await adminApi.changePassword(cur, nw); toast('Password changed successfully'); setCur(''); setNw(''); } catch (e) { toast(e.message); }
    setBusy(false);
  };
  return (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-slate-500">Signed in as <b>{email}</b></p>
      <Field label="Current password"><input data-testid="cur-pw" type="password" value={cur} onChange={(e) => setCur(e.target.value)} className="input w-full" /></Field>
      <Field label="New password"><input data-testid="new-pw" type="password" value={nw} onChange={(e) => setNw(e.target.value)} className="input w-full" /></Field>
      <button data-testid="change-pw-btn" onClick={save} disabled={busy} className="btn-primary text-white font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-60">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Change password
      </button>
    </div>
  );
};

const Field = ({ label, hint, children }) => (
  <div>
    <label className="text-sm font-medium block mb-1">{label}</label>
    {children}
    {hint && <p className="hint">{hint}</p>}
  </div>
);

/* ---------------- Dashboard shell ---------------- */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('pages');
  const [email, setEmail] = useState('');
  const [ready, setReady] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (!getToken()) { navigate('/admin/login'); return; }
    adminApi.me().then((d) => { setEmail(d.email); setReady(true); }).catch(() => { clearToken(); navigate('/admin/login'); });
  }, [navigate]);

  const toast = (m) => { setToastMsg(m); setTimeout(() => setToastMsg(''), 3000); };
  const logout = () => { clearToken(); navigate('/admin/login'); };

  if (!ready) return <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-[#0b0f1a]"><Loader2 className="w-6 h-6 animate-spin text-rose-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f1a] text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-lg"><span className="text-rose-500">Love</span>PDF <span className="text-xs font-semibold text-slate-400 ml-1">Admin</span></div>
          <div className="flex items-center gap-2">
            <Link to="/" target="_blank" className="text-sm text-slate-500 hover:text-rose-500 inline-flex items-center gap-1"><ExternalLink className="w-4 h-4" /> View site</Link>
            <button data-testid="logout-btn" onClick={logout} className="text-sm font-semibold inline-flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <TabBtn testId="tab-pages" active={tab === 'pages'} onClick={() => setTab('pages')} icon={FileText} label="Pages SEO" />
          <TabBtn testId="tab-site" active={tab === 'site'} onClick={() => setTab('site')} icon={Globe} label="Site & Analytics" />
          <TabBtn testId="tab-blog" active={tab === 'blog'} onClick={() => setTab('blog')} icon={Pencil} label="Blog" />
          <TabBtn testId="tab-account" active={tab === 'account'} onClick={() => setTab('account')} icon={KeyRound} label="Account" />
        </div>

        {tab === 'pages' && <PagesTab toast={toast} />}
        {tab === 'site' && <SiteTab toast={toast} />}
        {tab === 'blog' && <BlogTab toast={toast} />}
        {tab === 'account' && <AccountTab toast={toast} email={email} />}
      </div>

      {toastMsg && <Toast msg={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  );
};

export default AdminDashboard;
