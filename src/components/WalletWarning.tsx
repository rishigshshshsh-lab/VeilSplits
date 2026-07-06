import React from 'react';
import { AlertTriangle, Download } from 'lucide-react';

interface WalletWarningProps {
  isInstalled: boolean | null;
}

export const WalletWarning: React.FC<WalletWarningProps> = ({ isInstalled }) => {
  if (isInstalled === true || isInstalled === null) {
    return null;
  }

  return (
    <div className="container" style={{ marginTop: '1.5rem' }}>
      <div className="alert alert-warning flex items-center justify-between" style={{ margin: 0 }}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>
              Freighter Wallet Not Detected
            </strong>
            <span>
              To split bills and send Stellar transactions, you need the Freighter browser extension.
            </span>
          </div>
        </div>
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ 
            fontSize: '0.85rem', 
            padding: '0.5rem 1rem', 
            gap: '0.35rem',
            whiteSpace: 'nowrap',
            marginLeft: '1rem',
            boxShadow: 'none',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          }}
        >
          <Download size={14} />
          Get Freighter
        </a>
      </div>
    </div>
  );
};
