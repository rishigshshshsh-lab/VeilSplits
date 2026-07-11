import { useState, useEffect, useRef } from 'react';
import { getRecentEvents } from '../lib/stellar';
import type { SorobanEvent } from '../lib/stellar';
import { Activity, RefreshCw, CheckCircle2, FileText, Ban, Sparkles, UserPlus } from 'lucide-react';

interface ActivityFeedProps {
  connectedAddress?: string | null;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ connectedAddress }) => {
  const [events, setEvents] = useState<SorobanEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  
  const startLedgerRef = useRef<number | undefined>(undefined);
  const cursorRef = useRef<string | undefined>(undefined);
  const pollTimerRef = useRef<any>(null);

  const fetchInitialEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await getRecentEvents();
      
      // Load simulated events from localStorage
      let simulatedList: SorobanEvent[] = [];
      try {
        const stored = localStorage.getItem('veilsplit_simulated_events');
        if (stored) {
          simulatedList = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to parse simulated events:', e);
      }

      // Merge on-chain and simulated events, sorting simulated ones first
      const mergedEvents = [...simulatedList, ...res.events].sort((a, b) => {
        const parseTime = (id: string) => {
          if (id.startsWith('sim-')) {
            const parts = id.split('-');
            return parseInt(parts[1]) || 0;
          }
          return 0;
        };
        
        const timeA = parseTime(a.id);
        const timeB = parseTime(b.id);
        
        if (timeA && timeB) return timeB - timeA;
        if (timeA) return -1;
        if (timeB) return 1;
        
        return b.id.localeCompare(a.id);
      });

      setEvents(mergedEvents);
      cursorRef.current = res.cursor;
      startLedgerRef.current = res.latestLedger - 100;
      setIsStreaming(true);
    } catch (err: any) {
      console.error('Failed to connect to Soroban event stream:', err);
      setError(err.message || 'Failed to connect to Soroban event stream.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialEvents();

    const handleNewEvent = (e: Event) => {
      const customEvent = e as CustomEvent<SorobanEvent>;
      if (customEvent.detail) {
        setEvents((prev) => {
          if (prev.some((ev) => ev.id === customEvent.detail.id)) return prev;
          return [customEvent.detail, ...prev];
        });
      }
    };

    window.addEventListener('veilsplit_new_event', handleNewEvent);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      window.removeEventListener('veilsplit_new_event', handleNewEvent);
    };
  }, []);

  useEffect(() => {
    if (!isStreaming) return;

    // Set up real-time event streaming poll every 4 seconds
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await getRecentEvents(startLedgerRef.current, cursorRef.current);
        if (res.events && res.events.length > 0) {
          setEvents((prev) => {
            // Filter out any duplicates just in case
            const newEvents = res.events.filter(
              (newEv) => !prev.some((oldEv) => oldEv.id === newEv.id)
            );
            return [...newEvents, ...prev]; // Show newest first
          });
          cursorRef.current = res.cursor;
        }
      } catch (err) {
        console.warn('Real-time event stream poll error:', err);
      }
    }, 4000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [isStreaming]);

  const truncateAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getEventIcon = (type: SorobanEvent['type']) => {
    switch (type) {
      case 'split_created':
        return <FileText className="text-purple-400" size={18} />;
      case 'payment_marked':
        return <Sparkles className="text-blue-400" size={18} />;
      case 'notify_completed':
        return <CheckCircle2 className="text-emerald-400" size={18} />;
      case 'split_cancelled':
        return <Ban className="text-rose-400" size={18} />;
      case 'participant_added':
        return <UserPlus className="text-cyan-400" size={18} />;
    }
  };

  const formatEventMessage = (ev: SorobanEvent) => {
    switch (ev.type) {
      case 'split_created': {
        const creator = Array.isArray(ev.value) ? ev.value[0] : 'Creator';
        const rawAmount = Array.isArray(ev.value) ? ev.value[1] : 0n;
        const amountXlm = (Number(rawAmount) / 10000000).toFixed(2);
        return (
          <>
            Bill <span className="font-semibold text-white">{ev.billId}</span> created by{' '}
            <span className="address-badge">{truncateAddress(creator.toString())}</span> for{' '}
            <span className="font-semibold text-purple-400">{amountXlm} XLM</span>
          </>
        );
      }
      case 'payment_marked': {
        const participant = ev.value || 'Participant';
        return (
          <>
            Payment marked for{' '}
            <span className="address-badge">{truncateAddress(participant.toString())}</span> on bill{' '}
            <span className="font-semibold text-white">{ev.billId}</span>
          </>
        );
      }
      case 'notify_completed':
        return (
          <>
            Bill <span className="font-semibold text-emerald-400">{ev.billId}</span> is fully paid!{' '}
            <span className="text-emerald-400">SplitNotifier notified successfully</span> 🎉
          </>
        );
      case 'split_cancelled':
        return (
          <>
            Bill <span className="font-semibold text-rose-400">{ev.billId}</span> has been cancelled
          </>
        );
      case 'participant_added': {
        const participant = ev.value || 'Participant';
        return (
          <>
            Participant <span className="address-badge">{truncateAddress(participant.toString())}</span> added to bill{' '}
            <span className="font-semibold text-white">{ev.billId}</span>
          </>
        );
      }
      default:
        return `On-chain event triggered for bill ${ev.billId}`;
    }
  };

  const myEvents = events.filter((ev) => {
    if (!connectedAddress) return false;
    if (ev.type === 'split_created') {
      const creator = Array.isArray(ev.value) ? ev.value[0]?.toString() : '';
      return creator.toLowerCase() === connectedAddress.toLowerCase();
    }
    return false;
  }).slice(0, 5);

  const displayedEvents = activeTab === 'all' ? events : myEvents;

  return (
    <div className="card w-full" style={{ marginTop: '2rem' }}>
      <div className="feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="feed-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>
            <Activity size={20} className="text-purple-400" />
            Activity Log
          </div>
          {connectedAddress && (
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'all' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'all' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'all' ? 600 : 400
                }}
              >
                All Activity
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mine')}
                style={{
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'mine' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'mine' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'mine' ? 600 : 400
                }}
              >
                My Bills (Last 5)
              </button>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="feed-status connecting">
            <span className="spinner" style={{ width: '0.75rem', height: '0.75rem', borderWidth: '2px' }}></span>
            Connecting Event Stream...
          </div>
        ) : error ? (
          <button onClick={fetchInitialEvents} className="feed-status" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
            <RefreshCw size={12} />
            Stream Disconnected (Retry)
          </button>
        ) : (
          <div className="feed-status">
            <span className="pulse-badge status-success" style={{ padding: '2px', marginRight: '4px' }}></span>
            Live Stream Connected
          </div>
        )}
      </div>

      {loading ? (
        <div className="activity-feed">
          {[1, 2, 3].map((n) => (
            <div key={n} className="activity-item skeleton" style={{ opacity: 0.6, border: '1px solid rgba(255,255,255,0.03)' }}>
              <div className="activity-icon skeleton" style={{ width: '1.75rem', height: '1.75rem', borderRadius: '4px' }}></div>
              <div className="activity-details" style={{ gap: '0.5rem' }}>
                <div className="skeleton" style={{ height: '12px', width: '60%', borderRadius: '4px' }}></div>
                <div className="skeleton" style={{ height: '10px', width: '40%', borderRadius: '4px' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-error" style={{ margin: 0 }}>
          <p>{error}</p>
        </div>
      ) : displayedEvents.length === 0 ? (
        activeTab === 'mine' ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>No bills created yet</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '350px', margin: '0 auto' }}>
              Settle recurring rent or splits with roommates by creating your first private bill above!
            </p>
          </div>
        ) : (
          <div className="text-center text-muted" style={{ padding: '2rem 0' }}>
            No recent on-chain events found. Create a split bill to see activity.
          </div>
        )
      ) : (
        <div className="activity-feed" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {displayedEvents.map((ev) => (
            <div key={ev.id} className={`activity-item type-${ev.type}`}>
              <div className="activity-icon">
                {getEventIcon(ev.type)}
              </div>
              <div className="activity-details">
                <div className="activity-header">
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                    {formatEventMessage(ev)}
                  </span>
                  {ev.txHash && !ev.id.startsWith('sim-') ? (
                    <a
                      href={`https://stellar.expert/testnet/tx/${ev.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-explorer text-sm"
                    >
                      View Tx
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Simulated</span>
                  )}
                </div>
                <div className="activity-meta">
                  <span className="activity-time">Event ID: {ev.id.substring(0, 8)}...</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
