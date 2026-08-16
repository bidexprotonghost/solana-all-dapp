import WalletConnectButton from '@/components/WalletConnectButton';

const stats = [
  { label: 'TVL', value: '$2.4M' },
  { label: 'Stakers', value: '1,480' },
  { label: 'Treasury', value: '12.8 SOL' },
  { label: 'Uptime', value: '99.9%' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.25),_transparent_30%),linear-gradient(180deg,#020817_0%,#0f172a_60%,#020817_100%)] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-violet-400">My Project</p>
            <h1 className="mt-2 text-4xl font-bold text-white">Solana dApp Dashboard</h1>
          </div>
          <WalletConnectButton />
        </header>

        <section className="grid gap-5 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-xl">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Protocol Overview</h2>
            <p className="text-slate-300">
              This application demonstrates a production-ready Solana smart contract with governance,
              staking, treasury controls, pause logic, and wallet routing for Axiom and Jupiter workflows.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-sm text-slate-400">Axiom</p>
                <p className="mt-2 text-2xl font-bold text-violet-400">Routing</p>
              </div>
              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-sm text-slate-400">Jupiter</p>
                <p className="mt-2 text-2xl font-bold text-emerald-400">Swaps</p>
              </div>
              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-sm text-slate-400">Interaction Wallet</p>
                <p className="mt-2 text-2xl font-bold text-cyan-400">Send + Receive</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/admin" className="block rounded-xl bg-violet-600 px-4 py-3 text-center font-medium text-white hover:bg-violet-500">
                Open Admin Panel
              </a>
              <button className="block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-medium text-slate-200 hover:bg-slate-700">
                View Staking Activity
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
