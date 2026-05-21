/// <reference types="react-scripts" />

interface ElectronAPI {
  getBackendUrl: () => Promise<string>;
  getAppVersion: () => Promise<string>;
  getAppDataPath: () => Promise<string>;
  showNotification: (title: string, body: string) => Promise<void>;
  printInvoice: (invoiceId: number, type: 'a4' | 'thermal') => Promise<boolean>;
  selectFile: () => Promise<string | null>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
