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
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Kyroo" />
  <meta name="format-detection" content="telephone=no" />

  <!-- iOS home screen icon (180×180 is the recommended size) -->
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

  <!-- iOS splash screen for "Add to Home Screen" cold launch -->
  <link rel="apple-touch-startup-image" href="/apple-splash.png" />

  <!-- Favicon: versioned URL forces browser to discard cached icon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png?v=3" />
  <link rel="shortcut icon" href="/favicon.ico?v=3" />

`;

// Fix viewport: add viewport-fit=cover so content fills behind notch / Dynamic Island
html = html.replace(
  'width=device-width, initial-scale=1, shrink-to-fit=no',
  'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
);


// Inject PWA tags before </head>
html = html.replace('</head>', HEAD_INJECT + '\n</head>');

// Inject no-bounce / no-tap-highlight CSS + iOS safe-area handling
const PWA_CSS = `
  <style>
    html, body {
      margin: 0;
      padding: 0;
      overscroll-behavior: none;
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      touch-action: manipulation;
      background-color: #000000;
      /* Paint behind the notch and home indicator */
      height: 100%;
    }
    #root {
      /* Pure-black background under the status bar area when in
         standalone (Add to Home Screen) mode */
      background-color: #000000;
      min-height: 100vh;
      min-height: 100dvh;
    }
    * { -webkit-user-select: none; user-select: none; }
    input, textarea { -webkit-user-select: text; user-select: text; }

    /* iOS standalone-specific: remove Safari chrome artefacts */
    @media all and (display-mode: standalone) {
      html, body { overflow: hidden; }
      body { position: fixed; width: 100%; height: 100%; }
      #root { height: 100%; overflow: auto; -webkit-overflow-scrolling: touch; }
    }
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
