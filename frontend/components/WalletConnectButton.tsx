import React from 'react';
import { UseWalletOptions, useWallet } from '../hooks/useWallet';

export interface WalletConnectButtonProps {
  walletOptions?: UseWalletOptions;
  className?: string;
}

/**
 * Navbar wallet connection component for CrimeReport.
 * - Triggers `connect()` on "Connect Wallet" click
 * - Displays truncated Stellar address + XLM balance when connected
 * - Displays a prominent "Wrong Network — Switch to Testnet" warning if not on TESTNET
 */
export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  walletOptions,
  className = '',
}) => {
  const {
    truncatedAddress,
    isConnected,
    isWrongNetwork,
    xlmBalance,
    isLoading,
    error,
    connect,
    disconnect,
  } = useWallet(walletOptions);

  if (!isConnected) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => void connect()}
          disabled={isLoading}
          data-testid="connect-wallet-btn"
          style={{
            background: '#0E76FD',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            cursor: isLoading ? 'wait' : 'pointer',
          }}
        >
          {isLoading ? 'Connecting...' : '⭐ Connect Wallet'}
        </button>
        {error && (
          <span
            role="alert"
            data-testid="wallet-error"
            style={{ color: '#FF2D2D', fontSize: '12px' }}
          >
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {isWrongNetwork && (
        <span
          role="alert"
          data-testid="wrong-network-warning"
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid #F59E0B',
            color: '#F59E0B',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          ⚠️ Wrong Network (Testnet Required)
        </span>
      )}

      <div
        data-testid="connected-wallet-pill"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          background: '#161D26',
          border: '1px solid #1E2A36',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          color: '#E8EDF2',
        }}
      >
        <span
          data-testid="wallet-balance"
          style={{ color: '#38BDF8', fontWeight: 600 }}
        >
          {xlmBalance ?? '0.00'} XLM
        </span>
        <span
          data-testid="wallet-truncated-address"
          style={{ fontFamily: 'monospace', color: '#E8EDF2' }}
        >
          {truncatedAddress}
        </span>
        <button
          type="button"
          onClick={disconnect}
          data-testid="disconnect-wallet-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#5A6A7A',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default WalletConnectButton;
