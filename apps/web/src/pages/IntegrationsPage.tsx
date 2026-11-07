import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RefreshCw, CheckCircle, AlertTriangle, ArrowRightLeft, ShieldCheck } from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const { conflicts, resolveConflict, refreshData } = useApp();
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);

  const services = [
    {
      id: 'ANILIST',
      name: 'AniList',
      description: 'Primary GraphQL integration for anime, manga, and watch progress.',
      connected: true,
      username: 'otaku_architect',
      lastSynced: '2 minutes ago',
      color: '#02a9ff'
    },
    {
      id: 'MYANIMELIST',
      name: 'MyAnimeList',
      description: 'Official REST v2 integration with OAuth2 PKCE authentication.',
      connected: true,
      username: 'sahil_mal',
      lastSynced: '5 minutes ago',
      color: '#2e51a2'
    },
    {
      id: 'KITSU',
      name: 'Kitsu',
      description: 'Supplementary metadata provider for anime and manga relationship matching.',
      connected: false,
      username: null,
      lastSynced: 'Never',
      color: '#fd755c'
    }
  ];

  const handleSyncNow = async (providerId: string) => {
    setSyncingProvider(providerId);
    try {
      await fetch(`/api/v1/integrations/${providerId}/sync`, { method: 'POST' });
      await refreshData();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncingProvider(null);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800 }}>Integrations & Two-Way Synchronisation</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Connect your AniList and MyAnimeList accounts. AniVault owns your master data while keeping external platforms synced.
        </p>
      </div>

      {/* Sync Conflicts Section (If Any) */}
      {conflicts.length > 0 && (
        <div
          style={{
            marginBottom: '36px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid var(--danger)',
            borderRadius: '12px',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <AlertTriangle color="var(--danger)" size={22} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--danger)' }}>
              Discrepancies Detected ({conflicts.length})
            </h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            The following items have differing progress counters between AniVault and your connected accounts. Review and select the resolution strategy below.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {conflicts.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{c.mediaTitle}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Provider: {c.provider}</span>
                </div>

                {/* Diff Comparison Table */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    textAlign: 'center',
                    marginBottom: '16px',
                    backgroundColor: 'var(--bg-card)',
                    padding: '12px',
                    borderRadius: '8px'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AniVault (Local)</span>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)', marginTop: '4px' }}>
                      Episode {c.localEpisode}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.provider} (Remote)</span>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                      Episode {c.remoteEpisode}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action Required</span>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '6px' }}>
                      Resolve Discrepancy
                    </p>
                  </div>
                </div>

                {/* Resolution Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => resolveConflict(c.id, 'ANI_VAULT_MASTER')}
                    style={conflictResolveButtonStyle}
                  >
                    Keep AniVault (Ep {c.localEpisode}) & Overwrite Remote
                  </button>
                  <button
                    onClick={() => resolveConflict(c.id, 'HIGHEST_PROGRESS')}
                    style={{ ...conflictResolveButtonStyle, backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
                  >
                    Accept Highest Progress (Ep {Math.max(c.localEpisode, c.remoteEpisode)})
                  </button>
                  <button
                    onClick={() => resolveConflict(c.id, 'REMOTE_PROVIDER_WINS')}
                    style={{ ...conflictResolveButtonStyle, backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}
                  >
                    Accept Remote (Ep {c.remoteEpisode})
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {services.map((srv) => (
          <div
            key={srv.id}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: srv.color }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{srv.name}</h3>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: srv.connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.08)',
                  color: srv.connected ? 'var(--success)' : 'var(--text-muted)'
                }}
              >
                {srv.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
              {srv.description}
            </p>

            {srv.connected && (
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Account:</span>
                  <span style={{ fontWeight: 600 }}>@{srv.username}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last Synced:</span>
                  <span>{srv.lastSynced}</span>
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
              {srv.connected ? (
                <button
                  disabled={syncingProvider === srv.id}
                  onClick={() => handleSyncNow(srv.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    backgroundColor: 'var(--accent)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                >
                  <RefreshCw size={14} className={syncingProvider === srv.id ? 'spin' : ''} />
                  <span>{syncingProvider === srv.id ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              ) : (
                <button
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'var(--accent)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                >
                  Connect Account (OAuth2)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const conflictResolveButtonStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: 'var(--accent)',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 600
};

