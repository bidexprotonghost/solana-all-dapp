"use client";

import { useState } from 'react';

export default function WithdrawForm() {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Withdraw request:', { amount, recipient });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
      <div>
        <label className="mb-2 block text-sm text-slate-300">Recipient</label>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-0"
          placeholder="Recipient wallet address"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-300">Amount (SOL)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none ring-0"
          placeholder="0.00"
        />
      </div>

      <button type="submit" className="w-full rounded-xl bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-500">
        Submit Withdrawal
      </button>
    </form>
  );
}
