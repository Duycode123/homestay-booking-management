import type { Locale } from '@/i18n/config'

export const HOMESTAY_CITY = 'Hà Nội' as const
export const HOMESTAY_ACCOMMODATION_TYPE = 'HOMESTAY' as const

export const SUPPORTED_HOMESTAY_DISTRICTS = [
  { value: 'Đống Đa', vi: 'Đống Đa', en: 'Dong Da' },
  { value: 'Ba Vì', vi: 'Ba Vì', en: 'Ba Vi' },
  { value: 'Sơn Tây', vi: 'Sơn Tây', en: 'Son Tay' },
  { value: 'Sóc Sơn', vi: 'Sóc Sơn', en: 'Soc Son' },
] as const

export type SupportedHomestayDistrict = typeof SUPPORTED_HOMESTAY_DISTRICTS[number]['value']

export function isSupportedHomestayDistrict(value?: string | null): value is SupportedHomestayDistrict {
  const normalized = value?.trim().toLocaleLowerCase('vi-VN')
  return SUPPORTED_HOMESTAY_DISTRICTS.some(
    (district) => district.value.toLocaleLowerCase('vi-VN') === normalized,
  )
}

export function getSupportedHomestayDistrictOptions(locale: Locale) {
  return SUPPORTED_HOMESTAY_DISTRICTS.map((district) => ({
    value: district.value,
    label: locale === 'en' ? district.en : district.vi,
  }))
}
