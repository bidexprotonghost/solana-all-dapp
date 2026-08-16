import { PublicKey } from '@solana/web3.js';

const JUPITER_API_ENDPOINT = 'https://quote-api.jup.ag/v6/quote';
const DEFAULT_SLIPPAGE_BPS = 50;
const MIN_SLIPPAGE_BPS = 0;
const MAX_SLIPPAGE_BPS = 10000;
const REQUEST_TIMEOUT_MS = 15000;

export type JupiterQuoteParams = {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
};

function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

function validateQuoteParams({
  inputMint,
  outputMint,
  amount,
  slippageBps,
}: JupiterQuoteParams & { slippageBps?: number }): string | null {
  if (!isValidPublicKey(inputMint)) return 'Invalid inputMint address';
  if (!isValidPublicKey(outputMint)) return 'Invalid outputMint address';
  if (inputMint === outputMint) return 'Input and output mints cannot be the same';
  
  const amountNum = BigInt(amount);
  if (amountNum <= BigInt(0)) return 'Amount must be positive';
  
  const slippage = slippageBps ?? DEFAULT_SLIPPAGE_BPS;
  if (slippage < MIN_SLIPPAGE_BPS || slippage > MAX_SLIPPAGE_BPS) {
    return `Slippage must be between ${MIN_SLIPPAGE_BPS} and ${MAX_SLIPPAGE_BPS} bps`;
  }
  
  return null;
}

export async function getJupiterQuote({
  inputMint,
  outputMint,
  amount,
  slippageBps = DEFAULT_SLIPPAGE_BPS,
}: JupiterQuoteParams) {
  const validationError = validateQuoteParams({
    inputMint,
    outputMint,
    amount,
    slippageBps,
  });

  if (validationError) {
    throw new Error(`Quote validation failed: ${validationError}`);
  }

  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: String(slippageBps),
    restrictIntermediateTokens: 'true',
    platformFeeBps: '0',
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${JUPITER_API_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Jupiter API error: ${text || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Jupiter quote request timed out');
    }
    throw new Error(`Jupiter quote failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
