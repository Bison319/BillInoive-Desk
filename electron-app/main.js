const { app, BrowserWindow, ipcMain, dialog, Notification, Menu, Tray } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const log = require('electron-log');
const treeKill = require('tree-kill');
const fs = require('fs');

// Company name configuration
function getConfigPath() {
  const appDataPath = getAppDataPath();
  return path.join(appDataPath, 'config.json');
}

function loadConfig() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    log.error('Error loading config:', e);
  }
  return null;
}

function saveConfig(config) {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function askCompanyName() {
  const config = loadConfig();
  if (config && config.companyName && config.companyName !== 'My Company') {
    return config.companyName;
  }

  // Show first-run setup wizard for company details
  return new Promise((resolve) => {
    const promptWin = new BrowserWindow({
      width: 560,
      height: 520,
      resizable: false,
      minimizable: false,
      maximizable: false,
      frame: true,
      title: 'BillCraft - First Time Setup',
      icon: path.join(__dirname, 'assets', 'BIcon.ico'),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      }
    });

    const html = `<!DOCTYPE html>
<html><head><style>
  body { font-family: 'Segoe UI', sans-serif; padding: 30px; background: linear-gradient(135deg, #1a237e, #283593); color: #fff; margin: 0; }
  h2 { color: #ff6d00; margin-bottom: 5px; font-size: 22px; }
  p { color: rgba(255,255,255,0.7); font-size: 13px; margin-bottom: 18px; }
  label { display: block; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); margin-bottom: 4px; margin-top: 12px; }
  input { width: 100%; padding: 10px 12px; font-size: 14px; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; background: rgba(255,255,255,0.08); color: #fff; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
  input:focus { border-color: #ff6d00; box-shadow: 0 0 8px rgba(255,109,0,0.3); }
  input.error { border-color: #ff5252; }
  .error-msg { color: #ff5252; font-size: 11px; margin-top: 3px; display: none; }
  .error-msg.show { display: block; }
  .required { color: #ff6d00; }
  button { margin-top: 22px; padding: 12px 30px; background: linear-gradient(135deg, #ff6d00, #ff9100); color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; width: 100%; transition: opacity 0.2s; }
  button:hover { opacity: 0.9; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .gst-hint { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }
</style></head><body>
  <h2>Welcome to BillCraft</h2>
  <p>Set up your business details. These will appear on invoices and reports.</p>
  <label>Company Name <span class="required">*</span></label>
  <input id="companyName" placeholder="e.g. Rajesh Furniture Works" autofocus />
  <div id="companyNameErr" class="error-msg">Company name is required</div>
  <label>Owner / Proprietor Name <span class="required">*</span></label>
  <input id="ownerName" placeholder="e.g. Rajesh Kumar" />
  <div id="ownerNameErr" class="error-msg">Owner name is required</div>
  <label>GST Number (GSTIN)</label>
  <input id="gstNumber" placeholder="e.g. 29ABCDE1234F1Z5" maxlength="15" style="text-transform:uppercase" />
  <div class="gst-hint">15-character alphanumeric (leave blank if not registered)</div>
  <div id="gstErr" class="error-msg">Invalid GST format. Must be: 2-digit state code + 10-char PAN + entity no + Z + check digit</div>
  <label>Phone Number</label>
  <input id="phone" placeholder="e.g. 9876543210" maxlength="10" />
  <button id="submitBtn" onclick="submit()">Save & Continue</button>
  <script>
    const { ipcRenderer } = require('electron');
    function validateGST(gst) {
      if (!gst) return true;
      gst = gst.toUpperCase().trim();
      if (gst.length !== 15) return false;
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gst)) return false;
      const stateCode = parseInt(gst.substring(0, 2));
      if (stateCode < 1 || stateCode > 37) return false;
      return true;
    }
    function submit() {
      const companyName = document.getElementById('companyName').value.trim();
      const ownerName = document.getElementById('ownerName').value.trim();
      const gstNumber = document.getElementById('gstNumber').value.trim().toUpperCase();
      const phone = document.getElementById('phone').value.trim();
      let valid = true;
      document.getElementById('companyNameErr').classList.toggle('show', !companyName);
      document.getElementById('ownerNameErr').classList.toggle('show', !ownerName);
      if (!companyName) valid = false;
      if (!ownerName) valid = false;
      if (gstNumber && !validateGST(gstNumber)) {
        document.getElementById('gstErr').classList.add('show');
        document.getElementById('gstNumber').classList.add('error');
        valid = false;
      } else {
        document.getElementById('gstErr').classList.remove('show');
        document.getElementById('gstNumber').classList.remove('error');
      }
      if (!valid) return;
      ipcRenderer.send('company-setup-done', { companyName, ownerName, gstNumber, phone });
    }
    document.querySelectorAll('input').forEach(input => {
      input.addEventListener('keypress', (e) => { if (e.key === 'Enter') submit(); });
    });
  </script>
</body></html>`;

    promptWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    promptWin.setMenuBarVisibility(false);

    ipcMain.once('company-setup-done', (event, setupData) => {
      saveConfig({ 
        companyName: setupData.companyName, 
        ownerName: setupData.ownerName,
        gstNumber: setupData.gstNumber,
        phone: setupData.phone,
        setupDate: new Date().toISOString() 
      });
      promptWin.close();
      resolve(setupData.companyName);
    });

    promptWin.on('closed', () => {
      const cfg = loadConfig();
      if (!cfg || !cfg.companyName || cfg.companyName === 'My Company') {
        // User closed without completing - force a default
        resolve('My Company');
      }
    });
  });
}

// Configure logging
log.transports.file.resolvePathFn = () => {
  const userHome = app.getPath('userData');
  return path.join(userHome, 'logs', 'electron.log');
};
log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB

let mainWindow;
let splashWindow;
let backendProcess;
let tray;
const BACKEND_PORT = 8080;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
const HEALTH_URL = `${BACKEND_URL}/api/v1/health`;

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

function getAppDataPath() {
  const userHome = process.env.USERPROFILE || process.env.HOME || '';
  return path.join(userHome, '.billcraft');
}

function getJavaPath() {
  // Check bundled JRE first
  const resourcesPath = process.resourcesPath || path.join(__dirname, '..');
  const bundledJre = path.join(resourcesPath, 'jre', 'bin', 'java.exe');
  if (fs.existsSync(bundledJre)) {
    log.info('Using bundled JRE:', bundledJre);
    return bundledJre;
  }

  // Try bundled JRE in runtime folder (development)
  const devJre = path.join(__dirname, '..', 'runtime', 'jre', 'bin', 'java.exe');
  if (fs.existsSync(devJre)) {
    log.info('Using dev JRE:', devJre);
    return devJre;
  }

  // Fallback to system Java
  log.info('Using system Java');
  return 'java';
}

function getBackendJarPath() {
  // Check packaged location first
  const resourcesPath = process.resourcesPath || path.join(__dirname, '..');
  const packagedJar = path.join(resourcesPath, 'backend', 'billcraft-backend.jar');
  if (fs.existsSync(packagedJar)) {
    return packagedJar;
  }

  // Development fallback
  const devJar = path.join(__dirname, '..', 'springboot-backend', 'build', 'libs', 'billcraft-backend.jar');
  if (fs.existsSync(devJar)) {
    return devJar;
  }

  return null;
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 350,
    frame: false,
    transparent: true,
    resizable: false,
    center: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: 'AVP Nexus - Billing & Payment Platform',
    icon: path.join(__dirname, 'assets', 'BillingIcon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMenu(null);

  // Load React app
  const isDev = !app.isPackaged;
  if (isDev && process.env.ELECTRON_DEV_URL) {
    mainWindow.loadURL(process.env.ELECTRON_DEV_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'build', 'index.html'));
  }

  mainWindow.on('close', (e) => {
    e.preventDefault();
    handleAppClose();
  });

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    mainWindow.show();
    mainWindow.focus();
  });
}

async function startBackend() {
  // Check if backend is already running
  try {
    const response = await axios.get(HEALTH_URL, { timeout: 2000 });
    if (response.status === 200) {
      log.info('Backend already running');
      return true;
    }
  } catch (e) {
    // Not running, proceed to start
  }

  const jarPath = getBackendJarPath();
  if (!jarPath) {
    log.error('Backend JAR not found');
    dialog.showErrorBox('AVP Nexus Error', 'Backend application not found. Please reinstall AVP Nexus.');
    app.exit(1);
    return false;
  }

  const javaPath = getJavaPath();
  const appDataPath = getAppDataPath();
  const dbPath = path.join(appDataPath, 'data', 'billcraftdb');
  const logPath = path.join(appDataPath, 'logs', 'billcraft.log');
  const backupPath = path.join(appDataPath, 'backups');

  // Ensure directories exist
  [path.dirname(dbPath), path.dirname(logPath), backupPath].forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
  });

  log.info('Starting backend:', javaPath, jarPath);
  log.info('DB Path:', dbPath);

  backendProcess = spawn(javaPath, [
    '-jar', jarPath,
    `--BILLCRAFT_DB_PATH=${dbPath}`,
    `--BILLCRAFT_LOG_PATH=${logPath}`,
    `--BILLCRAFT_BACKUP_PATH=${backupPath}`,
    '--server.port=' + BACKEND_PORT
  ], {
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: false,
    windowsHide: true
  });

  backendProcess.stdout.on('data', (data) => {
    log.info('[Backend]', data.toString().trim());
  });

  backendProcess.stderr.on('data', (data) => {
    log.warn('[Backend Error]', data.toString().trim());
  });

  backendProcess.on('error', (err) => {
    log.error('Failed to start backend:', err);
    dialog.showErrorBox('AVP Nexus Error',
      'Failed to start the application backend.\n\nPlease ensure Java is installed or reinstall AVP Nexus.');
    app.exit(1);
  });

  backendProcess.on('exit', (code) => {
    log.info('Backend exited with code:', code);
    backendProcess = null;
  });

  // Wait for backend to be ready
  return waitForBackend(60); // 60 second timeout
}

async function waitForBackend(maxSeconds) {
  for (let i = 0; i < maxSeconds * 2; i++) {
    try {
      const response = await axios.get(HEALTH_URL, { timeout: 1000 });
      if (response.status === 200) {
        log.info('Backend is ready');
        return true;
      }
    } catch (e) {
      // Not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  log.error('Backend failed to start within timeout');
  dialog.showErrorBox('AVP Nexus Error', 'Application backend failed to start. Please check the logs.');
  return false;
}

function stopBackend() {
  return new Promise((resolve) => {
    if (!backendProcess) {
      resolve();
      return;
    }

    log.info('Stopping backend...');

    // Try graceful shutdown via actuator
    axios.post(`${BACKEND_URL}/actuator/shutdown`, {}, { timeout: 5000 })
      .catch(() => {});

    // Force kill after timeout
    const killTimeout = setTimeout(() => {
      if (backendProcess && backendProcess.pid) {
        treeKill(backendProcess.pid, 'SIGTERM', (err) => {
          if (err) log.error('Error killing backend:', err);
          backendProcess = null;
          resolve();
        });
      } else {
        resolve();
      }
    }, 5000);

    if (backendProcess) {
      backendProcess.on('exit', () => {
        clearTimeout(killTimeout);
        backendProcess = null;
        resolve();
      });
    }
  });
}

async function handleAppClose() {
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Minimize to Tray', 'Quit'],
    defaultId: 0,
    title: 'AVP Nexus',
    message: 'What would you like to do?',
    detail: 'You can minimize to system tray or quit the application completely.'
  });

  if (response === 0) {
    mainWindow.hide();
  } else {
    await stopBackend();
    app.exit(0);
  }
}

// IPC Handlers
ipcMain.handle('get-backend-url', () => BACKEND_URL);
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-data-path', () => getAppDataPath());

ipcMain.handle('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: path.join(__dirname, 'assets', 'BIcon.ico') }).show();
  }
});

ipcMain.handle('print-invoice', async (event, { invoiceId, type }) => {
  try {
    const url = type === 'thermal'
      ? `${BACKEND_URL}/api/v1/invoices/${invoiceId}/thermal`
      : `${BACKEND_URL}/api/v1/invoices/${invoiceId}/pdf`;

    const win = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });

    if (type === 'thermal') {
      await win.loadURL(url);
    } else {
      // Download PDF first, then use system print
      const token = event.sender.executeJavaScript('localStorage.getItem("token")');
      await win.loadURL(`${BACKEND_URL}/api/v1/invoices/${invoiceId}/download?token=${await token}`);
    }

    win.webContents.print({ silent: false, printBackground: true }, (success, reason) => {
      win.close();
      return success;
    });
  } catch (e) {
    log.error('Print failed:', e);
    return false;
  }
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'SQL Backup', extensions: ['sql'] }]
  });
  return result.filePaths[0] || null;
});

// IPC handler for company name
ipcMain.handle('get-company-name', () => {
  const config = loadConfig();
  return config?.companyName || 'My Company';
});

// App lifecycle
app.whenReady().then(async () => {
  // Ask for company name on first launch
  const companyName = await askCompanyName();
  log.info('Company name:', companyName);

  createSplashWindow();

  const backendReady = await startBackend();
  if (!backendReady) {
    app.exit(1);
    return;
  }

  // Save company details to backend settings
  try {
    const config = loadConfig() || {};
    await axios.post('http://localhost:8080/api/v1/auth/login', 
      { username: 'admin', password: 'admin123' },
      { headers: { 'Content-Type': 'application/json' } }
    ).then(async (loginRes) => {
      const token = loginRes.data.token;
      const settings = { company_name: companyName };
      if (config.ownerName) settings.owner_name = config.ownerName;
      if (config.gstNumber) settings.gst_number = config.gstNumber;
      if (config.phone) settings.company_phone = config.phone;
      await axios.put('http://localhost:8080/api/v1/settings',
        settings,
        { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
      );
      log.info('Company name saved to backend settings');
    });
  } catch (e) {
    log.warn('Could not save company name to backend:', e.message);
  }

  createMainWindow();
});

app.on('window-all-closed', () => {
  // Do nothing - keep running in tray
});

app.on('before-quit', async () => {
  await stopBackend();
});

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
  }
});
