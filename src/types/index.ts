export interface DiceRoll {
  count: number;
  sides: number;
  modifier: number;
}

export interface AttackProfile {
  name: string;
  attackBonus: number;
  damage: DiceRoll;
  damageType: string;
}

export interface CreaturePreset {
  name: string;
  attacks: AttackProfile[];
}

export interface IndividualAttackRoll {
  d20Roll: number;
  attackBonus: number;
  total: number;
  hit: boolean;
  criticalHit: boolean;
  damage: number;
  damageRolls: number[];
}

export interface AttackResults {
  totalCreatures: number;
  attacksPerCreature: number;
  totalAttacks: number;
  hits: number;
  misses: number;
  criticalHits: number;
  totalDamage: number;
  averageDamagePerHit: number;
  rolls: IndividualAttackRoll[];
}

export interface IndividualSaveRoll {
  d20Roll: number;
  saveBonus: number;
  total: number;
  success: boolean;
  naturalTwenty: boolean;
  naturalOne: boolean;
}

export interface SaveResults {
  totalCreatures: number;
  saveDC: number;
  saveBonus: number;
  successes: number;
  failures: number;
  naturalTwenties: number;
  naturalOnes: number;
  rolls: IndividualSaveRoll[];
}

