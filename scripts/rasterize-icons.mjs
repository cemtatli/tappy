import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const icons = join(root, 'src/assets/icons');

// 16/32 use the bare mark, 48/128 the full logo.
const jobs = [
  { size: 16, src: 'tappy-mark.svg' },
  { size: 32, src: 'tappy-mark.svg' },
  { size: 48, src: 'tappy-logo.svg' },
  { size: 128, src: 'tappy-logo.svg' },
  { size: 256, src: 'tappy-logo.svg', out: 'preview-logo.png' },
  { size: 256, src: 'tappy-mark.svg', out: 'preview-mark.png' },
];

for (const { size, src, out } of jobs) {
  const svg = readFileSync(join(icons, src));
  const file = out ?? `icon-${size}.png`;
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(join(icons, file));
  console.log(`${file}  <- ${src} @${size}`);
}
