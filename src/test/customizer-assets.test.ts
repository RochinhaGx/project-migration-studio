import { describe, expect, it } from 'vitest';
import { CUSTOM_MODELS, customizerAssetUrl } from '@/lib/customizer';

describe('Customizer asset metadata', () => {
  it.each([undefined, null, {}, { url: undefined }, { url: null }, { url: 42 }, { url: '' }, { url: '  ' }, 'not metadata'])('uses the placeholder for missing or invalid metadata: %j', metadata => {
    expect(customizerAssetUrl(metadata)).toBe('/produto-sem-foto.svg');
  });

  it('uses a valid pointer URL', () => {
    expect(customizerAssetUrl({ url: ' /__l5e/assets-v1/example/keychain.png ' })).toBe('/__l5e/assets-v1/example/keychain.png');
  });

  it('resolves all four current model photos from the optional pointer imports', () => {
    expect(CUSTOM_MODELS).toHaveLength(4);
    for (const model of CUSTOM_MODELS) {
      expect(model.image).toMatch(/^\/__l5e\/assets-v1\/.+\.png$/);
    }
  });
});