const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script
 * Exposes safe IPC methods to the renderer process
 */

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Network status
  checkNetwork: () => ipcRenderer.invoke('check-network'),
  onNetworkStatusChanged: (callback) => {
    ipcRenderer.on('network-status-changed', (event, data) => callback(data));
  },
  onApiStatusChanged: (callback) => {
    ipcRenderer.on('api-status-changed', (event, data) => callback(data));
  },

  // Sync operations
  triggerSync: () => ipcRenderer.invoke('trigger-sync'),

  // Database operations
  dbQuery: (table, method, params) => 
    ipcRenderer.invoke('db-query', { table, method, params }),

  // Supabase configuration
  getSupabaseConfig: () => ipcRenderer.invoke('get-supabase-config'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (key, value) => 
    ipcRenderer.invoke('update-settings', { key, value }),

  // File operations
  selectFile: () => ipcRenderer.invoke('select-file'),

  // App info
  platform: process.platform,
  version: process.versions.electron,
});

