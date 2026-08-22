"use client";

import { useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { QRCodeSVG } from 'qrcode.react';
import { connection } from '@/lib/anchor-client';
import {
  ArgValue,
  Idl,
  IdlInstruction,
  buildQrTransaction,
} from '@/lib/tx-qr';
import idlJson from '@/lib/idl/my_project.json';

const idl = idlJson as unknown as Idl;

function needsManualInput(ix: IdlInstruction, name: string): boolean {
  const account = ix.accounts.find((entry) => entry.name === name);
  if (!account) return false;
  if (account.address || account.pda || account.signer) return false;
  return true;
}

export default function TransactionQRBuilder() {
  const [ixName, setIxName] = useState(idl.instructions[0]?.name ?? '');
  const [feePayer, setFeePayer] = useState('');
  const [argValues, setArgValues] = useState<Record<string, string>>({});
  const [accountValues, setAccountValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ uri: string; base58: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const instruction = useMemo(
    () => idl.instructions.find((entry) => entry.name === ixName),
    [ixName],
  );
  const manualAccounts = useMemo(
    () => (instruction ? instruction.accounts.filter((a) => needsManualInput(instruction, a.name)) : []),
    [instruction],
  );

  async function generate() {
    if (!instruction) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const payer = new PublicKey(feePayer.trim());
      const args: Record<string, ArgValue> = {};
      for (const arg of instruction.args) {
        args[arg.name] = argValues[arg.name] ?? '';
      }
      const qr = await buildQrTransaction(connection, idl, instruction.name, args, accountValues, payer);
      setResult({ uri: qr.uri, base58: qr.base58 });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
      <h2 className="mb-1 text-xl font-semibold text-white">Transaction QR Builder</h2>
      <p className="mb-4 text-sm text-slate-400">
        Build any program instruction from the IDL as an unsigned transaction QR
        (<code className="text-violet-300">solana:&lt;base58Tx&gt;</code>). Scan and sign with any wallet.
      </p>

      <label className="mb-1 block text-sm text-slate-300">Instruction</label>
      <select
        value={ixName}
        onChange={(event) => { setIxName(event.target.value); setResult(null); setError(''); }}
        className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
      >
        {idl.instructions.map((entry) => (
          <option key={entry.name} value={entry.name}>{entry.name}</option>
        ))}
      </select>

      <label className="mb-1 block text-sm text-slate-300">Fee payer / signer (admin) pubkey</label>
      <input
        value={feePayer}
        onChange={(event) => setFeePayer(event.target.value)}
        placeholder="Signer public key"
        className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
      />

      {instruction?.args.map((arg) => (
        <div key={arg.name} className="mb-3">
          <label className="mb-1 block text-sm text-slate-300">
            {arg.name} <span className="text-slate-500">({JSON.stringify(arg.type).replaceAll('"', '')})</span>
          </label>
          <input
            value={argValues[arg.name] ?? ''}
            onChange={(event) => setArgValues((prev) => ({ ...prev, [arg.name]: event.target.value }))}
            placeholder={typeof arg.type === 'string' && arg.type === 'pubkey' ? 'Public key' : 'Value'}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
          />
        </div>
      ))}

      {manualAccounts.map((account) => (
        <div key={account.name} className="mb-3">
          <label className="mb-1 block text-sm text-slate-300">account: {account.name}</label>
          <input
            value={accountValues[account.name] ?? ''}
            onChange={(event) =>
              setAccountValues((prev) => ({ ...prev, [account.name]: event.target.value }))
            }
            placeholder="Public key"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
          />
        </div>
      ))}

      <button
        onClick={generate}
        disabled={busy || !feePayer.trim()}
        className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
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
