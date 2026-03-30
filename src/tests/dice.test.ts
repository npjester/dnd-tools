import { describe, it, expect, vi, afterEach } from 'vitest';
import { rollDie, rollDice, calculateDamage, simulateAttack, formatDice } from '../utils/dice';

describe('rollDie', () => {
  it('returns a value between 1 and the number of sides (inclusive)', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDie(6);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  it('works for a d20', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollDie(20);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(20);
    }
  });
});

describe('rollDice', () => {
  it('returns the correct number of individual rolls', () => {
    const { rolls } = rollDice({ count: 3, sides: 6, modifier: 0 });
    expect(rolls).toHaveLength(3);
  });

  it('applies modifier correctly', () => {
    // Mock Math.random to always return 0.5 → floor(0.5 * 6) + 1 = 4 per die → 2 dice = 8, + 3 modifier = 11    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { total } = rollDice({ count: 2, sides: 6, modifier: 3 });
    expect(total).toBe(11);
    vi.restoreAllMocks();
  });

  it('handles negative modifiers', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    // 0 * 6 = 0, floor = 0, +1 = 1 per die → 1 die = 1, - 2 modifier = -1
    const { total } = rollDice({ count: 1, sides: 6, modifier: -2 });
    expect(total).toBe(-1);
    vi.restoreAllMocks();
  });
});

describe('calculateDamage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('doubles dice count on critical hit', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const normal = rollDice({ count: 1, sides: 6, modifier: 0 });
    const crit = calculateDamage({ count: 1, sides: 6, modifier: 0 }, true);
    // Normal: 1 die → [4], Crit: 2 dice → [4, 4] = 8
    expect(crit.rolls).toHaveLength(2);
    expect(crit.total).toBe(normal.total * 2);
  });

  it('does not double dice on non-critical', () => {
    const result = calculateDamage({ count: 1, sides: 6, modifier: 0 }, false);
    expect(result.rolls).toHaveLength(1);
  });
});

describe('simulateAttack', () => {
  afterEach(() => vi.restoreAllMocks());

  it('registers a hit when d20 + bonus >= AC', () => {
    // d20 rolls 15, bonus 4, total 19 vs AC 15 → hit
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(14 / 20) // d20 = 15
      .mockReturnValue(0.5); // damage rolls
    const result = simulateAttack(4, { count: 1, sides: 6, modifier: 2 }, 15);
    expect(result.d20Roll).toBe(15);
    expect(result.total).toBe(19);
    expect(result.hit).toBe(true);
  });

  it('registers a miss when d20 + bonus < AC', () => {
    // d20 rolls 5, bonus 2, total 7 vs AC 15 → miss
    vi.spyOn(Math, 'random').mockReturnValueOnce(4 / 20); // d20 = 5
    const result = simulateAttack(2, { count: 1, sides: 6, modifier: 0 }, 15);
    expect(result.hit).toBe(false);
    expect(result.damage).toBe(0);
  });

  it('always hits on natural 20 (critical)', () => {
    // d20 = 20 (natural 20) → always hit regardless of AC
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(19 / 20) // d20 = 20
      .mockReturnValue(0);
    const result = simulateAttack(-5, { count: 1, sides: 6, modifier: 0 }, 30);
    expect(result.d20Roll).toBe(20);
    expect(result.criticalHit).toBe(true);
    expect(result.hit).toBe(true);
  });

  it('always misses on natural 1', () => {
    // d20 = 1 (critical miss) → always miss
    vi.spyOn(Math, 'random').mockReturnValueOnce(0); // d20 = 1
    const result = simulateAttack(20, { count: 1, sides: 6, modifier: 0 }, 1);
    expect(result.d20Roll).toBe(1);
    expect(result.hit).toBe(false);
  });
});

describe('formatDice', () => {
  it('formats a basic dice roll with no modifier', () => {
    expect(formatDice({ count: 1, sides: 6, modifier: 0 })).toBe('1d6');
  });

  it('formats a dice roll with positive modifier', () => {
    expect(formatDice({ count: 2, sides: 8, modifier: 3 })).toBe('2d8+3');
  });

  it('formats a dice roll with negative modifier', () => {
    expect(formatDice({ count: 1, sides: 4, modifier: -1 })).toBe('1d4-1');
  });
});
