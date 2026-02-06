#!/bin/bash

# release.sh - Build, Sign, and Notarize the Tauri Application

set -e # Exit immediately if a command exits with a non-zero status

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Release Build Process...${NC}"

# 0. Load .env file
if [ -f .env ]; then
    echo -e "${YELLOW}Loading environment variables from .env...${NC}"
    # Automatically export variables from .env
    set -a
    source .env
    set +a
fi

# Optional: Bump Version
if [ "$1" == "--bump" ]; then
    if [ -z "$2" ]; then
        echo -e "${RED}Error: Version type (major, minor, patch) required with --bump${NC}"
        exit 1
    fi
    echo -e "${YELLOW}Bumping version ($2)...${NC}"
    node scripts/bump-version.js "$2"
fi

# 1. Environment Verification
echo -e "${YELLOW}Verifying environment variables...${NC}"

MISSING_VARS=0

if [ -z "$APPLE_SIGNING_IDENTITY" ]; then
    echo -e "${YELLOW}Warning: APPLE_SIGNING_IDENTITY is not set. Using default or automatic detection.${NC}"
fi

if [ -z "$APPLE_CERTIFICATE" ]; then
    echo -e "${RED}Error: APPLE_CERTIFICATE (Base64) is missing.${NC}"
    MISSING_VARS=1
fi

if [ -z "$APPLE_CERTIFICATE_PASSWORD" ]; then
    echo -e "${RED}Error: APPLE_CERTIFICATE_PASSWORD is missing.${NC}"
    MISSING_VARS=1
fi

# Notarization credentials
if [ -z "$APPLE_ID" ]; then
    echo -e "${RED}Error: APPLE_ID is missing (required for notarization).${NC}"
    MISSING_VARS=1
fi

if [ -z "$APPLE_PASSWORD" ]; then
    echo -e "${RED}Error: APPLE_PASSWORD (App-Specific Password) is missing (required for notarization).${NC}"
    MISSING_VARS=1
fi

if [ -z "$APPLE_TEAM_ID" ]; then
    echo -e "${RED}Error: APPLE_TEAM_ID is missing.${NC}"
    MISSING_VARS=1
fi

# Tauri Updater credentials
if [ -z "$TAURI_SIGNING_PRIVATE_KEY" ]; then
    echo -e "${RED}Error: TAURI_SIGNING_PRIVATE_KEY is missing (required for updater signing).${NC}"
    MISSING_VARS=1
fi

if [ -z "$TAURI_SIGNING_PRIVATE_KEY_PASSWORD" ]; then
    echo -e "${YELLOW}Warning: TAURI_SIGNING_PRIVATE_KEY_PASSWORD is not set. Assuming empty password.${NC}"
fi

if [ $MISSING_VARS -ne 0 ]; then
    echo -e "${RED}Build aborted due to missing environment variables.${NC}"
    echo "Please ensure you have a .env file or exported variables for code signing and notarization."
    exit 1
fi

echo -e "${GREEN}Environment variables verified.${NC}"

# 2. Build Frontend
echo -e "${YELLOW}Building Frontend...${NC}"
npm run build

# 3. Build & Sign & Notarize (Tauri)
echo -e "${YELLOW}Building, Signing, and Notarizing Tauri App...${NC}"
# The environment variables APPLE_* are automatically picked up by tauri build
npm run tauri build

echo -e "${YELLOW}Generating latest.json and organizing artifacts...${NC}"
node scripts/generate-latest-json.cjs

echo -e "${GREEN}Release build completed successfully!${NC}"
echo -e "${YELLOW}Artifacts ready for GitHub Release:${NC}"
echo -e "1. macOS App/DMG: ${GREEN}src-tauri/target/release/bundle/macos/${NC}"
echo -e "2. Updater JSON:  ${GREEN}src-tauri/target/release/bundle/updater/latest.json${NC}"
echo -e "3. Update Bundle: ${GREEN}src-tauri/target/release/bundle/updater/*.tar.gz${NC}"
