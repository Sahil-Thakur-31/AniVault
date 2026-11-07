import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Flame, Clock, BookOpen, Film } from 'lucide-react';

export const StatsPage: React.FC = () => {
  const { client } = useApp();
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    client.getStats().then((data) => setStats(data));
  }, []);

  if (!stats) {
    return <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>Calculating metrics...</div>;
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800 }}>Analytics & Anime Wrapped</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Deep-dive statistics, watch time calculations, and your annual media recap.
        </p>
      </div>

      {/* Wrapped Banner Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
          borderRadius: '16px',
          padding: '32px',
          color: '#fff',
          marginBottom: '36px',
          boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={20} />
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            AniVault Wrapped 2026
          </span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>
          You've watched {stats.totalHoursWatched} hours of anime!
        </h1>
        <p style={{ fontSize: '15px', opacity: 0.9, maxWidth: '600px' }}>
          That equals approximately <b>{stats.daysWatched} full days</b> of pure storytelling. Your longest watch streak reached <b>{stats.activeStreakDays} consecutive days</b>.
        </p>
      </div>

      {/* 4 Key Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Anime Episodes</span>
            <Film size={16} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>
            {stats.totalEpisodesWatched}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Across {stats.animeCompleted} completed series</span>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manga Chapters</span>
            <BookOpen size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px', color: '#10b981' }}>
            {stats.totalChaptersRead}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Across {stats.mangaCompleted} completed volumes</span>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Watch Time</span>
            <Clock size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px', color: '#3b82f6' }}>
            {stats.daysWatched} Days
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Avg 24 min / episode</span>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Streak</span>
            <Flame size={16} color="#f97316" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px', color: '#f97316' }}>
            {stats.activeStreakDays} Days
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Daily engagement streak</span>
        </div>
      </div>

      {/* Genre Breakdown */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Top Genres Experienced</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(stats.genreDistribution || {}).map(([genre, count]: any) => (
            <div key={genre}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>{genre}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{count} titles</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (count / 5) * 100)}%`,
                    backgroundColor: 'var(--accent)',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '20px'
};

