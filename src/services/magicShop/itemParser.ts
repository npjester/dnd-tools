/**
 * Bulk item import parser.
 *
 * Expected line format (one item per line):
 *   Name, Rarity, Price, Description
 *
 * Rules:
 * - Fields may be double-quoted to include commas inside the field.
 * - The Description is everything from the 4th field onward (including any extra commas).
 * - Price may be written as "7000gp", "7,000 gp", "7000", etc.
 * - Rarity is case-insensitive; unrecognised values produce a validation warning and default to "varies".
 */

import type { MagicRarity, RawMagicItem } from '../../types/magicShop';

export interface ParsedItemLine {
  /** 1-based line number in the original input */
  lineNumber: number;
  raw: string;
  parsed: RawMagicItem;
  warnings: string[];
  errors: string[];
}

const VALID_RARITIES: MagicRarity[] = [
  'common',
  'uncommon',
  'rare',
  'very rare',
  'legendary',
  'artifact',
  'varies',
];

/**
 * Minimal CSV-like field splitter that respects double-quoted fields.
 * Splits the line into at most `maxFields` parts; everything from the
 * (maxFields)th comma onwards is kept in the last field verbatim.
 */
function splitLine(line: string, maxFields: number): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // Escaped double-quote inside a quoted field ("" → ")
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',' && fields.length < maxFields - 1) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Parse a price string into a gold-piece number.
 * Accepts: "7000gp", "7,000 gp", "7000 gold", "7000", "500sp" (converted).
 * Returns null if the value cannot be interpreted.
 */
export function parsePrice(raw: string): number | null {
  const str = raw.trim().toLowerCase();

  // Silver pieces (sp): 10 sp = 1 gp
  const spMatch = /^([\d,]+(?:\.\d+)?)\s*sp$/.exec(str);
  if (spMatch) {
    const val = parseFloat(spMatch[1].replace(/,/g, ''));
    return isNaN(val) ? null : Math.round((val / 10) * 100) / 100;
  }

  // Copper pieces (cp): 100 cp = 1 gp
  const cpMatch = /^([\d,]+(?:\.\d+)?)\s*cp$/.exec(str);
  if (cpMatch) {
    const val = parseFloat(cpMatch[1].replace(/,/g, ''));
    return isNaN(val) ? null : Math.round((val / 100) * 100) / 100;
  }

  // Gold pieces (gp) or bare number
  const gpStr = str
    .replace(/\s*gp\s*$/, '')
    .replace(/\s*gold\s*$/, '')
    .replace(/,/g, '')
    .trim();
  const val = parseFloat(gpStr);
  return isNaN(val) ? null : val;
}

/**
 * Normalise a rarity string into a MagicRarity value.
 * Returns `null` if the string is not recognised (caller should warn).
 */
export function parseRarity(raw: string): MagicRarity | null {
  const normalised = raw.trim().toLowerCase() as MagicRarity;
  return VALID_RARITIES.includes(normalised) ? normalised : null;
}

/**
 * Parse a single import line.
 * Returns null for blank lines and comment lines (starting with #).
 */
export function parseLine(line: string, lineNumber: number): ParsedItemLine | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const warnings: string[] = [];
  const errors: string[] = [];

  // Split into [Name, Rarity, Price, Description]
  const fields = splitLine(trimmed, 4);

  const rawName = fields[0] ?? '';
  const rawRarity = fields[1] ?? '';
  const rawPrice = fields[2] ?? '';
  const rawDescription = fields[3] ?? '';

  // Name
  const name = rawName;
  if (!name) {
    errors.push('Item name is required.');
  }

  // Rarity
  let rarity: MagicRarity | undefined;
  if (rawRarity) {
    const parsed = parseRarity(rawRarity);
    if (parsed === null) {
      warnings.push(
        `Unrecognised rarity "${rawRarity}" — defaulting to "varies". Valid values: ${VALID_RARITIES.join(', ')}.`,
      );
      rarity = 'varies';
    } else {
      rarity = parsed;
    }
  } else {
    warnings.push('Rarity not specified — defaulting to "varies".');
    rarity = 'varies';
  }

  // Price
  let valueGp: number | undefined;
  if (rawPrice) {
    const price = parsePrice(rawPrice);
    if (price === null) {
      warnings.push(`Could not parse price "${rawPrice}" — price will use rarity baseline.`);
    } else {
      valueGp = price;
    }
  } else {
    warnings.push('Price not specified — will use rarity baseline.');
  }

  const item: RawMagicItem = {
    name,
    rarity,
    description: rawDescription || undefined,
    valueGp,
    type: 'wondrous item',
    source: 'CUSTOM',
    tags: [],
  };

  return { lineNumber, raw: line, parsed: item, warnings, errors };
}

/**
 * Parse a multi-line import block.
 * Blank lines and lines starting with # are skipped.
 */
export function parseImportText(text: string): ParsedItemLine[] {
  const results: ParsedItemLine[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const result = parseLine(lines[i], i + 1);
    if (result) results.push(result);
  }
  return results;
}
