export type AccessibilitySettings = {
  darkMode: boolean
  highContrast: boolean
  reducedMotion: boolean
  enhancedFocus: boolean
  fontSize: 'default' | 'large' | 'extra-large'
}

export const ACCESSIBILITY_SETTINGS_KEY = 'homestay_accessibility_settings'

export const defaultAccessibilitySettings: AccessibilitySettings = {
  darkMode: false,
  highContrast: false,
  reducedMotion: false,
  enhancedFocus: false,
  fontSize: 'default',
}

const accessibilityClasses = [
  'accessibility-dark',
  'accessibility-high-contrast',
  'accessibility-reduced-motion',
  'accessibility-enhanced-focus',
  'accessibility-font-large',
  'accessibility-font-extra-large',
]

function isFontSize(value: unknown): value is AccessibilitySettings['fontSize'] {
  return value === 'default' || value === 'large' || value === 'extra-large'
}

function normalizeAccessibilitySettings(value: unknown): AccessibilitySettings {
  if (!value || typeof value !== 'object') {
    return defaultAccessibilitySettings
  }

  const parsed = value as Partial<AccessibilitySettings>

  return {
    darkMode: Boolean(parsed.darkMode),
    highContrast: Boolean(parsed.highContrast),
    reducedMotion: Boolean(parsed.reducedMotion),
    enhancedFocus: Boolean(parsed.enhancedFocus),
    fontSize: isFontSize(parsed.fontSize) ? parsed.fontSize : 'default',
  }
}

export function loadAccessibilitySettings(): AccessibilitySettings {
  if (typeof window === 'undefined') {
    return defaultAccessibilitySettings
  }

  try {
    const rawSettings = window.localStorage.getItem(ACCESSIBILITY_SETTINGS_KEY)
    if (!rawSettings) {
      return defaultAccessibilitySettings
    }

    return normalizeAccessibilitySettings(JSON.parse(rawSettings))
  } catch {
    return defaultAccessibilitySettings
  }
}

export function saveAccessibilitySettings(settings: AccessibilitySettings) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(ACCESSIBILITY_SETTINGS_KEY, JSON.stringify(settings))
}

export function clearAccessibilitySettings() {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(ACCESSIBILITY_SETTINGS_KEY)
}

export function applyAccessibilitySettings(settings: AccessibilitySettings) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.remove(...accessibilityClasses)
  root.style.colorScheme = settings.darkMode ? 'dark' : 'light'

  root.classList.toggle('accessibility-dark', settings.darkMode)
  root.classList.toggle('accessibility-high-contrast', settings.highContrast)
  root.classList.toggle('accessibility-reduced-motion', settings.reducedMotion)
  root.classList.toggle('accessibility-enhanced-focus', settings.enhancedFocus)

  if (settings.fontSize === 'large') {
    root.classList.add('accessibility-font-large')
  }

  if (settings.fontSize === 'extra-large') {
    root.classList.add('accessibility-font-extra-large')
  }
}
