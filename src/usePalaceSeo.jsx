import { useEffect } from 'react';
import { routeSeo } from './palaceSeo';

function meta(kind, name, value) {
  const selector = 'meta[' + kind + '="' + name + '"]';
  let node = document.head.querySelector(selector);
  if (!node) { node = document.createElement('meta'); node.setAttribute(kind, name); document.head.appendChild(node); }
  node.setAttribute('content', value);
}
export function applyPalaceSeo(details) {
  if (typeof document === 'undefined' || !details) return;
  document.title = details.title;
  meta('name', 'description', details.description);
  meta('name', 'robots', details.robots);
  meta('property', 'og:title', details.title);
  meta('property', 'og:description', details.description);
  meta('property', 'og:url', details.url);
  meta('property', 'og:type', details.type);
  meta('name', 'twitter:title', details.title);
  meta('name', 'twitter:description', details.description);
  const canonical = document.head.querySelector('link[rel="canonical"]') || document.head.appendChild(document.createElement('link'));
  canonical.setAttribute('rel', 'canonical');
  canonical.setAttribute('href', details.url);
  if (details.image) {
    meta('property', 'og:image', details.image);
    meta('name', 'twitter:card', 'summary_large_image');
  } else {
    document.head.querySelector('meta[property="og:image"]')?.remove();
    meta('name', 'twitter:card', 'summary');
  }
}
export function usePalaceSeo(details) {
  useEffect(() => { if (details) applyPalaceSeo(details); },
    [details?.title, details?.description, details?.url, details?.robots, details?.type, details?.image]);
}
export function PalaceRouteSeo({ pathname }) {
  useEffect(() => { applyPalaceSeo(routeSeo(pathname)); }, [pathname]);
  return null;
}
