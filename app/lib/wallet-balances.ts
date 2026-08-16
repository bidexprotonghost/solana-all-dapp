import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';

const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const MIN_BALANCE_TO_DISPLAY = 0.00000001;
const SOL_DECIMALS = 9;

export type WalletAsset = {
  mint: string;
  symbol: string;
  amount: string;
  uiAmount: number;
  decimals: number;
};

function truncateAddress(address: string, maxLength: number = 8): string {
  return address.length > maxLength ? `${address.slice(0, maxLength)}...` : address;
}

export async function getWalletAssets(connection: Connection, walletAddress: PublicKey): Promise<WalletAsset[]> {
  try {
    const [solBalance, tokenAccounts] = await Promise.all([
      connection.getBalance(walletAddress),
      connection.getParsedTokenAccountsByOwner(walletAddress, {
        programId: new PublicKey(TOKEN_PROGRAM_ID),
      }),
    ]);

    const assets: WalletAsset[] = [];

    const solAmount = solBalance / Math.pow(10, SOL_DECIMALS);
    if (solAmount >= MIN_BALANCE_TO_DISPLAY) {
      assets.push({
        mint: 'SOL',
        symbol: 'SOL',
        amount: solAmount.toFixed(4),
        uiAmount: solAmount,
        decimals: SOL_DECIMALS,
      });
    }

    const tokenAssets: WalletAsset[] = [];

    for (const { account } of tokenAccounts.value) {
      try {
        const parsed = account.data as ParsedAccountData;
        const info = parsed.parsed?.info;

        if (!info || !info.mint || !info.tokenAmount) continue;

        const mint = info.mint as string;
        const decimals = Number(info.tokenAmount.decimals ?? 0);
        const uiAmount = Number(info.tokenAmount.uiAmount ?? 0);

        if (uiAmount < MIN_BALANCE_TO_DISPLAY) continue;

        if (decimals < 0 || decimals > 18) continue;

        const displayDecimals = decimals > 0 ? Math.min(decimals, 6) : 0;
        const amount = uiAmount.toFixed(displayDecimals);

        tokenAssets.push({
          mint,
          symbol: truncateAddress(mint, 6),
          amount,
          uiAmount,
          decimals,
        });
      } catch {
        continue;
      }
    }

    tokenAssets.sort((a, b) => b.uiAmount - a.uiAmount);
    assets.push(...tokenAssets);

    return assets;
  } catch (error) {
    throw new Error(
      `Failed to fetch wallet assets: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
