"use client";

import { useState } from 'react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { QRCodeSVG } from 'qrcode.react';
import { connection } from '@/lib/anchor-client';
import { Idl, buildQrTransaction } from '@/lib/tx-qr';
import idlJson from '@/lib/idl/my_project.json';

const idl = idlJson as unknown as Idl;

type Action = 'transfer_treasury' | 'airdrop';

export default function TreasuryActionsPanel() {
  const [action, setAction] = useState<Action>('transfer_treasury');
  const [admin, setAdmin] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amountSol, setAmountSol] = useState('');
  const [result, setResult] = useState<{ uri: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const adminKey = new PublicKey(admin.trim());
      const lamports = BigInt(Math.round(Number(amountSol) * LAMPORTS_PER_SOL));
      if (lamports <= 0n) throw new Error('Amount must be positive');
      const qr = await buildQrTransaction(
        connection,
        idl,
        action,
        { amount: lamports },
        { recipient: recipient.trim() },
        adminKey,
      );
      setResult({ uri: qr.uri });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
      <h2 className="mb-1 text-xl font-semibold text-white">Treasury Transfer &amp; Airdrop</h2>
      <p className="mb-4 text-sm text-slate-400">
        Admin-only vault operations. Generates a pre-built Solana transaction QR — no relay.
      </p>

      <div className="mb-3 flex gap-2">
        {(['transfer_treasury', 'airdrop'] as Action[]).map((entry) => (
          <button
            key={entry}
            onClick={() => { setAction(entry); setResult(null); }}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              action === entry
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {entry === 'transfer_treasury' ? 'Transfer Treasury' : 'Airdrop'}
          </button>
        ))}
      </div>

      <label className="mb-1 block text-sm text-slate-300">Admin (signer) pubkey</label>
      <input
        value={admin}
        onChange={(event) => setAdmin(event.target.value)}
        placeholder="Admin public key"
        className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
      />

      <label className="mb-1 block text-sm text-slate-300">Recipient</label>
      <input
        value={recipient}
        onChange={(event) => setRecipient(event.target.value)}
        placeholder="Recipient public key"
        className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
      />

      <label className="mb-1 block text-sm text-slate-300">Amount (SOL)</label>
      <input
        value={amountSol}
        onChange={(event) => setAmountSol(event.target.value)}
        placeholder="0.5"
        inputMode="decimal"
        className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
      />

      <button
        onClick={generate}
        disabled={busy || !admin.trim() || !recipient.trim() || !amountSol.trim()}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {busy ? 'Building…' : 'Generate QR'}
      </button>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      {result && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={result.uri} size={220} />
          </div>
          <p className="w-full break-all rounded-lg bg-slate-800 p-3 text-xs text-slate-300">{result.uri}</p>
        </div>
      )}
    </div>
  );
}
