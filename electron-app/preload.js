const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),
  printInvoice: (invoiceId, type) => ipcRenderer.invoke('print-invoice', { invoiceId, type }),
  selectFile: () => ipcRenderer.invoke('select-file'),
});
