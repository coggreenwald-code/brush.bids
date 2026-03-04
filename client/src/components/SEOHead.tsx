import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description?: string;
  url?: string;
  image?: string;
}

function setMeta(selector: string, attr: string, value: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export function SEOHead({ title, description, url, image }: SEOHeadProps) {
  useEffect(() => {
    document.title = title;

    if (description) {
      setMeta('meta[name="description"]', "content", description);
      setMeta('meta[property="og:description"]', "content", description);
      setMeta('meta[name="twitter:description"]', "content", description);
    }

    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[name="twitter:title"]', "content", title);

    if (url) {
      setMeta('meta[property="og:url"]', "content", url);
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.setAttribute("href", url);
    }

    if (image) {
      setMeta('meta[property="og:image"]', "content", image);
      setMeta('meta[name="twitter:image"]', "content", image);
    }
  }, [title, description, url, image]);

  return null;
}
