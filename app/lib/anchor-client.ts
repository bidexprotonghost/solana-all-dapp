import { Connection, Keypair, PublicKey } from '@solana/web3.js';

export const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com', 'confirmed');

export function getWalletAddress() {
  return process.env.ADMIN_PRIVATE_KEY ? Keypair.fromSecretKey(Buffer.from(process.env.ADMIN_PRIVATE_KEY, 'base64')).publicKey : null;
}

export function getProgramId() {
  return new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'YourProgramIDHere');
}
