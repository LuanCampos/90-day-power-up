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
  // Mesmo artefato 512×512 opaco que pwa-512 — padding transparente no maskable gerava halo claro no Android.
  return pngBufferForSize(512);
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
