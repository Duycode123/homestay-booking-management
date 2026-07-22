'use client'

import { useI18n } from '@/components/i18n/LocaleProvider'

export default function SkipNavigationLink() {
  const { t } = useI18n()

  return <a href="#main-content" className="skip-link">{t('site.skipNavigation')}</a>
}
