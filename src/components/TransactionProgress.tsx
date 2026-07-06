import React from 'react';
import { ExternalLink, CheckCircle, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';

export interface PaymentStatus {
  recipient: string;
  amount: string;
  status: 'idle' | 'pending' | 'success' | 'failed';
  txHash?: string;
  error?: string;
}

interface TransactionProgressProps {
  payments: PaymentStatus[];
  isSending?: boolean;
  onReset: () => void;
}

export const TransactionProgress: React.FC<TransactionProgressProps> = ({
  payments,
  onReset,
}) => {
  const total = payments.length;
  const completed = payments.filter((p) => p.status === 'success' || p.status === 'failed').length;
  const succeededCount = payments.filter((p) => p.status === 'success').length;
  const failedCount = payments.filter((p) => p.status === 'failed').length;
  const isFinished = completed === total && total > 0;

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  const getStatusBadge = (payment: PaymentStatus) => {
    switch (payment.status) {
      case 'pending':
        return (
          <span className="pulse-badge status-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Loader2 size={12} className="spinner" />
            <span>Pending</span>
          </span>
        );
      case 'success':
        return (
          <span className="pulse-badge status-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle size={12} />
            <span>Success</span>
          </span>
        );
      case 'failed':
        return (
          <span className="pulse-badge status-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <XCircle size={12} />
            <span>Failed</span>
          </span>
        );
      case 'idle':
      default:
        return (
          <span className="pulse-badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: '1px solid var(--border-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} />
            <span>Queued</span>
          </span>
        );
    }
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.5rem' }}>
          {isFinished ? 'Split Payments Completed' : 'Processing Split Payments'}
        </h2>
        
        {/* Progress bar */}
        {total > 0 && !isFinished && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              <span>Sending payments...</span>
              <span>{completed} of {total} processed</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  background: 'linear-gradient(90deg, var(--primary), var(--secondary))', 
                  width: `${(completed / total) * 100}%`,
                  transition: 'width 0.4s ease'
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Overall Summary at the end */}
      {isFinished && (
        <div style={{ 
          background: failedCount > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)', 
          border: `1px solid ${failedCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`,
          padding: '1.25rem', 
          borderRadius: '0.75rem', 
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <div className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: '1.05rem', color: failedCount > 0 ? '#fca5a5' : '#a7f3d0', marginBottom: '0.5rem' }}>
            {failedCount > 0 ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <span>{failedCount > 0 ? 'Split Complete with Failures' : 'All Split Payments Sent!'}</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            We processed {total} transactions:
          </p>
          <div className="flex gap-4 mt-4" style={{ marginTop: '0.5rem' }}>
            <span className="pulse-badge status-success" style={{ padding: '0.35rem 0.75rem', fontWeight: 600 }}>
              {succeededCount} Succeeded
            </span>
            {failedCount > 0 && (
              <span className="pulse-badge status-error" style={{ padding: '0.35rem 0.75rem', fontWeight: 600 }}>
                {failedCount} Failed
              </span>
            )}
          </div>
        </div>
      )}

      {/* Transactions Details Table */}
      <div className="table-container" style={{ margin: '1.5rem 0' }}>
        <table className="summary-table">
          <thead>
            <tr>
              <th>Recipient</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, index) => (
              <tr key={index} style={{ background: payment.status === 'pending' ? 'rgba(139, 92, 246, 0.03)' : 'transparent' }}>
                <td>
                  <div className="flex flex-col">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Recipient #{index + 1}
                    </span>
                    <span className="address-badge" style={{ marginTop: '0.25rem', alignSelf: 'flex-start' }}>
                      {shortenAddress(payment.recipient)}
                    </span>
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {payment.amount} XLM
                </td>
                <td>
                  {getStatusBadge(payment)}
                </td>
                <td>
                  {payment.status === 'success' && payment.txHash && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${payment.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-explorer"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <span>Explorer</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                  {payment.status === 'failed' && payment.error && (
                    <div style={{ color: 'var(--error)', fontSize: '0.8rem', maxWidth: '180px', wordBreak: 'break-word', lineHeight: '1.2' }}>
                      {payment.error}
                    </div>
                  )}
                  {payment.status === 'idle' && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Waiting...</span>
                  )}
                  {payment.status === 'pending' && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Submitting...</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFinished && (
        <button
          onClick={onReset}
          className="btn btn-secondary w-full"
          style={{ padding: '0.75rem' }}
        >
          Back to Split Form
        </button>
      )}
    </div>
  );
};
