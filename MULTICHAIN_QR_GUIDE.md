# Multi-Chain Action Manifest

## What it does

The admin panel builds standards-compliant, native action URIs:

- Solana: an unsigned serialized transaction URI produced by the existing Solana builder.
- All 35 requested EVM chains: EIP-681 native-transfer and contract-method URIs. The network picker includes Ethereum, BNB Smart Chain, Polygon, Avalanche C-Chain, Fantom, Arbitrum, Optimism, Base, zkSync Era, Linea, Scroll, Celo, Harmony, Klaytn, Hedera, Moonbeam, Astar, Cronos, OKX Chain, Kava, Fuse, Aurora, Oasis Emerald, IoTeX, Metis, Boba, Rei, Evmos, Canto, ShimmerEVM, DFK Chain, Meter, Telos, Viction, and RSK.

The Multi-Chain Action Manifest panel collects these items into a versioned `superqr:` JSON envelope. This envelope is an application-level manifest, not a transaction protocol or a universal wallet command.

## Network compatibility

The panel catalogs all requested networks. A toggle is enabled only where the app can make a truthful action claim:

- **Native generation:** the 35 EVM networks (EIP-681) and Solana (the existing transaction builder).
- **Verified URI intake:** Cardano (`web+cardano:`), XRPL (`xrpl:`), and Bitcoin (`bitcoin:`). These payloads must come from a wallet or network implementation that documents the exact URI; the app does not synthesize arbitrary contract calls for them.
- **Unavailable as universal contract QR:** NEAR, Aptos, Sui, Polkadot, Cosmos, ICP, MultiversX, Algorand, Tezos, NEO, Waves, Zilliqa, Flow, Kadena, TON, THORChain, Stacks, Citrea, BOB, LitecoinVM, and Hyperledger Fabric. Their wallet/deep-link interfaces are application, ecosystem, or enterprise specific, so generating a generic URI would be misleading and unsafe.

## Walkthrough

1. Open `/admin` and connect the configured Solana admin wallet.
2. In **Transaction QR Builder**, choose a Solana instruction, complete its fields, and generate the `solana:` QR.
3. Copy the displayed `solana:` URI into **Multi-Chain Action Manifest** and select **Add Solana action**.
4. Choose an EVM network, enter an EVM recipient address and an amount in wei, then select **Add EVM action**. The item contains its EIP-681 `ethereum:` URI.
5. Set an expiration time. The Super QR is regenerated whenever its action list changes.
6. Scan each native URI using a wallet that explicitly supports that network and URI. Mark the action pending, approved, or failed in the panel to record the manual workflow state.

## Security and operational limits

- Each action requires a separate compatible wallet approval and is non-atomic.
- A `superqr:` URI must be decoded by this application or a compatible scanner that displays every action before requesting any signature.
- The UI never holds or transmits a private key.
- Verify recipient, chain ID, amount, contract method, and parameters in the wallet before signing.
- The UI does not estimate EVM gas or confirm execution on-chain yet; those require a connected EVM wallet and network-specific RPC integration.

## Going live

Provide before mainnet use:

1. Read-only RPC endpoints for every enabled chain.
2. Audited contract addresses, ABI/function definitions, and allowed parameter constraints for contract calls.
3. A hardware/multisig-controlled admin model; do not reuse a hot deployment wallet as treasury admin.
4. An HTTPS domain and an authenticated server-side persistence layer if action history must be durable.
5. Independent security review and manual mainnet deployment approval. No mainnet deployment is automated by this feature.