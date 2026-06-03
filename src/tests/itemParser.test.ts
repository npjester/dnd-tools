import { describe, expect, it } from 'vitest';
import { parseImportText, parseLine, parsePrice, parseRarity } from '../services/magicShop/itemParser';

describe('parsePrice', () => {
  it('parses bare gp values', () => {
    expect(parsePrice('7000gp')).toBe(7000);
    expect(parsePrice('500 gp')).toBe(500);
    expect(parsePrice('7000 gold')).toBe(7000);
  });

  it('parses values with thousands-separator commas', () => {
    expect(parsePrice('7,000gp')).toBe(7000);
    expect(parsePrice('1,500 gp')).toBe(1500);
  });

  it('parses bare numbers as gp', () => {
    expect(parsePrice('100')).toBe(100);
  });

  it('parses silver pieces (sp → gp / 10)', () => {
    expect(parsePrice('100sp')).toBeCloseTo(10, 5);
    expect(parsePrice('50 sp')).toBeCloseTo(5, 5);
  });

  it('parses copper pieces (cp → gp / 100)', () => {
    expect(parsePrice('100cp')).toBeCloseTo(1, 5);
    expect(parsePrice('50 cp')).toBeCloseTo(0.5, 5);
  });

  it('returns null for unparseable input', () => {
    expect(parsePrice('unknown')).toBeNull();
    expect(parsePrice('free')).toBeNull();
    expect(parsePrice('')).toBeNull();
  });
});

describe('parseRarity', () => {
  it('accepts all valid rarities case-insensitively', () => {
    expect(parseRarity('common')).toBe('common');
    expect(parseRarity('Uncommon')).toBe('uncommon');
    expect(parseRarity('RARE')).toBe('rare');
    expect(parseRarity('Very Rare')).toBe('very rare');
    expect(parseRarity('legendary')).toBe('legendary');
    expect(parseRarity('artifact')).toBe('artifact');
    expect(parseRarity('varies')).toBe('varies');
  });

  it('returns null for unrecognised rarities', () => {
    expect(parseRarity('epic')).toBeNull();
    expect(parseRarity('super rare')).toBeNull();
    expect(parseRarity('')).toBeNull();
  });
});

describe('parseLine', () => {
  it('parses a complete valid line', () => {
    const result = parseLine("Bob's Big Sword, Rare, 7000gp, Bob's Really Big Sword +1 Attack", 1);
    expect(result).not.toBeNull();
    expect(result!.errors).toHaveLength(0);
    expect(result!.parsed.name).toBe("Bob's Big Sword");
    expect(result!.parsed.rarity).toBe('rare');
    expect(result!.parsed.valueGp).toBe(7000);
    expect(result!.parsed.description).toBe("Bob's Really Big Sword +1 Attack");
  });

  it('returns null for blank lines', () => {
    expect(parseLine('', 1)).toBeNull();
    expect(parseLine('   ', 1)).toBeNull();
  });

  it('returns null for comment lines starting with #', () => {
    expect(parseLine('# This is a comment', 1)).toBeNull();
  });

  it('supports double-quoted fields with commas inside', () => {
    const result = parseLine('"Smith, Wesson Blade", Rare, 5000gp, A fancy sword', 1);
    expect(result).not.toBeNull();
    expect(result!.parsed.name).toBe('Smith, Wesson Blade');
    expect(result!.parsed.rarity).toBe('rare');
    expect(result!.parsed.valueGp).toBe(5000);
  });

  it('uses "" inside quoted fields as escaped double-quote', () => {
    const result = parseLine('"A ""Legendary"" Sword", Rare, 1000gp, desc', 1);
    expect(result!.parsed.name).toBe('A "Legendary" Sword');
  });

  it('warns and defaults rarity to "varies" for unrecognised rarity', () => {
    const result = parseLine('Sword of Epic, Epic, 9999gp, Desc', 1);
    expect(result).not.toBeNull();
    expect(result!.parsed.rarity).toBe('varies');
    expect(result!.warnings.some((w) => w.includes('Unrecognised rarity'))).toBe(true);
    expect(result!.errors).toHaveLength(0);
  });

  it('warns about missing rarity and defaults to "varies"', () => {
    const result = parseLine('Magic Ring, , 500gp, A ring', 1);
    expect(result!.parsed.rarity).toBe('varies');
    expect(result!.warnings.some((w) => w.includes('Rarity not specified'))).toBe(true);
  });

  it('warns and omits price for malformed price strings', () => {
    const result = parseLine('Sword, Rare, lots, A sword', 1);
    expect(result).not.toBeNull();
    expect(result!.parsed.valueGp).toBeUndefined();
    expect(result!.warnings.some((w) => w.includes('Could not parse price'))).toBe(true);
  });

  it('warns when price is missing', () => {
    const result = parseLine('Ring, Common, , Magic ring', 1);
    expect(result!.parsed.valueGp).toBeUndefined();
    expect(result!.warnings.some((w) => w.includes('Price not specified'))).toBe(true);
  });

  it('produces an error when name is missing', () => {
    const result = parseLine(', Rare, 500gp, A nameless thing', 1);
    expect(result).not.toBeNull();
    expect(result!.errors.some((e) => e.includes('name is required'))).toBe(true);
  });

  it('sets defaults: type=wondrous item, source=CUSTOM, tags=[]', () => {
    const result = parseLine('Orb, Rare, 1000gp, An orb', 1);
    expect(result!.parsed.type).toBe('wondrous item');
    expect(result!.parsed.source).toBe('CUSTOM');
    expect(result!.parsed.tags).toEqual([]);
  });

  it('preserves commas inside description (no fourth-field splitting)', () => {
    const result = parseLine('Sword, Rare, 1000gp, Deals damage to Cats, Dogs, and Birds', 1);
    expect(result!.parsed.description).toBe('Deals damage to Cats, Dogs, and Birds');
  });
});

describe('parseImportText', () => {
  it('parses multiple lines and skips blanks/comments', () => {
    const text = `
# Comment
Item One, Common, 50gp, A common thing
Item Two, Rare, 500gp, A rare thing

Item Three, Legendary, 50000gp, A legendary thing
    `;
    const results = parseImportText(text);
    expect(results).toHaveLength(3);
    expect(results[0].parsed.name).toBe('Item One');
    expect(results[1].parsed.name).toBe('Item Two');
    expect(results[2].parsed.name).toBe('Item Three');
  });

  it('returns line numbers matching original input', () => {
    const text = 'Item A, Common, 50gp, Desc\n\nItem B, Rare, 500gp, Desc';
    const results = parseImportText(text);
    expect(results[0].lineNumber).toBe(1);
    expect(results[1].lineNumber).toBe(3);
  });
});
