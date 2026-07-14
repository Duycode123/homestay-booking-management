import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Serene Villa',
    short_name: 'Serene Villa',
    description:
      'Khám phá và đặt phòng homestay trực tuyến với thông tin tiện nghi, giá và lịch trống minh bạch.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F6F3ED',
    theme_color: '#173A31',
    lang: 'vi',
    orientation: 'portrait-primary',
    categories: ['travel', 'lifestyle'],
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
