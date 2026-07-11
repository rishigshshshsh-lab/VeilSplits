import { useState, useEffect } from 'react';
import { Wallet, Coins, Check, Copy, Sun, Moon } from 'lucide-react';

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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('theme-light');
      localStorage.setItem('theme', 'dark');
    }
  }, [theme]);

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
        <div className="flex items-center gap-2">
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Coins size={18} style={{ color: 'white' }} />
          </div>
          <span className="logo" style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
            StellarSplit
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="pulse-badge" style={{ padding: '0.35rem 0.75rem', fontWeight: 600, background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            Stellar Testnet
          </span>

          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem',
              height: '2.25rem',
              width: '2.25rem',
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.06)',
              borderRadius: '0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {address ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopy} 
                className="address-badge tooltip"
                style={{ 
                  cursor: 'pointer', 
                  outline: 'none',
                  background: 'rgba(139, 92, 246, 0.1)',
                  color: '#c084fc',
                  borderColor: 'rgba(139, 92, 246, 0.2)'
                }}
                title="Copy Address"
              >
                {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                <span>{shortenAddress(address)}</span>
                <span className="tooltiptext">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              
              <button
                onClick={disconnect}
                className="btn btn-secondary"
                style={{ 
                  padding: '0.5rem', 
                  height: '2.25rem', 
                  width: '2.25rem',
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  borderRadius: '0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Disconnect Wallet"
              >
                <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
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
