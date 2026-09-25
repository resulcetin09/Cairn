/** Midnight DApp Connector API type declarations for window.midnight */

export interface MidnightShieldedAddresses {
  shieldedAddress: string;
  shieldedCoinPublicKey: string;
  shieldedEncryptionPublicKey: string;
}

export interface MidnightUnshieldedAddress {
  unshieldedAddress: string;
}

export interface MidnightDustAddress {
  dustAddress: string;
}

export interface MidnightNetworkConfig {
  indexerUri: string;
  indexerWsUri: string;
  substrateUri: string;
  networkId: string;
}

export interface MidnightConnectedAPI {
  getShieldedAddresses(): Promise<MidnightShieldedAddresses>;
  getUnshieldedAddress(): Promise<MidnightUnshieldedAddress>;
  getDustAddress(): Promise<MidnightDustAddress>;
  getShieldedBalances(): Promise<Record<string, bigint>>;
  getUnshieldedBalances(): Promise<Record<string, bigint>>;
  getDustBalance(): Promise<bigint>;
  getConfiguration(): Promise<MidnightNetworkConfig>;
  getConnectionStatus(): Promise<string>;
  balanceUnsealedTransaction(tx: unknown, payFees?: boolean): Promise<unknown>;
  balanceSealedTransaction(tx: unknown, payFees?: boolean): Promise<unknown>;
  submitTransaction(tx: string): Promise<void>;
  getProvingProvider(keyMaterialProvider: unknown): Promise<unknown>;
  hintUsage?(methodNames: string[]): Promise<void>;
}

export interface MidnightWalletAPI {
  name: string;
  icon: string;
  rdns?: string;
  apiVersion?: string;
  connect(networkId: string): Promise<MidnightConnectedAPI>;
  isEnabled?(): Promise<boolean>;
  enable?(): Promise<MidnightConnectedAPI>;
}

declare global {
  interface Window {
    midnight?: {
      mnLace?: MidnightWalletAPI;
      lace?: MidnightWalletAPI;
      [key: string]: MidnightWalletAPI | undefined;
    };
  }
}
