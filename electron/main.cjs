const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const http = require('node:http');

const PORT = 3589;
const HOST = '127.0.0.1';
const APP_URL = `http://${HOST}:${PORT}`;

const APP_ROOT = path.join(__dirname, '..');
const isSmoke = process.env.SMOKE_TEST === '1';

function waitForServer(timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setTimeout(() => reject(new Error('Server did not become ready in time')), timeoutMs);
    const attempt = () => {
      const req = http.get(APP_URL, (res) => {
        res.resume();
        clearTimeout(timer);
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) {
          clearTimeout(timer);
          reject(new Error('Server not reachable'));
        } else {
          setTimeout(attempt, 250);
        }
      });
    };
    attempt();
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    title: 'الموسوعة الإسلامية',
    autoHideMenuBar: true,
    backgroundColor: '#0d2a20',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error('did-fail-load', code, desc);
  });
  win.once('ready-to-show', () => win.show());
  win.on('closed', () => {
    /* handled by window-all-closed */
  });

  await win.loadURL(APP_URL);
  if (isSmoke) {
    console.log('SMOKE_OK');
    app.quit();
  }
  return win;
}

app.whenReady().then(async () => {
  try {
    process.chdir(APP_ROOT);
    process.env.PORT = String(PORT);
    process.env.NITRO_HOST = HOST;
    await import(pathToFileURL(path.join(APP_ROOT, '.output', 'server', 'index.mjs')).href);
    await waitForServer();
    await createWindow();
  } catch (err) {
    console.error('FATAL', err && err.stack ? err.stack : err);
    app.exit(1);
  }
});

app.on('window-all-closed', () => app.quit());

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch((err) => console.error(err));
  }
});
