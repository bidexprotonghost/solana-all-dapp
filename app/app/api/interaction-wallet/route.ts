import { NextRequest, NextResponse } from 'next/server';
import { receiveToInteractionWallet, sendFromInteractionWallet } from '@/lib/interaction-wallet';
import { transferToken } from '@/lib/spl-token-transfer';
import { verifyAdminRequest } from '@/lib/admin-auth';
import type { AdminRequestAuth } from '@/lib/admin-auth';

type RequestBody = {
  operation?: 'receive' | 'send' | 'token-transfer';
  auth?: AdminRequestAuth;
  payload?: {
    recipient?: string;
    amount?: number;
    tokenMint?: string;
  };
};

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 });
  }

  const operation = body.operation;
  if (operation !== 'receive' && operation !== 'send' && operation !== 'token-transfer') {
    return NextResponse.json({ error: 'Unsupported interaction wallet operation' }, { status: 400 });
  }
  if (!operation || !body.auth || !verifyAdminRequest(operation, body.auth, body.payload)) {
    return NextResponse.json({ error: 'Admin signature required' }, { status: 401 });
  }

  try {
    if (operation === 'receive') {
      return NextResponse.json({ signature: await receiveToInteractionWallet() });
    }

    const recipient = body.payload?.recipient;
    const amount = body.payload?.amount;
    if (!recipient || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Recipient and amount are required' }, { status: 400 });
    }

    if (operation === 'send') {
      return NextResponse.json({
        signature: await sendFromInteractionWallet(recipient, amount),
      });
    }

    const tokenMint = body.payload?.tokenMint;
    if (!tokenMint) {
      return NextResponse.json({ error: 'Token mint is required' }, { status: 400 });
    }

    return NextResponse.json({
      signature: await transferToken({
        rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
        payerSecretBase64: process.env.INTERACTION_WALLET_PRIVATE_KEY || '',
        tokenMintAddress: tokenMint,
        recipientAddress: recipient,
        amount,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Interaction wallet request failed' },
      { status: 502 },
    );
  }
}
