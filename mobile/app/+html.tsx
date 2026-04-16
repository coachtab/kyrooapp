import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* viewport-fit=cover: content fills behind notch / Dynamic Island / Android nav bar */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* Theme colour — browser toolbar and Android task switcher */}
        <meta name="theme-color" content="#0A0A0A" />

        {/* iOS PWA — makes "Add to Home Screen" behave like a native app */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Kyroo" />

        {/* Icons */}
        <link rel="apple-touch-icon" href="/assets/icon.png" />
        {/* Inline data URI — can't be cached separately, works in dev and prod */}
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='10' fill='%23E94560'/%3E%3Cline x1='19' y1='13' x2='19' y2='51' stroke='white' stroke-width='9' stroke-linecap='round'/%3E%3Cline x1='23' y1='32' x2='52' y2='13' stroke='white' stroke-width='7.5' stroke-linecap='round'/%3E%3Cline x1='23' y1='32' x2='52' y2='51' stroke='white' stroke-width='7.5' stroke-linecap='round'/%3E%3C/svg%3E" />

        <title>Kyroo</title>

        {/* One font across the whole app — DM Sans, all weights */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap"
        />

        <ScrollViewStyleReset />

        {/* PWA feel: no bounce scroll, no tap highlight, no double-tap zoom.
            Force DM Sans as the default on every text node and form field. */}
        <style dangerouslySetInnerHTML={{ __html: `
          html, body {
            height: 100%;
            overscroll-behavior: none;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            touch-action: manipulation;
            background-color: #0A0A0A;
            font-family: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          * { -webkit-user-select: none; user-select: none; }
          input, textarea, button, select { font-family: inherit; }
          input, textarea { -webkit-user-select: text; user-select: text; }
          input, textarea, [contenteditable] {
            outline: none !important;
            box-shadow: none !important;
            border-color: transparent !important;
            -webkit-appearance: none;
            appearance: none;
          }
          input:focus, textarea:focus, [contenteditable]:focus,
          *:focus, *:focus-visible, *:focus-within {
            outline: none !important;
            box-shadow: none !important;
          }
          /* React Native Web wraps TextInput in a <div> that gets
             an inline border on focus — override with !important */
          div:focus, div:focus-visible {
            outline: none !important;
            border-color: inherit !important;
          }
          * { -webkit-tap-highlight-color: transparent; }
        `}} />

        {/* Register service worker */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .catch(function(err) { console.warn('SW registration failed:', err); });
            });
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
