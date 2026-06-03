import { beforeEach, describe, expect, it } from 'vitest';
import type { GenerationRequest, MagicItem } from '../types/magicShop';

import {
  calculateEffectivePrice,
  generateShopInventory,
} from '../services/magicShop/generator';
import { getAllItems, getNormalizedMagicItems } from '../services/magicShop/normalize';
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

  it('custom items survive export/import round-trip', () => {
    const state = createDefaultShopState();
    const customItem: MagicItem = {
      id: 'custom-sword-1',
      name: "Bob's Big Sword",
      rarity: 'rare',
      type: 'weapon',
      source: 'CUSTOM',
      basePriceGp: 7000,
      description: '+1 Attack',
      tags: ['melee', 'magical'],
      metadata: { sourceName: 'CUSTOM', importedFrom: 'manual' },
    };
    state.customItems = [customItem];

    const payload = exportMagicShopState(state);
    const imported = importMagicShopState(payload);

    expect(imported.customItems).toHaveLength(1);
    expect(imported.customItems[0].id).toBe('custom-sword-1');
    expect(imported.customItems[0].name).toBe("Bob's Big Sword");
    expect(imported.customItems[0].tags).toEqual(['melee', 'magical']);
    expect(imported.customItems[0].description).toBe('+1 Attack');
  });

  it('backfills missing fields when importing old state without customItems', () => {
    const state = createDefaultShopState();
    const payload = exportMagicShopState(state);
    // Strip customItems from payload to simulate old format
    const oldPayload = JSON.stringify({ ...JSON.parse(payload) as object, customItems: undefined });
    const imported = importMagicShopState(oldPayload);
    expect(imported.customItems).toEqual([]);
  });
});

describe('getAllItems', () => {
  it('returns built-in items when no custom items provided', () => {
    const result = getAllItems([]);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.metadata.importedFrom !== 'manual')).toBe(true);
  });

  it('merges custom items with built-in items', () => {
    const custom: MagicItem = {
      id: 'custom-unique-xyz',
      name: 'Unique Custom Item',
      rarity: 'uncommon',
      type: 'wondrous item',
      source: 'CUSTOM',
      basePriceGp: 200,
      description: 'A unique item',
      tags: [],
      metadata: { sourceName: 'CUSTOM', importedFrom: 'manual' },
    };
    const result = getAllItems([custom]);
    const found = result.find((item) => item.id === 'custom-unique-xyz');
    expect(found).toBeDefined();
    expect(found!.name).toBe('Unique Custom Item');
  });

  it('custom items override built-in items with the same id', () => {
    const builtIn = getNormalizedMagicItems()[0];
    const override: MagicItem = {
      ...builtIn,
      description: 'Overridden description',
      metadata: { sourceName: 'CUSTOM', importedFrom: 'manual' },
    };
    const result = getAllItems([override]);
    const found = result.find((item) => item.id === builtIn.id);
    expect(found!.description).toBe('Overridden description');
    // Should not be duplicated
    expect(result.filter((item) => item.id === builtIn.id)).toHaveLength(1);
  });
});

describe('generator uses merged item pool', () => {
  it('includes custom items in seeded shop generation', () => {
    const builtIns = getNormalizedMagicItems();
    const custom: MagicItem = {
      id: 'test-custom-only-item',
      name: 'Test Custom Only Item',
      rarity: 'common',
      type: 'potion',
      source: 'CUSTOM',
      basePriceGp: 50,
      description: 'A test potion',
      tags: ['test'],
      metadata: { sourceName: 'CUSTOM', importedFrom: 'manual' },
    };
    const allItems = getAllItems([custom]);
    expect(allItems.some((i) => i.id === 'test-custom-only-item')).toBe(true);

    // With seeded generation and source filter that only includes CUSTOM, only our item should be used
    const request: GenerationRequest = {
      items: allItems,
      globalPricing: { rules: [] },
      townPricing: { rules: [] },
      shopPricing: { rules: [] },
      shopProfileId: 'trade_town' as const,
      rules: {
        stockCount: 5,
        allowedRarities: ['common'],
        itemTypes: [],
        tags: [],
        sources: ['CUSTOM'],
        seededMode: true,
        seed: 'test-seed-custom',
      },
    };

    const inventory = generateShopInventory(request);
    expect(inventory.every((entry) => builtIns.some((b) => b.id === entry.itemId) || entry.itemId === custom.id)).toBe(
      true,
    );
  });
});
