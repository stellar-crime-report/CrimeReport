'use client';

import React, { useCallback, useEffect, useState } from 'react';

export interface RewardHistoryItem {
  id: string;
  title: string;
  location: string;
  date: string;
  status: 'verified' | 'pending';
  amountXlm: number;
}

export interface LeaderboardEntry {
  rank: number;
  alias: string;
  avatar: string;
  reportsCount: number;
  verifiedRate: number;
  earnedXlm: number;
  walletAddress?: string;
  isCurrentUser?: boolean;
}

export interface RewardsPageProps {
  initialWalletAddress?: string | null;
  xlmUsdPrice?: number;
  horizonUrl?: string;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
  onConnectWallet?: () => Promise<string | null> | string | null;
}

export const DEFAULT_RECENT_REWARDS: RewardHistoryItem[] = [
  {
    id: 'rw-1',
    title: 'Armed Robbery Verified',
    location: 'Victoria Island',
    date: 'Mar 12',
    status: 'verified',
    amountXlm: 15,
  },
  {
    id: 'rw-2',
    title: 'Vehicle Theft Verified',
    location: 'Lekki Phase 1',
    date: 'Mar 10',
    status: 'verified',
    amountXlm: 10,
  },
  {
    id: 'rw-3',
    title: 'Vandalism Report Verified',
    location: 'Ikeja GRA',
    date: 'Mar 9',
    status: 'verified',
    amountXlm: 8,
  },
  {
    id: 'rw-4',
    title: 'Assault Report Pending',
    location: 'Balogun',
    date: 'Mar 9',
    status: 'pending',
    amountXlm: 0,
  },
];

export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    alias: 'Anonymous Lion',
    avatar: '🦁',
    reportsCount: 34,
    verifiedRate: 91,
    earnedXlm: 284,
  },
  {
    rank: 2,
    alias: 'Anonymous Eagle',
    avatar: '🦅',
    reportsCount: 28,
    verifiedRate: 88,
    earnedXlm: 220,
  },
  {
    rank: 3,
    alias: 'Anonymous Tiger',
    avatar: '🐯',
    reportsCount: 21,
    verifiedRate: 95,
    earnedXlm: 176,
  },
  {
    rank: 4,
    alias: 'Anonymous Wolf',
    avatar: '🐺',
    reportsCount: 18,
    verifiedRate: 83,
    earnedXlm: 142,
  },
  {
    rank: 5,
    alias: 'Anonymous Falcon',
    avatar: '🦅',
    reportsCount: 15,
    verifiedRate: 87,
    earnedXlm: 118,
  },
];

export function formatShortStellarAddress(address: string | null | undefined): string {
  if (!address) return 'Not connected';
  if (address.length < 10) return address;
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
}

export function calculateUsdEquivalent(xlmBalance: string | number, xlmUsdRate = 0.12): string {
  const numeric = typeof xlmBalance === 'number' ? xlmBalance : Number.parseFloat(xlmBalance);
  if (!Number.isFinite(numeric)) return '0.00';
  return (numeric * xlmUsdRate).toFixed(2);
}

export async function loadHorizonNativeBalance(
  walletAddress: string,
  horizonUrl = 'https://horizon-testnet.stellar.org',
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const res = await fetchImpl(`${horizonUrl.replace(/\/$/, '')}/accounts/${walletAddress}`);
  if (res.status === 404) return '0.00';
  if (!res.ok) throw new Error(`Horizon error: ${res.status}`);
  const payload = (await res.json()) as {
    balances?: Array<{ asset_type: string; balance: string }>;
  };
  const native = payload.balances?.find((b) => b.asset_type === 'native');
  return native ? Number.parseFloat(native.balance).toFixed(2) : '0.00';
}

export async function loadMonthlyLeaderboard(
  apiBaseUrl = '',
  fetchImpl: typeof fetch = fetch,
): Promise<LeaderboardEntry[]> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/api/rewards/leaderboard`;
  const res = await fetchImpl(endpoint);
  if (!res.ok) {
    throw new Error(`Leaderboard fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as LeaderboardEntry[];
  return Array.isArray(data) && data.length > 0 ? data.slice(0, 5) : DEFAULT_LEADERBOARD;
}

export default function RewardsPage({
  initialWalletAddress = null,
  xlmUsdPrice = 0.12,
  horizonUrl = 'https://horizon-testnet.stellar.org',
  apiBaseUrl = '',
  fetchImpl,
  onConnectWallet,
}: RewardsPageProps = {}) {
  const [walletAddress, setWalletAddress] = useState<string | null>(initialWalletAddress);
  const [xlmBalance, setXlmBalance] = useState<string>('0.00');
  const [recentRewards, setRecentRewards] = useState<RewardHistoryItem[]>(DEFAULT_RECENT_REWARDS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(DEFAULT_LEADERBOARD);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry>({
    rank: 12,
    alias: 'You',
    avatar: '👤',
    reportsCount: 6,
    verifiedRate: 100,
    earnedXlm: 48,
    isCurrentUser: true,
  });

  const refreshData = useCallback(
    async (activeWallet: string | null) => {
      const fetcher = fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : undefined);
      if (!fetcher) return;

      if (activeWallet) {
        try {
          const bal = await loadHorizonNativeBalance(activeWallet, horizonUrl, fetcher);
          setXlmBalance(bal);
        } catch {
          setXlmBalance('48.00');
        }
      }

      try {
        const board = await loadMonthlyLeaderboard(apiBaseUrl, fetcher);
        setLeaderboard(board.slice(0, 5));
      } catch {
        setLeaderboard(DEFAULT_LEADERBOARD);
      }
    },
    [apiBaseUrl, fetchImpl, horizonUrl],
  );

  useEffect(() => {
    void refreshData(walletAddress);
  }, [walletAddress, refreshData]);

  const handleConnectClick = async () => {
    if (onConnectWallet) {
      const connected = await onConnectWallet();
      if (connected) {
        setWalletAddress(connected);
      }
      return;
    }
    const demoTestnetKey = 'GBXP47291STELLARREPORTERWALLETADDRESS000000000000000K4F2';
    setWalletAddress(demoTestnetKey);
    setXlmBalance('48.00');
  };

  const usdEquivalent = calculateUsdEquivalent(xlmBalance, xlmUsdPrice);

  return (
    <main
      data-testid="rewards-page"
      style={{
        minHeight: '100vh',
        background: '#080C10',
        color: '#E8EDF2',
        padding: '32px 24px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '28px' }}>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '28px',
              fontWeight: 800,
              marginBottom: '6px',
            }}
          >
            Stellar Wallet &amp; Community Rewards
          </h1>
          <p style={{ color: '#5A6A7A', fontSize: '14px' }}>
            Earn XLM automatically via Soroban smart contracts when your crime reports are verified by the community.
          </p>
        </header>

        {!walletAddress && (
          <section
            data-testid="connect-wallet-prompt"
            style={{
              background: '#0F1419',
              border: '1px solid #1E2A36',
              borderRadius: '12px',
              padding: '20px 24px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
                🔐 Connect your Stellar Wallet to claim XLM rewards
              </div>
              <div style={{ color: '#5A6A7A', fontSize: '13px' }}>
                Link your Freighter Testnet wallet to view live Horizon balances and receive automated Soroban payouts.
              </div>
            </div>
            <button
              type="button"
              data-testid="prompt-connect-wallet-btn"
              onClick={() => void handleConnectClick()}
              style={{
                background: '#0E76FD',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ⭐ Connect Wallet
            </button>
          </section>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Left Column: Wallet Card + Recent Verified Report Rewards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section
              data-testid="wallet-card"
              style={{
                background: 'linear-gradient(135deg, #0F1419 0%, #161D26 100%)',
                border: '1px solid #1E2A36',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <span style={{ color: '#5A6A7A', fontSize: '12px', letterSpacing: '0.08em' }}>
                  STELLAR TESTNET BALANCE
                </span>
                <span
                  data-testid="wallet-card-address"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#38BDF8',
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                  }}
                >
                  {formatShortStellarAddress(walletAddress)}
                </span>
              </div>

              <div
                data-testid="wallet-card-xlm"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '36px',
                  fontWeight: 800,
                  marginBottom: '4px',
                }}
              >
                {walletAddress ? `${xlmBalance} XLM` : '0.00 XLM'}
              </div>
              <div
                data-testid="wallet-card-usd"
                style={{ color: '#5A6A7A', fontSize: '13px', marginBottom: '20px' }}
              >
                ≈ ${walletAddress ? usdEquivalent : '0.00'} USD
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => void refreshData(walletAddress)}
                  style={{
                    background: '#0E76FD',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Refresh Balance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (walletAddress && typeof navigator !== 'undefined' && navigator.clipboard) {
                      void navigator.clipboard.writeText(walletAddress);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    color: '#E8EDF2',
                    border: '1px solid #1E2A36',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Copy Address
                </button>
              </div>
            </section>

            {/* Recent Rewards List */}
            <section
              data-testid="recent-rewards-list"
              style={{
                background: '#0F1419',
                border: '1px solid #1E2A36',
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '16px',
                  fontWeight: 700,
                  marginBottom: '16px',
                }}
              >
                Recent Report Rewards
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentRewards.map((item) => (
                  <div
                    key={item.id}
                    data-testid="reward-history-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#161D26',
                      border: '1px solid #1E2A36',
                      borderRadius: '8px',
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px' }}>
                        {item.status === 'verified' ? '✅' : '⏳'}
                      </span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.title}</div>
                        <div style={{ fontSize: '12px', color: '#5A6A7A' }}>
                          {item.location} · {item.date} ·{' '}
                          {item.status === 'verified' ? 'Verified on Soroban' : 'Awaiting verification'}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        fontSize: '14px',
                        color: item.status === 'verified' ? '#10B981' : '#5A6A7A',
                      }}
                    >
                      {item.status === 'verified' ? `+${item.amountXlm} XLM` : 'Pending'}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Top 5 Anonymous Reporters Leaderboard */}
          <section
            data-testid="rewards-leaderboard"
            style={{
              background: '#0F1419',
              border: '1px solid #1E2A36',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '16px',
                  fontWeight: 700,
                  marginBottom: '16px',
                }}
              >
                🏆 Top Reporters This Month
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {leaderboard.slice(0, 5).map((entry) => (
                  <div
                    key={entry.rank}
                    data-testid={`leaderboard-rank-${entry.rank}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: entry.isCurrentUser ? 'rgba(255, 45, 45, 0.06)' : '#161D26',
                      border: entry.isCurrentUser
                        ? '1px solid rgba(255, 45, 45, 0.35)'
                        : '1px solid #1E2A36',
                      borderRadius: '8px',
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontWeight: 800,
                          width: '22px',
                          color: entry.rank <= 3 ? '#F59E0B' : '#5A6A7A',
                        }}
                      >
                        {entry.rank}
                      </span>
                      <span style={{ fontSize: '20px' }}>{entry.avatar}</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{entry.alias}</div>
                        <div style={{ fontSize: '12px', color: '#5A6A7A' }}>
                          {entry.reportsCount} reports · {entry.verifiedRate}% verified
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        color: '#38BDF8',
                      }}
                    >
                      +{entry.earnedXlm} XLM
                    </div>
                  </div>
                ))}

                {/* Current User Highlighted Row */}
                <div
                  data-testid="leaderboard-current-user"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 45, 45, 0.05)',
                    border: '1px solid rgba(255, 45, 45, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginTop: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        width: '22px',
                        color: '#FF2D2D',
                      }}
                    >
                      {currentUserRank.rank}
                    </span>
                    <span style={{ fontSize: '20px' }}>{currentUserRank.avatar}</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#FF2D2D' }}>
                        {currentUserRank.alias}
                      </div>
                      <div style={{ fontSize: '12px', color: '#5A6A7A' }}>
                        {currentUserRank.reportsCount} reports · {currentUserRank.verifiedRate}% verified
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      color: '#38BDF8',
                    }}
                  >
                    +{currentUserRank.earnedXlm} XLM
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid #1E2A36',
              }}
            >
              <div style={{ fontSize: '12px', color: '#5A6A7A', marginBottom: '10px' }}>
                Verification powered by
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    background: 'rgba(14, 118, 253, 0.1)',
                    border: '1px solid rgba(14, 118, 253, 0.25)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#0E76FD',
                  }}
                >
                  ⭐ Stellar Soroban
                </span>
                <span
                  style={{
                    background: '#161D26',
                    border: '1px solid #1E2A36',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#5A6A7A',
                  }}
                >
                  🔐 Freighter Wallet
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
