import { NetworkStatus, ApiStatus } from '../types/electron';
import './SyncStatus.css';

interface SyncStatusProps {
  networkStatus: NetworkStatus;
  apiStatus: ApiStatus;
  isSyncing: boolean;
  isSyncingUp?: boolean;
  onSync: () => void;
  onSyncUp?: () => void;
}

export function SyncStatus({
  networkStatus,
  isSyncing,
  isSyncingUp,
  onSync,
  onSyncUp,
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
          disabled={!canSync || isSyncing || isSyncingUp}
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

        {/* Upload to Supabase */}
        <button
          className="sync-button"
          onClick={onSyncUp}
          disabled={!canSync || isSyncing || isSyncingUp || !onSyncUp}
          title="Upload offline changes to Supabase"
          style={{ 
            backgroundColor: isSyncingUp ? '#3b82f6' : '#3b82f6',
            borderColor: '#3b82f6'
          }}
        >
          {isSyncingUp ? (
            <>
              <span className="spinner" />
              Uploading...
            </>
          ) : (
            <>
          <span className="sync-icon">⬆</span>
          Sync TO DB
            </>
          )}
        </button>
      </div>
    </div>
  );
}

