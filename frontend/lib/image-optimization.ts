const OPTIMIZED_REMOTE_IMAGE_HOSTS = new Set([
  'res.cloudinary.com',
  'cdn.justfly.vn',
])

/**
 * Next/Image can optimize local assets and the trusted remote hosts declared in
 * next.config.ts. Unknown admin-provided URLs still render directly instead of
 * crashing with an unconfigured-host error.
 */
export function shouldBypassImageOptimization(source?: string | null) {
  const value = source?.trim()
  if (!value) return false
  if (value.startsWith('/') && !value.startsWith('//')) return false

  try {
    const url = new URL(value)
    return url.protocol !== 'https:' || !OPTIMIZED_REMOTE_IMAGE_HOSTS.has(url.hostname)
  } catch {
    return true
  }
}
