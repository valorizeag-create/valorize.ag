import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, statSync } from 'node:fs';
import sharp from 'sharp';

const FILES = ['logo-h-dark.webp', 'mark-dark.webp', 'seal-dark.webp', 'ribbon-loop.webp', 'ribbon-bottom.webp', 'og-image.png'];

test('assets otimizados existem', () => {
  for (const f of FILES) assert.ok(existsSync(`assets/${f}`), f);
});

test('assets somam no máximo 500 KB', () => {
  const total = readdirSync('assets').reduce((s, f) => s + statSync(`assets/${f}`).size, 0);
  assert.ok(total <= 500 * 1024, `total ${total}`);
});

test('og-image tem 1200x630', async () => {
  const { width, height } = await sharp('assets/og-image.png').metadata();
  assert.deepEqual([width, height], [1200, 630]);
});
