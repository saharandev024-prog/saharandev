import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { publicApi } from '../lib/adminApi';
import { CalendarDays, ArrowRight } from 'lucide-react';

const Blog = () => {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    publicApi.blogList().then((d) => setPosts(d.posts || [])).catch(() => setPosts([]));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0f1a] text-slate-900 dark:text-slate-100">
      <Seo
        path="/blog"
        title="Blog — Tips & Guides for PDF & Image Tools | LovePDF"
        description="Guides, tips and tutorials on how to merge, compress, convert and edit PDFs and images online for free."
        keywords="pdf tips, how to merge pdf, compress pdf guide, pdf tutorials"
      />
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight">The LovePDF Blog</h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Tips, guides and tutorials to get the most out of your documents.</p>
        </div>

        {posts === null ? (
          <p className="text-center text-slate-400">Loading…</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
            <p className="text-slate-500 dark:text-slate-400">No articles published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {posts.map((p) => (
              <Link key={p.id} to={`/blog/${p.slug}`} data-testid={`blog-card-${p.slug}`}
                className="group rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden card-hover bg-slate-50 dark:bg-white/[0.02] transition-transform">
                {p.cover_image ? (
                  <div className="aspect-[16/9] overflow-hidden"><img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>
                ) : (
                  <div className="aspect-[16/9] bg-gradient-to-br from-rose-400/20 to-rose-600/10 grid place-items-center text-rose-500 text-4xl font-black">PDF</div>
                )}
                <div className="p-5">
                  <h2 className="text-lg font-bold group-hover:text-rose-500 transition-colors">{p.title}</h2>
                  {p.excerpt && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{p.excerpt}</p>}
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {(p.created_at || '').slice(0, 10)}</span>
                    <span className="inline-flex items-center gap-1 text-rose-500 font-semibold">Read <ArrowRight className="w-3.5 h-3.5" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
