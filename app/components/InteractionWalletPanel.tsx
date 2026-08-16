"use client";

import { useState } from 'react';
import { getAxiomStatus } from '@/lib/axiom';
import { getInteractionWalletAddress, receiveToInteractionWallet, sendFromInteractionWallet } from '@/lib/interaction-wallet';
import { getJupiterQuote } from '@/lib/jupiter';
import { transferToken } from '@/lib/spl-token-transfer';

export default function InteractionWalletPanel() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.05');
  const [tokenMint, setTokenMint] = useState('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  const [tokenAmount, setTokenAmount] = useState('10');
  const [status, setStatus] = useState('Ready');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);

  const wallet = getInteractionWalletAddress();

  const handleReceive = async () => {
    setLoading(true);
    setStatus('Requesting airdrop...');
    try {
      const sig = await receiveToInteractionWallet();
      setStatus(`Received funds successfully: ${sig.slice(0, 8)}...`);
    } catch (err: any) {
      setStatus(err.message || 'Receive failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    setStatus('Sending funds...');
    try {
      const sig = await sendFromInteractionWallet(recipient, Number(amount));
      setStatus(`Sent successfully: ${sig.slice(0, 8)}...`);
    } catch (err: any) {
      setStatus(err.message || 'Send failed');
    } finally {
      setLoading(false);
    }
  };

  const openJupiter = async () => {
    setLoading(true);
    setStatus('Fetching Jupiter route...');
    try {
      const result = await getJupiterQuote({
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: '1000000',
      });
      setQuote(result);
      setStatus(`Jupiter route ready: ${result?.outAmount ? Number(result.outAmount).toLocaleString() : 'quote received'}`);
      window.open('https://jup.ag/swap', '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setStatus(err.message || 'Jupiter query failed');
    } finally {
      setLoading(false);
    }
  };

  const triggerAxiom = async () => {
    setLoading(true);
    setStatus('Checking Axiom health...');
    try {
      const result = await getAxiomStatus();
      setStatus(`Axiom status: ${JSON.stringify(result).slice(0, 80)}...`);
    } catch (err: any) {
      setStatus(err.message || 'Axiom check failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenTransfer = async () => {
    setLoading(true);
    setStatus('Sending SPL token...');
    try {
      const raw = process.env.NEXT_PUBLIC_INTERACTION_WALLET_PRIVATE_KEY;
      if (!raw) {
        throw new Error('Missing NEXT_PUBLIC_INTERACTION_WALLET_PRIVATE_KEY');
      }

      const signature = await transferToken({
        rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
        payerSecretBase64: raw,
        tokenMintAddress: tokenMint,
        recipientAddress: recipient,
        amount: Number(tokenAmount),
      });

      setStatus(`SPL token transfer sent: ${signature.slice(0, 8)}...`);
    } catch (err: any) {
      setStatus(err.message || 'Token transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
      <h2 className="mb-4 text-xl font-semibold text-white">Interaction Wallet</h2>
      <div className="mb-4 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-sm text-violet-200">
        Wallet: {wallet}
      </div>

      <div className="space-y-4">
        <button
          onClick={handleReceive}
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          Receive SOL to Interaction Wallet
        </button>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Recipient</label>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none"
            placeholder="Recipient wallet address"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Amount (SOL)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={loading || !recipient}
          className="w-full rounded-xl bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-500 disabled:opacity-60"
        >
          Send SOL from Interaction Wallet
        </button>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Token Mint</label>
          <input
            value={tokenMint}
            onChange={(e) => setTokenMint(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none"
            placeholder="Token mint address"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Token Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none"
          />
        </div>

        <button
          onClick={handleTokenTransfer}
          disabled={loading || !recipient || !tokenMint}
          className="w-full rounded-xl bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500 disabled:opacity-60"
        >
          Send SPL Token from Interaction Wallet
        </button>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={openJupiter}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 font-medium text-cyan-200 hover:bg-cyan-500/20"
          >
            Open Jupiter Swap
          </button>
          <button
            onClick={triggerAxiom}
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 font-medium text-amber-200 hover:bg-amber-500/20"
          >
            Trigger Axiom Query
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-sm text-slate-300">
        Status: {status}
      </div>

      {quote && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">
          Jupiter outAmount: {quote?.outAmount || 'n/a'}
        </div>
      )}
    </div>
  );
}
