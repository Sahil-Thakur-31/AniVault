import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Star } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const { library, quickIncrement } = useApp();
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ANIME' | 'MANGA'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filtered = library.filter((item) => {
    if (typeFilter !== 'ALL' && item.media?.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchRomaji = item.media?.titleRomaji.toLowerCase().includes(q);
      const matchEnglish = item.media?.titleEnglish?.toLowerCase().includes(q);
      if (!matchRomaji && !matchEnglish) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800 }}>My Personal Library</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Decoupled anime and manga records with local-first tracking.
        </p>
      </div>

      {/* Segmented Type Bar & Search */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px' }}>
          {(['ALL', 'ANIME', 'MANGA'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: typeFilter === t ? 'var(--accent)' : 'transparent',
                color: typeFilter === t ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              {t === 'ALL' ? 'All Media' : t === 'ANIME' ? 'Anime (Watchlist)' : 'Manga (Reading)'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px'
            }}
          />
        </div>
      </div>

      {/* Status Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '28px', paddingBottom: '4px' }}>
        {[
          { id: 'ALL', label: 'All Statuses' },
          { id: 'WATCHING', label: 'Watching' },
          { id: 'READING', label: 'Reading' },
          { id: 'COMPLETED', label: 'Completed' },
          { id: 'PLANNING', label: 'Planning' },
          { id: 'ON_HOLD', label: 'On Hold' },
          { id: 'DROPPED', label: 'Dropped' }
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: statusFilter === s.id ? 'var(--accent)' : 'var(--border-color)',
              backgroundColor: statusFilter === s.id ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
              color: statusFilter === s.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Grid of Library Items */}
      {filtered.length === 0 ? (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
          No titles found matching the selected filter criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={item.media?.coverImageUrl || 'https://via.placeholder.com/300x400'}
                  alt={item.media?.titleRomaji}
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: item.status === 'COMPLETED' ? 'var(--success)' : 'var(--accent)'
                  }}
                >
                  {item.status}
                </span>
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700 }}>{item.media?.titleRomaji}</h4>
                  {item.rating?.score ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>
                      <Star size={12} fill="#f59e0b" />
                      {item.rating.score}
                    </span>
                  ) : null}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  {item.media?.type} • {item.media?.format}
                </p>

                {/* Progress details */}
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>
                      {item.media?.type === 'MANGA' ? 'Chapter' : 'Episode'} {item.media?.type === 'MANGA' ? item.progress?.currentChapter : item.progress?.currentEpisode} of{' '}
                      {item.media?.type === 'MANGA' ? item.media?.totalChapters || '?' : item.media?.totalEpisodes || '?'}
                    </span>
                    <span>{item.progress?.progressPercentage}%</span>
                  </div>

                  <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ height: '100%', width: `${item.progress?.progressPercentage || 0}%`, backgroundColor: 'var(--accent)' }} />
                  </div>

                  <button
                    onClick={() => quickIncrement(item.id, 1)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid var(--accent)',
                      borderRadius: '8px',
                      color: 'var(--accent)',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    <Plus size={14} />
                    <span>+1 {item.media?.type === 'MANGA' ? 'Chapter' : 'Episode'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

