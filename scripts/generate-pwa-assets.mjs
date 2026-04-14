/**
 * Gera ícones PWA (PNG) a partir de public/brand/pwa-icon.svg.
 * Screenshots do manifest (pwa-screenshot-*.png) são mantidos manualmente em public/.
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const svgPath = join(publicDir, "brand", "pwa-icon.svg");
const svg = readFileSync(svgPath);

async function pngBufferForSize(size) {
  return sharp(svg).resize(size, size).png().toBuffer();
}

async function maskable512() {
  const inner = 410;
  const pad = Math.floor((512 - inner) / 2);
  const innerBuf = await sharp(svg).resize(inner, inner).png().toBuffer();
  return sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: innerBuf, left: pad, top: pad }])
    .png()
    .toBuffer();
}

async function main() {
  await sharp(await pngBufferForSize(192)).toFile(join(publicDir, "pwa-192.png"));
  await sharp(await pngBufferForSize(512)).toFile(join(publicDir, "pwa-512.png"));
  await sharp(await maskable512()).toFile(join(publicDir, "pwa-maskable-512.png"));
  console.log("Ícones PWA gerados em public/ a partir de brand/pwa-icon.svg");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
