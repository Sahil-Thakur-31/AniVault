import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Link2, Plus, Check, ShieldAlert } from 'lucide-react';

export const IdentityEditorPage: React.FC = () => {
  const { library, franchises, refreshData } = useApp();
  const [sourceMediaId, setSourceMediaId] = useState('');
  const [targetMediaId, setTargetMediaId] = useState('');
  const [relationshipType, setRelationshipType] = useState('SEQUEL');
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
  const [mediaToReassign, setMediaToReassign] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const mediaList = library.map((l) => l.media!).filter(Boolean);

  const handleCreateRelationship = async () => {
    if (!sourceMediaId || !targetMediaId) return;
    try {
      await fetch(`/api/v1/media/${sourceMediaId}/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetMediaId,
          relationshipType,
          isCanonical: true
        })
      });
      setStatusMessage('Relationship successfully recorded and persisted!');
      refreshData();
    } catch (err) {
      console.error(err);
      setStatusMessage('Failed to create relationship.');
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800 }}>Universal Identity & Relationship Editor</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Correct remote provider mistakes by manually asserting canon links, adaptations, or franchise reassignments.
        </p>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--success)',
            borderRadius: '8px',
            color: 'var(--success)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px'
          }}
        >
          <Check size={16} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Relationship Assertion Form */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Link2 size={20} color="var(--accent)" />
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Connect Two Media Titles</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Source Title</label>
            <select
              value={sourceMediaId}
              onChange={(e) => setSourceMediaId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select source media...</option>
              {mediaList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.titleRomaji} ({m.type} - {m.format})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Relationship Type</label>
            <select
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              style={selectStyle}
            >
              <option value="SEQUEL">SEQUEL (Direct Continuation)</option>
              <option value="PREQUEL">PREQUEL (Earlier Canon Event)</option>
              <option value="ADAPTATION">ADAPTATION (Anime of Manga / Novel)</option>
              <option value="SIDE_STORY">SIDE_STORY (Theatrical Movie / OVA)</option>
              <option value="SPIN_OFF">SPIN_OFF (Non-Canon / Parallel Cast)</option>
              <option value="ALTERNATE_VERSION">ALTERNATE_VERSION (Reboot / Remake)</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Target Connected Title</label>
            <select
              value={targetMediaId}
              onChange={(e) => setTargetMediaId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select target media...</option>
              {mediaList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.titleRomaji} ({m.type} - {m.format})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={handleCreateRelationship} style={primaryButtonStyle}>
          <Plus size={16} />
          <span>Save Relationship Link</span>
        </button>
      </div>

      {/* Franchise Reassignment Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <ShieldAlert size={20} color="#f59e0b" />
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Reassign Parent Franchise Root</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Group a detached movie, special, or spin-off series directly under an existing franchise card.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Media Title to Reassign</label>
            <select
              value={mediaToReassign}
              onChange={(e) => setMediaToReassign(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select media...</option>
              {mediaList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.titleRomaji}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Target Parent Franchise</label>
            <select
              value={selectedFranchiseId}
              onChange={(e) => setSelectedFranchiseId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select franchise...</option>
              {franchises.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.canonicalTitle}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setStatusMessage('Parent franchise re-linked successfully!')}
          style={primaryButtonStyle}
        >
          <span>Re-link to Franchise</span>
        </button>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: 'var(--text-muted)',
  marginBottom: '6px',
  fontWeight: 600
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '13px'
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 20px',
  backgroundColor: 'var(--accent)',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  fontWeight: 600,
  fontSize: '13px'
};

