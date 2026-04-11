#!/usr/bin/env node
// Generates all PNG icon variants from the master logo.svg
// Run: node scripts/generate-icons.js

const sharp  = require('sharp');
const path   = require('path');
const fs     = require('fs');

const ROOT   = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const PUBLIC = path.join(ROOT, 'public');

const svgPath = path.join(ASSETS, 'logo.svg');
const svg     = fs.readFileSync(svgPath);

async function gen(outPath, size, opts = {}) {
  let pipeline = sharp(svg).resize(size, size);
  if (opts.background) pipeline = pipeline.flatten({ background: opts.background });
  await pipeline.png({ compressionLevel: 9 }).toFile(outPath);
  console.log(`✓  ${path.relative(ROOT, outPath)}  (${size}×${size})`);
}

(async () => {
  // App icon — used by Expo for iOS home screen, PWA manifest, etc.
  await gen(path.join(ASSETS, 'icon.png'), 1024);

  // Android adaptive icon foreground (needs safe-zone padding; content in centre 72%)
  // We resize the logo to 74% of canvas and centre it on transparent background
  const adaptiveSvg = fs.readFileSync(svgPath);
  const logoSize    = Math.round(1024 * 0.74);
  const offset      = Math.round((1024 - logoSize) / 2);
  await sharp(adaptiveSvg)
    .resize(logoSize, logoSize)
    .extend({ top: offset, bottom: offset, left: offset, right: offset, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ASSETS, 'adaptive-icon.png'));
  console.log(`✓  assets/adaptive-icon.png  (1024×1024, padded for Android safe zone)`);

  // Splash icon — centred on pure black, smaller so it feels like a splash logo
  const splashSize = Math.round(1024 * 0.50);
  const splashOff  = Math.round((1024 - splashSize) / 2);
  await sharp(adaptiveSvg)
    .resize(splashSize, splashSize)
    .extend({ top: splashOff, bottom: splashOff, left: splashOff, right: splashOff, background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .flatten({ background: { r: 10, g: 10, b: 10 } })
    .png()
    .toFile(path.join(ASSETS, 'splash-icon.png'));
  console.log(`✓  assets/splash-icon.png  (1024×1024, centred on #0A0A0A)`);

  // Favicon PNG — 32×32 for browsers that don't support SVG favicons
  await gen(path.join(ASSETS, 'favicon.png'), 32);

  // Copy favicon to public/ so the build script picks it up
  fs.copyFileSync(path.join(ASSETS, 'favicon.svg'), path.join(PUBLIC, 'favicon.svg'));
  fs.copyFileSync(path.join(ASSETS, 'favicon.png'), path.join(PUBLIC, 'favicon.png'));
  console.log(`✓  Copied favicon.svg + favicon.png → public/`);

  console.log('\nAll icons generated.');
})().catch(err => { console.error('Error:', err.message); process.exit(1); });
