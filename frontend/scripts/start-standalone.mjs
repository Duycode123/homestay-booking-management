import { cpSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const frontendRoot = process.cwd()
const standaloneRoot = join(frontendRoot, '.next', 'standalone')
const serverEntry = join(standaloneRoot, 'server.js')

if (!existsSync(serverEntry)) {
  throw new Error('Missing production build. Run npm run build before starting the standalone server.')
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

process.env.BACKEND_API_URL ??= 'http://127.0.0.1:65535'
process.env.HOSTNAME ??= '127.0.0.1'
process.env.PORT ??= '3000'
process.chdir(standaloneRoot)

await import(pathToFileURL(serverEntry).href)
