import type { MagicItem } from '../types/magicShop';
import { normalizeMagicItems } from '../services/magicShop/normalize';

export function makeCustomItem(
  raw: Parameters<typeof normalizeMagicItems>[0][0],
): MagicItem {
  const [normalized] = normalizeMagicItems([raw]);
  return {
    ...normalized,
    metadata: { sourceName: normalized.source, importedFrom: 'manual' },
  };
}