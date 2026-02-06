const fs = require('fs');
const path = require('path');

const tauriConfigPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
const version = tauriConfig.version;

const bundleDir = path.join(
    __dirname,
    '../src-tauri/target/universal-apple-darwin/release/bundle'
);
const macosDir = path.join(bundleDir, 'macos');
const updaterDir = path.join(bundleDir, 'updater');

if (!fs.existsSync(updaterDir)) {
    fs.mkdirSync(updaterDir, { recursive: true });
}

// Find the .tar.gz and .sig files
const files = fs.readdirSync(macosDir);
const tarFile = files.find(f => f.endsWith('.tar.gz'));
const sigFile = files.find(f => f.endsWith('.tar.gz.sig'));

if (!tarFile || !sigFile) {
    console.error('Error: Could not find .tar.gz or .sig files in', macosDir);
    process.exit(1);
}

const signature = fs.readFileSync(path.join(macosDir, sigFile), 'utf8');
const pub_date = new Date().toISOString();

// GitHub normalizes spaces to dots in asset names; mirror that in URLs/artifacts.
const urlTarFile = tarFile.replace(/ /g, '.');
const urlSigFile = sigFile.replace(/ /g, '.');

const latestJson = {
    version: version,
    notes: "Update via Tauri.",
    pub_date: pub_date,
    platforms: {
        "darwin-aarch64": {
            "signature": signature,
            "url": `https://github.com/furkanksl/md/releases/latest/download/${urlTarFile}`
        },
        "darwin-x86_64": {
            "signature": signature,
            "url": `https://github.com/furkanksl/md/releases/latest/download/${urlTarFile}`
        }
    }
};

fs.writeFileSync(path.join(updaterDir, 'latest.json'), JSON.stringify(latestJson, null, 2));

// Copy files to updater dir
fs.copyFileSync(path.join(macosDir, tarFile), path.join(updaterDir, urlTarFile));
fs.copyFileSync(path.join(macosDir, sigFile), path.join(updaterDir, urlSigFile));

console.log(`Successfully generated latest.json and moved artifacts to ${updaterDir}`);
