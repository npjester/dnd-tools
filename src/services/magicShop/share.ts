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

export async function publishMagicShopState(state: MagicShopState): Promise<string> {
  const response = await fetch('/api/magic-shop/shares', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ state }),
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
