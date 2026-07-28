import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import RoomDetailPageClient from '@/components/public/RoomDetailPageClient'
import { getPublicRoomForSeo, getRoomSeoDescription, getRoomSocialImage } from '@/lib/public/room-seo'

const siteName = 'The Serene Villa'
const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

function isValidRoomId(roomId: string) {
  return /^[1-9]\d*$/.test(roomId)
}

export async function generateMetadata({ params }: { params: Promise<{ roomId: string }> }): Promise<Metadata> {
  const { roomId } = await params
  if (!isValidRoomId(roomId)) {
    return {
      title: 'Không tìm thấy căn lưu trú',
      alternates: { canonical: null },
      robots: { index: false, follow: true },
    }
  }

  const room = await getPublicRoomForSeo(roomId)
  const roomName = room?.roomName || 'Căn lưu trú đang được cập nhật'
  const description = getRoomSeoDescription(room)
  const image = getRoomSocialImage(room)
  const path = `/rooms/${roomId}`

  return {
    title: roomName,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      locale: 'vi_VN',
      url: path,
      siteName,
      title: `${roomName} | ${siteName}`,
      description,
      images: [{ url: image, alt: roomName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${roomName} | ${siteName}`,
      description,
      images: [image],
    },
    robots: { index: Boolean(room), follow: true },
  }
}

export default async function RoomDetailPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  if (!isValidRoomId(roomId)) notFound()

  const room = await getPublicRoomForSeo(roomId)
  const roomPath = `/rooms/${roomId}`
  const roomUrl = new URL(roomPath, siteUrl).toString()
  const directNightlyRate = Number(room?.baseNightlyRate ?? 0)
  const pricePerNight = directNightlyRate > 0
    ? directNightlyRate
    : Number(room?.roomType?.pricePerHour ?? 0) * 22
  const structuredData = room ? {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: siteUrl.toString() },
          { '@type': 'ListItem', position: 2, name: 'Phòng homestay', item: new URL('/rooms', siteUrl).toString() },
          { '@type': 'ListItem', position: 3, name: room.roomName, item: roomUrl },
        ],
      },
      {
        '@type': 'VacationRental',
        name: room.roomName,
        description: getRoomSeoDescription(room),
        image: [room.imageUrl, ...(room.imageUrls ?? [])].filter(Boolean),
        url: roomUrl,
        address: room.addressLine ? {
          '@type': 'PostalAddress',
          streetAddress: [room.addressLine, room.ward].filter(Boolean).join(', '),
          addressLocality: room.district || undefined,
          addressRegion: room.city || undefined,
          addressCountry: 'VN',
        } : undefined,
        geo: room.latitude != null && room.longitude != null ? {
          '@type': 'GeoCoordinates',
          latitude: Number(room.latitude),
          longitude: Number(room.longitude),
        } : undefined,
        occupancy: room.maxPeople ? {
          '@type': 'QuantitativeValue',
          maxValue: room.maxPeople,
          unitText: 'người',
        } : undefined,
        numberOfBedrooms: room.bedroomCount || undefined,
        bed: room.bedCount ? {
          '@type': 'BedDetails',
          numberOfBeds: room.bedCount,
        } : undefined,
        offers: pricePerNight > 0 ? {
          '@type': 'Offer',
          price: pricePerNight,
          priceCurrency: 'VND',
          availability: 'https://schema.org/LimitedAvailability',
          url: roomUrl,
        } : undefined,
        containedInPlace: {
          '@type': 'LodgingBusiness',
          name: siteName,
          url: siteUrl.toString(),
        },
      },
    ],
  } : null

  return (
    <>
      {structuredData ? (
        <script
          id={`room-${roomId}-structured-data`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
        />
      ) : null}
      <RoomDetailPageClient roomId={roomId} />
    </>
  )
}
