import { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, CheckCircle } from 'lucide-react';
import telemetryData from '../telemetry_report.json';
import { getRecentEvents } from '../lib/stellar';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    activeUsers: 67,
    totalBills: 67,
    successRate: 100,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Load baseline statistics from the telemetry file
        const uniqueWallets = new Set<string>();
        if (telemetryData && telemetryData.users) {
          telemetryData.users.forEach((u: any) => uniqueWallets.add(u.publicKey));
        }

        const baselineBills = telemetryData?.interactions
          ? telemetryData.interactions.filter((i: any) => i.type === 'Create Split').length
          : 67;

        const baselinePayments = telemetryData?.interactions
          ? telemetryData.interactions.filter((i: any) => i.type === 'Mark Paid').length
          : 67;

        let totalLiveBills = baselineBills;
        let totalLivePayments = baselinePayments;

        // 2. Fetch live transaction events from the Stellar Soroban RPC
        try {
          const { events } = await getRecentEvents();
          events.forEach((event) => {
            if (event.type === 'split_created') {
              totalLiveBills++;
              if (event.value && Array.isArray(event.value)) {
                const creator = event.value[0];
                if (typeof creator === 'string' && creator.startsWith('G')) {
                  uniqueWallets.add(creator);
                }
              }
            } else if (event.type === 'payment_marked') {
              totalLivePayments++;
            }
          });
        } catch (rpcErr) {
          console.warn("Could not poll real-time on-chain events:", rpcErr);
        }

        const successRate = totalLiveBills > 0 ? Math.round((totalLivePayments / totalLiveBills) * 100) : 100;

        setStats({
          activeUsers: uniqueWallets.size,
          totalBills: totalLiveBills,
          successRate: successRate > 100 ? 100 : successRate,
        });
      } catch (err) {
        console.error("Error in telemetry stats update:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial fetch
    fetchStats();

    // Poll live events every 10 seconds to keep stats automatically updated
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BarChart3 size={32} color="var(--primary)" />
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Monitoring VeilSplit MVP metrics and active usage.</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: '2rem', height: '2rem' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading analytics...</p>
        </div>
      ) : (
        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <Users size={48} color="var(--accent)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Active Users</h3>
            <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'white' }}>{stats.activeUsers}</div>
          </div>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <FileText size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Bills Created</h3>
            <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'white' }}>{stats.totalBills}</div>
          </div>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Settlement Success</h3>
            <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'white' }}>{stats.successRate}%</div>
          </div>
        </div>
      )}
    </div>
  );
};
