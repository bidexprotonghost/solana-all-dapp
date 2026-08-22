import { createPublicKey, verify } from 'node:crypto';
import { PublicKey } from '@solana/web3.js';

const AUTH_WINDOW_MS = 5 * 60 * 1000;
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

export type AdminRequestAuth = {
  adminPublicKey: string;
  timestamp: number;
  signature: string;
};

export type AdminRequestPayload = {
  recipient?: string;
  amount?: number;
  tokenMint?: string;
};

export function getAdminRequestPayloadMessage(payload: AdminRequestPayload = {}): string {
  return JSON.stringify({
    amount: payload.amount ?? null,
    recipient: payload.recipient ?? null,
    tokenMint: payload.tokenMint ?? null,
  });
}

export function getAdminRequestMessage(
  operation: string,
  timestamp: number,
  payload: AdminRequestPayload = {},
): string {
  return `elite-interman-admin:${operation}:${timestamp}:${getAdminRequestPayloadMessage(payload)}`;
}

export function verifyAdminRequest(
  operation: string,
  auth: AdminRequestAuth,
  payload: AdminRequestPayload = {},
): boolean {
  const configuredAdmin = process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY;
  if (!configuredAdmin || auth.adminPublicKey !== configuredAdmin) return false;
  if (!Number.isSafeInteger(auth.timestamp)) return false;
  if (Math.abs(Date.now() - auth.timestamp) > AUTH_WINDOW_MS) return false;

  try {
    const publicKey = new PublicKey(auth.adminPublicKey);
    const keyObject = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, publicKey.toBytes()]),
      format: 'der',
      type: 'spki',
    });
    const signature = Buffer.from(auth.signature, 'base64');
    const message = Buffer.from(getAdminRequestMessage(operation, auth.timestamp, payload));
    return verify(null, message, keyObject, signature);
  } catch {
    return false;
  }
}
