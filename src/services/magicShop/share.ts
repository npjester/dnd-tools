import type { MagicShopState } from '../../types/magicShop';
import { importMagicShopState } from './storage';

interface PublishShareResponse {
  shareId: string;
}

interface FetchShareResponse {
  state: unknown;
}

export class ShareNotFoundError extends Error {
  constructor(message = 'Shared snapshot not found.') {
    super(message);
    this.name = 'ShareNotFoundError';
  }
}

// Create a minimal state that only includes the shop and its inventory
export function createMinimalShopState(state: MagicShopState): MagicShopState {
  if (!state.selectedShopId) {
    return state;
  }

  const selectedShop = state.shops.find(shop => shop.id === state.selectedShopId);
  if (!selectedShop) {
    return state;
  }

  // Find the town and campaign for this shop
  const selectedTown = state.towns.find(town => town.id === selectedShop.townId);
  const selectedCampaign = selectedTown ? state.campaigns.find(camp => camp.id === selectedTown.campaignId) : null;

  return {
    version: state.version,
    user: {
      id: state.user.id,
      name: state.user.name,
      globalPricing: state.user.globalPricing,
    },
    campaigns: selectedCampaign ? [selectedCampaign] : [],
    towns: selectedTown ? [selectedTown] : [],
    shops: [selectedShop],
    customItems: state.customItems,
    selectedCampaignId: selectedCampaign?.id ?? null,
    selectedTownId: selectedTown?.id ?? null,
    selectedShopId: selectedShop.id,
  };
}

export async function publishMagicShopState(state: MagicShopState): Promise<string> {
  const minimalState = createMinimalShopState(state);
  const response = await fetch('/api/magic-shop/shares', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ state: minimalState }),
  });

  if (!response.ok) {
    throw new Error('Unable to publish this shop snapshot right now.');
  }

  const payload = (await response.json()) as PublishShareResponse;
  if (!payload.shareId) {
    throw new Error('Share API response did not include a share id.');
  }

  return payload.shareId;
}

export async function fetchSharedMagicShopState(shareId: string): Promise<MagicShopState> {
  const response = await fetch(`/api/magic-shop/shares/${encodeURIComponent(shareId)}`);
  if (response.status === 404) {
    throw new ShareNotFoundError();
  }
  if (!response.ok) {
    throw new Error('Unable to load shared snapshot right now.');
  }

  const payload = (await response.json()) as FetchShareResponse;
  return importMagicShopState(JSON.stringify(payload.state));
}
