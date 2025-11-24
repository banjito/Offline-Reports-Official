import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { JobList } from './components/JobList';
import { JobDetail } from './components/JobDetail';
import { ReportViewer } from './components/ReportViewer';
import { SyncStatus } from './components/SyncStatus';
import { NetworkStatus, ApiStatus } from './types/electron';
import { initializeSyncService, performFullSync, syncUpReports } from './services/realtime-sync';
import './App.css';

function App() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: true,
    timestamp: new Date().toISOString(),
  });
  
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    reachable: false,
    timestamp: new Date().toISOString(),
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingUp, setIsSyncingUp] = useState(false);
  const [syncInitialized, setSyncInitialized] = useState(false);

  useEffect(() => {
    // Set up network status listeners
    window.electronAPI.onNetworkStatusChanged((status) => {
      console.log('Network status changed:', status);
      setNetworkStatus(status);
    });

    window.electronAPI.onApiStatusChanged((status) => {
      console.log('API status changed:', status);
      setApiStatus(status);
    });

    // Initial network check
    window.electronAPI.checkNetwork().then(setNetworkStatus);
    
    // Initialize sync service with Supabase
    initializeSyncService()
      .then(() => {
        console.log('Sync service ready');
        setSyncInitialized(true);
      })
      .catch((error) => {
        console.error('Failed to initialize sync service:', error);
        console.warn('Create a .env file with SUPABASE_URL and SUPABASE_ANON_KEY to enable sync');
      });
  }, []);

  const handleSync = async () => {
    if (!syncInitialized) {
      alert('Sync service not initialized. Please check your .env file has SUPABASE_URL and SUPABASE_ANON_KEY');
      return;
    }
    
    setIsSyncing(true);
    try {
      console.log('Starting sync from Supabase...');
      const result = await performFullSync();
      
      if (result.success) {
        const messages = [
          `Sync completed!`,
          ``,
          `✅ ${result.formTemplatesCount || 0} custom form templates`,
          `✅ ${result.jobsCount} jobs (in-progress + parent jobs for reports)`,  
          `✅ ${result.reportsCount || 0} filled-out reports`,
          `✅ ${result.assetsCount || 0} assets (PDFs, photos, drawings, reports)`,
          ``,
          `Note: Syncs in-progress jobs plus any reports referenced by assets.`,
          `Standard report types (ATS/MTS) are built into the app.`,
          ``,
          `Refreshing job list...`
        ];
        alert(messages.join('\n'));
        
        // Force JobList to refresh by triggering a window event
        window.dispatchEvent(new Event('jobs-synced'));
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed. Check console for details.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncUp = async () => {
    if (!syncInitialized) {
      alert('Sync service not initialized. Please check your .env file has SUPABASE_URL and SUPABASE_ANON_KEY');
      return;
    }
    
    setIsSyncingUp(true);
    try {
      console.log('Starting sync UP to Supabase...');
      const result = await syncUpReports();
      
      const messages = [
        result.success ? `Upload completed!` : `Upload had issues:`,
        ``,
        `📤 ${result.reportsUploaded || 0} reports uploaded`,
        `📦 ${result.assetsCreated || 0} assets created`,
      ];
      
      if (result.errors && result.errors.length > 0) {
        messages.push(``, `⚠️ ${result.errors.length} errors/warnings:`, ...result.errors.slice(0, 10));
      }
      
      alert(messages.join('\n'));
    } catch (error) {
      console.error('Sync up error:', error);
      alert('Upload failed. Check console for details.');
    } finally {
      setIsSyncingUp(false);
    }
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1>Field Tech Desktop</h1>
            <SyncStatus
              networkStatus={networkStatus}
              apiStatus={apiStatus}
              isSyncing={isSyncing}
              isSyncingUp={isSyncingUp}
              onSync={handleSync}
              onSyncUp={handleSyncUp}
            />
          </div>
        </header>

        <main className="app-main">
          <div className="container">
            <Routes>
              <Route path="/" element={<JobList />} />
              <Route path="/job/:jobId" element={<JobDetail />} />
              <Route path="/jobs/:jobId/reports/:reportId" element={<ReportViewer />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;

