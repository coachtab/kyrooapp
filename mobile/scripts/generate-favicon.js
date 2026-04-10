#!/usr/bin/env node
// Generates assets/favicon.png from the K logo design using only Node.js built-ins.
// Run: node scripts/generate-favicon.js

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const W = 64, H = 64;

// ── Colours ─────────────────────────────────────────────────────────────────
const BG  = [0,   0,   0  ];   // #000000
const FG  = [255, 92,  0  ];   // #FF5C00

// ── Pixel buffer ─────────────────────────────────────────────────────────────
const pixels = Array.from({ length: H }, () =>
  Array.from({ length: W }, () => [...BG])
);

// ── Drawing helpers ──────────────────────────────────────────────────────────
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function drawLine(x1, y1, x2, y2, thickness) {
  const half = thickness / 2;
  const minX = Math.max(0, Math.floor(Math.min(x1, x2) - half));
  const maxX = Math.min(W - 1, Math.ceil(Math.max(x1, x2) + half));
  const minY = Math.max(0, Math.floor(Math.min(y1, y2) - half));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(y1, y2) + half));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (distToSegment(x, y, x1, y1, x2, y2) <= half) {
        pixels[y][x] = [...FG];
      }
    }
  }
}

// ── Rounded-rect background clipping ────────────────────────────────────────
function roundedRectClip(radius) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const cx = Math.min(x, W - 1 - x);
      const cy = Math.min(y, H - 1 - y);
      if (cx < radius && cy < radius) {
        const dx = radius - cx - 0.5;
        const dy = radius - cy - 0.5;
        if (Math.hypot(dx, dy) > radius) {
          pixels[y][x] = null; // transparent (will render as BG)
        }
      }
    }
  }
}

// ── Draw the K ───────────────────────────────────────────────────────────────
roundedRectClip(12);
drawLine(17, 11, 17, 53, 10);    // vertical bar
drawLine(21, 32, 51, 11, 8.5);   // upper arm
drawLine(21, 32, 51, 53, 8.5);   // lower arm

// ── PNG encoder ──────────────────────────────────────────────────────────────
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c & 1) ? ((c >>> 1) ^ 0xEDB88320) : (c >>> 1);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([typeBuf, data]);
  const crc  = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(W, 0);
ihdrData.writeUInt32BE(H, 4);
ihdrData[8]  = 8;  // bit depth
ihdrData[9]  = 2;  // colour type: RGB
ihdrData[10] = 0;  // compression
ihdrData[11] = 0;  // filter
ihdrData[12] = 0;  // interlace

const rawRows = [];
for (let y = 0; y < H; y++) {
  rawRows.push(0); // filter byte: None
  for (let x = 0; x < W; x++) {
    const p = pixels[y][x] ?? BG;
    rawRows.push(p[0], p[1], p[2]);
  }
}

const compressed = zlib.deflateSync(Buffer.from(rawRows));
const png = Buffer.concat([
  PNG_SIG,
  chunk('IHDR', ihdrData),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = path.join(__dirname, '..', 'assets', 'favicon.png');
fs.writeFileSync(out, png);
console.log(`favicon.png written (${W}x${H}px)`);
