import { useCallback, useEffect, useState } from 'react';

export const WALLET_STORAGE_KEY = 'crimereport_stellar_wallet_v1';
export const REQUIRED_NETWORK = 'TESTNET';
export const HORIZON_TESTNET_URL = 'https://horizon-testnet.stellar.org';

export interface PersistedWalletState {
  publicKey: string;
  network: string;
  linkedAt?: string;
}

export interface FreighterBridge {
  isConnected: () => Promise<{ isConnected: boolean; error?: string } | boolean>;
  requestAccess: () => Promise<{ address: string; error?: string } | string>;
  getNetwork: () => Promise<{ network: string; networkPassphrase?: string; error?: string } | string>;
  signMessage?: (
    message: string,
    opts?: { address?: string; networkPassphrase?: string },
  ) => Promise<{ signedMessage: string; error?: string } | string>;
}

export interface UseWalletOptions {
  freighter?: FreighterBridge;
  apiBaseUrl?: string;
  horizonUrl?: string;
  fetchImpl?: typeof fetch;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}

export interface UseWalletResult {
  publicKey: string | null;
  truncatedAddress: string | null;
  isConnected: boolean;
  network: string | null;
  isWrongNetwork: boolean;
  xlmBalance: string | null;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: (address?: string) => Promise<void>;
}

/**
 * Formats a 56-character Stellar public key into `GBXP4...K4F2` display notation.
 */
export function truncateStellarAddress(publicKey: string | null | undefined): string | null {
  if (!publicKey || publicKey.length < 10) {
    return publicKey ?? null;
  }
  return `${publicKey.slice(0, 5)}...${publicKey.slice(-4)}`;
}

/**
 * Normalizes a network string returned by `@stellar/freighter-api` into uppercase standard form.
 */
export function normalizeFreighterNetwork(
  raw: { network?: string; error?: string } | string | null | undefined,
): string {
  if (!raw) return 'UNKNOWN';
  if (typeof raw === 'string') return raw.trim().toUpperCase();
  return (raw.network ?? 'UNKNOWN').trim().toUpperCase();
}

/**
 * Resolves the default `@stellar/freighter-api` bridge dynamically or from `window.freighterApi`.
 */
async function resolveDefaultFreighterBridge(): Promise<FreighterBridge> {
  try {
    // Dynamic import of @stellar/freighter-api when installed in the frontend bundle
    const mod = (await import('@stellar/freighter-api')) as unknown as FreighterBridge;
    if (mod && typeof mod.requestAccess === 'function') {
      return mod;
    }
  } catch {
    // Fallback to window injection if bundle import is unavailable in test environments
  }

  const win = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : {};
  const injected = win.freighterApi as FreighterBridge | undefined;
  if (injected && typeof injected.requestAccess === 'function') {
    return injected;
  }

  throw new Error('Freighter wallet extension is not installed or unavailable.');
}

/**
 * Fetches the native XLM balance for a Stellar account from Horizon Testnet.
 */
export async function fetchHorizonXlmBalance(
  publicKey: string,
  horizonUrl: string = HORIZON_TESTNET_URL,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(`${horizonUrl.replace(/\/$/, '')}/accounts/${publicKey}`);
  if (response.status === 404) {
    return '0.00';
  }
  if (!response.ok) {
    throw new Error(`Horizon balance request failed (${response.status})`);
  }
  const data = (await response.json()) as {
    balances?: Array<{ asset_type: string; balance: string }>;
  };
  const native = data.balances?.find((b) => b.asset_type === 'native');
  if (!native) {
    return '0.00';
  }
  return Number.parseFloat(native.balance).toFixed(2);
}

/**
 * Links the connected Stellar wallet with the CrimeReport backend (`POST /auth/link-wallet`)
 * using the public key and a signed challenge message.
 */
export async function linkWalletWithBackend(params: {
  publicKey: string;
  network: string;
  freighter: FreighterBridge;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  const { publicKey, network, freighter, apiBaseUrl = '', fetchImpl = fetch } = params;
  const challenge = `CrimeReport Wallet Link:${publicKey}:${Date.now()}`;
  let signedChallenge = challenge;

  if (typeof freighter.signMessage === 'function') {
    const sigResult = await freighter.signMessage(challenge, { address: publicKey });
    if (typeof sigResult === 'string') {
      signedChallenge = sigResult;
    } else if (sigResult && typeof sigResult.signedMessage === 'string') {
      signedChallenge = sigResult.signedMessage;
    }
  }

  const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/auth/link-wallet`;
  await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      publicKey,
      network,
      challenge,
      signedChallenge,
    }),
  });
}

/**
 * React hook for connecting and managing a Stellar Freighter wallet on Testnet.
 * Exposes `connect()`, `disconnect()`, `publicKey`, `isConnected`, `network`,
 * `isWrongNetwork`, and `xlmBalance`, while persisting session state in `localStorage`.
 */
export function useWallet(options: UseWalletOptions = {}): UseWalletResult {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [xlmBalance, setXlmBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getStorage = useCallback(() => {
    if (options.storage) return options.storage;
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return null;
  }, [options.storage]);

  const refreshBalance = useCallback(
    async (targetKey?: string) => {
      const address = targetKey ?? publicKey;
      if (!address) return;
      try {
        const bal = await fetchHorizonXlmBalance(
          address,
          options.horizonUrl ?? HORIZON_TESTNET_URL,
          options.fetchImpl ?? fetch,
        );
        setXlmBalance(bal);
      } catch {
        setXlmBalance((prev) => prev ?? '0.00');
      }
    },
    [publicKey, options.horizonUrl, options.fetchImpl],
  );

  // Restore persisted wallet session on mount
  useEffect(() => {
    const storage = getStorage();
    if (!storage) return;

    try {
      const raw = storage.getItem(WALLET_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedWalletState;
      if (parsed.publicKey) {
        setPublicKey(parsed.publicKey);
        setNetwork(parsed.network || REQUIRED_NETWORK);
        void refreshBalance(parsed.publicKey);
      }
    } catch {
      storage.removeItem(WALLET_STORAGE_KEY);
    }
  }, [getStorage, refreshBalance]);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const freighter = options.freighter ?? (await resolveDefaultFreighterBridge());
      const accessRes = await freighter.requestAccess();
      const address =
        typeof accessRes === 'string'
          ? accessRes
          : accessRes?.error
            ? (() => {
                throw new Error(accessRes.error);
              })()
            : accessRes?.address;

      if (!address) {
        throw new Error('User rejected Freighter wallet connection.');
      }

      const netRes = await freighter.getNetwork();
      const detectedNetwork = normalizeFreighterNetwork(netRes);

      setPublicKey(address);
      setNetwork(detectedNetwork);

      const storage = getStorage();
      if (storage) {
        const persisted: PersistedWalletState = {
          publicKey: address,
          network: detectedNetwork,
          linkedAt: new Date().toISOString(),
        };
        storage.setItem(WALLET_STORAGE_KEY, JSON.stringify(persisted));
      }

      if (detectedNetwork === REQUIRED_NETWORK) {
        await linkWalletWithBackend({
          publicKey: address,
          network: detectedNetwork,
          freighter,
          apiBaseUrl: options.apiBaseUrl,
          fetchImpl: options.fetchImpl,
        });
        await refreshBalance(address);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect Freighter wallet';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [options.freighter, options.apiBaseUrl, options.fetchImpl, getStorage, refreshBalance]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setNetwork(null);
    setXlmBalance(null);
    setError(null);
    const storage = getStorage();
    storage?.removeItem(WALLET_STORAGE_KEY);
  }, [getStorage]);

  const isConnected = Boolean(publicKey);
  const isWrongNetwork = isConnected && network !== null && network !== REQUIRED_NETWORK;

  return {
    publicKey,
    truncatedAddress: truncateStellarAddress(publicKey),
    isConnected,
    network,
    isWrongNetwork,
    xlmBalance,
    isLoading,
    error,
    connect,
    disconnect,
    refreshBalance,
  };
}
