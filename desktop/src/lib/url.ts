
export function normalizeUrl(input: string): { ok: boolean; url: string; isSearch?: boolean } {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, url: "" };

  // If it already starts with http/https, assume it's a URL
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed);
      return { ok: true, url: trimmed };
    } catch {
      // Invalid URL even with protocol
      return { ok: true, url: `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`, isSearch: true };
    }
  }

  // Check if it looks like a domain (has a dot, no spaces)
  // Simple regex: no spaces, at least one dot, not starting with a dot
  if (!/\s/.test(trimmed) && /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.test(trimmed)) {
    const withProtocol = `https://${trimmed}`;
    try {
      new URL(withProtocol);
      return { ok: true, url: withProtocol };
    } catch {
      // fallback to search
    }
  }

  // Treat as search query
  return { 
    ok: true, 
    url: `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`,
    isSearch: true
  };
}
