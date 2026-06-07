export type MagicRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very rare'
  | 'legendary'
  | 'artifact'
  | 'varies';

export interface RawMagicItem {
  name: string;
  rarity?: string;
  type?: string;
  source?: string;
  description?: string;
  valueCp?: number;
  valueGp?: number;
  tags?: string[];
}

export interface MagicItem {
  id: string;
  name: string;
  rarity: MagicRarity;
  type: string;
  source: string;
  basePriceGp: number;
  description: string;
  tags: string[];
  metadata: {
    sourceName: string;
    importedFrom: '5etools' | 'bis-backend' | 'manual';
  };
}

export type PriceRuleAction = 'set' | 'multiplier' | 'none';
export type PriceScope = 'global' | 'town' | 'shop' | 'custom';

export interface PriceOverrideRule {
  id: string;
  label: string;
  action: PriceRuleAction;
  value?: number;
  itemId?: string;
  rarity?: MagicRarity;
  itemType?: string;
  tag?: string;
}

export interface PricingPolicy {
  rules: PriceOverrideRule[];
}

export interface UserNode {
  id: string;
  name: string;
  globalPricing: PricingPolicy;
}

export interface CampaignNode {
  id: string;
  userId: string;
  name: string;
}

export interface TownNode {
  id: string;
  campaignId: string;
  name: string;
  pricing: PricingPolicy;
}

export type ShopProfileId = 'poor_village' | 'trade_town' | 'arcane_emporium';

export interface ShopGenerationRules {
  stockCount: number;
  allowedRarities: MagicRarity[];
  itemTypes: string[];
  tags: string[];
  sources: string[];
  seededMode: boolean;
  seed: string;
}

export interface ShopNode {
  id: string;
  townId: string;
  name: string;
  profileId: ShopProfileId;
  pricing: PricingPolicy;
  generationRules: ShopGenerationRules;
  inventory: GeneratedInventoryEntry[];
}

export interface AppliedPriceOverride {
  scope: PriceScope;
  ruleId: string;
  action: PriceRuleAction;
  value?: number;
  label: string;
}

export interface GeneratedInventoryEntry {
  itemId: string;
  itemName: string;
  rarity: MagicRarity;
  type: string;
  quantity: number;
  baseUnitPriceGp: number;
  effectiveUnitPriceGp: number;
  totalPriceGp: number;
  priceSource: 'base' | PriceScope;
  appliedOverrides: AppliedPriceOverride[];
}

export interface EffectivePriceResult {
  effectiveUnitPriceGp: number;
  priceSource: 'base' | PriceScope;
  appliedOverrides: AppliedPriceOverride[];
}

export interface GenerationRequest {
  items: MagicItem[];
  globalPricing: PricingPolicy;
  townPricing: PricingPolicy;
  shopPricing: PricingPolicy;
  shopProfileId: ShopProfileId;
  rules: ShopGenerationRules;
}

export interface MagicShopState {
  version: number;
  user: UserNode;
  campaigns: CampaignNode[];
  towns: TownNode[];
  shops: ShopNode[];
  customItems: MagicItem[];
  selectedCampaignId: string | null;
  selectedTownId: string | null;
  selectedShopId: string | null;
}
