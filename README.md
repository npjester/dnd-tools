# D&D Tools

A collection of client-side web tools for Dungeons & Dragons, built with React, TypeScript, Vite, and Material UI.

## Features

### ⚔️ Attack Calculator
Simulate a horde of identical creatures making attacks against a single target. Configure:
- **Creature preset** (Skeleton, Goblin, Zombie, Orc, Wolf, or Custom) and which attack they use
- **Attack stats** – attack bonus, damage dice (e.g. `1d6+2`), and damage type
- **Simulation parameters** – number of creatures (1–100), attacks per creature (1–5), and target Armor Class (1–30)

Results include total hits, misses, critical hits, hit rate %, total damage, average damage per hit, and a colour-coded individual-roll breakdown.

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build

# Run unit tests
npm test
```

## Tech Stack
- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Material UI v6](https://mui.com/) (dark theme)
- [React Router v7](https://reactrouter.com/)
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
