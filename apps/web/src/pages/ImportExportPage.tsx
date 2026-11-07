import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Upload, FileText, CheckCircle2 } from 'lucide-react';

export const ImportExportPage: React.FC = () => {
  const { client, refreshData } = useApp();
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [committed, setCommitted] = useState(false);

  const handleDownloadJson = async () => {
    window.open('/api/v1/export/json', '_blank');
  };

  const handleDownloadCsv = async () => {
    window.open('/api/v1/export/csv', '_blank');
  };

  // Sample import test payload
  const handleSimulateImport = async (dryRun: boolean) => {
    setLoading(true);
    setCommitted(false);

    const samplePayload = {
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      application: 'AniVault',
      user: { username: 'otaku_architect' },
      franchises: [],
      library: [
        {
          title: 'Attack on Titan',
          type: 'ANIME',
          format: 'TV',
          status: 'COMPLETED',
          progress: { currentEpisode: 25, totalEpisodes: 25 },
          rating: { score: 9.5 }
        },
        {
          title: 'Chainsaw Man',
          type: 'MANGA',
          format: 'MANGA',
          status: 'READING',
          progress: { currentChapter: 97, totalChapters: 150 },
          rating: { score: 9.0 }
        }
      ]
    };

    try {
      const res = await fetch(`/api/v1/import/json?dryRun=${dryRun}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload)
      });
      const data = await res.json();
      setDryRunResult(data);
      if (!dryRun) {
        setCommitted(true);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800 }}>Universal Import, Export & Portability</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Your data belongs to you. Export full-fidelity backups or import entire histories with dry-run verification.
        </p>
      </div>

      {/* Export Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '36px' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <FileText color="var(--accent)" size={20} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>AniVault Master JSON Backup</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
            Complete full-fidelity schemaVersion 1.0.0 backup containing franchises, relationships, personal ratings, and notes.
          </p>
          <button onClick={handleDownloadJson} style={downloadButtonStyle}>
            <Download size={15} />
            <span>Download Full JSON Backup</span>
          </button>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <FileText color="#10b981" size={20} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Universal CSV Table</h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
            Flat comma-separated spreadsheet file ideal for manual editing in Excel, Numbers, or Google Sheets.
          </p>
          <button onClick={handleDownloadCsv} style={{ ...downloadButtonStyle, backgroundColor: '#10b981' }}>
            <Download size={15} />
            <span>Download CSV Spreadsheet</span>
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div style={{ ...cardStyle, marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Upload color="var(--accent)" size={20} />
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Import Library with Dry-Run Inspection</h3>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Upload any JSON or CSV export. AniVault validates the schema and checks for duplicates before committing anything to your library.
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => handleSimulateImport(true)}
            disabled={loading}
            style={actionButtonStyle}
          >
            {loading ? 'Processing...' : 'Run Dry-Run Import Inspection'}
          </button>
          <button
            onClick={() => handleSimulateImport(false)}
            disabled={loading}
            style={{ ...actionButtonStyle, backgroundColor: 'var(--accent)' }}
          >
            Execute Real Import
          </button>
        </div>

        {committed && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid var(--success)',
              borderRadius: '8px',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <CheckCircle2 size={16} />
            <span>Import successfully committed to your master library!</span>
          </div>
        )}

        {/* Dry Run Diff Report */}
        {dryRunResult && (
          <div style={{ marginTop: '24px', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
              Import Staging Report (Status: {dryRunResult.status})
            </h4>
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', marginBottom: '16px' }}>
              <span>Total: <b>{dryRunResult.totalRecords}</b></span>
              <span style={{ color: 'var(--success)' }}>Will Add: <b>{dryRunResult.addedCount}</b></span>
              <span style={{ color: '#f59e0b' }}>Will Update: <b>{dryRunResult.duplicatesDetected}</b></span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {dryRunResult.preview?.map((p: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    fontSize: '12px'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{p.title}</span>
                  <span style={{ color: p.action === 'ADD_NEW' ? 'var(--success)' : '#f59e0b' }}>
                    {p.action} ({p.newStatus})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '24px'
};

const downloadButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  backgroundColor: 'var(--accent)',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  fontWeight: 600,
  fontSize: '13px'
};

const actionButtonStyle: React.CSSProperties = {
  padding: '10px 18px',
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontWeight: 600,
  fontSize: '13px'
};

