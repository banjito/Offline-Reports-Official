/**
 * Electron API type definitions
 * Matches the API exposed in preload.js
 */

// Declare electron module to avoid TypeScript errors
declare module 'electron' {
  export const app: {
    getPath: (name: string) => string;
  };
}

export interface NetworkStatus {
  online: boolean;
  timestamp: string;
}

export interface ApiStatus {
  reachable: boolean;
  timestamp: string;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  message?: string;
  uploaded?: number;
  downloaded?: number;
  errors?: string[];
}

export interface DbQueryResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SettingsResult {
  success: boolean;
  settings?: {
    last_full_sync: string | null;
    sync_interval_minutes: number;
    auto_sync_enabled: boolean;
    offline_mode: boolean;
    current_user_id: string | null;
    api_base_url: string | null;
  };
  error?: string;
}

export interface FileSelectResult {
  success: boolean;
  canceled?: boolean;
  filePaths?: string[];
}

export interface ElectronAPI {
  // Network status
  checkNetwork: () => Promise<NetworkStatus>;
  onNetworkStatusChanged: (callback: (data: NetworkStatus) => void) => void;
  onApiStatusChanged: (callback: (data: ApiStatus) => void) => void;

  // Sync operations
  triggerSync: () => Promise<SyncResult>;

  // Database operations
  dbQuery: <T = any>(
    table: string,
    method: string,
    params?: any
  ) => Promise<DbQueryResult<T>>;

  // Supabase configuration
  getSupabaseConfig: () => Promise<{
    success: boolean;
    url?: string;
    anonKey?: string;
    error?: string;
  }>;

  // Settings
  getSettings: () => Promise<SettingsResult>;
  updateSettings: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;

  // File operations
  selectFile: () => Promise<FileSelectResult>;

  // App info
  platform: string;
  version: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

