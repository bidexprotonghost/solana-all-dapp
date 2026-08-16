"use client";

import { useState } from 'react';

export default function StakeForm() {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Stake request:', amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
      <div>
        <label className="mb-2 block text-sm text-slate-300">Stake Amount (SOL)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-0"
          placeholder="0.00"
        />
      </div>

      <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500">
        Stake Tokens
      </button>
    </form>
  );
}
