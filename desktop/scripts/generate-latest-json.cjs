const fs = require('fs');
const path = require('path');

const tauriConfigPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
const version = tauriConfig.version;

const aarch64BundleDir = path.join(
    __dirname,
    '../src-tauri/target/aarch64-apple-darwin/release/bundle'
);
const x86BundleDir = path.join(
    __dirname,
    '../src-tauri/target/x86_64-apple-darwin/release/bundle'
);
const updaterDir = path.join(__dirname, '../src-tauri/target/release/bundle/updater');

if (!fs.existsSync(updaterDir)) {
    fs.mkdirSync(updaterDir, { recursive: true });
}

const pub_date = new Date().toISOString();

function collectArtifacts(bundleDir, archLabel) {
    const macosDir = path.join(bundleDir, 'macos');
    const files = fs.readdirSync(macosDir);
    const tarFile = files.find(f => f.endsWith('.tar.gz'));
    const sigFile = files.find(f => f.endsWith('.tar.gz.sig'));

    if (!tarFile || !sigFile) {
        console.error('Error: Could not find .tar.gz or .sig files in', macosDir);
        process.exit(1);
    }

    const signature = fs.readFileSync(path.join(macosDir, sigFile), 'utf8');

    // GitHub normalizes spaces to dots in asset names; mirror that in URLs/artifacts.
    const urlTarFile = tarFile.replace(/ /g, '.');
    const urlSigFile = sigFile.replace(/ /g, '.');

    const archTarFile = urlTarFile.replace(/\.tar\.gz$/, `.${archLabel}.tar.gz`);
    const archSigFile = urlSigFile.replace(/\.tar\.gz\.sig$/, `.${archLabel}.tar.gz.sig`);

    fs.copyFileSync(path.join(macosDir, tarFile), path.join(updaterDir, archTarFile));
    fs.copyFileSync(path.join(macosDir, sigFile), path.join(updaterDir, archSigFile));

    return {
        signature,
        url: `https://github.com/furkanksl/md/releases/latest/download/${archTarFile}`
    };
}

const aarch64Artifacts = collectArtifacts(aarch64BundleDir, 'aarch64');
const x86Artifacts = collectArtifacts(x86BundleDir, 'x86_64');

const latestJson = {
    version: version,
    notes: "Update via Tauri.",
    pub_date: pub_date,
    platforms: {
        "darwin-aarch64": aarch64Artifacts,
        "darwin-arm64": aarch64Artifacts,
        "darwin-x86_64": x86Artifacts,
        "darwin-x64": x86Artifacts
    }
};

fs.writeFileSync(path.join(updaterDir, 'latest.json'), JSON.stringify(latestJson, null, 2));

console.log(`Successfully generated latest.json and moved artifacts to ${updaterDir}`);
