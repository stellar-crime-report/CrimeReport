import {
  calculateUsdEquivalent,
  DEFAULT_LEADERBOARD,
  formatShortStellarAddress,
  loadHorizonNativeBalance,
  loadMonthlyLeaderboard,
} from '../page';

describe('Stellar Wallet & Rewards page helpers', () => {
  const sampleWallet = 'GBXP47291STELLARREPORTERWALLETADDRESS000000000000000K4F2';

  it('formats truncated Stellar wallet address and disconnected state cleanly', () => {
    expect(formatShortStellarAddress(sampleWallet)).toBe('GBXP4...K4F2');
    expect(formatShortStellarAddress(null)).toBe('Not connected');
  });

  it('computes USD equivalent from XLM balance', () => {
    expect(calculateUsdEquivalent('100.00', 0.12)).toBe('12.00');
    expect(calculateUsdEquivalent(50, 0.2)).toBe('10.00');
  });

  it('loads native XLM balance from Horizon API', async () => {
    const mockFetch = (async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({
          balances: [{ asset_type: 'native', balance: '284.7500000' }],
        }),
      }) as Response) as typeof fetch;

    const balance = await loadHorizonNativeBalance(
      sampleWallet,
      'https://horizon-testnet.stellar.org',
      mockFetch,
    );
    expect(balance).toBe('284.75');
  });

  it('loads top 5 monthly reporters from backend leaderboard API', async () => {
    const mockFetch = (async () =>
      ({
        ok: true,
        status: 200,
        json: async () => DEFAULT_LEADERBOARD,
      }) as Response) as typeof fetch;

    const entries = await loadMonthlyLeaderboard('https://api.crimereport.app', mockFetch);
    expect(entries).toHaveLength(5);
    expect(entries[0].alias).toBe('Anonymous Lion');
    expect(entries[0].earnedXlm).toBe(284);
  });
});
