import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import bs58 from 'bs58';

/* Minimal Anchor 0.31 IDL typings (subset needed for tx building). */
export interface IdlSeed {
  kind: 'const' | 'account' | 'arg';
  value?: number[];
  path?: string;
}
export interface IdlAccountItem {
  name: string;
  writable?: boolean;
  signer?: boolean;
  address?: string;
  pda?: { seeds: IdlSeed[]; program?: IdlSeed };
}
export interface IdlArg {
  name: string;
  type: IdlType;
}
export type IdlType =
  | 'bool' | 'u8' | 'i8' | 'u16' | 'i16' | 'u32' | 'i32'
  | 'u64' | 'i64' | 'string' | 'pubkey'
  | { vec: IdlType }
  | { option: IdlType };
export interface IdlInstruction {
  name: string;
  discriminator: number[];
  accounts: IdlAccountItem[];
  args: IdlArg[];
}
export interface Idl {
  address: string;
  instructions: IdlInstruction[];
}

export type ArgValue = string | number | bigint | boolean | ArgValue[] | null;

/* ---------- Borsh encoding for instruction args ---------- */

function encodeValue(type: IdlType, value: ArgValue, out: number[]): void {
  if (typeof type === 'object' && 'vec' in type) {
    const items = value as ArgValue[];
    encodeValue('u32', items.length, out);
    for (const item of items) encodeValue(type.vec, item, out);
    return;
  }
  if (typeof type === 'object' && 'option' in type) {
    if (value === null || value === undefined) {
      out.push(0);
    } else {
      out.push(1);
      encodeValue(type.option, value, out);
    }
    return;
  }
  switch (type) {
    case 'bool':
      out.push(value === true || value === 'true' || value === 1 ? 1 : 0);
      return;
    case 'u8':
    case 'i8':
      pushInt(BigInt(value as string | number | bigint), 1, out);
      return;
    case 'u16':
    case 'i16':
      pushInt(BigInt(value as string | number | bigint), 2, out);
      return;
    case 'u32':
    case 'i32':
      pushInt(BigInt(value as string | number | bigint), 4, out);
      return;
    case 'u64':
    case 'i64':
      pushInt(BigInt(value as string | number | bigint), 8, out);
      return;
    case 'string': {
      const bytes = new TextEncoder().encode(String(value));
      encodeValue('u32', bytes.length, out);
      bytes.forEach((b) => out.push(b));
      return;
    }
    case 'pubkey':
      new PublicKey(value as string).toBytes().forEach((b) => out.push(b));
      return;
    default:
      throw new Error(`Unsupported arg type: ${JSON.stringify(type)}`);
  }
}

function pushInt(value: bigint, bytes: number, out: number[]): void {
  let v = BigInt.asUintN(bytes * 8, value);
  for (let i = 0; i < bytes; i += 1) {
    out.push(Number(v & 0xffn));
    v >>= 8n;
  }
}

export function encodeInstructionData(
  ix: IdlInstruction,
  args: Record<string, ArgValue>,
): Buffer {
  const out: number[] = [...ix.discriminator];
  for (const arg of ix.args) {
    if (!(arg.name in args)) throw new Error(`Missing argument: ${arg.name}`);
    encodeValue(arg.type, args[arg.name], out);
  }
  return Buffer.from(out);
}

/* ---------- Account resolution (auto-derives PDAs from IDL seeds) ---------- */

export function resolveAccounts(
  idl: Idl,
  ix: IdlInstruction,
  args: Record<string, ArgValue>,
  provided: Record<string, string>,
  feePayer: PublicKey,
): { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[] {
  const programId = new PublicKey(idl.address);
  const resolved = new Map<string, PublicKey>();

  for (const account of ix.accounts) {
    if (provided[account.name]) {
      resolved.set(account.name, new PublicKey(provided[account.name]));
    } else if (account.address) {
      resolved.set(account.name, new PublicKey(account.address));
    } else if (account.signer) {
      // Signers default to the fee payer so PDA seeds referencing them resolve.
      resolved.set(account.name, feePayer);
    }
  }

  // Multi-pass PDA derivation: seeds may reference other accounts.
  for (let pass = 0; pass < ix.accounts.length; pass += 1) {
    let progress = false;
    for (const account of ix.accounts) {
      if (resolved.has(account.name) || !account.pda) continue;
      const seedBuffers: Buffer[] = [];
      let ready = true;
      for (const seed of account.pda.seeds) {
        if (seed.kind === 'const' && seed.value) {
          seedBuffers.push(Buffer.from(seed.value));
        } else if (seed.kind === 'account' && seed.path) {
          const ref = resolved.get(seed.path);
          if (!ref) { ready = false; break; }
          seedBuffers.push(ref.toBuffer());
        } else if (seed.kind === 'arg' && seed.path) {
          const value = args[seed.path];
          if (value === undefined) { ready = false; break; }
          seedBuffers.push(new PublicKey(value as string).toBuffer());
        } else {
          ready = false;
          break;
        }
      }
      if (ready) {
        const [pda] = PublicKey.findProgramAddressSync(seedBuffers, programId);
        resolved.set(account.name, pda);
        progress = true;
      }
    }
    if (!progress) break;
  }

  return ix.accounts.map((account) => {
    let pubkey = resolved.get(account.name);
    if (!pubkey && account.signer) pubkey = feePayer;
    if (!pubkey && account.name === 'system_program') pubkey = SystemProgram.programId;
    if (!pubkey) {
      throw new Error(`Account "${account.name}" could not be resolved — provide it explicitly.`);
    }
    return {
      pubkey,
      isSigner: Boolean(account.signer),
      isWritable: Boolean(account.writable),
    };
  });
}

/* ---------- Unsigned transaction + solana: QR payload ---------- */

export interface QrTransaction {
  transaction: Transaction;
  base58: string;
  /** QR payload: `solana:<base58-serialized-unsigned-tx>` */
  uri: string;
}

export function buildInstruction(
  idl: Idl,
  instructionName: string,
  args: Record<string, ArgValue>,
  provided: Record<string, string>,
  feePayer: PublicKey,
): TransactionInstruction {
  const ix = idl.instructions.find((entry) => entry.name === instructionName);
  if (!ix) throw new Error(`Instruction "${instructionName}" not found in IDL`);
  return new TransactionInstruction({
    programId: new PublicKey(idl.address),
    keys: resolveAccounts(idl, ix, args, provided, feePayer),
    data: encodeInstructionData(ix, args),
  });
}

export async function buildQrTransaction(
  connection: Connection,
  idl: Idl,
  instructionName: string,
  args: Record<string, ArgValue>,
  provided: Record<string, string>,
  feePayer: PublicKey,
): Promise<QrTransaction> {
  const instruction = buildInstruction(idl, instructionName, args, provided, feePayer);
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  const transaction = new Transaction({ feePayer, recentBlockhash: blockhash }).add(instruction);
  const serialized = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  const base58 = bs58.encode(serialized);
  return { transaction, base58, uri: `solana:${base58}` };
}

/** Inverse of the QR payload — used by scanners/tests to reconstruct the tx. */
export function decodeQrTransaction(uri: string): Transaction {
  const payload = uri.startsWith('solana:') ? uri.slice('solana:'.length) : uri;
  return Transaction.from(bs58.decode(payload));
}
