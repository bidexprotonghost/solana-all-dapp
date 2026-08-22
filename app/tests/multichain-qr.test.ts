import { describe, expect, it } from 'vitest';
import {
  EVM_NETWORKS,
  NETWORK_CATALOG,
  buildEip681Uri,
  buildEip5792Request,
  buildErc7715PermissionRequest,
  buildCosmosBatchUri,
  buildMoveBatchUri,
  decodeManifest,
  encodeManifest,
} from '../lib/multichain-qr';

const RECIPIENT = '0x1111111111111111111111111111111111111111';

describe('EIP-681 generator', () => {
  it('registers every requested EVM chain with a unique positive chain ID', () => {
    expect(EVM_NETWORKS).toHaveLength(35);
    expect(new Set(EVM_NETWORKS.map((network) => network.chainId)).size).toBe(EVM_NETWORKS.length);
    expect(EVM_NETWORKS.every((network) => network.chainId > 0)).toBe(true);
  });

  it.each(EVM_NETWORKS)('encodes a $label native transfer with its chain ID', (network) => {
    expect(buildEip681Uri({
      chainId: network.chainId,
      recipient: RECIPIENT,
      valueWei: 123n,
    })).toBe(`ethereum:${RECIPIENT}@${network.chainId}?value=123`);
  });

  it('encodes a contract method and query parameters', () => {
    expect(buildEip681Uri({
      chainId: 1,
      recipient: RECIPIENT,
      contractAddress: '0x2222222222222222222222222222222222222222',
      functionName: 'transfer',
      parameters: { address: RECIPIENT, uint256: '25' },
    })).toBe(`ethereum:0x2222222222222222222222222222222222222222@1/transfer?address=${RECIPIENT}&uint256=25`);
  });

  it('rejects malformed addresses and negative values', () => {
    expect(() => buildEip681Uri({ chainId: 1, recipient: 'not-an-address' })).toThrow('20-byte EVM address');
    expect(() => buildEip681Uri({ chainId: 1, recipient: RECIPIENT, valueWei: -1n })).toThrow('cannot be negative');
  });
});

describe('EIP-5792 batch request', () => {
  it('builds an atomic wallet_sendCalls request for one EVM chain', () => {
    expect(buildEip5792Request(8453, RECIPIENT, [{
      to: '0x2222222222222222222222222222222222222222',
      data: '0x1234',
      value: '0x01',
    }])).toEqual({
      version: '1.0',
      chainId: '0x2105',
      from: RECIPIENT,
      atomicRequired: true,
      calls: [{ to: '0x2222222222222222222222222222222222222222', data: '0x1234', value: '0x01' }],
    });
  });

  it('rejects empty batches', () => {
    expect(() => buildEip5792Request(1, RECIPIENT, [])).toThrow('At least one');
  });
});

describe('experimental permission and protocol batches', () => {
  it('builds an ERC-7715 recurring permission request', () => {
    expect(buildErc7715PermissionRequest(1, RECIPIENT, 'transfer', ['1'], '1000', 86400)).toMatchObject({
      chainId: 1,
      contract: RECIPIENT,
      function: 'transfer',
      permissions: [{ type: 'recurring-transfer', maxAmount: '1000', periodSeconds: 86400 }],
    });
  });

  it('encodes Cosmos messages and Aptos/Sui move calls', () => {
    expect(buildCosmosBatchUri('cosmoshub-4', [{ typeUrl: '/bank/send', value: {} }])).toMatch(/^cosmos:/);
    expect(buildMoveBatchUri('aptos', [{ module: '0x1::coin', function: 'transfer', arguments: ['1'] }])).toMatch(/^aptos:/);
    expect(buildMoveBatchUri('sui', [{ module: '0x2::coin', function: 'transfer', arguments: ['1'] }])).toMatch(/^sui:/);
  });
});

describe('network capability catalog', () => {
  it('lists the requested EVM, Solana, and non-EVM families without claiming unsupported URI generators', () => {
    expect(NETWORK_CATALOG).toHaveLength(60);
    expect(NETWORK_CATALOG.filter((network) => network.capability === 'eip681')).toHaveLength(35);
    expect(NETWORK_CATALOG.find((network) => network.id === 'solana')?.capability).toBe('solana-native');
    expect(NETWORK_CATALOG.find((network) => network.id === 'fabric')?.capability).toBe('no-interoperable-contract-uri');
  });
});

describe('Super QR manifest envelope', () => {
  it('round-trips a versioned non-atomic action manifest', () => {
    const manifest = {
      version: 1 as const,
      expiresAt: '2026-08-20T12:00:00.000Z',
      actions: [{ chain: 'eip155:1', uri: `ethereum:${RECIPIENT}@1?value=123`, label: 'Ethereum', summary: 'Native transfer', permissionRequest: buildErc7715PermissionRequest(1, RECIPIENT, 'transfer', ['1'], '123', 3600) }],
    };
    const uri = encodeManifest(manifest);
    expect(uri).toMatch(/^superqr:/);
    expect(decodeManifest(uri)).toEqual(manifest);
  });

  it('rejects an empty action list and non-manifest URI', () => {
    expect(() => encodeManifest({ version: 1, expiresAt: '2026-08-20T12:00:00.000Z', actions: [] })).toThrow('At least one');
    expect(() => decodeManifest('ethereum:bad')).toThrow('Not a Super QR');
  });
});