import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

const DEFAULT_RPC_URL = 'https://api.devnet.solana.com';
const AIRDROP_AMOUNT_SOL = 0.1;
const MIN_TRANSACTION_AMOUNT = 0.00001;
const MAX_TRANSACTION_AMOUNT = 1000;

let cachedConnection: Connection | null = null;

function getConnection(): Connection {
  if (!cachedConnection) {
    const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC || DEFAULT_RPC_URL;
    cachedConnection = new Connection(endpoint, 'confirmed');
  }
  return cachedConnection;
}

function isValidBase58PublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function getInteractionWallet(): Keypair | null {
  const raw = process.env.INTERACTION_WALLET_PRIVATE_KEY;
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    return null;
  }

  try {
    const decoded = Buffer.from(raw.trim(), 'base64');
    if (decoded.length !== 64) {
      return null;
    }
    return Keypair.fromSecretKey(Uint8Array.from(decoded));
  } catch {
    return null;
  }
}

export function getInteractionWalletAddress(): string {
  const wallet = getInteractionWallet();
  return wallet ? wallet.publicKey.toBase58() : 'Not configured';
}

export async function receiveToInteractionWallet(): Promise<string> {
  const wallet = getInteractionWallet();
  if (!wallet) {
    throw new Error('Interaction wallet is not configured on the server');
  }

  const connection = getConnection();
  const lamports = Math.round(AIRDROP_AMOUNT_SOL * LAMPORTS_PER_SOL);

  try {
    const sig = await connection.requestAirdrop(wallet.publicKey, lamports);
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: sig, ...latestBlockhash }, 'confirmed');
    return sig;
  } catch (error) {
    throw new Error(`Airdrop failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function sendFromInteractionWallet(to: string, amountSol: number): Promise<string> {
  const wallet = getInteractionWallet();
  if (!wallet) {
    throw new Error('Interaction wallet is not configured on the server');
  }

  if (!isValidBase58PublicKey(to)) {
    throw new Error('Invalid recipient address format');
  }

  if (typeof amountSol !== 'number' || amountSol <= 0 || !isFinite(amountSol)) {
    throw new Error('Invalid amount: must be a positive number');
  }

  if (amountSol < MIN_TRANSACTION_AMOUNT || amountSol > MAX_TRANSACTION_AMOUNT) {
    throw new Error(`Amount must be between ${MIN_TRANSACTION_AMOUNT} and ${MAX_TRANSACTION_AMOUNT} SOL`);
  }

  const recipient = new PublicKey(to);
  const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);

  if (lamports <= 0) {
    throw new Error('Transaction amount is too small');
  }

  const connection = getConnection();
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: recipient,
      lamports,
    })
  );

  try {
    const latestBlockhash = await connection.getLatestBlockhash();
    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.sign(wallet);

    const sig = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: true,
      maxRetries: 3,
    });
    await connection.confirmTransaction({ signature: sig, ...latestBlockhash }, 'confirmed');
    return sig;
  } catch (error) {
    throw new Error(`Send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
