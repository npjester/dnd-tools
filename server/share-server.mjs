import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.SHARE_SERVER_PORT ?? 8787);
const MAX_PAYLOAD_SIZE = 2_000_000;
// Intentionally in-memory only for now: share snapshots are lost whenever this process restarts.
const shares = new Map();

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > MAX_PAYLOAD_SIZE) {
        reject(new Error('Payload too large.'));
      }
    });
    req.on('end', () => {
      if (!raw) {
        reject(new Error('Missing JSON body.'));
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', () => reject(new Error('Failed to read request body.')));
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/magic-shop/shares') {
    try {
      const payload = await readJson(req);
      const state = payload?.state;
      if (!state || typeof state !== 'object') {
        sendJson(res, 400, { error: 'Expected body shape: { "state": { ... } }.' });
        return;
      }

      const shareId = randomUUID();
      shares.set(shareId, state);
      sendJson(res, 201, { shareId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create share snapshot.';
      sendJson(res, 400, { error: message });
    }
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/magic-shop/shares/')) {
    const shareId = decodeURIComponent(url.pathname.replace('/api/magic-shop/shares/', ''));
    const state = shares.get(shareId);
    if (!state) {
      sendJson(res, 404, { error: 'Shared snapshot not found.' });
      return;
    }

    sendJson(res, 200, { state });
    return;
  }

  sendJson(res, 404, { error: 'Not found.' });
});

server.listen(PORT, () => {
  console.log(`Magic shop share server listening on http://localhost:${PORT}`);
});
