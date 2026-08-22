type SignMessage = ((message: Uint8Array) => Promise<Uint8Array>) | undefined;

type Operation = 'receive' | 'send' | 'token-transfer';

type OperationPayload = {
  recipient?: string;
  amount?: number;
  tokenMint?: string;
};

function getAdminRequestPayloadMessage(payload: OperationPayload = {}): string {
  return JSON.stringify({
    amount: payload.amount ?? null,
    recipient: payload.recipient ?? null,
    tokenMint: payload.tokenMint ?? null,
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function requestInteractionWallet(
  signMessage: SignMessage,
  adminPublicKey: string | undefined,
  operation: Operation,
  payload: OperationPayload = {},
): Promise<string> {
  if (!signMessage) {
    throw new Error('The connected wallet does not support message signing');
  }

  const timestamp = Date.now();
  const message = `elite-interman-admin:${operation}:${timestamp}:${getAdminRequestPayloadMessage(payload)}`;
  const signature = await signMessage(new TextEncoder().encode(message));
  const response = await fetch('/api/interaction-wallet', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      operation,
      auth: {
        adminPublicKey,
        timestamp,
        signature: bytesToBase64(signature),
      },
      payload,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || 'Interaction wallet request failed');
  }
  return result.signature;
}
