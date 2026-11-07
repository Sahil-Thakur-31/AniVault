import React from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Flame, Clock, CheckCircle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { library, quickIncrement, setActiveTab } = useApp();

  const watchingAnime = library.filter(
    (item) => item.status === 'WATCHING' && item.media?.type === 'ANIME'
  );
  const readingManga = library.filter(
    (item) => item.status === 'READING' && item.media?.type === 'MANGA'
  );

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Welcome Banner */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800 }}>Welcome back, Sahil</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Your entertainment ecosystem is synchronized across all connected devices and widgets.
        </p>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '36px'
        }}
      >
        <div style={metricCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Currently Active</span>
            <Clock size={16} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>
            {watchingAnime.length + readingManga.length} Titles
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {watchingAnime.length} Anime • {readingManga.length} Manga
          </span>
        </div>

        <div style={metricCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Daily Watch Streak</span>
            <Flame size={16} color="#f97316" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: '#f97316' }}>
            🔥 14 Days
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Logged 2 episodes today</span>
        </div>

        <div style={metricCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Completed Library</span>
            <CheckCircle size={16} color="var(--success)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>
            {library.filter((i) => i.status === 'COMPLETED').length} Items
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Across all franchises</span>
        </div>
      </div>

      {/* Continue Watching Section */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Continue Watching</h3>
          <button
            onClick={() => setActiveTab('library')}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '13px', fontWeight: 600 }}
          >
            View All in Library →
          </button>
        </div>

        {watchingAnime.length === 0 ? (
          <div style={emptyCardStyle}>
            No anime currently marked as Watching. Add one from the catalogue!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {watchingAnime.map((item) => (
              <div key={item.id} style={mediaCardStyle}>
                <img
                  src={item.media?.coverImageUrl || 'https://via.placeholder.com/300x400'}
                  alt={item.media?.titleRomaji}
                  style={posterStyle}
                />
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
                    {item.media?.titleRomaji}
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <span>Episode {item.progress?.currentEpisode} of {item.media?.totalEpisodes || '?'}</span>
                    <span>{item.progress?.progressPercentage}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={progressBarContainer}>
                    <div style={{ ...progressBarFill, width: `${item.progress?.progressPercentage || 0}%` }} />
                  </div>

                  {/* Quick Action Button */}
                  <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                    <button
                      onClick={() => quickIncrement(item.id, 1)}
                      style={actionButtonStyle}
                    >
                      <Plus size={15} />
                      <span>Log +1 Episode</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Continue Reading Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Continue Reading</h3>
          <button
            onClick={() => setActiveTab('library')}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '13px', fontWeight: 600 }}
          >
            View Manga →
          </button>
        </div>

        {readingManga.length === 0 ? (
          <div style={emptyCardStyle}>No manga currently marked as Reading.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {readingManga.map((item) => (
              <div key={item.id} style={mediaCardStyle}>
                <img
                  src={item.media?.coverImageUrl || 'https://via.placeholder.com/300x400'}
                  alt={item.media?.titleRomaji}
                  style={posterStyle}
                />
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
                    {item.media?.titleRomaji}
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <span>Chapter {item.progress?.currentChapter} of {item.media?.totalChapters || '?'}</span>
                    <span>{item.progress?.progressPercentage}%</span>
                  </div>

                  <div style={progressBarContainer}>
                    <div style={{ ...progressBarFill, width: `${item.progress?.progressPercentage || 0}%` }} />
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                    <button
                      onClick={() => quickIncrement(item.id, 1)}
                      style={actionButtonStyle}
                    >
                      <Plus size={15} />
                      <span>Log +1 Chapter</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const metricCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '20px'
};

const mediaCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};

const posterStyle: React.CSSProperties = {
  width: '100%',
  height: '160px',
  objectFit: 'cover'
};

const progressBarContainer: React.CSSProperties = {
  height: '6px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '3px',
  overflow: 'hidden'
};

const progressBarFill: React.CSSProperties = {
  height: '100%',
  backgroundColor: 'var(--accent)',
  borderRadius: '3px',
  transition: 'width 0.3s ease'
};

const actionButtonStyle: React.CSSProperties = {
  width: '100%',
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
};

const emptyCardStyle: React.CSSProperties = {
  padding: '32px',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px dashed var(--border-color)',
  borderRadius: '12px',
  color: 'var(--text-muted)',
  textAlign: 'center'
};

