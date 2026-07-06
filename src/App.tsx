import { useState } from 'react';
import { useWallet } from './hooks/useWallet';
import { Header } from './components/Header';
import { WalletWarning } from './components/WalletWarning';
import { BalanceCard } from './components/BalanceCard';
import { SplitForm } from './components/SplitForm';
import { TransactionProgress } from './components/TransactionProgress';
import type { PaymentStatus } from './components/TransactionProgress';
import { sendPayment } from './lib/stellar';

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
  const [payments, setPayments] = useState<PaymentStatus[]>([]);
  const [showProgress, setShowProgress] = useState(false);

  const handleSendPayments = async (recipients: string[], shareAmount: string) => {
    if (!address) return;

    // Initialize payment statuses
    const initialPayments: PaymentStatus[] = recipients.map((recipient) => ({
      recipient,
      amount: shareAmount,
      status: 'idle',
    }));

    setPayments(initialPayments);
    setShowProgress(true);
    setIsSending(true);

    // Sequentially send payment to each recipient
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      // Update state to pending for current index
      setPayments((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: 'pending' } : p))
      );

      try {
        // Send transaction
        const txHash = await sendPayment(address, recipient, shareAmount);
        
        // Update state to success
        setPayments((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: 'success', txHash } : p
          )
        );
      } catch (err: any) {
        console.error(`Failed to send to ${recipient}:`, err);
        const errMsg = err.message || 'Transaction failed.';
        
        // Update state to failed
        setPayments((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: 'failed', error: errMsg } : p
          )
        );
      }

      // Refresh sender balance after each transaction to reflect correct current status
      await refreshBalance();
    }

    setIsSending(false);
  };

  const handleReset = () => {
    setPayments([]);
    setShowProgress(false);
    setIsSending(false);
    refreshBalance();
  };

  return (
    <>
      <Header
        address={address}
        connect={connect}
        disconnect={disconnect}
        isConnecting={isConnecting}
      />

      <WalletWarning isInstalled={isInstalled} />

      <main className="container" style={{ flexGrow: 1, padding: '2rem 1.5rem' }}>
        <div className="hero">
          <h1>Split Bills, Instantly</h1>
          <p>
            Split expenses and send transactions to multiple recipients sequentially on the Stellar Testnet. Simple, fast, and secure.
          </p>
        </div>

        {showProgress ? (
          <TransactionProgress
            payments={payments}
            isSending={isSending}
            onReset={handleReset}
          />
        ) : (
          <div className="grid-2">
            <BalanceCard
              address={address}
              balance={balance}
              loadingBalance={loadingBalance}
              error={error}
              refreshBalance={refreshBalance}
            />

            <SplitForm
              senderAddress={address}
              senderBalance={balance}
              onSendPayments={handleSendPayments}
              isSending={isSending}
            />
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <p>
            StellarSplit &copy; {new Date().getFullYear()} &bull; Built on Stellar Testnet &bull;{' '}
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
