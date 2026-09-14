import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, setToken, getToken } from '../../lib/adminApi';
import { Lock, Loader2, ShieldCheck } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (getToken()) navigate('/admin'); }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await adminApi.login(email.trim(), password);
      setToken(res.access_token);
      navigate('/admin');
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-[#0b0f1a] text-slate-900 dark:text-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/10 grid place-items-center text-rose-500 mb-4"><ShieldCheck className="w-7 h-7" /></div>
          <h1 className="text-2xl font-extrabold">Admin Panel</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">SEO & content management for LovePDF</p>
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6 space-y-4 shadow-sm">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input data-testid="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input w-full mt-1" placeholder="admin@lovepdf.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input data-testid="admin-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input w-full mt-1" placeholder="••••••••" />
          </div>
          {error && <p data-testid="login-error" className="text-sm text-rose-500 font-medium">{error}</p>}
          <button data-testid="admin-login-btn" disabled={busy} className="btn-primary text-white font-semibold w-full py-3 rounded-xl inline-flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : <><Lock className="w-4 h-4" /> Sign in</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
