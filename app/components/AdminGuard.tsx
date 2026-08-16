"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import { ReactNode } from 'react';

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { publicKey, connected } = useWallet();

  const adminAddress = process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY;

  if (!adminAddress || adminAddress.trim().length === 0) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
        Admin wallet not configured. Set NEXT_PUBLIC_ADMIN_PUBLIC_KEY in environment.
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
        Connect your admin wallet to continue.
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
        Wallet connected but public key not available. Please try reconnecting.
      </div>
    );
  }

  const connectedAddress = publicKey.toBase58();
  const isAllowed = connectedAddress === adminAddress;

  if (!isAllowed) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="text-red-100 font-semibold">Access Denied</p>
        <p className="text-red-100/80 text-sm mt-2">
          This wallet is not authorized for admin actions.
        </p>
        <p className="text-red-100/60 text-xs mt-2 font-mono">
          Connected: {connectedAddress.slice(0, 8)}...{connectedAddress.slice(-8)}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
