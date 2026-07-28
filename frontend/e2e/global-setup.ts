import { spawn } from 'node:child_process'
import { cpSync, existsSync, writeFileSync } from 'node:fs'
import { request } from 'node:http'
import { join } from 'node:path'

const frontendRoot = process.cwd()
const standaloneRoot = join(frontendRoot, '.next', 'standalone')
const serverEntry = join(standaloneRoot, 'server.js')
const serverMarker = join(frontendRoot, '.next', 'e2e-server.pid')
const serverUrl = new URL('http://127.0.0.1:3000/')

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function isServerReady() {
  return new Promise<boolean>((resolve) => {
    const probe = request(
      {
        hostname: serverUrl.hostname,
        port: Number(serverUrl.port),
        path: serverUrl.pathname,
        method: 'GET',
        timeout: 1_500,
      },
      (response) => {
        response.resume()
        resolve(Boolean(response.statusCode && response.statusCode < 500))
      },
    )

    probe.on('error', () => resolve(false))
    probe.on('timeout', () => {
      probe.destroy()
      resolve(false)
    })
    probe.end()
  })
}

function terminateProcess(processId: number) {
  try {
    process.kill(processId, 'SIGTERM')
  } catch {
    // The process already exited.
  }
}

export default async function globalSetup() {
  if (await isServerReady()) {
    if (!existsSync(serverMarker)) writeFileSync(serverMarker, 'external', 'utf8')
    return
  }

  if (!existsSync(serverEntry)) {
    throw new Error('Missing production build. Run npm run build before npm run test:e2e.')
  }

  cpSync(join(frontendRoot, 'public'), join(standaloneRoot, 'public'), {
    recursive: true,
    force: true,
  })
  cpSync(
    join(frontendRoot, '.next', 'static'),
    join(standaloneRoot, '.next', 'static'),
    {
      recursive: true,
      force: true,
    },
  )

  const server = spawn(process.execPath, [serverEntry], {
    cwd: standaloneRoot,
    env: {
      ...process.env,
      BACKEND_API_URL: 'http://127.0.0.1:65535',
      ENFORCE_HTTPS: 'false',
      HOSTNAME: '127.0.0.1',
      PORT: '3000',
    },
    stdio: 'ignore',
    windowsHide: true,
  })

  if (!server.pid) throw new Error('Unable to start the E2E server process.')
  writeFileSync(serverMarker, String(server.pid), 'utf8')

  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`The E2E server exited early with code ${server.exitCode}.`)
    }
    if (await isServerReady()) return
    await delay(250)
  }

  terminateProcess(server.pid)
  throw new Error('The E2E server did not become ready within 30 seconds.')
}
