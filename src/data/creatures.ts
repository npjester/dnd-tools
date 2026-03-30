import type { CreaturePreset } from '../types';

export const CREATURE_PRESETS: CreaturePreset[] = [
  {
    name: 'Skeleton',
    attacks: [
      {
        name: 'Shortbow',
        attackBonus: 4,
        damage: { count: 1, sides: 6, modifier: 2 },
        damageType: 'piercing',
      },
      {
        name: 'Shortsword',
        attackBonus: 4,
        damage: { count: 1, sides: 6, modifier: 2 },
        damageType: 'piercing',
      },
    ],
  },
  {
    name: 'Goblin',
    attacks: [
      {
        name: 'Scimitar',
        attackBonus: 4,
        damage: { count: 1, sides: 6, modifier: 2 },
        damageType: 'slashing',
      },
      {
        name: 'Shortbow',
        attackBonus: 4,
        damage: { count: 1, sides: 6, modifier: 2 },
        damageType: 'piercing',
      },
    ],
  },
  {
    name: 'Zombie',
    attacks: [
      {
        name: 'Slam',
        attackBonus: 3,
        damage: { count: 1, sides: 6, modifier: 1 },
        damageType: 'bludgeoning',
      },
    ],
  },
  {
    name: 'Orc',
    attacks: [
      {
        name: 'Greataxe',
        attackBonus: 5,
        damage: { count: 1, sides: 12, modifier: 3 },
        damageType: 'slashing',
      },
      {
        name: 'Javelin',
        attackBonus: 5,
        damage: { count: 1, sides: 6, modifier: 3 },
        damageType: 'piercing',
      },
    ],
  },
  {
    name: 'Wolf',
    attacks: [
      {
        name: 'Bite',
        attackBonus: 4,
        damage: { count: 2, sides: 4, modifier: 2 },
        damageType: 'piercing',
      },
    ],
  },
  {
    name: 'Custom',
    attacks: [
      {
        name: 'Attack',
        attackBonus: 0,
        damage: { count: 1, sides: 6, modifier: 0 },
        damageType: 'slashing',
      },
    ],
  },
];

export const DAMAGE_TYPES = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
] as const;
