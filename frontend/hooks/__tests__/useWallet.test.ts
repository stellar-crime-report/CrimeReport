import {
  fetchHorizonXlmBalance,
  FreighterBridge,
  linkWalletWithBackend,
  normalizeFreighterNetwork,
  truncateStellarAddress,
} from '../useWallet';

describe('useWallet helpers & Freighter integration', () => {
  const samplePublicKey = 'GBXP47291STELLARREPORTERWALLETADDRESS000000000000000K4F2';

  it('truncates Stellar public keys to 5-prefix and 4-suffix format', () => {
    expect(truncateStellarAddress(samplePublicKey)).toBe('GBXP4...K4F2');
    expect(truncateStellarAddress(null)).toBeNull();
  });

  it('normalizes Freighter network responses and detects non-testnet networks', () => {
    expect(normalizeFreighterNetwork({ network: 'testnet' })).toBe('TESTNET');
    expect(normalizeFreighterNetwork('PUBLIC')).toBe('PUBLIC');
    expect(normalizeFreighterNetwork(null)).toBe('UNKNOWN');
  });

  it('posts public key and signed challenge to /auth/link-wallet after connecting', async () => {
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchCalls.push({ url: String(input), init });
      return {
        ok: true,
        status: 200,
        json: async () => ({ linked: true }),
      } as Response;
    }) as typeof fetch;

    const mockFreighter: FreighterBridge = {
      isConnected: async () => ({ isConnected: true }),
      requestAccess: async () => ({ address: samplePublicKey }),
      getNetwork: async () => ({ network: 'TESTNET' }),
      signMessage: async (msg: string) => ({ signedMessage: `signed:${msg}` }),
    };

    await linkWalletWithBackend({
      publicKey: samplePublicKey,
      network: 'TESTNET',
      freighter: mockFreighter,
      apiBaseUrl: 'https://api.crimereport.app',
      fetchImpl: mockFetch,
    });

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe('https://api.crimereport.app/auth/link-wallet');
    const body = JSON.parse(String(fetchCalls[0].init?.body)) as {
      publicKey: string;
      network: string;
      signedChallenge: string;
    };
    expect(body.publicKey).toBe(samplePublicKey);
    expect(body.network).toBe('TESTNET');
    expect(body.signedChallenge).toContain('signed:CrimeReport Wallet Link:');
  });

  it('fetches and formats native XLM balance from Horizon API', async () => {
    const mockFetch = (async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({
          balances: [
            { asset_type: 'credit_alphanum4', balance: '100.0000000' },
            { asset_type: 'native', balance: '142.5000000' },
          ],
        }),
      }) as Response) as typeof fetch;

    const balance = await fetchHorizonXlmBalance(
      samplePublicKey,
      'https://horizon-testnet.stellar.org',
      mockFetch,
    );
    expect(balance).toBe('142.50');
  });
});
