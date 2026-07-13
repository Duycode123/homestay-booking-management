'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  applyAccessibilitySettings,
  clearAccessibilitySettings,
  defaultAccessibilitySettings,
  loadAccessibilitySettings,
  saveAccessibilitySettings,
  type AccessibilitySettings,
} from '@/lib/accessibility-settings-service'

export function useAccessibilitySettings() {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultAccessibilitySettings)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const storedSettings = loadAccessibilitySettings()
    setSettings(storedSettings)
    applyAccessibilitySettings(storedSettings)
    setIsLoaded(true)
  }, [])

  const updateSetting = useCallback(
    <Key extends keyof AccessibilitySettings>(key: Key, value: AccessibilitySettings[Key]) => {
      setSettings((currentSettings) => {
        const nextSettings = {
          ...currentSettings,
          [key]: value,
        }

        saveAccessibilitySettings(nextSettings)
        applyAccessibilitySettings(nextSettings)
        return nextSettings
      })
    },
    [],
  )

  const resetSettings = useCallback(() => {
    clearAccessibilitySettings()
    applyAccessibilitySettings(defaultAccessibilitySettings)
    setSettings(defaultAccessibilitySettings)
  }, [])

  return {
    settings,
    updateSetting,
    resetSettings,
    isLoaded,
  }
}
