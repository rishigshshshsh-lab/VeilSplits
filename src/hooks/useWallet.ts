import { useState, useEffect, useCallback } from 'react';
import {
  checkFreighterInstalled,
  connectFreighter,
  fetchXlmBalance,
} from '../lib/stellar';

export interface WalletState {
  address: string | null;
  balance: string | null;
  isInstalled: boolean | null;
  loadingBalance: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    isInstalled: null,
    loadingBalance: false,
    isConnecting: false,
    error: null,
  });

  // Check if Freighter is installed on mount
  useEffect(() => {
    const checkInstallation = async () => {
      const installed = await checkFreighterInstalled();
      setState((prev) => ({ ...prev, isInstalled: installed }));
    };
    checkInstallation();
  }, []);

  // Check connection status from localStorage on mount (persistence)
  useEffect(() => {
    const savedAddress = localStorage.getItem('connected_stellar_address');
    if (savedAddress) {
      setState((prev) => ({ ...prev, address: savedAddress }));
      // Fetch balance for the saved address
      fetchBalance(savedAddress);
    }
  }, []);

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
        error: err.message || 'Failed to fetch balance.',
      }));
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      // 1. Check install status first
      const installed = await checkFreighterInstalled();
      if (!installed) {
        throw new Error('Freighter is not installed. Please install the extension first.');
      }

      // 2. Request address
      const walletAddress = await connectFreighter();
      localStorage.setItem('connected_stellar_address', walletAddress);
      
      setState((prev) => ({
        ...prev,
        address: walletAddress,
        isConnecting: false,
        isInstalled: true,
      }));

      // 3. Fetch balance
      await fetchBalance(walletAddress);
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: err.message || 'Failed to connect wallet.',
      }));
    }
  }, [fetchBalance]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
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
