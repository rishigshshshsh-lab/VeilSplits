import { Buffer } from 'buffer';

// Ensure Buffer is available in the browser context for stellar-sdk XDR operations
if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
  (window as any).global = (window as any).global || window;
}

import { Horizon, rpc, TransactionBuilder, Operation, Asset, StrKey, Contract, nativeToScVal, scValToNative, Account } from '@stellar/stellar-sdk';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import contracts from '../contracts.json';

const HORIZON_URL = import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org';
export const server = new Horizon.Server(HORIZON_URL);

// Soroban RPC server for Testnet
const SOROBAN_RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
export const rpcServer = new rpc.Server(SOROBAN_RPC_URL);

// Deployed Smart Contract IDs
export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || contracts.splitBillRegistry;
export const NOTIFIER_CONTRACT_ID = import.meta.env.VITE_NOTIFIER_CONTRACT_ID || contracts.splitNotifier;

// Configure network passphrase for Testnet
export const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';

// Initialize StellarWalletsKit once globally
if (typeof window !== 'undefined') {
  StellarWalletsKit.init({
    modules: defaultModules(),
    network: Networks.TESTNET,
  });
}

/**
 * Validates if the given string is a valid Stellar public key (ED25519).
 */
export const isValidPublicKey = (address: string): boolean => {
  try {
    return StrKey.isValidEd25519PublicKey(address);
  } catch {
    return false;
  }
};

/**
 * Fetches XLM balance for the given address from Horizon Testnet.
 */
export const fetchXlmBalance = async (address: string): Promise<string> => {
  try {
    const account = await server.loadAccount(address);
    const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
    return nativeBalance ? nativeBalance.balance : '0.0000000';
  } catch (err: any) {
    if (err.response && err.response.status === 404) {
      throw new Error('Account not funded. Please fund this account via Friendbot to use it on the Testnet.');
    }
    throw new Error(err.message || 'Failed to fetch balance from Horizon.');
  }
};

/**
 * Sends a native XLM payment transaction with detailed status callback.
 */
export const sendPayment = async (
  sender: string,
  recipient: string,
  amount: string,
  statusCallback?: (status: 'pending' | 'submitted' | 'success' | 'failed', txHash?: string, error?: string) => void
): Promise<string> => {
  if (statusCallback) statusCallback('pending');
  try {
    // 1. Fetch latest account state
    const account = await server.loadAccount(sender);

    // 2. Fetch base fee
    let baseFee = 100;
    try {
      baseFee = await server.fetchBaseFee();
    } catch (e) {
      console.warn('Failed to fetch base fee, defaulting to 100 stroops', e);
    }

    // 3. Build payment transaction
    const transaction = new TransactionBuilder(account, {
      fee: baseFee.toString(),
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: recipient,
          asset: Asset.native(),
          amount: amount,
        })
      )
      .setTimeout(180)
      .build();

    const transactionXdr = transaction.toXDR();

    // 4. Request wallet signature via StellarWalletsKit
    const signResult = await StellarWalletsKit.signTransaction(transactionXdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: sender,
    });

    if (statusCallback) statusCallback('submitted');

    // 5. Submit transaction to Horizon
    const transactionToSubmit = TransactionBuilder.fromXDR(signResult.signedTxXdr, NETWORK_PASSPHRASE);
    const submitResult = await server.submitTransaction(transactionToSubmit);

    if (statusCallback) statusCallback('success', submitResult.hash);
    return submitResult.hash;
  } catch (err: any) {
    console.error('sendPayment error:', err);
    const errMsg = err.message || err.toString() || 'Transaction failed.';
    if (statusCallback) statusCallback('failed', undefined, errMsg);
    throw err;
  }
};

/**
 * Executes a Soroban Smart Contract call (like create_split or mark_paid)
 * with complete footprint preparation, wallet signature, and transaction status polling.
 */
export const executeContractCall = async (
  sender: string,
  method: string,
  args: any[],
  statusCallback?: (status: 'pending' | 'submitted' | 'success' | 'failed', txHash?: string, error?: string) => void
): Promise<string> => {
  if (statusCallback) statusCallback('pending');
  try {
    // 1. Load sender account
    const account = await server.loadAccount(sender);
    const contract = new Contract(CONTRACT_ID);

    // 2. Build initial transaction
    let tx = new TransactionBuilder(account, {
      fee: '100', // Will be auto-adjusted during prepareTransaction
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(180)
      .build();

    // 3. Prepare transaction (simulates it to fetch footprints, gas fees, etc.)
    try {
      tx = await rpcServer.prepareTransaction(tx);
    } catch (simErr: any) {
      console.error('Simulation/Preparation failed:', simErr);
      throw new Error(`SimulationError: ${simErr.message || 'Simulation of contract invocation failed.'}`);
    }

    // 4. Request signature from the wallet
    const signResult = await StellarWalletsKit.signTransaction(tx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: sender,
    });

    if (statusCallback) statusCallback('submitted');

    // 5. Submit signed transaction to Soroban RPC
    const signedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, NETWORK_PASSPHRASE);
    const response = await rpcServer.sendTransaction(signedTx);
    
    if (response.status === 'ERROR') {
      const errMsg = response.errorResult?.toXDR('base64') || 'Transaction submission failed.';
      throw new Error(errMsg);
    }

    const txHash = response.hash;
    if (statusCallback) statusCallback('submitted', txHash);

    // 6. Poll getTransaction until it is either SUCCESS or FAILED
    let attempts = 0;
    while (attempts < 30) {
      const txStatus = await rpcServer.getTransaction(txHash);
      if (txStatus.status === 'SUCCESS') {
        if (statusCallback) statusCallback('success', txHash);
        return txHash;
      } else if (txStatus.status === 'FAILED') {
        const errMsg = txStatus.resultXdr?.toString() || 'Transaction execution failed.';
        throw new Error(errMsg);
      }
      // Wait 1.5 seconds between poll attempts
      await new Promise((resolve) => setTimeout(resolve, 1500));
      attempts++;
    }

    throw new Error('TimeoutError: Transaction execution timed out while waiting for ledger inclusion.');
  } catch (err: any) {
    console.error(`executeContractCall (${method}) failed:`, err);
    const errMsg = err.message || err.toString() || 'Contract invocation failed.';
    if (statusCallback) statusCallback('failed', undefined, errMsg);
    throw err;
  }
};

/**
 * Fetches the split status for a given bill ID from the contract.
 * Uses simulation (read-only call) so no user signature is required.
 */
export const getSplitStatusOnChain = async (
  billId: string
): Promise<any> => {
  try {
    const dummyAccount = new Account('GBXBZYRUXADVOOB5TIBNDHMCH7TAUEEUDJDV5WLOBWIZMUVFBXHXQ76N', '0');
    const contract = new Contract(CONTRACT_ID);
    
    const tx = new TransactionBuilder(dummyAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('get_split_status', nativeToScVal(billId)))
      .setTimeout(30)
      .build();

    const sim = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
      return scValToNative(sim.result.retval);
    }
    throw new Error('SimulationError: Split bill does not exist or simulation failed.');
  } catch (err: any) {
    console.error('getSplitStatusOnChain error:', err);
    throw err;
  }
};

export interface SorobanEvent {
  id: string;
  type: 'split_created' | 'payment_marked' | 'notify_completed' | 'split_cancelled' | 'participant_added';
  billId: string;
  topic: string[];
  value: any;
  txHash: string;
  pagingToken: string;
}

export const parseSorobanEvent = (event: any): SorobanEvent | null => {
  try {
    const topicRaw = event.topic || [];
    if (topicRaw.length === 0) return null;
    
    const eventNameVal = topicRaw[0];
    const eventName = scValToNative(eventNameVal);
    
    let billId = '';
    if (topicRaw.length > 1) {
      billId = scValToNative(topicRaw[1]);
    }
    
    const value = event.value ? scValToNative(event.value) : null;
    
    return {
      id: event.id,
      type: eventName as any,
      billId,
      topic: topicRaw.map((t: any) => scValToNative(t).toString()),
      value,
      txHash: event.txHash,
      pagingToken: event.pagingToken || event.id,
    };
  } catch (e) {
    console.error('Error parsing event:', e);
    return null;
  }
};

/**
 * Fetches recent events from both the split bill registry and split notifier contracts.
 */
export const getRecentEvents = async (
  startLedger?: number,
  cursor?: string
): Promise<{ events: SorobanEvent[]; latestLedger: number; cursor?: string }> => {
  try {
    const latest = await rpcServer.getLatestLedger();
    const finalStartLedger = startLedger || (latest.sequence - 3000);
    
    // Type-safe event queries to prevent mixing startLedger and cursor
    const requestParams = cursor 
      ? {
          filters: [
            {
              type: 'contract' as const,
              contractIds: [CONTRACT_ID, NOTIFIER_CONTRACT_ID],
            },
          ],
          limit: 100,
          cursor,
        }
      : {
          startLedger: finalStartLedger,
          filters: [
            {
              type: 'contract' as const,
              contractIds: [CONTRACT_ID, NOTIFIER_CONTRACT_ID],
            },
          ],
          limit: 100,
        };

    const response = await rpcServer.getEvents(requestParams);
    
    const parsedEvents = (response.events || [])
      .map(parseSorobanEvent)
      .filter((ev): ev is SorobanEvent => ev !== null);
      
    const nextCursor = response.cursor || cursor;

    return {
      events: parsedEvents,
      latestLedger: latest.sequence,
      cursor: nextCursor,
    };
  } catch (err: any) {
    console.error('getRecentEvents error:', err);
    throw err;
  }
};
