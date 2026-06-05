# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a client-side web application for Dungeons & Dragons tools built with React, TypeScript, Vite, and Material UI. It provides several utilities for D&D game masters and players:

1. **Attack Calculator** - Simulate horde attacks against targets
2. **Legendary Actions** - Manage legendary actions for creatures
3. **Save Calculator** - Calculate saving throw outcomes
4. **Magic Item Shop Generator** - Create and manage magic item inventories with complex pricing rules

## Key Features

The Magic Item Shop Generator is the most complex feature, offering:
- Campaign → Town → Shop hierarchy management 
- Custom item library with bulk import capabilities
- Complex pricing override system with global, town, and shop levels
- Shop profile presets (Poor Village, Trade Town, Arcane Emporium) with different stock ranges and rarity weights
- Inventory generation with seeded or random modes
- Share functionality to publish snapshots for others to view

## Tech Stack

- React 19 with TypeScript
- Vite build system
- Material UI v6 (dark theme)
- React Router v7 for routing
- Vitest + Testing Library for unit testing

## Architecture Overview

The application follows a structured architecture with several key layers:

1. **Pages** (`src/pages/`) - Top-level route components that define the UI structure
2. **Components** (`src/components/`) - Reusable UI components
3. **Services** (`src/services/magicShop/`) - Business logic for magic shop functionality:
   - Storage: Handles local persistence and state management 
   - Generator: Inventory generation algorithms with pricing rules
   - Share: API interaction for sharing snapshots
   - Item parser: Parses bulk item imports
   - Normalizer: Processes raw items into normalized MagicItems
4. **Types** (`src/types/magicShop.ts`) - Strongly typed interfaces defining the data structures
5. **Data** (`src/data/magic-items.json`) - Built-in magic items database

## Key Concepts

### State Management
The app uses a complex nested state structure with:
- User level (global pricing rules)
- Campaign level (organizational hierarchy)
- Town level (pricing rules and scope)
- Shop level (generation rules, inventory, pricing rules)

### Pricing System
Pricing follows a hierarchical override system where:
1. Global rules apply to all items
2. Town rules override global for town-specific adjustments
3. Shop rules override both for shop-specific adjustments

Rules can be applied based on item properties: rarity, type, tag, or specific item ID.

### Item Import/Export
Users can import custom items in bulk using a CSV-like format with:
- Name, Rarity, Price, Description fields
- Support for quoted fields containing commas
- Automatic parsing and normalization of item data

### Share Functionality
Snapshots can be published to a temporary server (via `npm run share:server`) that allows others to view the shop state without importing local JSON. The sharing system uses unique identifiers and handles loading errors gracefully.

## Development Commands

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

# Run tests in watch mode
npm run test:watch
```

## File Structure Notes

- Magic shop state is persisted to localStorage with key `dnd-tools.magic-shop.state`
- The share server is a simple Node.js server that handles in-memory snapshot storage
- Routing is handled via React Router, with specific paths for shared snapshots and hierarchical navigation
- Data normalization happens at the service layer to ensure consistent item representation