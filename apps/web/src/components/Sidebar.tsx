import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Film,
  FolderTree,
  RefreshCw,
  BarChart3,
  UploadCloud,
  Link2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, syncStatus, conflicts } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'My Library', icon: Film },
    { id: 'franchises', label: 'Franchise Hub', icon: FolderTree },
    { id: 'integrations', label: 'Sync & Accounts', icon: RefreshCw },
    { id: 'identity-editor', label: 'Relationship Editor', icon: Link2 },
    { id: 'import-export', label: 'Backup & Restore', icon: UploadCloud },
    { id: 'stats', label: 'Analytics & Wrapped', icon: BarChart3 }
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        flexShrink: 0
      }}
    >
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '18px'
          }}
        >
          AV
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>AniVault</h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unified Media Tracker</p>
        </div>
      </div>

      {/* Sync Status Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor:
            syncStatus === 'CONFLICT'
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(16, 185, 129, 0.15)',
          color: syncStatus === 'CONFLICT' ? 'var(--danger)' : 'var(--success)',
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '24px'
        }}
      >
        {syncStatus === 'CONFLICT' ? (
          <>
            <AlertTriangle size={15} />
            <span>{conflicts.length} Sync Conflict(s)</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={15} />
            <span>Local & Cloud Synced</span>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '14px',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div
        style={{
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          OA
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            otaku_architect
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pro Master Tier</p>
        </div>
      </div>
    </aside>
  );
};

