import React, { useState, useEffect } from 'react';
import { Shield, Coins, Share2, ArrowRight, X } from 'lucide-react';

interface OnboardingFlowProps {
  onConnectWallet: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onConnectWallet }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const hasVisited = localStorage.getItem('veilsplit_onboarded');
    if (!hasVisited) {
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('veilsplit_onboarded', 'true');
    setIsOpen(false);
  };

  const handleConnectAndComplete = () => {
    onConnectWallet();
    handleComplete();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', position: 'relative' }}>
        <button 
          onClick={handleComplete}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {step === 1 && (
          <div style={{ textAlign: 'center', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1.5rem' }}>
              <Shield size={48} />
            </div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>Welcome to VeilSplit</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
              The first privacy-preserving recurring bill settlement protocol on Stellar. Split bills with roommates or freelancers without linking repeated payments on-chain.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setStep(2)}>
              See How It Works <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'slideIn 0.3s ease-out' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-display)', textAlign: 'center' }}>How VeilSplit Works</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.5rem', borderRadius: '8px' }}><Coins size={20} /></div>
                <div>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>1. Create a Bill</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Enter the total amount and participant wallets. We generate a hashed commitment on the Soroban registry.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', padding: '0.5rem', borderRadius: '8px' }}><Shield size={20} /></div>
                <div>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>2. Stealth Addresses</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Our contract generates one-time stealth addresses for each user, so on-chain observers can't track your spending habits.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--secondary)', padding: '0.5rem', borderRadius: '8px' }}><Share2 size={20} /></div>
                <div>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>3. Settle Up</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Participants send XLM to their stealth address, and the registry securely marks the bill as paid.</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleConnectAndComplete}>
                Connect Wallet to Start
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
