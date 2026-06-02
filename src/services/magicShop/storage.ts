import type {
  MagicShopState,
  PricingPolicy,
  ShopGenerationRules,
  ShopNode,
  ShopProfileId,
} from '../../types/magicShop';

export const MAGIC_SHOP_STORAGE_KEY = 'dnd-tools.magic-shop.state';
export const MAGIC_SHOP_SCHEMA_VERSION = 1;

function defaultPricingPolicy(): PricingPolicy {
  return { rules: [] };
}

function defaultGenerationRules(seed = ''): ShopGenerationRules {
  return {
    stockCount: 10,
    allowedRarities: ['common', 'uncommon', 'rare'],
    itemTypes: [],
    tags: [],
    sources: [],
    seededMode: true,
    seed,
  };
}

export function createDefaultShopState(): MagicShopState {
  const defaultCampaignId = 'camp-default';
  const defaultTownId = 'town-default';
  const defaultShopId = 'shop-default';

  const defaultShop: ShopNode = {
    id: defaultShopId,
    townId: defaultTownId,
    name: 'General Arcanum',
    profileId: 'trade_town',
    pricing: defaultPricingPolicy(),
    generationRules: defaultGenerationRules('general-arcanum-seed'),
    inventory: [],
  };

  return {
    version: MAGIC_SHOP_SCHEMA_VERSION,
    user: {
      id: 'user-default',
      name: 'Local User',
      globalPricing: defaultPricingPolicy(),
    },
    campaigns: [{ id: defaultCampaignId, userId: 'user-default', name: 'Default Campaign' }],
    towns: [{ id: defaultTownId, campaignId: defaultCampaignId, name: 'Starter Town', pricing: defaultPricingPolicy() }],
    shops: [defaultShop],
    selectedCampaignId: defaultCampaignId,
    selectedTownId: defaultTownId,
    selectedShopId: defaultShopId,
  };
}

function withDefaults(input: Partial<MagicShopState>): MagicShopState {
  const defaults = createDefaultShopState();
  return {
    ...defaults,
    ...input,
    version: MAGIC_SHOP_SCHEMA_VERSION,
  };
}

export function loadMagicShopState(): MagicShopState {
  if (typeof window === 'undefined') return createDefaultShopState();

  const raw = window.localStorage.getItem(MAGIC_SHOP_STORAGE_KEY);
  if (!raw) return createDefaultShopState();

  try {
    const parsed = JSON.parse(raw) as Partial<MagicShopState>;
    return withDefaults(parsed);
  } catch {
    return createDefaultShopState();
  }
}

export function saveMagicShopState(state: MagicShopState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    MAGIC_SHOP_STORAGE_KEY,
    JSON.stringify({ ...state, version: MAGIC_SHOP_SCHEMA_VERSION }),
  );
}

export function exportMagicShopState(state: MagicShopState): string {
  return JSON.stringify({ ...state, version: MAGIC_SHOP_SCHEMA_VERSION }, null, 2);
}

function validateShopProfile(profileId: string | undefined): ShopProfileId {
  if (profileId === 'poor_village' || profileId === 'trade_town' || profileId === 'arcane_emporium') {
    return profileId;
  }
  return 'trade_town';
}

export function importMagicShopState(serialized: string): MagicShopState {
  const parsed = JSON.parse(serialized) as Partial<MagicShopState>;
  const normalized = withDefaults(parsed);
  normalized.shops = normalized.shops.map((shop) => ({
    ...shop,
    profileId: validateShopProfile(shop.profileId),
    pricing: shop.pricing ?? defaultPricingPolicy(),
    generationRules: {
      ...defaultGenerationRules(),
      ...(shop.generationRules ?? {}),
      seed: shop.generationRules?.seed ?? '',
    },
    inventory: shop.inventory ?? [],
  }));

  normalized.towns = normalized.towns.map((town) => ({
    ...town,
    pricing: town.pricing ?? defaultPricingPolicy(),
  }));

  normalized.user = {
    ...normalized.user,
    globalPricing: normalized.user.globalPricing ?? defaultPricingPolicy(),
  };

  return normalized;
}
