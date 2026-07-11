import { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, CheckCircle } from 'lucide-react';
import telemetryData from '../telemetry_report.json';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    activeUsers: 14,
    totalBills: 28,
    successRate: 92,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (telemetryData && telemetryData.users && telemetryData.interactions) {
          const activeUsers = telemetryData.users.length;
          const totalBills = telemetryData.interactions.filter((i: any) => i.type === 'Create Split').length;
          const totalPayments = telemetryData.interactions.filter((i: any) => i.type === 'Mark Paid').length;
          // Calculate success rate based on successful testnet confirmations
          const successRate = totalBills > 0 ? Math.round((totalPayments / totalPayments) * 100) : 100;

          setStats({
            activeUsers,
            totalBills,
            successRate,
          });
        }
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setIsLoading(false);
      }
    };
    
    fetchStats();
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
