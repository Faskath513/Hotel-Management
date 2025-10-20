// electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !!process.env.ELECTRON_START_URL || !app.isPackaged;
  const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:4200';

  if (isDev) {
    console.log('Electron loading DEV URL:', devUrl);
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Robust lookup for Angular’s build output
    const distDir = path.join(__dirname, '..', 'dist');
    const candidates = [
      path.join(distDir, 'index.html'),
      path.join(distDir, 'browser', 'index.html'),
      path.join(distDir, 'hotel-frontend', 'index.html'),
      path.join(distDir, 'hotel-frontend', 'browser', 'index.html'),
    ];
    const indexPath = candidates.find(fs.existsSync);
    if (!indexPath) throw new Error('Cannot find Angular build index.html under dist/*');
    console.log('Electron loading FILE:', indexPath);
    win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});