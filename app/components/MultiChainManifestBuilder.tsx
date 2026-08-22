"use client";

import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ActionManifest,
  EVM_NETWORKS,
  EvmNetworkId,
  ManifestAction,
  NETWORK_CATALOG,
  buildEip681Uri,
  buildEip5792Request,
  buildErc7715PermissionRequest,
  encodeManifest,
} from '@/lib/multichain-qr';

type ApprovalStatus = 'pending' | 'approved' | 'failed';

interface LocalAction extends ManifestAction {
  status: ApprovalStatus;
}

export default function MultiChainManifestBuilder() {
  const [networkId, setNetworkId] = useState<EvmNetworkId>('eip155:1');
  const [recipient, setRecipient] = useState('');
  const [evmFrom, setEvmFrom] = useState('');
  const [amountWei, setAmountWei] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [functionName, setFunctionName] = useState('');
  const [parametersJson, setParametersJson] = useState('{}');
  const [smartSessions, setSmartSessions] = useState(false);
  const [batchCalls, setBatchCalls] = useState(false);
  const [lifiRouting, setLifiRouting] = useState(false);
  const [permissionMax, setPermissionMax] = useState('0');
  const [permissionPeriod, setPermissionPeriod] = useState('86400');
  const [solanaUri, setSolanaUri] = useState('');
  const [manualNetworkId, setManualNetworkId] = useState('cardano');
  const [manualUri, setManualUri] = useState('');
  const [actions, setActions] = useState<LocalAction[]>([]);
  const [enabledNetworks, setEnabledNetworks] = useState<Record<string, boolean>>(() => Object.fromEntries(NETWORK_CATALOG.map((network) => [network.id, network.capability !== 'no-interoperable-contract-uri'])));
  const [expiresAt, setExpiresAt] = useState(() => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));
  const [error, setError] = useState('');

  const manifest = useMemo<ActionManifest | null>(() => {
    if (actions.length === 0) return null;
    try {
      return { version: 1, expiresAt: new Date(expiresAt).toISOString(), actions };
    } catch {
      return null;
    }
  }, [actions, expiresAt]);
  const manifestUri = useMemo(() => (manifest ? encodeManifest(manifest) : null), [manifest]);

  function addEvmAction() {
    setError('');
    try {
      const network = EVM_NETWORKS.find((entry) => entry.id === networkId)!;
      const valueWei = amountWei.trim() ? BigInt(amountWei.trim()) : undefined;
      const parameters = parametersJson.trim() ? JSON.parse(parametersJson) : {};
      if (typeof parameters !== 'object' || Array.isArray(parameters) || parameters === null || Object.values(parameters).some((value) => typeof value !== 'string')) {
        throw new Error('Parameters must be a JSON object with string values');
      }
      const uri = buildEip681Uri({
        chainId: network.chainId,
        recipient,
        valueWei,
        contractAddress: contractAddress.trim() || undefined,
        functionName: functionName.trim() || undefined,
        parameters: parameters as Record<string, string>,
      });
      const permissionRequest = smartSessions
        ? buildErc7715PermissionRequest(network.chainId, contractAddress || recipient, functionName || 'transfer', Object.values(parameters) as string[], permissionMax, Number(permissionPeriod))
        : undefined;
      const walletRequest = batchCalls
        ? buildEip5792Request(network.chainId, evmFrom, [{ to: contractAddress || recipient, value: valueWei === undefined ? undefined : `0x${valueWei.toString(16)}` }])
        : undefined;
      setActions((current) => [...current, {
        chain: network.id,
        uri,
        label: network.label,
        summary: contractAddress.trim() ? `${functionName.trim()} on ${contractAddress.trim()}` : `${amountWei || '0'} wei native transfer to ${recipient}`,
        status: 'pending',
        permissionRequest,
        walletRequest,
      }]);
      setRecipient('');
      setEvmFrom('');
      setAmountWei('');
      setContractAddress('');
      setFunctionName('');
      setParametersJson('{}');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  function updateStatus(index: number, status: ApprovalStatus) {
    setActions((current) => current.map((action, actionIndex) => actionIndex === index ? { ...action, status } : action));
  }

  function addSolanaAction() {
    setError('');
    const uri = solanaUri.trim();
    if (!uri.startsWith('solana:')) {
      setError('Paste a Solana native transaction URI beginning with solana:');
      return;
    }
    setActions((current) => [...current, {
      chain: 'solana',
      uri,
      label: 'Solana',
      summary: 'Native Solana transaction from the Solana QR builder',
      status: 'pending',
    }]);
    setSolanaUri('');
  }

  function addManualAction() {
    setError('');
    const network = NETWORK_CATALOG.find((entry) => entry.id === manualNetworkId);
    const uri = manualUri.trim();
    const prefix = manualNetworkId === 'cardano' ? 'web+cardano:' : `${manualNetworkId}:`;
    if (!network || !uri.startsWith(prefix)) {
      setError(`Paste a verified ${prefix} URI for the selected network`);
      return;
    }
    setActions((current) => [...current, {
      chain: network.id,
      uri,
      label: network.label,
      summary: `Verified external wallet URI supplied for ${network.label}`,
      status: 'pending',
    }]);
    setManualUri('');
  }

  function toggleNetwork(id: string) {
    setEnabledNetworks((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <section className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
      <h2 className="text-xl font-semibold text-white">Multi-Chain Action Manifest</h2>
      <p className="mt-1 text-sm text-slate-400">
        Add standards-compliant native actions. Each wallet scans, signs, and executes its own action; this manifest is not atomic.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <select value={networkId} onChange={(event) => setNetworkId(event.target.value as EvmNetworkId)} className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white">
          {EVM_NETWORKS.map((network) => <option key={network.id} value={network.id}>{network.label}</option>)}
        </select>
        <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Recipient 0x..." className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" />
        <input value={amountWei} onChange={(event) => setAmountWei(event.target.value)} inputMode="numeric" placeholder="Amount in wei" className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input value={evmFrom} onChange={(event) => setEvmFrom(event.target.value)} placeholder="EVM sender 0x... (for wallet_sendCalls)" className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" />
        <input value={contractAddress} onChange={(event) => setContractAddress(event.target.value)} placeholder="Optional contract address 0x..." className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" />
        <input value={functionName} onChange={(event) => setFunctionName(event.target.value)} placeholder="Optional function name, e.g. transfer" className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" />
      </div>
      <textarea value={parametersJson} onChange={(event) => setParametersJson(event.target.value)} rows={2} placeholder='Contract parameters JSON, e.g. {"address":"0x...","uint256":"1"}' className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 font-mono text-sm text-white" />
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={batchCalls} onChange={(event) => setBatchCalls(event.target.checked)} /> Enable EIP-5792 wallet_sendCalls</label>
        <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={smartSessions} onChange={(event) => setSmartSessions(event.target.checked)} /> Enable Smart Sessions (ERC-7715)</label>
      </div>
      {smartSessions && <div className="mt-2 grid gap-3 md:grid-cols-2"><input value={permissionMax} onChange={(event) => setPermissionMax(event.target.value)} placeholder="Recurring max amount" className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" /><input value={permissionPeriod} onChange={(event) => setPermissionPeriod(event.target.value)} placeholder="Period seconds" className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" /></div>}
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={lifiRouting} onChange={(event) => setLifiRouting(event.target.checked)} /> Enable LI.FI cross-chain routing</label>
      {lifiRouting && <p className="mt-1 text-xs text-amber-300">Experimental admin mode. A configured server-side LI_FI_API_KEY is required before requesting a quote.</p>}
      <button onClick={addEvmAction} className="mt-3 rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white hover:bg-cyan-500">Add EVM action</button>
      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

      <div className="mt-5 border-t border-slate-700 pt-4">
        <label className="mb-1 block text-sm text-slate-300">Add generated Solana URI</label>
        <div className="flex flex-col gap-2 md:flex-row">
          <input value={solanaUri} onChange={(event) => setSolanaUri(event.target.value)} placeholder="solana:base58SerializedTransaction" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" />
          <button onClick={addSolanaAction} className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500">Add Solana action</button>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-700 pt-4">
        <label className="mb-1 block text-sm text-slate-300">Add verified external wallet URI</label>
        <p className="mb-2 text-xs text-amber-300">Cardano, XRPL, and Bitcoin values are accepted only as wallet-verified native URIs. This app does not fabricate them.</p>
        <div className="flex flex-col gap-2 md:flex-row">
          <select value={manualNetworkId} onChange={(event) => setManualNetworkId(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white">
            <option value="cardano">Cardano (web+cardano:)</option><option value="xrpl">XRPL (xrpl:)</option><option value="bitcoin">Bitcoin (bitcoin:)</option>
          </select>
          <input value={manualUri} onChange={(event) => setManualUri(event.target.value)} placeholder="Verified wallet URI" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" />
          <button onClick={addManualAction} className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-500">Add external action</button>
        </div>
      </div>

      <details className="mt-5 border-t border-slate-700 pt-4">
        <summary className="cursor-pointer text-sm font-semibold text-white">Network compatibility and action toggles ({NETWORK_CATALOG.length})</summary>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {NETWORK_CATALOG.map((network) => <label key={network.id} className="flex gap-3 rounded-lg bg-slate-800/80 p-3 text-sm">
            <input type="checkbox" checked={Boolean(enabledNetworks[network.id])} disabled={network.capability === 'no-interoperable-contract-uri'} onChange={() => toggleNetwork(network.id)} className="mt-1" />
            <span><span className="block font-medium text-white">{network.label}</span><span className="block text-xs text-slate-400">{network.note}</span></span>
          </label>)}
        </div>
      </details>

      {actions.length > 0 && <div className="mt-5 space-y-3">
        <label className="block text-sm text-slate-300">Manifest expiration</label>
        <input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" />
        {actions.map((action, index) => <article key={`${action.uri}-${index}`} className="rounded-lg border border-slate-700 bg-slate-800/80 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-white">{action.label}</strong><span className="text-xs text-cyan-300">{action.chain}</span></div>
          <p className="mt-1 break-all text-xs text-slate-300">{action.uri}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={action.uri} className="rounded-md bg-slate-700 px-3 py-1 text-xs text-white">Open native URI</a>
            {(['pending', 'approved', 'failed'] as ApprovalStatus[]).map((status) => <button key={status} onClick={() => updateStatus(index, status)} className={`rounded-md px-3 py-1 text-xs ${action.status === status ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{status}</button>)}
          </div>
        </article>)}
      </div>}

      {manifestUri && <div className="mt-5 grid gap-4 lg:grid-cols-[240px_1fr] lg:items-center">
        <div className="w-fit rounded-xl bg-white p-3"><QRCodeSVG value={manifestUri} size={210} /></div>
        <div><h3 className="font-semibold text-white">Super QR manifest</h3><p className="mt-1 text-sm text-slate-400">A manifest envelope. A compatible scanner must show every action and request one approval per chain.</p><p className="mt-3 break-all rounded-lg bg-slate-800 p-3 text-xs text-slate-300">{manifestUri}</p></div>
      </div>}
    </section>
  );
}