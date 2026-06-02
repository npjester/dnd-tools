import type {
  EffectivePriceResult,
  GenerationRequest,
  GeneratedInventoryEntry,
  MagicItem,
  MagicRarity,
  PriceOverrideRule,
  PriceScope,
  PricingPolicy,
  ShopProfileId,
} from '../../types/magicShop';

interface ShopProfile {
  id: ShopProfileId;
  label: string;
  stockRange: [number, number];
  rarityWeights: Record<MagicRarity, number>;
}

const DEFAULT_RARITY_WEIGHTS: Record<MagicRarity, number> = {
  common: 8,
  uncommon: 5,
  rare: 2,
  'very rare': 1,
  legendary: 0.15,
  artifact: 0.02,
  varies: 1,
};

export const SHOP_PROFILES: ShopProfile[] = [
  {
    id: 'poor_village',
    label: 'Poor Village Curio Stall',
    stockRange: [4, 8],
    rarityWeights: { ...DEFAULT_RARITY_WEIGHTS, rare: 0.5, 'very rare': 0.05, legendary: 0 },
  },
  {
    id: 'trade_town',
    label: 'Trade Town Magic Broker',
    stockRange: [8, 14],
    rarityWeights: { ...DEFAULT_RARITY_WEIGHTS, rare: 2.5, 'very rare': 0.4 },
  },
  {
    id: 'arcane_emporium',
    label: 'Arcane Emporium',
    stockRange: [12, 20],
    rarityWeights: { ...DEFAULT_RARITY_WEIGHTS, uncommon: 6, rare: 4, 'very rare': 1.5, legendary: 0.5 },
  },
];

const RARITY_SORT_ORDER: Record<MagicRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  'very rare': 3,
  legendary: 4,
  artifact: 5,
  varies: 6,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createRng(seed: string | null): () => number {
  if (!seed) return Math.random;
  return mulberry32(hashSeed(seed));
}

function weightedPick<T>(items: T[], getWeight: (item: T) => number, rng: () => number): T | null {
  const weighted = items.map((item) => ({ item, weight: Math.max(0, getWeight(item)) }));
  const totalWeight = weighted.reduce((sum, x) => sum + x.weight, 0);
  if (totalWeight <= 0 || weighted.length === 0) return null;

  let roll = rng() * totalWeight;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }
  return weighted[weighted.length - 1]?.item ?? null;
}

function ruleMatches(item: MagicItem, rule: PriceOverrideRule): boolean {
  if (rule.itemId && rule.itemId !== item.id) return false;
  if (rule.rarity && rule.rarity !== item.rarity) return false;
  if (rule.itemType && rule.itemType !== item.type) return false;
  if (rule.tag && !item.tags.includes(rule.tag)) return false;
  return true;
}

export function calculateEffectivePrice(
  item: MagicItem,
  globalPricing: PricingPolicy,
  townPricing: PricingPolicy,
  shopPricing: PricingPolicy,
): EffectivePriceResult {
  let current = item.basePriceGp;
  let priceSource: EffectivePriceResult['priceSource'] = 'base';
  const appliedOverrides: EffectivePriceResult['appliedOverrides'] = [];
  let stopAtScope: PriceScope | null = null;

  const scopes: Array<{ scope: PriceScope; policy: PricingPolicy }> = [
    { scope: 'global', policy: globalPricing },
    { scope: 'town', policy: townPricing },
    { scope: 'shop', policy: shopPricing },
  ];

  for (const { scope, policy } of scopes) {
    if (stopAtScope) break;

    for (const rule of policy.rules) {
      if (!ruleMatches(item, rule)) continue;

      if (rule.action === 'none') {
        appliedOverrides.push({
          scope,
          ruleId: rule.id,
          action: rule.action,
          label: rule.label,
        });
        stopAtScope = scope;
        priceSource = scope;
        break;
      }

      if (typeof rule.value !== 'number') continue;

      if (rule.action === 'set') {
        current = Math.max(0, rule.value);
      } else if (rule.action === 'multiplier') {
        current = Math.max(0, current * rule.value);
      }

      priceSource = scope;
      appliedOverrides.push({
        scope,
        ruleId: rule.id,
        action: rule.action,
        value: rule.value,
        label: rule.label,
      });
    }
  }

  return {
    effectiveUnitPriceGp: Math.round(current * 100) / 100,
    priceSource,
    appliedOverrides,
  };
}

export function filterEligibleItems(items: MagicItem[], request: GenerationRequest): MagicItem[] {
  const { rules } = request;
  return items.filter((item) => {
    if (rules.allowedRarities.length > 0 && !rules.allowedRarities.includes(item.rarity)) {
      return false;
    }
    if (rules.itemTypes.length > 0 && !rules.itemTypes.includes(item.type)) {
      return false;
    }
    if (rules.sources.length > 0 && !rules.sources.includes(item.source)) {
      return false;
    }
    if (rules.tags.length > 0 && !rules.tags.every((tag) => item.tags.includes(tag))) {
      return false;
    }
    return true;
  });
}

function getProfile(profileId: ShopProfileId): ShopProfile {
  return SHOP_PROFILES.find((profile) => profile.id === profileId) ?? SHOP_PROFILES[1];
}

function getQuantityForRarity(rarity: MagicRarity, rng: () => number): number {
  switch (rarity) {
    case 'common':
      return 1 + Math.floor(rng() * 4);
    case 'uncommon':
      return 1 + Math.floor(rng() * 3);
    case 'rare':
      return 1 + Math.floor(rng() * 2);
    default:
      return 1;
  }
}

export function generateShopInventory(request: GenerationRequest): GeneratedInventoryEntry[] {
  const rng = createRng(request.rules.seededMode ? request.rules.seed : null);
  const profile = getProfile(request.shopProfileId);
  const eligible = filterEligibleItems(request.items, request);

  if (eligible.length === 0) return [];

  const [minStock, maxStock] = profile.stockRange;
  const requested = clamp(request.rules.stockCount, minStock, maxStock * 3);
  const targetStock = requested > 0 ? requested : minStock + Math.floor(rng() * (maxStock - minStock + 1));

  const picks = new Set<string>();
  const inventory: GeneratedInventoryEntry[] = [];

  let safety = 0;
  while (inventory.length < targetStock && safety < 2000) {
    // Prevents infinite loops when selection constraints are strict and repeated picks are skipped.
    safety += 1;
    const picked = weightedPick(eligible, (item) => profile.rarityWeights[item.rarity] ?? 1, rng);
    if (!picked) break;
    if (picks.has(picked.id)) continue;
    picks.add(picked.id);

    const price = calculateEffectivePrice(
      picked,
      request.globalPricing,
      request.townPricing,
      request.shopPricing,
    );

    const quantity = getQuantityForRarity(picked.rarity, rng);
    inventory.push({
      itemId: picked.id,
      itemName: picked.name,
      rarity: picked.rarity,
      type: picked.type,
      quantity,
      baseUnitPriceGp: picked.basePriceGp,
      effectiveUnitPriceGp: price.effectiveUnitPriceGp,
      totalPriceGp: Math.round(quantity * price.effectiveUnitPriceGp * 100) / 100,
      priceSource: price.priceSource,
      appliedOverrides: price.appliedOverrides,
    });

    if (picks.size >= eligible.length) break;
  }

  return inventory.sort((a, b) => {
    const rarityDelta = RARITY_SORT_ORDER[a.rarity] - RARITY_SORT_ORDER[b.rarity];
    if (rarityDelta !== 0) return rarityDelta;

    const priceDelta = a.effectiveUnitPriceGp - b.effectiveUnitPriceGp;
    if (priceDelta !== 0) return priceDelta;

    return a.itemName.localeCompare(b.itemName);
  });
}
