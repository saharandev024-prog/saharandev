import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Moon, Sun, Menu, X, FileText, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TOOLS, ICON_TILE, CATEGORIES } from '../mock';

export const Logo = ({ compact = false }) => (
  <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 group" data-testid="logo-home-link">
    <div className="relative">
      <div className="absolute inset-0 rounded-xl bg-rose-500/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative grid place-items-center w-9 h-9 rounded-xl btn-primary text-white">
        <FileText className="w-5 h-5" strokeWidth={2.4} />
      </div>
    </div>
    {!compact && (
      <span className="font-display font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
        Love<span className="brand-gradient-text">PDF</span>
      </span>
    )}
  </Link>
);

const NavLink = ({ to, children }) => (
  <Link to={to} className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
    {children}
  </Link>
);

const DropdownGrid = ({ tools, cols = 'grid-cols-2', width = 'w-[520px]' }) => {
  const navigate = useNavigate();
  return (
    <div className={`absolute left-0 top-full pt-2 ${width}`}>
      <div className={`glass rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-2xl p-3 grid ${cols} gap-1 reveal`}>
        {tools.map((t) => {
          const Icon = Icons[t.icon] || Icons.FileText;
          return (
            <button key={t.slug} onClick={() => navigate(`/tool/${t.slug}`)} className="group flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
              <span className={`grid place-items-center w-9 h-9 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${ICON_TILE[t.color] || ICON_TILE.rose}`}><Icon className="w-4.5 h-4.5" /></span>
              <span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-rose-500 transition-colors">{t.name}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{t.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Header = () => {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(null); // 'convert' | 'all' | null

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const convertTools = TOOLS.filter((t) => t.category === 'convert-to' || t.category === 'convert-from');
  const imageTools = TOOLS.filter((t) => t.category === 'image');

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-slate-200/70 dark:border-white/10 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden lg:flex items-center gap-0.5">
            <NavLink to="/tool/merge-pdf">Merge PDF</NavLink>
            <NavLink to="/tool/split-pdf">Split PDF</NavLink>
            <NavLink to="/tool/compress-pdf">Compress PDF</NavLink>
            <div className="relative" onMouseEnter={() => setMenu('convert')} onMouseLeave={() => setMenu(null)}>
              <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                Convert PDF <ChevronDown className={`w-4 h-4 transition-transform ${menu === 'convert' ? 'rotate-180' : ''}`} />
              </button>
              {menu === 'convert' && <DropdownGrid tools={convertTools} />}
            </div>
            <div className="relative" onMouseEnter={() => setMenu('image')} onMouseLeave={() => setMenu(null)}>
              <button data-testid="nav-image-tools" className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                Image Tools
                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-rose-500 text-white">New</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${menu === 'image' ? 'rotate-180' : ''}`} />
              </button>
              {menu === 'image' && <DropdownGrid tools={imageTools} cols="grid-cols-1" width="w-[340px]" />}
            </div>
            <div className="relative" onMouseEnter={() => setMenu('all')} onMouseLeave={() => setMenu(null)}>
              <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                All PDF Tools <ChevronDown className={`w-4 h-4 transition-transform ${menu === 'all' ? 'rotate-180' : ''}`} />
              </button>
              {menu === 'all' && (
                <div className="absolute right-0 top-full pt-2 w-[720px]">
                  <div className="glass rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-2xl p-4 reveal max-h-[70vh] overflow-y-auto space-y-3">
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <div key={c.id}>
                        <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-500">{c.label}</p>
                        <div className="grid grid-cols-3 gap-1">
                          {TOOLS.filter((t) => t.category === c.id).map((t) => {
                            const Icon = Icons[t.icon] || Icons.FileText;
                            return (
                              <Link key={t.slug} to={`/tool/${t.slug}`} onClick={() => setMenu(null)} className="group flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                <span className={`grid place-items-center w-8 h-8 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${ICON_TILE[t.color] || ICON_TILE.rose}`}><Icon className="w-4 h-4" /></span>
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-rose-500 transition-colors">{t.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggle} aria-label="Toggle theme" className="grid place-items-center w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <a href="/#tools" className="hidden sm:inline-flex items-center btn-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">Get started</a>
          <button onClick={() => setOpen(!open)} className="lg:hidden grid place-items-center w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden glass border-t border-slate-200/70 dark:border-white/10 px-4 py-4 grid grid-cols-2 gap-1 reveal max-h-[75vh] overflow-y-auto">
          {TOOLS.map((t) => (
            <Link key={t.slug} to={`/tool/${t.slug}`} onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5">{t.name}</Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
