import type { Metadata } from 'next'
import RoomDetailPageClient from '@/components/public/RoomDetailPageClient'
import { getPublicRoomForSeo, getRoomSeoDescription, getRoomSocialImage } from '@/lib/public/room-seo'

const siteName = 'The Serene Villa'
const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

export async function generateMetadata({ params }: { params: Promise<{ roomId: string }> }): Promise<Metadata> {
  const { roomId } = await params
  const room = await getPublicRoomForSeo(roomId)
  const roomName = room?.roomName || `Phòng homestay ${roomId}`
  const description = getRoomSeoDescription(room)
  const image = getRoomSocialImage(room)
  const path = `/rooms/${roomId}`

  return {
    title: roomName,
    description,
    alternates: {
      canonical: path,
      languages: { 'vi-VN': path },
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
    robots: { index: true, follow: true },
  }
}

export default async function RoomDetailPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const room = await getPublicRoomForSeo(roomId)
  const roomPath = `/rooms/${roomId}`
  const roomUrl = new URL(roomPath, siteUrl).toString()
  const pricePerNight = Number(room?.roomType?.pricePerHour ?? 0) * 22
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
        '@type': 'HotelRoom',
        name: room.roomName,
        description: getRoomSeoDescription(room),
        image: [room.imageUrl, ...(room.imageUrls ?? [])].filter(Boolean),
        url: roomUrl,
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
