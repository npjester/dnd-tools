import type { MagicItem, MagicRarity, RawMagicItem } from '../../types/magicShop';
import rawMagicItems from '../../data/magic-items.json';

const RARITY_BASELINE_GP: Record<MagicRarity, number> = {
  common: 100,
  uncommon: 500,
  rare: 5000,
  'very rare': 20000,
  legendary: 100000,
  artifact: 250000,
  varies: 250,
};
const COPPER_TO_GOLD_RATIO = 100;

function normalizeRarity(rarity?: string): MagicRarity {
  if (!rarity) return 'varies';
  const normalized = rarity.trim().toLowerCase();
  if (
    normalized === 'common' ||
    normalized === 'uncommon' ||
    normalized === 'rare' ||
    normalized === 'very rare' ||
    normalized === 'legendary' ||
    normalized === 'artifact'
  ) {
    return normalized;
  }
  return 'varies';
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeItem(raw: RawMagicItem): MagicItem {
  const rarity = normalizeRarity(raw.rarity);
  const basePriceGp =
    typeof raw.valueGp === 'number'
      ? raw.valueGp
      : typeof raw.valueCp === 'number'
        ? raw.valueCp / COPPER_TO_GOLD_RATIO
        : RARITY_BASELINE_GP[rarity];

  return {
    id: slugify(raw.name),
    name: raw.name,
    rarity,
    type: raw.type?.trim().toLowerCase() ?? 'wondrous item',
    source: raw.source?.trim().toUpperCase() ?? 'UNKNOWN',
    basePriceGp,
    tags: (raw.tags ?? []).map((tag) => tag.trim().toLowerCase()),
    metadata: {
      sourceName: raw.source?.trim().toUpperCase() ?? 'UNKNOWN',
      importedFrom: '5etools',
    },
  };
}

export function normalizeMagicItems(rawItems: RawMagicItem[]): MagicItem[] {
  return rawItems.map(normalizeItem);
}

export function getNormalizedMagicItems(): MagicItem[] {
  return normalizeMagicItems(rawMagicItems as RawMagicItem[]);
}
