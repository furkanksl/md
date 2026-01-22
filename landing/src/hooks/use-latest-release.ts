import { useState, useEffect } from 'react';

interface ReleaseData {
  version: string;
  downloadUrl: string;
}

export function useLatestRelease() {
  const [release, setRelease] = useState<ReleaseData>({
    version: 'v0.1.0', // Default fallback
    downloadUrl: 'https://github.com/furkanksl/md/releases/latest'
  });

  useEffect(() => {
    fetch('https://api.github.com/repos/furkanksl/md/releases/latest')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch release');
        return res.json();
      })
      .then(data => {
        // Find the .dmg asset for macOS (Intel or Apple Silicon usually universal or separate)
        // For simplicity, we'll point to the release page if specific asset matching is complex,
        // or just use the first asset if available.
        // Usually safe to just link to /releases/latest for the button if we can't find a direct link.
        
        // But let's try to find a .dmg or .app
        const macAsset = data.assets?.find((asset: any) => 
          asset.name.endsWith('.dmg') || asset.name.endsWith('.app.zip')
        );

        setRelease({
          version: data.tag_name,
          downloadUrl: macAsset ? macAsset.browser_download_url : data.html_url
        });
      })
      .catch(err => {
        console.warn('Could not fetch latest release:', err);
        // Keep default state
      });
  }, []);

  return release;
}
