import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Hostinger standalone photos', () => {
  it.each([
    '3dtech-logo-new.png.asset.json', 'hero-desktop.png.asset.json',
    'hero-mobile.png.asset.json', 'custom-order-background.jpg.asset.json',
    'custom-keychain.jpg.asset.json', 'custom-cabletag.jpg.asset.json',
    'custom-articulated.jpg.asset.json', 'custom-nameplate.jpg.asset.json',
  ])('ships the actual photo bytes for %s without the Lovable proxy', name => {
    const pointer = JSON.parse(readFileSync(resolve('src/assets', name), 'utf8'));
    const file = resolve('public', pointer.url.slice(1));
    expect(existsSync(file)).toBe(true);
    const bytes = readFileSync(file);
    expect(bytes.length).toBeGreaterThan(1000);
    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });
});