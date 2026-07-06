import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Send, Users, Coins, Info } from 'lucide-react';
import { isValidPublicKey } from '../lib/stellar';

interface SplitFormProps {
  senderAddress: string | null;
  senderBalance: string | null;
  onSendPayments: (recipients: string[], shareAmount: string) => void;
  isSending: boolean;
}

export const SplitForm: React.FC<SplitFormProps> = ({
  senderAddress,
  senderBalance,
  onSendPayments,
  isSending,
}) => {
  const [totalAmount, setTotalAmount] = useState<string>('10');
  const [numPeople, setNumPeople] = useState<number>(3);
  const [includeSender, setIncludeSender] = useState<boolean>(true);
  const [recipients, setRecipients] = useState<string[]>(['']);
  
  // Validation errors state
  const [errors, setErrors] = useState<{
    total?: string;
    people?: string;
    recipients?: string[];
  }>({});

  // Auto-calculate share per person
  const total = parseFloat(totalAmount) || 0;
  const count = numPeople || 1;
  const shareAmount = (total / count).toFixed(7);

  // Automatically adjust recipients list length if they change count or includeSender
  useEffect(() => {
    const expectedRecipientsCount = includeSender ? Math.max(0, numPeople - 1) : numPeople;
    
    setRecipients((prev) => {
      const current = [...prev];
      if (current.length < expectedRecipientsCount) {
        // Add empty fields
        while (current.length < expectedRecipientsCount) {
          current.push('');
        }
      } else if (current.length > expectedRecipientsCount) {
        // Truncate fields
        current.splice(expectedRecipientsCount);
      }
      return current;
    });
  }, [numPeople, includeSender]);

  // Handle adding a recipient manually
  const handleAddRecipient = () => {
    setRecipients([...recipients, '']);
    setNumPeople((prev) => prev + 1);
  };

  // Handle removing a recipient manually
  const handleRemoveRecipient = (index: number) => {
    const nextRecipients = recipients.filter((_, i) => i !== index);
    setRecipients(nextRecipients);
    setNumPeople((prev) => Math.max(1, prev - 1));
  };

  // Handle recipient address change
  const handleRecipientChange = (index: number, value: string) => {
    const nextRecipients = [...recipients];
    nextRecipients[index] = value;
    setRecipients(nextRecipients);
  };

  // Run validation
  const validateForm = () => {
    const nextErrors: typeof errors = {};
    let isValid = true;

    // Validate total amount
    if (total <= 0) {
      nextErrors.total = 'Bill amount must be greater than 0 XLM';
      isValid = false;
    }

    if (senderBalance && total > parseFloat(senderBalance)) {
      nextErrors.total = `Insufficient balance. You need at least ${total} XLM.`;
      isValid = false;
    }

    // Validate number of people
    if (numPeople < 1) {
      nextErrors.people = 'Number of people must be at least 1';
      isValid = false;
    }

    // Validate recipients
    const recipientErrors: string[] = [];
    let hasRecipientError = false;

    recipients.forEach((addr, index) => {
      if (!addr) {
        recipientErrors[index] = 'Wallet address is required';
        hasRecipientError = true;
        isValid = false;
      } else if (!isValidPublicKey(addr)) {
        recipientErrors[index] = 'Invalid Stellar public key format';
        hasRecipientError = true;
        isValid = false;
      } else if (addr === senderAddress) {
        recipientErrors[index] = 'Cannot send payment to your own connected wallet';
        hasRecipientError = true;
        isValid = false;
      } else if (recipients.indexOf(addr) !== index) {
        recipientErrors[index] = 'Duplicate recipient address';
        hasRecipientError = true;
        isValid = false;
      } else {
        recipientErrors[index] = '';
      }
    });

    if (hasRecipientError) {
      nextErrors.recipients = recipientErrors;
    }

    setErrors(nextErrors);
    return isValid;
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSendPayments(recipients, shareAmount);
    }
  };

  // Total required XLM for payments
  const totalPaymentsCost = (parseFloat(shareAmount) * recipients.length).toFixed(7);

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.5rem' }}>
        Bill Splitting Details
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          {/* Total Bill Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="totalAmount">Total Bill Amount (XLM)</label>
            <div className="input-container">
              <span className="input-icon">
                <Coins size={18} />
              </span>
              <input
                id="totalAmount"
                type="number"
                step="any"
                min="0.0000001"
                className="form-input"
                placeholder="e.g. 50.0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                disabled={isSending || !senderAddress}
              />
            </div>
            {errors.total && <span style={{ color: 'var(--error)', fontSize: '0.8rem', fontWeight: 600 }}>{errors.total}</span>}
          </div>

          {/* Number of People Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="numPeople">Number of People to Split With</label>
            <div className="input-container">
              <span className="input-icon">
                <Users size={18} />
              </span>
              <input
                id="numPeople"
                type="number"
                min="1"
                step="1"
                className="form-input"
                placeholder="e.g. 3"
                value={numPeople || ''}
                onChange={(e) => setNumPeople(parseInt(e.target.value) || 0)}
                disabled={isSending || !senderAddress}
              />
            </div>
            {errors.people && <span style={{ color: 'var(--error)', fontSize: '0.8rem', fontWeight: 600 }}>{errors.people}</span>}
          </div>
        </div>

        {/* Include Sender Toggle */}
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          <input
            id="includeSender"
            type="checkbox"
            checked={includeSender}
            onChange={(e) => setIncludeSender(e.target.checked)}
            disabled={isSending || !senderAddress}
            style={{ width: '1.15rem', height: '1.15rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
          <label htmlFor="includeSender" style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}>
            Include myself in the split (I pay my share of {shareAmount} XLM)
          </label>
        </div>

        {/* Dynamic Recipients Input List */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <div className="flex justify-between items-center mb-2" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label">Recipient Wallet Addresses ({recipients.length})</label>
            {!includeSender && (
              <button
                type="button"
                onClick={handleAddRecipient}
                disabled={isSending || !senderAddress}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', gap: '0.25rem' }}
              >
                <Plus size={14} />
                <span>Add Recipient</span>
              </button>
            )}
          </div>

          {recipients.map((recipient, index) => (
            <div key={index} className="flex-col gap-2" style={{ display: 'flex', marginBottom: '0.75rem', width: '100%' }}>
              <div className="recipient-row">
                <div className="input-container" style={{ flexGrow: 1 }}>
                  <span className="input-icon" style={{ left: '0.85rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      #{index + 1}
                    </span>
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Recipient Stellar Public Key (starts with G...)"
                    value={recipient}
                    onChange={(e) => handleRecipientChange(index, e.target.value)}
                    disabled={isSending || !senderAddress}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
                {(!includeSender || recipients.length > 1) && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(index)}
                    disabled={isSending || !senderAddress}
                    className="remove-btn"
                    title="Remove Recipient"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {errors.recipients && errors.recipients[index] && (
                <span style={{ color: 'var(--error)', fontSize: '0.8rem', fontWeight: 600, paddingLeft: '0.5rem', marginTop: '-0.25rem' }}>
                  {errors.recipients[index]}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Calculation Summary Panel */}
        <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Each Person's Share:</span>
            <span style={{ fontWeight: 700, color: 'white' }}>{shareAmount} XLM</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Number of Recipients:</span>
            <span style={{ fontWeight: 700, color: 'white' }}>{recipients.length}</span>
          </div>
          {includeSender && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Sender's Share (Kept):</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>{shareAmount} XLM</span>
            </div>
          )}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0.75rem 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Total Transacted Amount:</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
              {totalPaymentsCost} XLM
            </span>
          </div>
        </div>

        {/* Action Button */}
        {senderAddress ? (
          <button
            type="submit"
            disabled={isSending || recipients.length === 0}
            className="btn btn-primary w-full"
            style={{ padding: '1rem', fontSize: '1.05rem' }}
          >
            {isSending ? (
              <>
                <div className="spinner" style={{ width: '1.2rem', height: '1.2rem', borderWidth: '2px' }}></div>
                <span>Executing Split Payments...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Send Split Payments</span>
              </>
            )}
          </button>
        ) : (
          <div className="alert alert-warning flex items-center gap-2" style={{ margin: 0 }}>
            <Info size={16} />
            <span>Connect your wallet above to input details and send payments.</span>
          </div>
        )}
      </form>
    </div>
  );
};
