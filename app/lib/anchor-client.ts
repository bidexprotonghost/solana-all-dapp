import { Connection, PublicKey } from '@solana/web3.js';

export const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com', 'confirmed');

export function getProgramId(): PublicKey | null {
  const id = process.env.NEXT_PUBLIC_PROGRAM_ID;
  if (!id || id === 'YourProgramIDHere') return null;
  try {
    return new PublicKey(id);
  } catch {
    return null;
  }
}
