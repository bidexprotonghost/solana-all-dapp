import * as anchor from '@coral-xyz/anchor';
import { BN, Program } from '@coral-xyz/anchor';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { expect } from 'chai';
import {
  Idl as QrIdl,
  buildQrTransaction,
  decodeQrTransaction,
} from '../../app/lib/tx-qr';
import idlJson from '../target/idl/my_project.json';

describe('my_project', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.MyProject as Program;
  const admin = provider.wallet.publicKey;
  const connection = provider.connection;

  const [statePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('state')],
    program.programId,
  );
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault')],
    program.programId,
  );
  const [stakerPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('staker'), admin.toBuffer()],
    program.programId,
  );

  const attacker = Keypair.generate();
  const recipient = Keypair.generate();

  async function expectAnchorError(promise: Promise<unknown>, code: string) {
    try {
      await promise;
      expect.fail(`Expected ${code} error`);
    } catch (err: any) {
      const actual = err?.error?.errorCode?.code ?? err?.message ?? String(err);
      expect(String(actual)).to.include(code);
    }
  }

  before(async () => {
    const sig = await connection.requestAirdrop(attacker.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, 'confirmed');
  });

  it('initializes global state', async () => {
    await program.methods.initialize().rpc();
    const state: any = await program.account.globalState.fetch(statePda);
    expect(state.admin.toBase58()).to.equal(admin.toBase58());
    expect(state.paused).to.equal(false);
    expect(state.totalStaked.toNumber()).to.equal(0);
  });

  it('admin can pause and unpause', async () => {
    await program.methods.setPause(true).rpc();
    let state: any = await program.account.globalState.fetch(statePda);
    expect(state.paused).to.equal(true);

    await program.methods.setPause(false).rpc();
    state = await program.account.globalState.fetch(statePda);
    expect(state.paused).to.equal(false);
  });

  it('rejects pause from non-admin', async () => {
    await expectAnchorError(
      program.methods
        .setPause(true)
        .accounts({ admin: attacker.publicKey })
        .signers([attacker])
        .rpc(),
      'Unauthorized',
    );
  });

  it('admin can toggle allowlist entries', async () => {
    const user = Keypair.generate().publicKey;
    await program.methods.toggleAllowlist(user).rpc();
    let state: any = await program.account.globalState.fetch(statePda);
    expect(state.allowlist.map((k: PublicKey) => k.toBase58())).to.include(user.toBase58());

    await program.methods.toggleAllowlist(user).rpc();
    state = await program.account.globalState.fetch(statePda);
    expect(state.allowlist.map((k: PublicKey) => k.toBase58())).to.not.include(user.toBase58());
  });

  it('rejects allowlist toggle from non-admin', async () => {
    await expectAnchorError(
      program.methods
        .toggleAllowlist(Keypair.generate().publicKey)
        .accounts({ admin: attacker.publicKey })
        .signers([attacker])
        .rpc(),
      'Unauthorized',
    );
  });

  it('stakes and updates counters', async () => {
    await program.methods.stake(new BN(1_000)).rpc();
    const staker: any = await program.account.stakerState.fetch(stakerPda);
    const state: any = await program.account.globalState.fetch(statePda);
    expect(staker.amount.toNumber()).to.equal(1_000);
    expect(state.totalStaked.toNumber()).to.equal(1_000);
  });

  it('rejects zero-amount stake', async () => {
    await expectAnchorError(program.methods.stake(new BN(0)).rpc(), 'InvalidAmount');
  });

  it('unstakes and tracks withdrawals', async () => {
    await program.methods.unstake(new BN(400)).rpc();
    const staker: any = await program.account.stakerState.fetch(stakerPda);
    const state: any = await program.account.globalState.fetch(statePda);
    expect(staker.amount.toNumber()).to.equal(600);
    expect(state.totalStaked.toNumber()).to.equal(600);
    expect(state.totalWithdrawn.toNumber()).to.equal(400);
  });

  it('rejects unstaking more than staked', async () => {
    await expectAnchorError(
      program.methods.unstake(new BN(10_000)).rpc(),
      'InsufficientBalance',
    );
  });

  it('rejects staking while paused', async () => {
    await program.methods.setPause(true).rpc();
    await expectAnchorError(program.methods.stake(new BN(10)).rpc(), 'Paused');
    await program.methods.setPause(false).rpc();
  });

  describe('vault: transfer_treasury & airdrop', () => {
    before(async () => {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: admin,
          toPubkey: vaultPda,
          lamports: LAMPORTS_PER_SOL,
        }),
      );
      await provider.sendAndConfirm(tx);
    });

    it('admin can transfer from treasury vault', async () => {
      const before = await connection.getBalance(recipient.publicKey);
      await program.methods
        .transferTreasury(new BN(0.3 * LAMPORTS_PER_SOL))
        .accounts({ recipient: recipient.publicKey })
        .rpc();
      const after = await connection.getBalance(recipient.publicKey);
      expect(after - before).to.equal(0.3 * LAMPORTS_PER_SOL);
    });

    it('admin can airdrop from vault', async () => {
      const target = Keypair.generate().publicKey;
      await program.methods
        .airdrop(new BN(0.2 * LAMPORTS_PER_SOL))
        .accounts({ recipient: target })
        .rpc();
      expect(await connection.getBalance(target)).to.equal(0.2 * LAMPORTS_PER_SOL);
    });

    it('rejects vault transfer from non-admin', async () => {
      await expectAnchorError(
        program.methods
          .transferTreasury(new BN(1))
          .accounts({ recipient: attacker.publicKey, admin: attacker.publicKey })
          .signers([attacker])
          .rpc(),
        'Unauthorized',
      );
    });

    it('rejects transfer exceeding vault balance', async () => {
      await expectAnchorError(
        program.methods
          .transferTreasury(new BN(100 * LAMPORTS_PER_SOL))
          .accounts({ recipient: recipient.publicKey })
          .rpc(),
        'InsufficientVaultFunds',
      );
    });
  });

  describe('QR transaction round-trip (solana:base58Tx)', () => {
    const idl = idlJson as unknown as QrIdl;

    async function scanSignSend(uri: string): Promise<void> {
      // "Scan" the QR: strip scheme, base58-decode, reconstruct transaction.
      const tx = Transaction.from(decodeQrTransaction(uri).serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }));
      const signed = await provider.wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, 'confirmed');
    }

    it('QR-encoded airdrop executes correctly after scan/sign/send', async () => {
      const target = Keypair.generate().publicKey;
      const lamports = 123_456_789;

      const qr = await buildQrTransaction(
        connection as any,
        idl,
        'airdrop',
        { amount: BigInt(lamports) },
        { recipient: target.toBase58() },
        admin as any,
      );
      expect(qr.uri.startsWith('solana:')).to.equal(true);

      await scanSignSend(qr.uri);
      expect(await connection.getBalance(target)).to.equal(lamports);
    });

    it('QR-encoded transfer_treasury executes correctly', async () => {
      const before = await connection.getBalance(recipient.publicKey);
      const lamports = 50_000_000;

      const qr = await buildQrTransaction(
        connection as any,
        idl,
        'transfer_treasury',
        { amount: BigInt(lamports) },
        { recipient: recipient.publicKey.toBase58() },
        admin as any,
      );

      await scanSignSend(qr.uri);
      expect(await connection.getBalance(recipient.publicKey)).to.equal(before + lamports);
    });

    it('QR-encoded stake executes correctly', async () => {
      const stakerBefore: any = await program.account.stakerState.fetch(stakerPda);

      const qr = await buildQrTransaction(
        connection as any,
        idl,
        'stake',
        { amount: 250n },
        {},
        admin as any,
      );

      await scanSignSend(qr.uri);

      const stakerAfter: any = await program.account.stakerState.fetch(stakerPda);
      expect(stakerAfter.amount.toNumber()).to.equal(stakerBefore.amount.toNumber() + 250);
    });
  });
});
