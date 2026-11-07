import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FranchiseTreeResponse } from '@anivault/shared-types';
import { CheckCircle2, ChevronDown, ChevronRight, Film, BookOpen, Layers } from 'lucide-react';

export const FranchisePage: React.FC = () => {
  const { franchises, client } = useApp();
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>('');
  const [treeData, setTreeData] = useState<FranchiseTreeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (franchises.length > 0 && !selectedFranchiseId) {
      setSelectedFranchiseId(franchises[0].id);
    }
  }, [franchises]);

  useEffect(() => {
    if (!selectedFranchiseId) return;
    setLoading(true);
    client
      .getFranchiseTree(selectedFranchiseId)
      .then((res) => {
        setTreeData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load franchise tree:', err);
        setLoading(false);
      });
  }, [selectedFranchiseId]);

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Franchise Selector Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 800 }}>Franchise Hierarchy Hub</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Unified franchise umbrella organizing series, sequels, movies, and manga adaptations.
          </p>
        </div>

        {/* Dropdown selector */}
        <select
          value={selectedFranchiseId}
          onChange={(e) => setSelectedFranchiseId(e.target.value)}
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          {franchises.map((f) => (
            <option key={f.id} value={f.id}>
              {f.canonicalTitle}
            </option>
          ))}
        </select>
      </div>

      {loading || !treeData ? (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading franchise architecture...
        </div>
      ) : (
        <div>
          {/* Franchise Hero Card */}
          <div
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '32px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <div
              style={{
                height: '180px',
                backgroundImage: `linear-gradient(to bottom, rgba(11,15,25,0.4), rgba(11,15,25,0.95)), url(${treeData.franchise.bannerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end'
              }}
            >
              <h1 style={{ fontSize: '32px', fontWeight: 900 }}>{treeData.franchise.canonicalTitle}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '650px', marginTop: '6px' }}>
                {treeData.franchise.description}
              </p>
            </div>

            {/* Franchise Rollup Stats */}
            <div
              style={{
                padding: '20px 24px',
                backgroundColor: 'rgba(26, 35, 58, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Overall Franchise Progress
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>
                    {treeData.completionStats.completionPercentage}%
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    ({treeData.completionStats.completedItems} / {treeData.completionStats.totalItems} Components Finished)
                  </span>
                </div>
              </div>

              {/* Progress meter bar */}
              <div style={{ flex: 1, maxWidth: '300px' }}>
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${treeData.completionStats.completionPercentage}%`,
                      backgroundColor: 'var(--accent)',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hierarchical Categories */}
          <SectionAccordion
            title="Main Canonical Series"
            icon={<Layers size={18} color="var(--accent)" />}
            items={treeData.mainStory}
          />

          {treeData.sequels.length > 0 && (
            <SectionAccordion
              title="Sequels & Sequenced Sagas"
              icon={<ChevronRight size={18} color="var(--accent)" />}
              items={treeData.sequels}
            />
          )}

          {treeData.movies.length > 0 && (
            <SectionAccordion
              title="Theatrical Movies"
              icon={<Film size={18} color="#ec4899" />}
              items={treeData.movies}
            />
          )}

          {treeData.manga.length > 0 && (
            <SectionAccordion
              title="Manga & Source Adaptations"
              icon={<BookOpen size={18} color="#10b981" />}
              items={treeData.manga}
            />
          )}
        </div>
      )}
    </div>
  );
};

const SectionAccordion: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: any[];
}> = ({ title, icon, items }) => {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        marginBottom: '24px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          backgroundColor: 'rgba(255,255,255,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {icon}
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{title}</h3>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: 'var(--border-color)',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}
          >
            {items.length}
          </span>
        </div>
        {open ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
      </div>

      {open && (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((comp) => {
            const m = comp.media;
            const isCompleted = comp.userLibrary?.status === 'COMPLETED';

            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src={m.coverImageUrl || 'https://via.placeholder.com/80x100'}
                    alt={m.titleRomaji}
                    style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700 }}>{m.titleRomaji}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {m.format} • {m.totalEpisodes ? `${m.totalEpisodes} Episodes` : m.totalChapters ? `${m.totalChapters} Chapters` : 'Ongoing'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      color: isCompleted ? 'var(--success)' : 'var(--accent)',
                      fontWeight: 600
                    }}
                  >
                    {comp.userLibrary?.status || 'Unlisted'}
                  </span>
                  {isCompleted && <CheckCircle2 size={18} color="var(--success)" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

