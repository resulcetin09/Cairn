'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  MidnightConnectedAPI,
  MidnightWalletAPI,
  MidnightShieldedAddresses,
} from './midnight.d';

export interface WalletState {
  isAvailable: boolean;
  isConnected: boolean;
  connecting: boolean;
  walletName: string | null;
  unshieldedAddress: string | null;
  shieldedAddress: string | null;
  dustBalance: bigint | null;
  connectedApi: MidnightConnectedAPI | null;
  error: string | null;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  formatAddress: (addr: string | null) => string;
}

const WalletContext = createContext<WalletContextType | null>(null);

const TARGET_NETWORK = 'preview';
const WALLET_CONNECTED_KEY = 'cairn_wallet_connected';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    isAvailable: false,
    isConnected: false,
    connecting: false,
    walletName: null,
    unshieldedAddress: null,
    shieldedAddress: null,
    dustBalance: null,
    connectedApi: null,
    error: null,
  });

  // Lace wallet keşfi
  const findWallet = useCallback((): MidnightWalletAPI | null => {
    if (typeof window === 'undefined' || !window.midnight) return null;
    const midnight = window.midnight;

    if (midnight.mnLace) return midnight.mnLace;
    if (midnight.lace) return midnight.lace;

    const wallets = Object.values(midnight).filter(Boolean) as MidnightWalletAPI[];
    return (
      wallets.find(
        (w) =>
          w?.name?.toLowerCase().includes('lace') ||
          w?.rdns?.toLowerCase().includes('lace')
      ) || wallets[0] || null
    );
  }, []);

  // Cüzdan kontrolü
  useEffect(() => {
    const checkAvailability = () => {
      const wallet = findWallet();
      setState((prev) => ({ ...prev, isAvailable: !!wallet }));
    };

    checkAvailability();
    const timer = setTimeout(checkAvailability, 750);
    return () => clearTimeout(timer);
  }, [findWallet]);

  // Cüzdana bağlanma
  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, connecting: true, error: null }));
    try {
      const wallet = findWallet();
      if (!wallet) {
        throw new Error('Lace cüzdanı bulunamadı. Lütfen Midnight destekli Lace eklentisini yükleyin.');
      }

      let connectedApi: MidnightConnectedAPI;

      if (typeof wallet.connect === 'function') {
        connectedApi = await wallet.connect(TARGET_NETWORK);
      } else if (typeof wallet.enable === 'function') {
        connectedApi = await wallet.enable();
      } else {
        throw new Error('Cüzdan arayüzü uyumlu değil.');
      }

      let unshieldedAddress = '';
      try {
        const unshielded = await connectedApi.getUnshieldedAddress();
        unshieldedAddress = unshielded.unshieldedAddress;
      } catch (e) {
        console.warn('Unshielded adres alınamadı:', e);
      }

      let shieldedAddress = '';
      try {
        const shielded = await connectedApi.getShieldedAddresses();
        shieldedAddress = shielded.shieldedAddress;
      } catch (e) {
        console.warn('Shielded adres alınamadı:', e);
      }

      let dustBalance: bigint | null = null;
      try {
        dustBalance = await connectedApi.getDustBalance();
      } catch (e) {
        console.warn('DUST bakiyesi alınamadı:', e);
      }

      setState({
        isAvailable: true,
        isConnected: true,
        connecting: false,
        walletName: wallet.name || 'Lace',
        unshieldedAddress: unshieldedAddress || null,
        shieldedAddress: shieldedAddress || null,
        dustBalance,
        connectedApi,
        error: null,
      });

      try {
        localStorage.setItem(WALLET_CONNECTED_KEY, 'true');
      } catch {}
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cüzdana bağlanılamadı.';
      setState((prev) => ({
        ...prev,
        connecting: false,
        error: msg,
      }));
    }
  }, [findWallet]);

  const disconnect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isConnected: false,
      connecting: false,
      walletName: null,
      unshieldedAddress: null,
      shieldedAddress: null,
      dustBalance: null,
      connectedApi: null,
      error: null,
    }));
    try {
      localStorage.removeItem(WALLET_CONNECTED_KEY);
    } catch {}
  }, []);

  // Sayfa yenilendiğinde daha önce bağlıysa otomatik deneme
  useEffect(() => {
    try {
      if (localStorage.getItem(WALLET_CONNECTED_KEY) === 'true') {
        const timer = setTimeout(() => {
          if (findWallet()) {
            connect();
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [findWallet, connect]);

  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        formatAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
