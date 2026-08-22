"use client";

const notes = [
  ['EIP-5792 batch calls', 'Experimental: generates a wallet_sendCalls request, but execution requires an EIP-5792-capable wallet.'],
  ['ERC-7715 smart sessions', 'Not enabled: requires a wallet-specific delegation implementation and explicit permission policy.'],
  ['LI.FI routing', 'Not enabled: requires a server-side route quote, API key policy, slippage controls, and user approval.'],
  ['EVM treasury template', 'The audited-scope starting point is contracts/EvmTreasury.sol. Each chain still requires deployment, funding, address configuration, and independent review.'],
  ['Cardano / XRPL / other admin contracts', 'No deployment is performed automatically. These require chain-specific scripts, funded keys, audited validators or account policies, and explicit network configuration.'],
  ['Token discovery', 'Not supported: every token, spender, amount, and destination must be explicitly specified.'],
  ['Multi-chain atomicity', 'Not supported: each chain requires its own signature and can succeed or fail independently.'],
  ['Manual URI networks', 'Cardano, XRPL, and Bitcoin accept verified native URIs; other catalogued networks remain reference-only until a wallet standard is validated.'],
];

export default function AdminNotes() {
  return (
    <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
      <h2 className="text-xl font-semibold text-amber-100">Admin Notes</h2>
      <p className="mt-1 text-sm text-amber-100/80">Capability status for this deployment. These notes are visible only inside the admin guard.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {notes.map(([title, detail]) => <div key={title} className="rounded-lg bg-slate-950/40 p-3">
          <p className="font-semibold text-amber-100">{title}</p>
          <p className="mt-1 text-sm text-amber-100/80">{detail}</p>
        </div>)}
      </div>
    </section>
  );
}