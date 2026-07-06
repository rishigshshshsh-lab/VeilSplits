import React, { useState } from 'react';
import { Wallet, LogOut, Coins, Check, Copy } from 'lucide-react';

interface HeaderProps {
  address: string | null;
  connect: () => void;
  disconnect: () => void;
  isConnecting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  address,
  connect,
  disconnect,
  isConnecting,
}) => {
  const [copied, setCopied] = useState(false);

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header>
      <div className="container header-inner">
        <div className="logo">
          <Coins size={28} style={{ color: '#8b5cf6' }} />
          <span>StellarSplit</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="pulse-badge status-pending" style={{ padding: '0.35rem 0.75rem', fontWeight: 700 }}>
            Stellar Testnet
          </span>

          {address ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopy} 
                className="address-badge tooltip"
                style={{ cursor: 'pointer', outline: 'none' }}
                title="Copy Address"
              >
                {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                <span>{shortenAddress(address)}</span>
                <span className="tooltiptext">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              
              <button
                onClick={disconnect}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.75rem', height: '2.25rem' }}
                title="Disconnect Wallet"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem', height: '2.25rem' }}
            >
              {isConnecting ? (
                <>
                  <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet size={16} />
                  <span>Connect Wallet</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
