"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function WalletConnectButton() {
  const { wallet, publicKey, connected } = useWallet();

  return (
    <div className="flex items-center gap-3">
      <WalletMultiButton />
      {connected && publicKey && (
        <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </div>
      )}
      {wallet && !connected && (
        <div className="text-xs text-slate-400">Wallet ready</div>
      )}
    </div>
  );
}
