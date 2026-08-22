"use client";

import AdminGuard from '@/components/AdminGuard';
import AllowlistTable from '@/components/AllowlistTable';
import InteractionWalletPanel from '@/components/InteractionWalletPanel';
import AdminNotes from '@/components/AdminNotes';
import MultiChainManifestBuilder from '@/components/MultiChainManifestBuilder';
import ProtocolBatchBuilder from '@/components/ProtocolBatchBuilder';
import PauseToggle from '@/components/PauseToggle';
import StakeForm from '@/components/StakeForm';
import TransactionQRBuilder from '@/components/TransactionQRBuilder';
import TreasuryActionsPanel from '@/components/TreasuryActionsPanel';
import WalletConnectButton from '@/components/WalletConnectButton';
import WalletPortfolio from '@/components/WalletPortfolio';
import WithdrawForm from '@/components/WithdrawForm';

const cards = [
  { label: 'Total Staked', value: '245.8 SOL', tone: 'violet' },
  { label: 'Treasury', value: '12.1 SOL', tone: 'emerald' },
  { label: 'Pending Withdrawals', value: '3', tone: 'amber' },
  { label: 'Users', value: '1,426', tone: 'cyan' },
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-violet-400">Elite Interman</p>
            <h1 className="mt-2 text-4xl font-bold text-white">Protocol Control Center</h1>
          </div>
          <WalletConnectButton />
        </header>

        <AdminGuard>
          <section className="grid gap-5 md:grid-cols-4">
            {cards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="mt-3 text-3xl font-bold text-white">{card.value}</p>
              </div>
            ))}
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Admin Controls</h2>
                  <PauseToggle />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <StakeForm />
                  <WithdrawForm />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
                <h2 className="mb-4 text-xl font-semibold text-white">Allowlist</h2>
                <AllowlistTable />
              </div>

              <TransactionQRBuilder />

              <TreasuryActionsPanel />

              <MultiChainManifestBuilder />

              <AdminNotes />

              <ProtocolBatchBuilder />
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
                <h2 className="mb-4 text-xl font-semibold text-white">Recent Transactions</h2>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="rounded-xl bg-slate-800/80 p-3">Stake • 2.4 SOL • 2 minutes ago</li>
                  <li className="rounded-xl bg-slate-800/80 p-3">Withdraw • 0.8 SOL • 14 minutes ago</li>
                  <li className="rounded-xl bg-slate-800/80 p-3">Allowlist add • 3h ago</li>
                  <li className="rounded-xl bg-slate-800/80 p-3">Pause toggle • yesterday</li>
                </ul>
              </div>

              <InteractionWalletPanel />

              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
                <h2 className="mb-4 text-xl font-semibold text-white">Axiom + Jupiter routing</h2>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="rounded-lg bg-slate-800/80 p-3">Axiom: analytics, execution, and data routing hooks for protocol triggers</div>
                  <div className="rounded-lg bg-slate-800/80 p-3">Jupiter: swap and routing integration for token movement and treasury actions</div>
                  <div className="rounded-lg bg-slate-800/80 p-3">Admin wallet can send and receive SOL from the interaction wallet while routing execution through these integrations</div>
                </div>
              </div>

              <WalletPortfolio />

              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
                <h2 className="mb-4 text-xl font-semibold text-white">Role Matrix</h2>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/80 p-3"><span>SuperAdmin</span><span className="text-violet-400">Full</span></div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/80 p-3"><span>TreasuryAdmin</span><span className="text-emerald-400">Treasury</span></div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-800/80 p-3"><span>PauseAdmin</span><span className="text-amber-400">Pause</span></div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <h2 className="mb-2 text-xl font-semibold text-emerald-100">Admin security</h2>
                <p className="text-sm text-emerald-100/90">
                  The connected wallet is checked against the configured admin wallet, all wallet actions are scoped to the active Solana network, and balances display both native SOL and SPL token holdings for the connected wallet.
                </p>
              </div>
            </div>
          </section>
        </AdminGuard>
      </div>
    </main>
  );
}
