import React, { useState } from 'react';
import { Send, Users, Coins, Shield, RefreshCw } from 'lucide-react';
import { isValidPublicKey } from '../lib/stellar';
import { useToast } from './Toast';
import { Skeleton } from './Skeletons';

interface CreateBillProps {
  senderAddress: string | null;
  onSendPrivateBill: (recipients: string[], totalAmount: string, isRecurring: boolean) => Promise<any[]>; // returns array of stealth addresses
}

export const CreateBill: React.FC<CreateBillProps> = ({
  senderAddress,
  onSendPrivateBill,
}) => {
  const [totalAmount, setTotalAmount] = useState<string>('10');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [isSending, setIsSending] = useState(false);
  const [stealthAddresses, setStealthAddresses] = useState<{ recipient: string, address: string }[]>([]);
  
  const { showToast } = useToast();

  const handleAddRecipient = () => setRecipients([...recipients, '']);
  const handleRemoveRecipient = (index: number) => setRecipients(recipients.filter((_, i) => i !== index));
  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderAddress) {
      showToast('Please connect your wallet first', 'error');
      return;
    }
    
    // Basic validation
    if (parseFloat(totalAmount) <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }
    
    for (const rec of recipients) {
      if (!isValidPublicKey(rec)) {
        showToast(`Invalid public key: ${rec.substring(0, 10)}...`, 'error');
        return;
      }
    }

    setIsSending(true);
    try {
      const generatedAddresses = await onSendPrivateBill(recipients, totalAmount, isRecurring);
      const mapped = recipients.map((r, i) => ({ recipient: r, address: generatedAddresses[i] }));
      setStealthAddresses(mapped);
      showToast('Private Bill created successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to create bill', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (stealthAddresses.length > 0) {
    return (
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--success)' }}>
          <Shield size={24} />
          Private Bill Created
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Share these one-time stealth addresses with the participants. They can claim their funds without exposing their main wallet addresses on-chain.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {stealthAddresses.map((s, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Participant {idx + 1} ({s.recipient.substring(0,6)}...{s.recipient.substring(50)})</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--primary)', wordBreak: 'break-all' }}>
                {s.address}
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setStealthAddresses([])}>
          Create Another Bill
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          <Shield size={24} color="var(--primary)" />
          Create Private Bill (VeilSplit)
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="totalAmountPrivate">Total Bill Amount (XLM)</label>
            <div className="input-container">
              <span className="input-icon"><Coins size={18} /></span>
              <input
                id="totalAmountPrivate"
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
          </div>

          <div className="form-group">
            <label className="form-label">Bill Type</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="billType"
                  checked={!isRecurring}
                  onChange={() => setIsRecurring(false)}
                  disabled={isSending || !senderAddress}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>One-time</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="billType"
                  checked={isRecurring}
                  onChange={() => setIsRecurring(true)}
                  disabled={isSending || !senderAddress}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}><RefreshCw size={14}/> Recurring</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <div className="flex justify-between items-center mb-2" style={{ marginBottom: '0.5rem' }}>
            <label className="form-label">Participant Wallet Addresses ({recipients.length})</label>
            <button
              type="button"
              onClick={handleAddRecipient}
              disabled={isSending || !senderAddress}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', gap: '0.25rem' }}
            >
              Add Participant
            </button>
          </div>

          {recipients.map((recipient, index) => (
            <div key={index} className="flex-col gap-2" style={{ display: 'flex', marginBottom: '0.75rem', width: '100%' }}>
              <div className="recipient-row" style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="input-container" style={{ flexGrow: 1 }}>
                  <span className="input-icon" style={{ left: '0.85rem' }}>
                    <Users size={16} color="var(--text-muted)" />
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
                {recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(index)}
                    disabled={isSending || !senderAddress}
                    className="remove-btn btn-secondary"
                    style={{ padding: '0 1rem', background: 'rgba(255,50,50,0.1)', color: '#ff5555' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            <Shield size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem', color: 'var(--primary)' }} />
            This bill uses <strong>hashed commitments</strong>. The blockchain will only record a hash of the total amount and one-time stealth addresses for participants, ensuring privacy.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSending || recipients.length === 0 || !senderAddress}
          className="btn-cta"
        >
          {isSending ? (
            <>
              <div className="spinner" style={{ width: '1.2rem', height: '1.2rem', borderWidth: '2px' }}></div>
              <span>Creating Private Bill...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Create Private Bill</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
