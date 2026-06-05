import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDefaultShopState } from '../src/services/magicShop/storage';
import { createMinimalShopState, publishMagicShopState, fetchSharedMagicShopState } from '../src/services/magicShop/share';
import type { MagicShopState } from '../src/types/magicShop';

// Mock the fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Magic Shop Sharing', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });

  it('should create a minimal state with inventory when sharing', () => {
    // Create a default state
    const state = createDefaultShopState();
    
    // Add some mock inventory to the default shop
    const shopWithInventory = state.shops[0];
    shopWithInventory.inventory = [
      {
        itemId: 'potion-of-healing',
        itemName: 'Potion of Healing',
        rarity: 'common',
        type: 'potion',
        quantity: 3,
        baseUnitPriceGp: 50,
        effectiveUnitPriceGp: 50,
        totalPriceGp: 150,
        priceSource: 'shop',
        appliedOverrides: [],
      }
    ];
    
    // Update the shop in the state
    state.shops[0] = shopWithInventory;
    
    // Create minimal state
    const minimalState = createMinimalShopState(state);
    
    // Verify the selected shop has inventory
    const selectedShop = minimalState.shops.find(shop => shop.id === minimalState.selectedShopId);
    expect(selectedShop).toBeDefined();
    expect(selectedShop?.inventory).toBeDefined();
    expect(selectedShop?.inventory.length).toBeGreaterThan(0);
    expect(selectedShop?.inventory[0].itemId).toBe('potion-of-healing');
  });

  it('should publish and fetch shared state with inventory', async () => {
    // Create a default state with inventory
    const state = createDefaultShopState();
    
    // Add some mock inventory to the default shop
    const shopWithInventory = state.shops[0];
    shopWithInventory.inventory = [
      {
        itemId: 'potion-of-healing',
        itemName: 'Potion of Healing',
        rarity: 'common',
        type: 'potion',
        quantity: 3,
        baseUnitPriceGp: 50,
        effectiveUnitPriceGp: 50,
        totalPriceGp: 150,
        priceSource: 'shop',
        appliedOverrides: [],
      }
    ];
    
    // Update the shop in the state
    state.shops[0] = shopWithInventory;
    
    // Mock the publish response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shareId: 'test-share-id' }),
    });
    
    // Publish the state
    const shareId = await publishMagicShopState(state);
    
    // Verify the shareId
    expect(shareId).toBe('test-share-id');
    
    // Mock the fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        state: {
          ...state,
          version: state.version,
          user: state.user,
          campaigns: state.campaigns,
          towns: state.towns,
          shops: state.shops,
          customItems: state.customItems,
          selectedCampaignId: state.selectedCampaignId,
          selectedTownId: state.selectedTownId,
          selectedShopId: state.selectedShopId,
        }
      }),
    });
    
    // Fetch the shared state
    const sharedState = await fetchSharedMagicShopState(shareId);
    
    // Verify the shared state has inventory
    expect(sharedState).toBeDefined();
    const selectedShop = sharedState.shops.find(shop => shop.id === sharedState.selectedShopId);
    expect(selectedShop).toBeDefined();
    expect(selectedShop?.inventory).toBeDefined();
    expect(selectedShop?.inventory.length).toBeGreaterThan(0);
    expect(selectedShop?.inventory[0].itemId).toBe('potion-of-healing');
  });

  it('should preserve inventory when creating minimal state for sharing', () => {
    // Create a default state
    const state = createDefaultShopState();
    
    // Add some mock inventory to the default shop
    const shopWithInventory = state.shops[0];
    shopWithInventory.inventory = [
      {
        itemId: 'potion-of-healing',
        itemName: 'Potion of Healing',
        rarity: 'common',
        type: 'potion',
        quantity: 3,
        baseUnitPriceGp: 50,
        effectiveUnitPriceGp: 50,
        totalPriceGp: 150,
        priceSource: 'shop',
        appliedOverrides: [],
      },
      {
        itemId: 'sword-of-sharpness',
        itemName: 'Sword of Sharpness',
        rarity: 'rare',
        type: 'weapon',
        quantity: 1,
        baseUnitPriceGp: 2000,
        effectiveUnitPriceGp: 2000,
        totalPriceGp: 2000,
        priceSource: 'shop',
        appliedOverrides: [],
      }
    ];
    
    // Update the shop in the state
    state.shops[0] = shopWithInventory;
    
    // Create minimal state
    const minimalState = createMinimalShopState(state);
    
    // Verify all inventory items are preserved
    const selectedShop = minimalState.shops.find(shop => shop.id === minimalState.selectedShopId);
    expect(selectedShop).toBeDefined();
    expect(selectedShop?.inventory).toBeDefined();
    expect(selectedShop?.inventory.length).toBe(2);
    
    // Verify first item
    expect(selectedShop?.inventory[0].itemId).toBe('potion-of-healing');
    expect(selectedShop?.inventory[0].itemName).toBe('Potion of Healing');
    expect(selectedShop?.inventory[0].quantity).toBe(3);
    
    // Verify second item
    expect(selectedShop?.inventory[1].itemId).toBe('sword-of-sharpness');
    expect(selectedShop?.inventory[1].itemName).toBe('Sword of Sharpness');
    expect(selectedShop?.inventory[1].quantity).toBe(1);
  });
});