import { Buffer } from 'buffer';

// Ensure Buffer is available in the browser context for stellar-sdk XDR operations
if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
  (window as any).global = (window as any).global || window;
}

import { Horizon, TransactionBuilder, Operation, Asset, StrKey } from '@stellar/stellar-sdk';
import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const server = new Horizon.Server(HORIZON_URL);

// Configure network passphrase for Testnet
export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

/**
 * Checks if the Freighter extension is installed.
 */
export const checkFreighterInstalled = async (): Promise<boolean> => {
  try {
    const res = await isConnected();
    return !!(res && res.isConnected);
  } catch (err) {
    console.error('Error checking Freighter installation:', err);
    return false;
  }
};

/**
 * Requests wallet access and returns the public key (address).
 */
export const connectFreighter = async (): Promise<string> => {
  try {
    const res = await requestAccess();
    
    // Support object returned from requestAccess()
    if (res && 'error' in res && res.error) {
      throw new Error(res.error || 'Failed to request access to Freighter.');
    }
    
    const address = res && 'address' in res ? res.address : (res as any);
    if (!address) {
      throw new Error('No address returned from Freighter.');
    }
    return address;
  } catch (err: any) {
    throw new Error(err.message || 'Freighter connection failed.');
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
    // If the account is not found, Horizon returns 404
    if (err.response && err.response.status === 404) {
      throw new Error('Account not funded. Please fund this account via Friendbot to use it on the Testnet.');
    }
    throw new Error(err.message || 'Failed to fetch balance from Horizon.');
  }
};

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
 * Sequentially builds and submits a payment transaction.
 * Pre-loads the sender account to get the freshest sequence number.
 */
export const sendPayment = async (
  sender: string,
  recipient: string,
  amount: string
): Promise<string> => {
  // 1. Fetch latest account state for the correct sequence number
  const account = await server.loadAccount(sender);

  // 2. Fetch standard base fee from Horizon or use default fallback (100 stroops = 0.00001 XLM)
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
    .setTimeout(180) // 3 minutes validity window
    .build();

  const transactionXdr = transaction.toXDR();

  // 4. Request signature from Freighter
  const signResult = await signTransaction(transactionXdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: sender,
  });

  if (signResult && 'error' in signResult && signResult.error) {
    throw new Error(signResult.error || 'Transaction signing rejected or failed.');
  }

  let signedXdr = '';
  if (typeof signResult === 'string') {
    signedXdr = signResult;
  } else if (signResult && typeof signResult === 'object') {
    signedXdr = signResult.signedTxXdr;
  }

  if (!signedXdr) {
    throw new Error('Freighter did not return a signed transaction.');
  }

  // 5. Submit signed transaction to Horizon Testnet
  const transactionToSubmit = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const submitResult = await server.submitTransaction(transactionToSubmit);

  return submitResult.hash;
};
