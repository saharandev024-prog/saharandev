import React, { createContext, useContext, useEffect, useState } from 'react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SeoContext = createContext({ site: {}, loaded: false });
export const useSite = () => useContext(SeoContext);

export const SeoProvider = ({ children }) => {
  const [site, setSite] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API}/seo/site`)
      .then((r) => r.json())
      .then((d) => { if (alive) { setSite(d.site || {}); setLoaded(true); } })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  return (
    <SeoContext.Provider value={{ site, loaded }}>
      {/* Google Search Console verification (hoisted to <head> by React 19) */}
      {site.gsc_verification && <meta name="google-site-verification" content={site.gsc_verification} />}

      {/* Google Tag Manager */}
      {site.gtm_id && (
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${site.gtm_id}');` }} />
      )}

      {/* Google Analytics 4 */}
      {site.ga_measurement_id && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${site.ga_measurement_id}`}></script>
          <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${site.ga_measurement_id}');` }} />
        </>
      )}

      {/* Organization structured data */}
      {site.organization_name && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: site.organization_name,
          ...(site.site_url ? { url: site.site_url } : {}),
          ...(site.organization_logo ? { logo: site.organization_logo } : {}),
        }) }} />
      )}

      {children}
    </SeoContext.Provider>
  );
};
