"use client";

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { buildCosmosBatchUri, buildMoveBatchUri } from '@/lib/multichain-qr';

export default function ProtocolBatchBuilder() {
  const [network, setNetwork] = useState<'cosmos' | 'aptos' | 'sui'>('cosmos');
  const [messages, setMessages] = useState('[{"typeUrl":"/cosmos.bank.v1beta1.MsgSend","value":{}}]');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  function generate() {
    setError('');
    try {
      const parsed = JSON.parse(messages);
      if (!Array.isArray(parsed)) throw new Error('Batch input must be a JSON array');
      const uri = network === 'cosmos'
        ? buildCosmosBatchUri('cosmoshub-4', parsed)
        : buildMoveBatchUri(network, parsed);
      setResult(uri);
    } catch (cause) {
      setResult('');
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  return <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
    <h2 className="text-xl font-semibold text-white">Protocol Batch Actions</h2>
    <p className="mt-1 text-sm text-slate-400">Admin-only payload builder for multi-message Cosmos or Move calls. Wallet compatibility must be verified per network.</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {(['cosmos', 'aptos', 'sui'] as const).map((entry) => <button key={entry} onClick={() => setNetwork(entry)} className={`rounded-lg px-3 py-2 text-sm ${network === entry ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'}`}>{entry}</button>)}
    </div>
    <textarea value={messages} onChange={(event) => setMessages(event.target.value)} rows={5} className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 font-mono text-xs text-white" aria-label="Batch messages JSON" />
    <button onClick={generate} className="mt-3 rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white">Generate batch URI</button>
    {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
    {result && <div className="mt-4 grid gap-3 md:grid-cols-[170px_1fr] md:items-center"><div className="w-fit rounded-lg bg-white p-2"><QRCodeSVG value={result} size={150} /></div><p className="break-all rounded-lg bg-slate-800 p-3 text-xs text-slate-300">{result}</p></div>}
  </section>;
}
