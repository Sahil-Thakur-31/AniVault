import React, { createContext, useContext, useState, useEffect } from 'react';
import { AniVaultApiClient } from '@anivault/api-client';
import { UserLibrary, Franchise, SyncConflict } from '@anivault/shared-types';

interface AppContextType {
  client: AniVaultApiClient;
  library: UserLibrary[];
  franchises: Franchise[];
  conflicts: SyncConflict[];
  syncStatus: 'SYNCED' | 'SYNCING' | 'CONFLICT';
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refreshData: () => Promise<void>;
  quickIncrement: (libraryId: string, delta?: number) => Promise<void>;
  resolveConflict: (conflictId: string, strategy: any, customEp?: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client] = useState(() => new AniVaultApiClient({ baseUrl: '' }));
  const [library, setLibrary] = useState<UserLibrary[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [syncStatus, setSyncStatus] = useState<'SYNCED' | 'SYNCING' | 'CONFLICT'>('SYNCED');
  const [activeTab, setActiveTab] = useState('dashboard');

  const refreshData = async () => {
    try {
      const [libRes, franRes, confRes] = await Promise.all([
        client.getLibrary(),
        client.getFranchises(),
        client.getConflicts()
      ]);
      setLibrary(libRes.data);
      setFranchises(franRes.data);
      setConflicts(confRes);
      setSyncStatus(confRes.length > 0 ? 'CONFLICT' : 'SYNCED');
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const quickIncrement = async (libraryId: string, delta = 1) => {
    try {
      // Optimistic local update
      setLibrary((prev) =>
        prev.map((item) => {
          if (item.id === libraryId && item.progress) {
            const nextVal = item.media?.type === 'MANGA' ? item.progress.currentChapter + delta : item.progress.currentEpisode + delta;
            return {
              ...item,
              progress: {
                ...item.progress,
                currentEpisode: item.media?.type === 'ANIME' ? nextVal : item.progress.currentEpisode,
                currentChapter: item.media?.type === 'MANGA' ? nextVal : item.progress.currentChapter
              }
            };
          }
          return item;
        })
      );

      await client.quickIncrement(libraryId, delta);
      await refreshData();
    } catch (err) {
      console.error('Quick increment error:', err);
      refreshData();
    }
  };

  const resolveConflict = async (conflictId: string, strategy: any, customEp?: number) => {
    await client.resolveConflict({ conflictId, strategy, customEpisode: customEp });
    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        client,
        library,
        franchises,
        conflicts,
        syncStatus,
        activeTab,
        setActiveTab,
        refreshData,
        quickIncrement,
        resolveConflict
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

