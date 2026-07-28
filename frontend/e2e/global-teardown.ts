import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const serverMarker = join(process.cwd(), '.next', 'e2e-server.pid')

function isRunning(processId: number) {
  try {
    process.kill(processId, 0)
    return true
  } catch {
    return false
  }
}

function terminateProcessTree(processId: number) {
  try {
    process.kill(processId, 'SIGTERM')
  } catch {
    return
  }

  if (!isRunning(processId)) return

  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill.exe', ['/pid', String(processId), '/t', '/f'], {
        stdio: 'ignore',
        windowsHide: true,
      })
    } catch {
      // The process may have exited between checks.
    }
    return
  }

  try {
    process.kill(processId, 'SIGKILL')
  } catch {
    // The process already exited.
  }
}

export default function globalTeardown() {
  if (!existsSync(serverMarker)) return

  const marker = readFileSync(serverMarker, 'utf8').trim()
  unlinkSync(serverMarker)

  if (!/^\d+$/.test(marker)) return
  terminateProcessTree(Number(marker))
}
