#!/usr/bin/env node
// Post-processes dist/index.html after `expo export --platform web`
// Injects PWA meta tags, links manifest, registers service worker,
// and copies public/ assets into dist/.

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// ── 1. Inject into index.html ────────────────────────────────────────────────
const htmlPath = path.join(DIST, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const HEAD_INJECT = `
  <!-- PWA manifest -->
  <link rel="manifest" href="/manifest.webmanifest" />

  <!-- Theme colour: browser toolbar + Android task switcher -->
  <meta name="theme-color" content="#0A0A0A" />

  <!-- iOS PWA: hides Safari chrome after "Add to Home Screen" -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Kyroo" />

  <!-- iOS home screen icon -->
  <link rel="apple-touch-icon" href="/assets/icon.png" />

  <!-- Favicon: SVG first (modern browsers), PNG fallback, ICO last resort -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />`;

// Fix viewport: add viewport-fit=cover so content fills behind notch / Dynamic Island
html = html.replace(
  'width=device-width, initial-scale=1, shrink-to-fit=no',
  'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
);

// Inject PWA tags before </head>
html = html.replace('</head>', HEAD_INJECT + '\n</head>');

// Inject no-bounce / no-tap-highlight CSS before </head>
const PWA_CSS = `
  <style>
    html, body {
      overscroll-behavior: none;
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      touch-action: manipulation;
      background-color: #0A0A0A;
    }
    * { -webkit-user-select: none; user-select: none; }
    input, textarea { -webkit-user-select: text; user-select: text; }
  </style>`;
html = html.replace('</head>', PWA_CSS + '\n</head>');

// Inject service worker registration before </body>
const SW_SCRIPT = `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
          .catch(function(err) { console.warn('SW registration failed:', err); });
      });
    }
  </script>`;
html = html.replace('</body>', SW_SCRIPT + '\n</body>');

fs.writeFileSync(htmlPath, html);
console.log('✓ Patched dist/index.html with PWA tags');

// ── 2. Copy public/ → dist/ ──────────────────────────────────────────────────
const PUBLIC = path.join(ROOT, 'public');
for (const file of fs.readdirSync(PUBLIC)) {
  fs.copyFileSync(path.join(PUBLIC, file), path.join(DIST, file));
  console.log(`✓ Copied public/${file} → dist/${file}`);
}

console.log('Done.');
