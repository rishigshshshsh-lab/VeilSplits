import React from 'react';
import { ExternalLink, CheckCircle, XCircle, Clock, Loader2, Copy, Check, FileText, UserCheck } from 'lucide-react';

const CopyHashButton: React.FC<{ hash: string }> = ({ hash }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="btn btn-secondary"
      style={{ 
        padding: '0.2rem 0.4rem', 
        fontSize: '0.75rem', 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginLeft: '0.5rem',
        height: '1.5rem',
        minWidth: '1.5rem',
        verticalAlign: 'middle',
        cursor: 'pointer'
      }}
      title="Copy Transaction Hash"
    >
      {copied ? <Check size={10} style={{ color: '#10b981' }} /> : <Copy size={10} />}
    </button>
  );
};

export const ContractCallErrorDisplay: React.FC<{ error: string }> = ({ error }) => {
  const isSimulationError = error.includes('SimulationError') || error.includes('Simulation');
  const isTimeoutError = error.includes('TimeoutError') || error.includes('Timeout');

  return (
    <div className="alert alert-error" style={{ margin: '1rem 0 0 0', display: 'block', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem', color: '#fca5a5' }}>
        {isSimulationError ? 'Smart Contract Simulation Failed' : isTimeoutError ? 'Soroban RPC Network Timeout' : 'Smart Contract Execution Error'}
      </div>
      <p style={{ fontSize: '0.85rem', lineHeight: '1.4', margin: 0, color: 'var(--text-secondary)' }}>
        {isSimulationError 
          ? 'The smart contract call failed simulation. This usually indicates invalid input parameters, non-existent split ID, or insufficient privileges.' 
          : isTimeoutError 
            ? 'The transaction was submitted but the RPC server timed out waiting for confirmation. It may still be included in a future block. Check the activity feed.' 
            : 'The contract call failed to execute. Ensure you have supported network status.'}
      </p>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.5rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
        Details: {error}
      </div>
    </div>
  );
};

export const CompactErrorDisplay: React.FC<{ error: string }> = ({ error }) => {
  const isSimulationError = error.includes('SimulationError') || error.includes('Simulation');
  const isTimeoutError = error.includes('TimeoutError') || error.includes('Timeout');

  return (
    <div style={{ 
      background: 'rgba(239, 68, 68, 0.08)', 
      border: '1px solid rgba(239, 68, 68, 0.2)', 
      padding: '0.5rem', 
      borderRadius: '0.5rem',
      color: '#fca5a5',
      fontSize: '0.75rem',
      marginTop: '0.25rem',
      maxWidth: '220px',
      wordBreak: 'break-word',
      textAlign: 'left'
    }}>
      <strong style={{ display: 'block', color: '#f87171' }}>
        {isSimulationError ? 'Sim Fail' : isTimeoutError ? 'RPC Timeout' : 'Fail'}
      </strong>
      <span style={{ opacity: 0.8 }}>{error.replace('SimulationError: ', '').replace('TimeoutError: ', '')}</span>
    </div>
  );
};

export interface ContractCallStatus {
  status: 'idle' | 'pending' | 'submitted' | 'success' | 'failed';
  txHash?: string;
  error?: string;
}

export interface ParticipantSplitStatus {
  recipient: string;
  amount: string;
  paymentStatus: 'idle' | 'pending' | 'submitted' | 'success' | 'failed';
  paymentTxHash?: string;
  paymentError?: string;
  markPaidStatus: 'idle' | 'pending' | 'submitted' | 'success' | 'failed';
  markPaidTxHash?: string;
  markPaidError?: string;
  onChainPaid: boolean;
}

interface TransactionProgressProps {
  billId: string;
  createSplit: ContractCallStatus;
  participants: ParticipantSplitStatus[];
  isSending: boolean;
  onReset: () => void;
}

export const TransactionProgress: React.FC<TransactionProgressProps> = ({
  billId,
  createSplit,
  participants,
  isSending,
  onReset,
}) => {
  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  // Operations progress calculation
  // Total ops = 1 (create_split) + 2 * recipients.length (XLM payment + mark_paid)
  const totalOps = 1 + 2 * participants.length;
  let completedOps = 0;
  
  if (createSplit.status === 'success' || createSplit.status === 'failed') completedOps++;
  participants.forEach(p => {
    if (p.paymentStatus === 'success' || p.paymentStatus === 'failed') completedOps++;
    if (p.markPaidStatus === 'success' || p.markPaidStatus === 'failed') completedOps++;
  });

  const isFinished = completedOps === totalOps && !isSending;

  const getStatusBadge = (status: 'idle' | 'pending' | 'submitted' | 'success' | 'failed') => {
    switch (status) {
      case 'pending':
        return (
          <span className="pulse-badge status-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Loader2 size={12} className="spinner" />
            <span>Approve...</span>
          </span>
        );
      case 'submitted':
        return (
          <span className="pulse-badge status-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <Loader2 size={12} className="spinner" />
            <span>Mining...</span>
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
        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            On-Chain Bill Splitting Process
          </h2>
          <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.50rem', borderRadius: '0.375rem', color: 'var(--text-secondary)' }}>
            ID: <strong style={{ color: 'var(--primary)' }}>{billId}</strong>
          </span>
        </div>
        
        {/* Overall Progress bar */}
        {!isFinished && (
          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              <span>Executing split payment flow steps...</span>
              <span>{completedOps} of {totalOps} steps complete</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  background: 'linear-gradient(90deg, var(--primary), var(--secondary))', 
                  width: `${(completedOps / totalOps) * 100}%`,
                  transition: 'width 0.4s ease'
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Contract registry setup step */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.02)', 
        border: '1px solid var(--border-muted)', 
        padding: '1.25rem', 
        borderRadius: '0.75rem', 
        marginBottom: '1.5rem',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: '1rem', color: 'white' }}>
            <FileText size={18} style={{ color: 'var(--primary)' }} />
            <span>1. Create Split Registry On-Chain</span>
          </div>
          <div>{getStatusBadge(createSplit.status)}</div>
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Calls <code>create_split(bill_id, total_amount, participants)</code> on the Soroban smart contract.
        </div>
        {createSplit.txHash && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Transaction:</span>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${createSplit.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link-explorer"
              style={{ marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>{createSplit.txHash.slice(0, 12)}...{createSplit.txHash.slice(-12)}</span>
              <ExternalLink size={12} />
            </a>
            <CopyHashButton hash={createSplit.txHash} />
          </div>
        )}
        {createSplit.error && (
          <ContractCallErrorDisplay error={createSplit.error} />
        )}
      </div>

      {/* Recipients detail section */}
      <div className="table-container" style={{ margin: '1.5rem 0' }}>
        <table className="summary-table">
          <thead>
            <tr>
              <th>Recipient</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>XLM Payment</th>
              <th>On-Chain Status</th>
              <th>Registry Status</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant, index) => (
              <tr key={index} style={{ background: (participant.paymentStatus === 'pending' || participant.markPaidStatus === 'pending') ? 'rgba(139, 92, 246, 0.03)' : 'transparent' }}>
                <td data-label="Recipient">
                  <div className="flex flex-col">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      #{index + 1}
                    </span>
                    <span className="address-badge" style={{ marginTop: '0.25rem', alignSelf: 'flex-start' }}>
                      {shortenAddress(participant.recipient)}
                    </span>
                  </div>
                </td>
                <td data-label="Amount" style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {participant.amount} XLM
                </td>
                {/* XLM Payment transaction status */}
                <td data-label="XLM Payment">
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(participant.paymentStatus)}
                    {participant.paymentTxHash && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${participant.paymentTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-explorer"
                        style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}
                      >
                        <span>Tx Link</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                    {participant.paymentError && (
                      <CompactErrorDisplay error={participant.paymentError} />
                    )}
                  </div>
                </td>
                {/* On chain paid state synced in real time */}
                <td data-label="On-Chain Status">
                  {participant.onChainPaid ? (
                    <span className="pulse-badge status-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <UserCheck size={12} />
                      <span>Paid ✅</span>
                    </span>
                  ) : (
                    <span className="pulse-badge status-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Loader2 size={12} className="spinner" />
                      <span>Pending</span>
                    </span>
                  )}
                </td>
                {/* Mark Paid Registry contract status */}
                <td data-label="Registry Status">
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(participant.markPaidStatus)}
                    {participant.markPaidTxHash && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${participant.markPaidTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-explorer"
                        style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}
                      >
                        <span>Tx Link</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                    {participant.markPaidError && (
                      <CompactErrorDisplay error={participant.markPaidError} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Done summary */}
      {isFinished && (
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.05)', 
          border: '1px solid rgba(16, 185, 129, 0.15)',
          padding: '1.25rem', 
          borderRadius: '0.75rem', 
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <div className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: '1.05rem', color: '#a7f3d0', marginBottom: '0.5rem' }}>
            <CheckCircle size={20} />
            <span>Bill Split Registry & Payments Complete!</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            The bill was successfully recorded on-chain, all payments were routed, and all recipients are registry-marked as Paid.
          </p>
        </div>
      )}

      {(!isSending || isFinished) && (
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
