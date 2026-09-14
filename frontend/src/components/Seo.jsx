import React, { useEffect, useState } from 'react';
import { useSite } from '../context/SeoContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Renders per-page document metadata. React 19 automatically hoists
// <title>/<meta>/<link>/<script> rendered here into the document <head>.
export default function Seo({ path, title, description, keywords, image, type = 'website', jsonLd }) {
  const { site } = useSite();
  const [ov, setOv] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API}/seo/page?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((d) => { if (alive) setOv(d.seo || {}); })
      .catch(() => {});
    return () => { alive = false; };
  }, [path]);

  const o = ov || {};
  const siteName = site.site_name || 'LovePDF';
  const finalTitle = o.title || title;
  const finalDesc = o.description || description;
  const finalKeywords = o.keywords || keywords;
  const ogTitle = o.og_title || finalTitle;
  const ogDesc = o.og_description || finalDesc;
  const ogImage = o.og_image || image || site.default_og_image;
  const canonical = o.canonical || (site.site_url ? `${site.site_url.replace(/\/$/, '')}${path}` : undefined);
  const noindex = o.noindex;

  return (
    <>
      {finalTitle && <title>{finalTitle}</title>}
      {finalDesc && <meta name="description" content={finalDesc} />}
      {finalKeywords && <meta name="keywords" content={finalKeywords} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {ogTitle && <meta property="og:title" content={ogTitle} />}
      {ogDesc && <meta property="og:description" content={ogDesc} />}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      {site.twitter_handle && <meta name="twitter:site" content={site.twitter_handle} />}
      {ogTitle && <meta name="twitter:title" content={ogTitle} />}
      {ogDesc && <meta name="twitter:description" content={ogDesc} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    </>
  );
}
