# D&D Tools

A collection of client-side web tools for Dungeons & Dragons, built with React, TypeScript, Vite, and Material UI.

## Features

### ⚔️ Attack Calculator
Simulate a horde of identical creatures making attacks against a single target. Configure:
- **Creature preset** (Skeleton, Goblin, Zombie, Orc, Wolf, or Custom) and which attack they use
- **Attack stats** – attack bonus, damage dice (e.g. `1d6+2`), and damage type
- **Simulation parameters** – number of creatures (1–100), attacks per creature (1–5), and target Armor Class (1–30)

Results include total hits, misses, critical hits, hit rate %, total damage, average damage per hit, and a colour-coded individual-roll breakdown.

### 🏪 Magic Item Shop Sharing
- Publish a full in-memory snapshot of your current magic shop state
- Share a generated URL so other browsers can view that snapshot without importing local JSON
- Optionally import a viewed shared snapshot into your own local browser state

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# In another terminal, run the temporary in-memory share server
npm run share:server

# Build for production
npm run build

# Run unit tests
npm test
```

## Deployment to Vercel

When deploying to Vercel, note that the share server runs as a separate Node.js process. To deploy properly with Vercel, you have two options:
1. Deploy with a separate backend service that runs the share server on port 8787
2. Modify your deployment configuration to run both the frontend and backend together

The application will automatically proxy requests to `/api/magic-shop/shares` to the share server running on port 8787, so ensure this is available in your deployment environment. For Vercel deployments, you may need to use a custom serverless function or separate hosting for the share functionality to work properly.
