import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '..', '..')
const frontendRoot = join(repositoryRoot, 'frontend')

const roots = [
  join(frontendRoot, 'app'),
  join(frontendRoot, 'components'),
  join(frontendRoot, 'lib'),
  join(repositoryRoot, 'backend', 'src', 'main', 'java'),
  join(repositoryRoot, 'backend', 'src', 'test', 'java'),
  join(repositoryRoot, 'database', 'sample-data'),
]

const files = [
  join(repositoryRoot, 'database', 'Homestay_Database.sql'),
  join(repositoryRoot, 'database', 'schema-target-en.dbml'),
]

const supportedExtensions = new Set(['.css', '.dbml', '.java', '.js', '.jsx', '.mjs', '.sql', '.ts', '.tsx'])
const forbiddenTerms = [
  /\bband\b/i,
  /\bstudio\b/i,
  /\brehearsal\b/i,
  /\bguitar\b/i,
  /\bdrum\b/i,
  /\bmixer\b/i,
  /\bmicrophone\b/i,
  /khách\s*\/\s*band/i,
  /standard practice/i,
  /premium studio/i,
]

const sourceAssertions = [
  {
    file: join(frontendRoot, 'components', 'admin', 'rooms', 'RoomFormModal.tsx'),
    includes: ['step={1}'],
    excludes: ['step={50_000}'],
    description: 'Giá phòng theo đêm phải cho phép nhập theo từng đồng.',
  },
  {
    file: join(frontendRoot, 'components', 'admin', 'rooms', 'RoomTierManager.tsx'),
    includes: ['step={1}'],
    excludes: ['step={1000}'],
    description: 'Giá theo giờ phải cho phép nhập theo từng đồng.',
  },
  {
    file: join(frontendRoot, 'components', 'staff', 'StaffNotificationsPage.tsx'),
    includes: ['useState<StaffNotification[]>([])', 'loadError'],
    excludes: ['initialNotifications'],
    description: 'Thông báo nhân viên không được fallback sang dữ liệu demo.',
  },
  {
    file: join(frontendRoot, 'components', 'staff', 'StaffReportsPage.tsx'),
    includes: ['exportStaffReportCsv', 'EMPTY_REPORT_DATA'],
    excludes: ['reportData', 'báo cáo demo'],
    description: 'Báo cáo nhân viên phải dùng dữ liệu thật và xuất file thật.',
  },
  {
    file: join(frontendRoot, 'components', 'staff', 'StaffRoomsPage.tsx'),
    includes: ['useState<StaffRoom[]>([])', 'loadError'],
    excludes: ['initialRooms', 'initialEquipment', 'initialIssues'],
    description: 'Màn hình vận hành phòng không được chứa dữ liệu runtime giả.',
  },
]

function collectFiles(directory) {
  for (const entry of readdirSync(directory)) {
    const absolutePath = join(directory, entry)
    const stats = statSync(absolutePath)
    if (stats.isDirectory()) collectFiles(absolutePath)
    else if (supportedExtensions.has(extname(entry))) files.push(absolutePath)
  }
}

for (const root of roots) collectFiles(root)

const violations = []
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, index) => {
    const matchedPattern = forbiddenTerms.find((pattern) => pattern.test(line))
    if (matchedPattern) {
      violations.push(`${relative(repositoryRoot, file)}:${index + 1}: ${line.trim()}`)
    }
  })
}

for (const assertion of sourceAssertions) {
  const source = readFileSync(assertion.file, 'utf8')
  const missing = assertion.includes.filter((value) => !source.includes(value))
  const forbidden = assertion.excludes.filter((value) => source.includes(value))
  if (missing.length > 0 || forbidden.length > 0) {
    violations.push(
      `${relative(repositoryRoot, assertion.file)}: ${assertion.description} `
      + `Thiếu [${missing.join(', ')}], còn tồn tại [${forbidden.join(', ')}].`,
    )
  }
}

if (violations.length > 0) {
  console.error('Found legacy music-studio domain terms outside historical migrations:')
  console.error(violations.join('\n'))
  process.exit(1)
}

console.log(`Homestay domain check passed (${files.length} files).`)
