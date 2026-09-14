import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { publicApi } from '../lib/adminApi';
import { ArrowLeft, CalendarDays } from 'lucide-react';

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(undefined); // undefined=loading, null=not found

  useEffect(() => {
    let alive = true;
    publicApi.blogPost(slug)
      .then((d) => { if (alive) setPost(d.post); })
      .catch(() => { if (alive) setPost(null); });
    return () => { alive = false; };
  }, [slug]);

  const jsonLd = post ? {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.meta_description || '',
    ...(post.cover_image ? { image: post.cover_image } : {}),
    author: { '@type': 'Organization', name: post.author || 'LovePDF' },
    datePublished: post.created_at,
    dateModified: post.updated_at,
  } : null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0f1a] text-slate-900 dark:text-slate-100">
      {post && (
        <Seo
          path={`/blog/${slug}`}
          title={post.meta_title || `${post.title} | LovePDF`}
          description={post.meta_description || post.excerpt}
          keywords={post.keywords}
          image={post.cover_image}
          type="article"
          jsonLd={jsonLd}
        />
      )}
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-14">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-rose-500 font-semibold mb-6"><ArrowLeft className="w-4 h-4" /> Back to blog</Link>
        {post === undefined ? (
          <p className="text-slate-400">Loading…</p>
        ) : post === null ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold">Article not found</h1>
            <p className="mt-2 text-slate-500">This article may have been moved or unpublished.</p>
          </div>
        ) : (
          <article>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">{post.title}</h1>
            <div className="mt-4 flex items-center gap-3 text-sm text-slate-400">
              <span>{post.author || 'LovePDF Team'}</span>
              <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {(post.created_at || '').slice(0, 10)}</span>
            </div>
            {post.cover_image && <img src={post.cover_image} alt={post.title} className="w-full rounded-2xl mt-6 object-cover" />}
            <div className="prose prose-slate dark:prose-invert max-w-none mt-8 leading-relaxed blog-content" dangerouslySetInnerHTML={{ __html: post.content || '' }} />
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
