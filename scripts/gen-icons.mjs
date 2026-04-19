import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svg = readFileSync(resolve(root, 'public/icon.svg'));
const ogSvg = readFileSync(resolve(root, 'public/og-image.svg'));

// Maskable variant: same icon but with a safe-zone background that fills the canvas
const maskableSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#f6f1e8"/>
  <g transform="translate(64 64) scale(0.75)">
    ${readFileSync(resolve(root, 'public/icon.svg'), 'utf8').replace(/<svg[^>]*>|<\/svg>/g, '')}
  </g>
</svg>`);

const targets = [
  { src: svg, size: 192, out: 'public/icon-192.png' },
  { src: svg, size: 512, out: 'public/icon-512.png' },
  { src: maskableSvg, size: 512, out: 'public/icon-512-maskable.png' },
  { src: svg, size: 180, out: 'public/apple-touch-icon.png' },
  { src: svg, size: 32,  out: 'public/favicon.png' },
];

for (const t of targets) {
  await sharp(t.src).resize(t.size, t.size).png().toFile(resolve(root, t.out));
  console.log('wrote', t.out);
}

await sharp(ogSvg).resize(1200, 630).png().toFile(resolve(root, 'public/og-image.png'));
console.log('wrote public/og-image.png');
