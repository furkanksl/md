import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_JSON_PATH = path.join(__dirname, '../package.json');
const TAURI_CONF_PATH = path.join(__dirname, '../src-tauri/tauri.conf.json');

const type = process.argv[2];
const allowedTypes = ['major', 'minor', 'patch'];

if (!type && !process.argv[2]) {
    console.log('Usage: node bump-version.js <major|minor|patch|specific-version>');
    process.exit(1);
}

function bumpVersion(currentVersion, type) {
    if (!allowedTypes.includes(type)) {
        // Assume explicit version if not a type
        if (/^\d+\.\d+\.\d+$/.test(type)) {
            return type;
        }
        console.error(`Invalid version type or format: ${type}. Use major, minor, patch, or x.y.z`);
        process.exit(1);
    }

    const [major, minor, patch] = currentVersion.split('.').map(Number);

    switch (type) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
            return `${major}.${minor}.${patch + 1}`;
    }
}

try {
    // 1. Update package.json
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const oldVersion = packageJson.version;
    const newVersion = bumpVersion(oldVersion, type);

    packageJson.version = newVersion;
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Updated package.json: ${oldVersion} -> ${newVersion}`);

    // 2. Update tauri.conf.json
    const tauriConf = JSON.parse(fs.readFileSync(TAURI_CONF_PATH, 'utf8'));
    // tauri.conf.json might have a different version, but we usually sync it to package.json
    const tauriOldVersion = tauriConf.version;
    tauriConf.version = newVersion;
    fs.writeFileSync(TAURI_CONF_PATH, JSON.stringify(tauriConf, null, 2) + '\n');
    console.log(`Updated tauri.conf.json: ${tauriOldVersion} -> ${newVersion}`);

    console.log(`\nVersion bumped to ${newVersion} successfully.`);

} catch (error) {
    console.error('Error bumping version:', error);
    process.exit(1);
}
