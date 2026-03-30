import type { DiceRoll, IndividualAttackRoll } from '../types';

/**
 * Roll a single die with the given number of sides.
 */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll multiple dice and return the sum plus the modifier.
 */
export function rollDice(diceRoll: DiceRoll): { total: number; rolls: number[] } {
  const rolls: number[] = [];
  for (let i = 0; i < diceRoll.count; i++) {
    rolls.push(rollDie(diceRoll.sides));
  }
  const total = rolls.reduce((sum, r) => sum + r, 0) + diceRoll.modifier;
  return { total, rolls };
}

/**
 * Calculate damage for an attack. On a critical hit, dice are rolled twice (doubled).
 */
export function calculateDamage(
  diceRoll: DiceRoll,
  isCritical: boolean,
): { total: number; rolls: number[] } {
  const effectiveDice: DiceRoll = isCritical
    ? { ...diceRoll, count: diceRoll.count * 2 }
    : diceRoll;
  return rollDice(effectiveDice);
}

/**
 * Simulate a single attack roll against a given armor class.
 */
export function simulateAttack(
  attackBonus: number,
  damage: DiceRoll,
  armorClass: number,
): IndividualAttackRoll {
  const d20Roll = rollDie(20);
  const total = d20Roll + attackBonus;
  const criticalHit = d20Roll === 20;
  const criticalMiss = d20Roll === 1;
  const hit = !criticalMiss && (criticalHit || total >= armorClass);

  let damageRolls: number[] = [];
  let damageTotal = 0;

  if (hit) {
    const result = calculateDamage(damage, criticalHit);
    damageTotal = Math.max(1, result.total);
    damageRolls = result.rolls;
  }

  return {
    d20Roll,
    attackBonus,
    total,
    hit,
    criticalHit,
    damage: damageTotal,
    damageRolls,
  };
}

/**
 * Format a dice roll expression as a human-readable string, e.g. "1d6+2".
 */
export function formatDice(diceRoll: DiceRoll): string {
  const base = `${diceRoll.count}d${diceRoll.sides}`;
  if (diceRoll.modifier === 0) return base;
  if (diceRoll.modifier > 0) return `${base}+${diceRoll.modifier}`;
  return `${base}${diceRoll.modifier}`;
}
