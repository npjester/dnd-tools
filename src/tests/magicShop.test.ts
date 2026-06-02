import { beforeEach, describe, expect, it } from 'vitest';
import type { GenerationRequest } from '../types/magicShop';

import {
  calculateEffectivePrice,
  generateShopInventory,
} from '../services/magicShop/generator';
import { getNormalizedMagicItems } from '../services/magicShop/normalize';
import {
  createDefaultShopState,
  exportMagicShopState,
  importMagicShopState,
  loadMagicShopState,
  MAGIC_SHOP_STORAGE_KEY,
  saveMagicShopState,
} from '../services/magicShop/storage';

const items = getNormalizedMagicItems();
const potion = items.find((item) => item.name === 'Potion of Healing')!;

describe('magic shop price precedence', () => {
  it('uses nearest scope wins order (global -> town -> shop)', () => {
    const result = calculateEffectivePrice(
      potion,
      {
        rules: [{ id: 'g1', label: 'Global x2', action: 'multiplier', value: 2, rarity: 'common' }],
      },
      {
        rules: [{ id: 't1', label: 'Town set 60', action: 'set', value: 60, itemId: potion.id }],
      },
      {
        rules: [{ id: 's1', label: 'Shop x1.5', action: 'multiplier', value: 1.5, itemType: potion.type }],
      },
    );

    expect(result.effectiveUnitPriceGp).toBe(90);
    expect(result.priceSource).toBe('shop');
    expect(result.appliedOverrides).toHaveLength(3);
  });

  it('supports explicit no-override to stop later scope processing', () => {
    const result = calculateEffectivePrice(
      potion,
      {
        rules: [{ id: 'g1', label: 'Global set', action: 'set', value: 120 }],
      },
      {
        rules: [{ id: 't1', label: 'Town no-override', action: 'none', rarity: 'common' }],
      },
      {
        rules: [{ id: 's1', label: 'Shop set', action: 'set', value: 1 }],
      },
    );

    expect(result.effectiveUnitPriceGp).toBe(120);
    expect(result.priceSource).toBe('town');
    expect(result.appliedOverrides.map((x) => x.ruleId)).toEqual(['g1', 't1']);
  });
});

describe('magic shop generator determinism', () => {
  it('generates repeatable inventory with seeded mode', () => {
    const request: GenerationRequest = {
      items,
      globalPricing: { rules: [] },
      townPricing: { rules: [] },
      shopPricing: { rules: [] },
      shopProfileId: 'trade_town' as const,
      rules: {
        stockCount: 8,
        allowedRarities: ['common', 'uncommon', 'rare'],
        itemTypes: [],
        tags: [],
        sources: ['DMG'],
        seededMode: true,
        seed: 'same-seed',
      },
    };

    const a = generateShopInventory(request);
    const b = generateShopInventory(request);

    expect(a.map((entry) => entry.itemId)).toEqual(b.map((entry) => entry.itemId));
    expect(a.map((entry) => entry.quantity)).toEqual(b.map((entry) => entry.quantity));
  });
});

describe('magic shop storage serialization', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves and loads localStorage state', () => {
    const state = createDefaultShopState();
    state.user.name = 'Tester';
    saveMagicShopState(state);

    const loaded = loadMagicShopState();
    expect(loaded.user.name).toBe('Tester');
  });

  it('exports and imports state payload', () => {
    const state = createDefaultShopState();
    state.campaigns.push({ id: 'camp-2', userId: state.user.id, name: 'Campaign 2' });

    const payload = exportMagicShopState(state);
    const imported = importMagicShopState(payload);

    expect(imported.campaigns.some((campaign) => campaign.id === 'camp-2')).toBe(true);
    expect(window.localStorage.getItem(MAGIC_SHOP_STORAGE_KEY)).toBeNull();
  });
});
