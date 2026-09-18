const { app, BrowserWindow, shell } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')
const net = require('net')

// ── Port helpers ────────────────────────────────────────────────────────────

function findFreePort(start = 3001) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(start, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
    server.on('error', () => resolve(findFreePort(start + 1)))
  })
}

function waitForBackend(port, retries = 40) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const req = http.get(`http://127.0.0.1:${port}/api/hosts`, () => resolve())
      req.on('error', () => {
        if (n > 0) setTimeout(() => attempt(n - 1), 500)
        else reject(new Error('Backend did not start in time'))
      })
      req.end()
    }
    attempt(retries)
  })
}

// ── Backend process ─────────────────────────────────────────────────────────

let backendProcess = null

function startBackend(port) {
  const isPackaged = app.isPackaged

  // Paths differ between dev (monorepo) and packaged app
  const backendEntry = isPackaged
    ? path.join(process.resourcesPath, 'backend/dist/index.js')
    : path.join(__dirname, '../backend/dist/index.js')

  const frontendDist = isPackaged
    ? path.join(process.resourcesPath, 'frontend/dist')
    : path.join(__dirname, '../frontend/dist')

  const dbPath = path.join(app.getPath('userData'), 'isovershell.db')

  const env = {
    ...process.env,
    PORT: String(port),
    NODE_ENV: 'production',
    DATABASE_PATH: dbPath,
    FRONTEND_DIST: frontendDist,
  }

  backendProcess = spawn('node', [backendEntry], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  backendProcess.stdout.on('data', (d) => process.stdout.write(`[backend] ${d}`))
  backendProcess.stderr.on('data', (d) => process.stderr.write(`[backend] ${d}`))

  backendProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[backend] exited with code ${code}`)
    }
  })
}

// ── Window ──────────────────────────────────────────────────────────────────

let mainWindow = null

async function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'ISOverShell',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadURL(`http://127.0.0.1:${port}`)

  // Open target="_blank" links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ── App lifecycle ───────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  const port = await findFreePort(3001)
  startBackend(port)
  await waitForBackend(port)
  await createWindow(port)
})

app.on('window-all-closed', () => {
  killBackend()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', killBackend)

app.on('activate', async () => {
  if (mainWindow === null) {
    const port = await findFreePort(3001)
    startBackend(port)
    await waitForBackend(port)
    await createWindow(port)
  }
})

function killBackend() {
  if (backendProcess) {
    backendProcess.kill()
    backendProcess = null
  }
}
