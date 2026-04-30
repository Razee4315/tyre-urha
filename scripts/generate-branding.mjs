/**
 * Procedural branding generator for Tyre Launch.
 *
 * Renders the app icon (1024x1024) + the menu logo (512x512) directly to
 * RGBA buffers and writes them as PNGs using a small pure-JS encoder.
 * Run this once after a clone to populate branding/icon.png +
 * branding/logo.png; then `npm run branding:replace` will fan the icon
 * out to the Android + Tauri icon sets.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const brandingDir = path.join(root, "branding");
const publicDir = path.join(root, "public");
fs.mkdirSync(brandingDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

// CRC32 table (RFC 1952 / PNG spec)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const buf = Buffer.alloc(8 + data.length + 4);
  buf.writeUInt32BE(data.length, 0);
  buf.write(type, 4, 4, "ascii");
  data.copy(buf, 8);
  const crcInput = Buffer.concat([Buffer.from(type, "ascii"), data]);
  buf.writeUInt32BE(crc32(crcInput), 8 + data.length);
  return buf;
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const filtered = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    filtered[y * (stride + 1)] = 0;
    rgba.copy(filtered, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(filtered, { level: 9 });

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);  // bit depth
  ihdr.writeUInt8(6, 9);  // color type RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  return Buffer.concat([
    header,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- drawing primitives on RGBA buffer ---------- */

function makeBuffer(w, h, fill) {
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = fill[0];
    buf[i + 1] = fill[1];
    buf[i + 2] = fill[2];
    buf[i + 3] = fill[3] ?? 255;
  }
  return buf;
}

function setPixel(buf, w, x, y, color, alpha = 1) {
  if (x < 0 || y < 0 || x >= w || alpha <= 0) return;
  const i = (y * w + x) * 4;
  if (i < 0 || i >= buf.length) return;
  const dstA = buf[i + 3] / 255;
  const srcA = (color[3] ?? 255) / 255 * alpha;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;
  buf[i] = Math.round((color[0] * srcA + buf[i] * dstA * (1 - srcA)) / outA);
  buf[i + 1] = Math.round((color[1] * srcA + buf[i + 1] * dstA * (1 - srcA)) / outA);
  buf[i + 2] = Math.round((color[2] * srcA + buf[i + 2] * dstA * (1 - srcA)) / outA);
  buf[i + 3] = Math.round(outA * 255);
}

function fillCircle(buf, w, h, cx, cy, r, color, edgeSoft = 1.5) {
  const r2 = r * r;
  const minX = Math.max(0, Math.floor(cx - r - 1));
  const maxX = Math.min(w - 1, Math.ceil(cx + r + 1));
  const minY = Math.max(0, Math.floor(cy - r - 1));
  const maxY = Math.min(h - 1, Math.ceil(cy + r + 1));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > (r + edgeSoft) * (r + edgeSoft)) continue;
      const d = Math.sqrt(d2);
      const a = d <= r ? 1 : Math.max(0, 1 - (d - r) / edgeSoft);
      setPixel(buf, w, x, y, color, a);
    }
  }
}

function ringMask(buf, w, h, cx, cy, rOuter, rInner, color, edgeSoft = 1.2) {
  const minX = Math.max(0, Math.floor(cx - rOuter - 1));
  const maxX = Math.min(w - 1, Math.ceil(cx + rOuter + 1));
  const minY = Math.max(0, Math.floor(cy - rOuter - 1));
  const maxY = Math.min(h - 1, Math.ceil(cy + rOuter + 1));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < rInner - edgeSoft || d > rOuter + edgeSoft) continue;
      const aOut = d <= rOuter ? 1 : Math.max(0, 1 - (d - rOuter) / edgeSoft);
      const aIn = d >= rInner ? 1 : Math.max(0, 1 - (rInner - d) / edgeSoft);
      const a = Math.min(aOut, aIn);
      setPixel(buf, w, x, y, color, a);
    }
  }
}

function rotatedRect(buf, w, h, cx, cy, hw, hh, angle, color) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const r = Math.hypot(hw, hh);
  const minX = Math.max(0, Math.floor(cx - r - 1));
  const maxX = Math.min(w - 1, Math.ceil(cx + r + 1));
  const minY = Math.max(0, Math.floor(cy - r - 1));
  const maxY = Math.min(h - 1, Math.ceil(cy + r + 1));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const lx = dx * cos + dy * sin;
      const ly = -dx * sin + dy * cos;
      if (Math.abs(lx) <= hw && Math.abs(ly) <= hh) {
        setPixel(buf, w, x, y, color, 1);
      } else if (Math.abs(lx) <= hw + 1 && Math.abs(ly) <= hh + 1) {
        const ax = 1 - Math.max(0, Math.abs(lx) - hw);
        const ay = 1 - Math.max(0, Math.abs(ly) - hh);
        setPixel(buf, w, x, y, color, Math.max(0, Math.min(ax, ay)));
      }
    }
  }
}

function radialBackground(buf, w, h, c0, c1) {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.hypot(cx, cy);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / maxR;
      const t = Math.max(0, Math.min(1, d));
      const i = (y * w + x) * 4;
      buf[i]     = Math.round(c0[0] * (1 - t) + c1[0] * t);
      buf[i + 1] = Math.round(c0[1] * (1 - t) + c1[1] * t);
      buf[i + 2] = Math.round(c0[2] * (1 - t) + c1[2] * t);
      buf[i + 3] = 255;
    }
  }
}

/* ---------- the actual logo composition ---------- */

function drawTyreLogo(size) {
  const buf = makeBuffer(size, size, [0, 0, 0, 0]);
  const cx = size * 0.62;
  const cy = size * 0.5;
  const rOuter = size * 0.36;
  const rTread = size * 0.32;
  const rInnerRubber = size * 0.21;
  const rAlloy = size * 0.17;
  const rHub = size * 0.045;

  // Background panel (rounded square via large circle covers most of canvas)
  radialBackground(buf, size, size, [40, 26, 14], [12, 10, 6]);
  fillCircle(buf, size, size, size / 2, size / 2, size * 0.49, [0, 0, 0, 90], 4);

  // Speed lines on the left
  const flameOrange = [255, 124, 46, 255];
  for (let i = 0; i < 3; i += 1) {
    const yLine = size * (0.36 + i * 0.14);
    rotatedRect(buf, size, size, size * 0.18, yLine, size * 0.14, size * (0.012 + i * 0.005), 0, flameOrange);
  }

  // Outer rubber circle
  fillCircle(buf, size, size, cx, cy, rOuter, [22, 22, 24, 255], 2);

  // Tread blocks ring
  const treadCount = 18;
  for (let i = 0; i < treadCount; i += 1) {
    const a = (i / treadCount) * Math.PI * 2;
    const tx = cx + Math.cos(a) * rTread;
    const ty = cy + Math.sin(a) * rTread;
    rotatedRect(buf, size, size, tx, ty, size * 0.022, size * 0.034, a, [10, 10, 12, 255]);
  }

  // Sidewall (rubber side) ring
  ringMask(buf, size, size, cx, cy, size * 0.31, size * 0.215, [38, 38, 42, 255]);

  // Alloy hub
  fillCircle(buf, size, size, cx, cy, rAlloy, [205, 213, 220, 255]);

  // Spokes
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    rotatedRect(buf, size, size, cx, cy, size * 0.028, size * 0.13, a, [200, 207, 215, 255]);
  }

  // Hub centre boss
  fillCircle(buf, size, size, cx, cy, rHub, [60, 64, 70, 255]);
  fillCircle(buf, size, size, cx, cy, rHub * 0.4, [255, 174, 51, 255]);

  // Subtle inner alloy outline
  ringMask(buf, size, size, cx, cy, rAlloy, rAlloy - 2, [60, 64, 70, 255]);

  return buf;
}

function writePng(filePath, size, rgba) {
  const png = encodePng(size, size, rgba);
  fs.writeFileSync(filePath, png);
  console.log(`Wrote ${path.relative(root, filePath)} (${size}x${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

console.log("Generating Tyre Launch branding…");
const iconSize = 1024;
const logoSize = 512;
writePng(path.join(brandingDir, "icon.png"), iconSize, drawTyreLogo(iconSize));
writePng(path.join(brandingDir, "logo.png"), logoSize, drawTyreLogo(logoSize));
writePng(path.join(publicDir, "logo.png"), logoSize, drawTyreLogo(logoSize));
console.log("Done. Run `npm run branding:replace` to fan the icon out to Tauri/Android.");
