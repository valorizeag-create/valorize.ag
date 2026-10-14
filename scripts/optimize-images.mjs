// Gera as imagens da página a partir dos originais do design (design/assets).
// Rodar uma vez: npm run images
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'design/assets';
const OUT = 'assets';
const QUALITY = 80;

const WIDTHS = {
  'logo-h-dark': 600,
  'mark-dark': 120,
  'seal-dark': 280,
  'ribbon-loop': 900,
  'ribbon-bottom': 1300,
};

mkdirSync(OUT, { recursive: true });

for (const [name, width] of Object.entries(WIDTHS)) {
  await sharp(`${SRC}/${name}.png`).resize({ width }).webp({ quality: QUALITY }).toFile(`${OUT}/${name}.webp`);
}

const seal = await sharp(`${SRC}/seal-dark.png`).resize({ width: 420 }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#65d9ff' } })
  .composite([{ input: seal, gravity: 'center' }])
  .png()
  .toFile(`${OUT}/og-image.png`);

console.log('Imagens geradas em', OUT);
