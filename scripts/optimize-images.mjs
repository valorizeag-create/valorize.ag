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

// Logos dos clientes: selos redondos de 160px (exibidos a 56px), fonte em design/clientes.
const AVATAR = 160;
const circleMask = Buffer.from(`<svg width="${AVATAR}" height="${AVATAR}"><circle cx="${AVATAR / 2}" cy="${AVATAR / 2}" r="${AVATAR / 2}"/></svg>`);

const CLIENTS = {
  // crop: recorte do emblema no arquivo original; inner: tamanho do emblema dentro do selo; bg: fundo do selo
  climatiza: { src: 'climatiza.webp', crop: { left: 585, top: 0, width: 610, height: 655 }, inner: 104, bg: '#1b1b1b' },
  'marcas-autoral': { src: 'marcas-autoral.png', crop: { left: 250, top: 230, width: 500, height: 540 }, inner: 112, bg: '#eceff6' },
  plantax: { src: 'plantax.webp', crop: { left: 690, top: 305, width: 632, height: 632 }, inner: AVATAR, bg: '#0a1a5c' },
  atlas: { src: 'atlas.png', crop: null, inner: 150, bg: '#ffffff' },
};

mkdirSync(`${OUT}/clientes`, { recursive: true });
for (const [name, { src, crop, inner, bg }] of Object.entries(CLIENTS)) {
  let img = sharp(`design/clientes/${src}`);
  if (crop) img = img.extract(crop);
  const emblem = await img.resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: AVATAR, height: AVATAR, channels: 4, background: bg } })
    .composite([{ input: emblem, gravity: 'center' }, { input: circleMask, blend: 'dest-in' }])
    .webp({ quality: QUALITY })
    .toFile(`${OUT}/clientes/${name}.webp`);
}

console.log('Imagens geradas em', OUT);
