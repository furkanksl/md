import { useState, useEffect } from 'react';

interface ReleaseData {
  version: string;
  downloadUrl: string;
  downloadUrlAarch64: string;
  downloadUrlX86_64: string;
}

export function useLatestRelease() {
  const [release, setRelease] = useState<ReleaseData>({
    version: 'v0.1.0', // Default fallback
    downloadUrl: 'https://github.com/furkanksl/md/releases/latest',
    downloadUrlAarch64: 'https://github.com/furkanksl/md/releases/latest',
    downloadUrlX86_64: 'https://github.com/furkanksl/md/releases/latest'
  });

  useEffect(() => {
    const detectMacArch = async () => {
      if (!/Mac/i.test(navigator.userAgent)) {
        return null;
      }

      const uaData = (navigator as any).userAgentData;
      if (uaData?.getHighEntropyValues) {
        try {
          const values = await uaData.getHighEntropyValues(['architecture', 'platform']);
          const platform = String(values.platform || '').toLowerCase();
          const arch = String(values.architecture || '').toLowerCase();
          if (platform.includes('mac')) {
            if (arch.includes('arm')) return 'aarch64';
            if (arch.includes('x86')) return 'x86_64';
          }
        } catch {
          // Ignore and fall back to UA sniffing.
        }
      }

      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('arm64') || ua.includes('aarch64')) return 'aarch64';
      if (ua.includes('x86_64') || ua.includes('intel') || ua.includes('x86')) return 'x86_64';
      return null;
    };

    const pickAsset = (assets: any[], arch: 'aarch64' | 'x86_64' | null) => {
      const normalized = assets.map(asset => ({
        asset,
        name: String(asset.name || '').toLowerCase()
      }));

      const isDmg = (entry: any) => entry.name.endsWith('.dmg');
      const isZip = (entry: any) => entry.name.endsWith('.app.zip');
      const isUniversal = (entry: any) => entry.name.includes('universal');
      const isAarch64 = (entry: any) =>
        entry.name.includes('aarch64') || entry.name.includes('arm64') || entry.name.includes('apple');
      const isX86 = (entry: any) =>
        entry.name.includes('x86_64') || entry.name.includes('x64') || entry.name.includes('intel');

      if (arch === 'aarch64') {
        return normalized.find(entry => isDmg(entry) && isAarch64(entry))?.asset
          || normalized.find(entry => isZip(entry) && isAarch64(entry))?.asset
          || normalized.find(entry => isDmg(entry) && isUniversal(entry))?.asset
          || normalized.find(entry => isZip(entry) && isUniversal(entry))?.asset;
      }

      if (arch === 'x86_64') {
        return normalized.find(entry => isDmg(entry) && isX86(entry))?.asset
          || normalized.find(entry => isZip(entry) && isX86(entry))?.asset
          || normalized.find(entry => isDmg(entry) && isUniversal(entry))?.asset
          || normalized.find(entry => isZip(entry) && isUniversal(entry))?.asset;
      }

      return normalized.find(entry => isDmg(entry) && isUniversal(entry))?.asset
        || normalized.find(entry => isZip(entry) && isUniversal(entry))?.asset
        || normalized.find(entry => isDmg(entry))?.asset
        || normalized.find(entry => isZip(entry))?.asset;
    };

    const run = async () => {
      try {
        const res = await fetch('https://api.github.com/repos/furkanksl/md/releases/latest');
        if (!res.ok) throw new Error('Failed to fetch release');
        const data = await res.json();
        const assets = data.assets || [];
        const arch = await detectMacArch();
        const macAsset = pickAsset(assets, arch);
        const aarch64Asset = pickAsset(assets, 'aarch64');
        const x86Asset = pickAsset(assets, 'x86_64');
        const fallbackUrl = data.html_url || 'https://github.com/furkanksl/md/releases/latest';

        setRelease({
          version: data.tag_name,
          downloadUrl: macAsset ? macAsset.browser_download_url : fallbackUrl,
          downloadUrlAarch64: aarch64Asset ? aarch64Asset.browser_download_url : fallbackUrl,
          downloadUrlX86_64: x86Asset ? x86Asset.browser_download_url : fallbackUrl
        });
      } catch (err) {
        console.warn('Could not fetch latest release:', err);
        // Keep default state
      }
    };

    void run();
  }, []);

  return release;
}
