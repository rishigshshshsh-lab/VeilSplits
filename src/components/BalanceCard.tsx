import React from 'react';
import { RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';

interface BalanceCardProps {
  address: string | null;
  balance: string | null;
  loadingBalance: boolean;
  error: string | null;
  refreshBalance: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  address,
  balance,
  loadingBalance,
  error,
  refreshBalance,
}) => {
  if (!address) {
    return (
      <div className="card text-center" style={{ padding: '3rem 2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>
          Wallet Disconnected
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
          Connect your Freighter wallet on Stellar Testnet to check your balance, set up recipients, and execute splits.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Your Wallet
        </h2>
        <button
          onClick={refreshBalance}
          disabled={loadingBalance}
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          title="Refresh Balance"
        >
          <RefreshCw size={14} className={loadingBalance ? 'spinner' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-muted)' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
          CONNECTED ADDRESS
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', wordBreak: 'break-all', color: 'var(--text-main)' }}>
          {address}
        </div>

        <div style={{ margin: '1.25rem 0 0.5rem 0', height: '1px', background: 'var(--border-muted)' }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>XLM Balance</span>
          {loadingBalance ? (
            <div className="skeleton" style={{ height: '2.5rem', width: '150px', borderRadius: '8px' }}></div>
          ) : error ? (
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>0.00 XLM</span>
          ) : (
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)' }}>
              {balance ? parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 }) : '0.00'} XLM
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error flex items-start gap-2 mt-4" style={{ margin: '1rem 0 0 0' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.125rem' }}>
              Account Issue
            </strong>
            <span style={{ fontSize: '0.85rem' }}>
              {error}
            </span>
            <div className="mt-4" style={{ marginTop: '0.5rem' }}>
              <a
                href={`https://laboratory.stellar.org/#friendbot?addr=${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-explorer"
                style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>Fund Account with Friendbot</span>
                <ExternalLink size={12} />
              </a>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.35rem', lineHeight: '1.4' }}>
                Friendbot is a Testnet funding tool that immediately credits your account with 10,000 test XLM so you can perform splits.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
