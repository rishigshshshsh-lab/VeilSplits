import { useState, useEffect, useRef } from 'react';
import { useWallet } from './hooks/useWallet';
import { Header } from './components/Header';
import { WalletWarning } from './components/WalletWarning';
import { BalanceCard } from './components/BalanceCard';
import { SplitForm } from './components/SplitForm';
import { TransactionProgress } from './components/TransactionProgress';
import type { ContractCallStatus, ParticipantSplitStatus } from './components/TransactionProgress';
import { sendPayment, executeContractCall, getSplitStatusOnChain, NOTIFIER_CONTRACT_ID } from './lib/stellar';
import { Address, nativeToScVal } from '@stellar/stellar-sdk';
import { ActivityFeed } from './components/ActivityFeed';
import { CreateBill } from './components/CreateBill';
import { createPrivateBillOnChain } from './lib/stellar';
import { OnboardingFlow } from './components/OnboardingFlow';
import { FeedbackWidget } from './components/FeedbackWidget';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  const {
    address,
    balance,
    isInstalled,
    loadingBalance,
    isConnecting,
    error,
    connect,
    disconnect,
    refreshBalance,
  } = useWallet();

  const [isSending, setIsSending] = useState(false);
  const [billId, setBillId] = useState<string>('');
  const [createSplit, setCreateSplit] = useState<ContractCallStatus>({ status: 'idle' });
  const [participants, setParticipants] = useState<ParticipantSplitStatus[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [billMode, setBillMode] = useState<'private' | 'standard'>('private');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdmin(window.location.hash === '#admin');
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Keep a reference to the active polling interval to clear it on unmount or reset
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleSendPayments = async (recipients: string[], shareAmount: string) => {
    if (!address) return;

    // Generate a unique bill ID for this session
    const generatedBillId = `bill-${Date.now()}`;
    setBillId(generatedBillId);

    // Calculate total amount in stroops (Stellar base units, 7 decimals)
    const totalAmount = parseFloat(shareAmount) * recipients.length;
    const totalStroops = BigInt(Math.round(totalAmount * 10000000));

    // Initialize state
    setCreateSplit({ status: 'idle' });
    const initialParticipants: ParticipantSplitStatus[] = recipients.map((recipient) => ({
      recipient,
      amount: shareAmount,
      paymentStatus: 'idle',
      markPaidStatus: 'idle',
      onChainPaid: false,
    }));
    setParticipants(initialParticipants);
    setShowProgress(true);
    setIsSending(true);

    try {
      // 1. Create split on-chain via smart contract invocation
      await executeContractCall(
        address,
        'create_split',
        [
          nativeToScVal(generatedBillId),
          nativeToScVal(totalStroops, { type: 'u64' }),
          nativeToScVal(recipients.map(p => Address.fromString(p))),
          nativeToScVal(Address.fromString(address!)),
          nativeToScVal(Address.fromString(NOTIFIER_CONTRACT_ID)),
        ],
        (status, txHash, errorMsg) => {
          setCreateSplit({ status, txHash, error: errorMsg });
        }
      );

      // Start real-time contract status polling to check when registry changes to Paid ✅
      pollIntervalRef.current = setInterval(async () => {
        const onChainStatus = await getSplitStatusOnChain(generatedBillId);
        if (onChainStatus && onChainStatus.participants) {
          setParticipants((prev) =>
            prev.map((p) => {
              const match = onChainStatus.participants.find(
                (sp: any) => sp.address === p.recipient
              );
              return match ? { ...p, onChainPaid: match.paid } : p;
            })
          );
        }
      }, 3000);

      // 2. Loop through recipients sequentially to execute XLM payment & mark paid
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];

        // Process XLM Payment
        let paymentSuccess = false;
        try {
          await sendPayment(address, recipient, shareAmount, (status, txHash, errorMsg) => {
            setParticipants((prev) =>
              prev.map((p, idx) =>
                idx === i
                  ? { ...p, paymentStatus: status, paymentTxHash: txHash, paymentError: errorMsg }
                  : p
              )
            );
          });
          paymentSuccess = true;
        } catch (paymentErr) {
          console.error(`XLM Payment to ${recipient} failed:`, paymentErr);
        }

        // If payment was successful, mark the participant as paid in the contract
        if (paymentSuccess) {
          try {
            await executeContractCall(
              address,
              'mark_paid',
              [
                nativeToScVal(generatedBillId),
                nativeToScVal(Address.fromString(recipient)),
              ],
              (status, txHash, errorMsg) => {
                setParticipants((prev) =>
                  prev.map((p, idx) =>
                    idx === i
                      ? { ...p, markPaidStatus: status, markPaidTxHash: txHash, markPaidError: errorMsg }
                      : p
                  )
                );
              }
            );
          } catch (contractErr) {
            console.error(`Marking paid on-chain failed for ${recipient}:`, contractErr);
          }
        }

        // Refresh sender balance to keep state synced
        await refreshBalance();
      }

    } catch (flowErr) {
      console.error('Split flow failed at initialization:', flowErr);
    } finally {
      // Clear background polling interval once flow completes
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      // Do a final fetch of the on-chain status to ensure complete sync
      const finalStatus = await getSplitStatusOnChain(generatedBillId);
      if (finalStatus && finalStatus.participants) {
        setParticipants((prev) =>
          prev.map((p) => {
            const match = finalStatus.participants.find(
              (sp: any) => sp.address === p.recipient
            );
            return match ? { ...p, onChainPaid: match.paid } : p;
          })
        );
      }

      setIsSending(false);
      await refreshBalance();
    }
  };

  const handleReset = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setBillId('');
    setCreateSplit({ status: 'idle' });
    setParticipants([]);
    setShowProgress(false);
    setIsSending(false);
    refreshBalance();
  };

  if (isAdmin) {
    return (
      <>
        <Header address={address} connect={connect} disconnect={disconnect} isConnecting={isConnecting} />
        <AdminDashboard />
      </>
    );
  }

  return (
    <>
      <OnboardingFlow onConnectWallet={connect} />
      <FeedbackWidget />
      
      {/* Premium Background - Aurora + Grain */}
      <div className="aurora-bg">
        <div className="aurora-circle-1" style={{ background: billMode === 'private' ? 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0) 70%)' : undefined }}></div>
        <div className="aurora-circle-2" style={{ background: billMode === 'private' ? 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0) 70%)' : undefined }}></div>
        <div className="aurora-grain"></div>
      </div>

      <Header
        address={address}
        connect={connect}
        disconnect={disconnect}
        isConnecting={isConnecting}
      />

      <WalletWarning isInstalled={isInstalled} />

      <main className="container" style={{ flexGrow: 1, padding: '2rem 1.5rem' }}>
        <div className="hero">
          <h1>Split Bills, Privately.</h1>
          <p>
            Split expenses and settle up on the Stellar Testnet without linking repeated payments, backed by a Soroban registry with one-time stealth addresses.
          </p>
        </div>

        {showProgress ? (
          <div className="glowing-wrapper">
            <div className="glowing-glow"></div>
            <div className="glowing-content">
              <TransactionProgress
                billId={billId}
                createSplit={createSplit}
                participants={participants}
                isSending={isSending}
                onReset={handleReset}
              />
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button 
                  className={`btn ${billMode === 'private' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '8px', border: 'none', padding: '0.5rem 1.5rem', background: billMode === 'private' ? 'var(--primary)' : 'transparent' }}
                  onClick={() => setBillMode('private')}
                >
                  VeilSplit (Private)
                </button>
                <button 
                  className={`btn ${billMode === 'standard' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '8px', border: 'none', padding: '0.5rem 1.5rem', background: billMode === 'standard' ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                  onClick={() => setBillMode('standard')}
                >
                  Standard Split
                </button>
              </div>
            </div>

            <div className="grid-2">
              <div className="glowing-wrapper">
                <div className="glowing-glow"></div>
                <div className="glowing-content">
                  <BalanceCard
                    address={address}
                    balance={balance}
                    loadingBalance={loadingBalance}
                    error={error}
                    refreshBalance={refreshBalance}
                  />
                </div>
              </div>

              <div className="glowing-wrapper">
                <div className="glowing-glow"></div>
                <div className="glowing-content">
                  {billMode === 'private' ? (
                    <CreateBill
                      senderAddress={address}
                      onSendPrivateBill={(recipients, totalAmount, isRecurring) => 
                        createPrivateBillOnChain(address!, recipients, totalAmount, isRecurring)
                      }
                    />
                  ) : (
                    <SplitForm
                      senderAddress={address}
                      senderBalance={balance}
                      onSendPayments={handleSendPayments}
                      isSending={isSending}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="glowing-wrapper" style={{ marginTop: '2rem' }}>
          <div className="glowing-glow"></div>
          <div className="glowing-content">
            <ActivityFeed />
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>
            VeilSplit &copy; {new Date().getFullYear()} &bull; Built on Stellar Testnet &bull;{' '}
            <a href="https://developers.stellar.org/" target="_blank" rel="noopener noreferrer">
              Stellar Developers
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;
