import { NetworkStatus, ApiStatus } from '../types/electron';
import './SyncStatus.css';

interface SyncStatusProps {
  networkStatus: NetworkStatus;
  apiStatus: ApiStatus;
  isSyncing: boolean;
  onSync: () => void;
  onSyncUp?: () => void; // Optional upload sync (disabled in development)
}

export function SyncStatus({
  networkStatus,
  isSyncing,
  onSync,
}: SyncStatusProps) {
  // Only need network connection for Supabase sync (not the web app API)
  const canSync = networkStatus.online;

  return (
    <div className="sync-status">
      <div className="status-indicators">
        <div className={`status-indicator ${networkStatus.online ? 'online' : 'offline'}`}>
          <span className="status-dot" />
          <span className="status-text">
            {networkStatus.online ? 'Network' : 'Offline'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {/* Download from Supabase */}
        <button
          className="sync-button"
          onClick={onSync}
          disabled={!canSync || isSyncing}
          title="Download jobs and reports from Supabase"
          style={{ 
            backgroundColor: '#10b981',
            borderColor: '#10b981'
          }}
        >
          {isSyncing ? (
            <>
              <span className="spinner" />
              Downloading...
            </>
          ) : (
            <>
              <span className="sync-icon">⬇</span>
              Sync FROM DB
            </>
          )}
        </button>

        {/* Upload to Supabase - DISABLED in development */}
        <button
          className="sync-button"
          onClick={() => {
            alert('⚠️ Upload to Database is DISABLED during development.\n\nThis will be enabled later to push offline changes back to Supabase.');
          }}
          disabled={true}
          title="Upload offline changes to Supabase (DISABLED)"
          style={{ 
            backgroundColor: '#6b7280',
            borderColor: '#6b7280',
            opacity: 0.5,
            cursor: 'not-allowed'
          }}
        >
          <span className="sync-icon">⬆</span>
          Sync TO DB
          <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>(disabled)</span>
        </button>
      </div>
    </div>
  );
}

