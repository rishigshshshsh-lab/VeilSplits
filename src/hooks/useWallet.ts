import { useState, useEffect, useCallback } from 'react';
import { fetchXlmBalance } from '../lib/stellar';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';

export interface WalletState {
  address: string | null;
  balance: string | null;
  isInstalled: boolean | null;
  loadingBalance: boolean;
  isConnecting: boolean;
  error: string | null;
}

const formatWalletError = (err: any): string => {
  const msg = (err?.message || err?.toString() || '').toLowerCase();
  
  // Error Type 1: Wallet not found / not installed
  if (msg.includes('install') || msg.includes('not found') || msg.includes('not installed') || msg.includes('does not exist')) {
    return 'The selected wallet extension is not installed or not available. Please install the extension to continue.';
  }
  
  // Error Type 2: Transaction rejected by user in the wallet popup
  if (msg.includes('reject') || msg.includes('cancel') || msg.includes('decline') || msg.includes('user closed')) {
    return 'The connection request or transaction was rejected in your wallet popup.';
  }
  
  // Error Type 3: Insufficient balance
  if (msg.includes('insufficient') || msg.includes('underfunded') || msg.includes('404')) {
    return 'Insufficient balance to cover the split payment and network fees. Please fund your account via Friendbot.';
  }
  
  return err?.message || 'An unknown error occurred while connecting your wallet.';
};

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    isInstalled: true, // We assume wallet extensions are available, kit will detect them in the modal
    loadingBalance: false,
    isConnecting: false,
    error: null,
  });

  // Helper to fetch balance
  const fetchBalance = useCallback(async (walletAddress: string) => {
    setState((prev) => ({ ...prev, loadingBalance: true, error: null }));
    try {
      const xlmBalance = await fetchXlmBalance(walletAddress);
      setState((prev) => ({
        ...prev,
        balance: xlmBalance,
        loadingBalance: false,
        error: null,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        balance: null,
        loadingBalance: false,
        error: formatWalletError(err),
      }));
    }
  }, []);

  // Check connection status from localStorage on mount (persistence)
  useEffect(() => {
    const savedAddress = localStorage.getItem('connected_stellar_address');
    if (savedAddress) {
      setState((prev) => ({ ...prev, address: savedAddress }));
      // Fetch balance for the saved address
      fetchBalance(savedAddress);
    }
  }, [fetchBalance]);

  // Connect wallet using StellarWalletsKit modal
  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      // Show the multi-wallet choice modal (Freighter, Albedo, Lobstr, xBull)
      const { address: walletAddress } = await StellarWalletsKit.authModal();
      
      if (!walletAddress) {
        throw new Error('No address returned from the selected wallet.');
      }

      localStorage.setItem('connected_stellar_address', walletAddress);
      
      setState((prev) => ({
        ...prev,
        address: walletAddress,
        isConnecting: false,
        isInstalled: true,
      }));

      // Fetch balance
      await fetchBalance(walletAddress);
    } catch (err: any) {
      // If user closed the modal, we silently reset isConnecting without showing a noisy error
      if (err.message && err.message.includes('closed')) {
        setState((prev) => ({ ...prev, isConnecting: false }));
        return;
      }
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: formatWalletError(err),
      }));
    }
  }, [fetchBalance]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (err) {
      console.error('disconnect error:', err);
    }
    localStorage.removeItem('connected_stellar_address');
    setState((prev) => ({
      ...prev,
      address: null,
      balance: null,
      error: null,
    }));
  }, []);

  // Refresh balance explicitly
  const refreshBalance = useCallback(async () => {
    if (state.address) {
      await fetchBalance(state.address);
    }
  }, [state.address, fetchBalance]);

  return {
    ...state,
    connect,
    disconnect,
    refreshBalance,
  };
};
