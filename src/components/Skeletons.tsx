import React from 'react';

export const Skeleton = ({ className, style }: { className?: string, style?: React.CSSProperties }) => {
  return (
    <div
      className={`skeleton ${className || ''}`}
      style={{
        background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-surface) 50%, var(--bg-card) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s infinite',
        borderRadius: '8px',
        ...style
      }}
    />
  );
};

export const BillCardSkeleton = () => (
  <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
    <Skeleton style={{ height: '24px', width: '60%', marginBottom: '1rem' }} />
    <Skeleton style={{ height: '16px', width: '40%', marginBottom: '0.5rem' }} />
    <Skeleton style={{ height: '16px', width: '80%' }} />
    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
      <Skeleton style={{ height: '36px', width: '100px', borderRadius: '20px' }} />
      <Skeleton style={{ height: '36px', width: '100px', borderRadius: '20px' }} />
    </div>
  </div>
);

export const BalanceCardSkeleton = () => (
  <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
    <Skeleton style={{ height: '20px', width: '40%', margin: '0 auto 1rem auto' }} />
    <Skeleton style={{ height: '40px', width: '60%', margin: '0 auto' }} />
  </div>
);
