"use client";

import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getWalletAssets, WalletAsset } from '@/lib/wallet-balances';

export default function WalletPortfolio() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setAssets([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const result = await getWalletAssets(connection, publicKey);
        setAssets(result);
      } catch {
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [connection, publicKey]);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
      <h2 className="mb-4 text-xl font-semibold text-white">Wallet Portfolio</h2>
      {loading ? (
        <div className="text-sm text-slate-300">Loading assets...</div>
      ) : !publicKey ? (
        <div className="text-sm text-slate-300">Connect a wallet to load balances.</div>
      ) : assets.length === 0 ? (
        <div className="text-sm text-slate-300">No assets found.</div>
      ) : (
        <div className="space-y-2">
          {assets.map((asset) => (
            <div key={asset.mint} className="flex items-center justify-between rounded-xl bg-slate-800/80 p-3 text-sm text-slate-200">
              <span>{asset.symbol}</span>
              <span>{asset.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
