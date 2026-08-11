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

  /* A service worker from a previous version can keep serving a stale cached
   * shell on the local origin (http://127.0.0.1:PORT), so the app would show
   * the old version on launch. The packaged app bundles its own content and
   * does not need a service worker at all — on every startup we purge any
   * existing registrations and caches, then reload once to guarantee the
   * freshly bundled version is shown immediately. */
  let swPurged = false;
  win.webContents.on('did-finish-load', async () => {
    if (swPurged) return;
    swPurged = true;
    try {
      const changed = await win.webContents.executeJavaScript(`
        (async () => {
          let changed = false;
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const reg of regs) {
              if (reg.active || reg.waiting || reg.installing) changed = true;
              await reg.unregister();
            }
          }
          if (typeof caches !== 'undefined') {
            const keys = await caches.keys();
            if (keys.length) changed = true;
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          return changed;
        })()
      `);
      if (changed) win.webContents.reload();
    } catch (err) {
      console.error('sw-purge failed', err && err.message ? err.message : err);
    }
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
