import React from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { FranchisePage } from './pages/FranchisePage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { IdentityEditorPage } from './pages/IdentityEditorPage';
import { ImportExportPage } from './pages/ImportExportPage';
import { StatsPage } from './pages/StatsPage';

export const App: React.FC = () => {
  const { activeTab } = useApp();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'library':
        return <LibraryPage />;
      case 'franchises':
        return <FranchisePage />;
      case 'integrations':
        return <IntegrationsPage />;
      case 'identity-editor':
        return <IdentityEditorPage />;
      case 'import-export':
        return <ImportExportPage />;
      case 'stats':
        return <StatsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-primary)' }}>
        {renderContent()}
      </main>
    </div>
  );
};

