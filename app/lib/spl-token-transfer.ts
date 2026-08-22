import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { createTransferCheckedInstruction, getMint, getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';

const MIN_TRANSFER_AMOUNT = 0.000001;
const MAX_TRANSFER_AMOUNT = 1_000_000_000;
const MAX_DECIMALS = 18;

function isValidAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

function validateTransferParams({
  rpcUrl,
  payerSecretBase64,
  tokenMintAddress,
  recipientAddress,
  amount,
}: {
  rpcUrl: string;
  payerSecretBase64: string;
  tokenMintAddress: string;
  recipientAddress: string;
  amount: number;
}): string | null {
  if (!rpcUrl || typeof rpcUrl !== 'string') return 'Invalid RPC URL';
  if (!payerSecretBase64 || typeof payerSecretBase64 !== 'string') return 'Invalid payer secret configuration';
  if (!isValidAddress(tokenMintAddress)) return 'Invalid token mint address';
  if (!isValidAddress(recipientAddress)) return 'Invalid recipient address';
  if (typeof amount !== 'number' || !isFinite(amount)) return 'Invalid amount: must be a finite number';
  if (amount < MIN_TRANSFER_AMOUNT || amount > MAX_TRANSFER_AMOUNT) return `Amount must be between ${MIN_TRANSFER_AMOUNT} and ${MAX_TRANSFER_AMOUNT}`;
  return null;
}

export async function transferToken({
  rpcUrl,
  payerSecretBase64,
  tokenMintAddress,
  recipientAddress,
  amount,
}: {
  rpcUrl: string;
  payerSecretBase64: string;
  tokenMintAddress: string;
  recipientAddress: string;
  amount: number;
}): Promise<string> {
  const validationError = validateTransferParams({
    rpcUrl,
    payerSecretBase64,
    tokenMintAddress,
    recipientAddress,
    amount,
  });

  if (validationError) {
    throw new Error(`Validation failed: ${validationError}`);
  }

  const connection = new Connection(rpcUrl, 'confirmed');
  let payer: Keypair;
  
  try {
    payer = Keypair.fromSecretKey(Buffer.from(payerSecretBase64, 'base64'));
  } catch {
    throw new Error('Invalid payer secret: failed to decode base64');
  }

  const mint = new PublicKey(tokenMintAddress);
  const recipient = new PublicKey(recipientAddress);

  try {
    const mintInfo = await getMint(connection, mint);

    if (mintInfo.decimals > MAX_DECIMALS) {
      throw new Error(`Token has invalid decimals: ${mintInfo.decimals}`);
    }

    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey,
      false,
    );

    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      recipient,
      false,
    );

    const adjustedAmount = BigInt(Math.round(amount * Math.pow(10, mintInfo.decimals)));

    if (adjustedAmount <= BigInt(0)) {
      throw new Error('Adjusted transfer amount is zero or negative');
    }

    const tx = new Transaction().add(
      createTransferCheckedInstruction(
        senderTokenAccount.address,
        mint,
        recipientTokenAccount.address,
        payer.publicKey,
        adjustedAmount,
        mintInfo.decimals,
        [],
        TOKEN_PROGRAM_ID,
      )
    );

    const signature = await sendAndConfirmTransaction(connection, tx, [payer], {
      skipPreflight: true,
      preflightCommitment: 'confirmed',
      maxRetries: 3,
    });

    return signature;
  } catch (error) {
    throw new Error(`Token transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
