import type { MagicShopState } from '../../types/magicShop';

export interface MagicShopSelection {
  campaignId: string | null;
  townId: string | null;
  shopId: string | null;
}

export interface MagicShopRouteParams {
  shareId?: string;
  campaignId?: string;
  townId?: string;
  shopId?: string;
}

export interface MagicShopRouteResolution {
  selection: MagicShopSelection;
  unavailableNotice: string | null;
}

export const MAGIC_SHOP_LINK_VISIBILITY_MESSAGE =
  'Campaign and shop links resolve against data stored in this browser. Use Share Snapshot to generate a cross-browser view link.';

export const MAGIC_SHOP_LINK_UNAVAILABLE_MESSAGE =
  'This campaign, town, or shop is not available in the current browser. Open a shared snapshot link or import the matching JSON export, then reopen the link.';

function findCampaign(state: MagicShopState, campaignId: string | null | undefined) {
  return campaignId ? state.campaigns.find((campaign) => campaign.id === campaignId) ?? null : null;
}

function findTown(state: MagicShopState, townId: string | null | undefined) {
  return townId ? state.towns.find((town) => town.id === townId) ?? null : null;
}

function findShop(state: MagicShopState, shopId: string | null | undefined) {
  return shopId ? state.shops.find((shop) => shop.id === shopId) ?? null : null;
}

export function sanitizeMagicShopSelection(
  state: MagicShopState,
  selection: MagicShopSelection,
): MagicShopSelection {
  const selectedShop = findShop(state, selection.shopId);
  const selectedShopTown = selectedShop ? findTown(state, selectedShop.townId) : null;
  const shop = selectedShop && selectedShopTown ? selectedShop : null;

  const selectedTown = findTown(state, selection.townId);
  const town = selectedShopTown ?? (selectedTown && findCampaign(state, selectedTown.campaignId) ? selectedTown : null);

  const selectedCampaign = findCampaign(state, selection.campaignId);
  const campaign = town ? findCampaign(state, town.campaignId) : selectedCampaign;

  return {
    campaignId: campaign?.id ?? null,
    townId: town?.id ?? null,
    shopId: shop?.id ?? null,
  };
}

export function resolveMagicShopRouteSelection(
  state: MagicShopState,
  params: MagicShopRouteParams,
): MagicShopRouteResolution {
  const fallbackSelection = sanitizeMagicShopSelection(state, {
    campaignId: state.selectedCampaignId,
    townId: state.selectedTownId,
    shopId: state.selectedShopId,
  });

  if (params.shopId) {
    const shop = findShop(state, params.shopId);
    if (!shop) {
      return { selection: fallbackSelection, unavailableNotice: MAGIC_SHOP_LINK_UNAVAILABLE_MESSAGE };
    }

    return {
      selection: sanitizeMagicShopSelection(state, {
        campaignId: params.campaignId ?? null,
        townId: params.townId ?? shop.townId,
        shopId: shop.id,
      }),
      unavailableNotice: null,
    };
  }

  if (params.townId) {
    const town = findTown(state, params.townId);
    if (!town) {
      return { selection: fallbackSelection, unavailableNotice: MAGIC_SHOP_LINK_UNAVAILABLE_MESSAGE };
    }

    return {
      selection: sanitizeMagicShopSelection(state, {
        campaignId: params.campaignId ?? town.campaignId,
        townId: town.id,
        shopId: null,
      }),
      unavailableNotice: null,
    };
  }

  if (params.campaignId) {
    const campaign = findCampaign(state, params.campaignId);
    if (!campaign) {
      return { selection: fallbackSelection, unavailableNotice: MAGIC_SHOP_LINK_UNAVAILABLE_MESSAGE };
    }

    return {
      selection: sanitizeMagicShopSelection(state, {
        campaignId: campaign.id,
        townId: null,
        shopId: null,
      }),
      unavailableNotice: null,
    };
  }

  return { selection: fallbackSelection, unavailableNotice: null };
}

export function buildMagicShopPath(selection: MagicShopSelection): string {
  if (selection.shopId && selection.townId) {
    return `/magic-item-shop/town/${selection.townId}/shop/${selection.shopId}`;
  }

  if (selection.townId && selection.campaignId) {
    return `/magic-item-shop/campaign/${selection.campaignId}/town/${selection.townId}`;
  }

  if (selection.campaignId) {
    return `/magic-item-shop/campaign/${selection.campaignId}`;
  }

  return '/magic-item-shop';
}

export function buildMagicShopSharePath(shareId: string): string {
  return `/magic-item-shop/shared/${encodeURIComponent(shareId)}`;
}
