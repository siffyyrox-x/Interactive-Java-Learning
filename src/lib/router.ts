import { useEffect, useState } from 'react';

/** Hash routing: works on GitHub Pages at any sub-path and survives refresh with no server rewrites. */
export interface Route { page: string; params: string[] }

export function parseHash(hash = location.hash): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  return { page: parts[0] ?? 'home', params: parts.slice(1) };
}

export function href(...parts: string[]): string {
  return '#/' + parts.map(encodeURIComponent).join('/');
}

export function go(...parts: string[]) {
  location.hash = href(...parts);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const on = () => { setRoute(parseHash()); window.scrollTo({ top: 0 }); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return route;
}
