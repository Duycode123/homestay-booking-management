'use client'

import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings'

export default function AccessibilityClientProvider() {
  useAccessibilitySettings()

  return null
}
