'use client'

import Image from 'next/image'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { shouldBypassImageOptimization } from '@/lib/image-optimization'
import { formatCurrency, getNightlyDisplayPrice } from '@/components/booking/booking-data'
import type { Room } from '@/lib/public/room-filters'
import type { Locale } from '@/i18n/config'

type RoomMapProps = {
  rooms: Room[]
  selectedRoomId?: string | null
  locale: Locale
  onSelect: (room: Room) => void
  onBook: (room: Room) => void
  onViewDetail?: (room: Room) => void
  compact?: boolean
}

const HANOI_CENTER: [number, number] = [21.0278, 105.8342]

function isMappedRoom(room: Room): room is Room & { latitude: number; longitude: number } {
  return Number.isFinite(room.latitude)
    && Number.isFinite(room.longitude)
    && Math.abs(room.latitude ?? 0) <= 90
    && Math.abs(room.longitude ?? 0) <= 180
}

function MapViewport({ rooms, selectedRoomId }: { rooms: Array<Room & { latitude: number; longitude: number }>; selectedRoomId?: string | null }) {
  const map = useMap()

  useEffect(() => {
    const selectedRoom = rooms.find((room) => room.id === selectedRoomId)
    if (selectedRoom) {
      map.flyTo([selectedRoom.latitude, selectedRoom.longitude], Math.max(map.getZoom(), 14), {
        duration: 0.65,
      })
      return
    }

    if (rooms.length === 1) {
      map.setView([rooms[0].latitude, rooms[0].longitude], 14)
      return
    }

    if (rooms.length > 1) {
      map.fitBounds(
        L.latLngBounds(rooms.map((room) => [room.latitude, room.longitude] as [number, number])),
        { padding: [44, 44], maxZoom: 13 },
      )
    }
  }, [map, rooms, selectedRoomId])

  return null
}

function getPriceMarker(room: Room, selected: boolean) {
  const price = getNightlyDisplayPrice(room.pricePerHour)
  const compactPrice = price >= 1_000_000
    ? `${Number((price / 1_000_000).toFixed(1))}tr`
    : `${Math.round(price / 1_000)}k`

  return L.divIcon({
    className: 'serene-map-marker-shell',
    html: `<span class="serene-map-price-marker${selected ? ' is-selected' : ''}">${compactPrice}</span>`,
    iconSize: [72, 38],
    iconAnchor: [36, 36],
    popupAnchor: [0, -34],
  })
}

export default function RoomMap({
  rooms,
  selectedRoomId,
  locale,
  onSelect,
  onBook,
  onViewDetail,
  compact = false,
}: RoomMapProps) {
  const mappedRooms = useMemo(() => rooms.filter(isMappedRoom), [rooms])
  const isEnglish = locale === 'en'

  if (mappedRooms.length === 0) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-[26px] border border-dashed border-[#cfc2b1] bg-[#fbf8f2] px-6 text-center">
        <div className="max-w-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f0ec] text-2xl">⌖</span>
          <p className="mt-4 font-editorial text-2xl font-semibold text-secondary">
            {isEnglish ? 'Location data is being updated' : 'Đang cập nhật vị trí các căn'}
          </p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            {isEnglish
              ? 'These stays do not have valid coordinates yet. You can still browse them in the list.'
              : 'Các căn này chưa có tọa độ hợp lệ. Bạn vẫn có thể xem đầy đủ trong danh sách.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-[#d8cdbf] bg-[#e9eee9] shadow-[0_20px_60px_rgba(25,55,46,.12)]">
      <MapContainer
        center={HANOI_CENTER}
        zoom={10}
        scrollWheelZoom
        className={compact
          ? 'h-[360px] w-full sm:h-[420px]'
          : 'h-[560px] w-full lg:h-[calc(100vh-150px)] lg:min-h-[640px] lg:max-h-[860px]'}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport rooms={mappedRooms} selectedRoomId={selectedRoomId} />

        {mappedRooms.map((room) => (
          <Marker
            key={room.id}
            position={[room.latitude, room.longitude]}
            icon={getPriceMarker(room, room.id === selectedRoomId)}
            eventHandlers={{ click: () => onSelect(room) }}
          >
            <Popup minWidth={286} maxWidth={310} closeButton={false}>
              <article className="overflow-hidden rounded-[18px] bg-white">
                <div className="relative h-32 overflow-hidden rounded-[15px]">
                  <Image
                    src={room.image || '/images/homestay-luxury-hero.webp'}
                    alt={room.name}
                    fill
                    sizes="310px"
                    unoptimized={shouldBypassImageOptimization(room.image)}
                    className="object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-secondary shadow-sm">
                    {room.district || (isEnglish ? 'Hanoi' : 'Hà Nội')}
                  </span>
                </div>
                <div className="px-1 pb-1 pt-3">
                  <h3 className="font-editorial text-xl font-semibold leading-tight text-secondary">{room.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-on-surface-variant">{room.location}</p>
                  <div className="mt-3 flex items-end justify-between gap-3 border-t border-[#ece5dc] pt-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#8b8379]">
                        {isEnglish ? 'Per night' : 'Mỗi đêm'}
                      </p>
                      <p className="mt-0.5 font-editorial text-lg font-semibold text-[#9b6737]">
                        {formatCurrency(getNightlyDisplayPrice(room.pricePerHour))}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {onViewDetail ? (
                        <button
                          type="button"
                          onClick={() => onViewDetail(room)}
                          className="rounded-full border border-[#c8b8a5] px-3 py-2 text-[11px] font-bold text-secondary transition hover:bg-[#f5efe7]"
                        >
                          {isEnglish ? 'Details' : 'Chi tiết'}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onBook(room)}
                        className="rounded-full bg-secondary px-3 py-2 text-[11px] font-bold text-white transition hover:bg-[#52766B]"
                      >
                        {isEnglish ? 'Book' : 'Đặt căn'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-[0_10px_30px_rgba(30,54,47,.15)] backdrop-blur">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9b6737]">
          {isEnglish ? 'MAP VIEW' : 'BẢN ĐỒ CÁC CĂN'}
        </p>
        <p className="mt-1 text-sm font-semibold text-secondary">
          {mappedRooms.length} {isEnglish ? 'mapped stays' : 'căn có vị trí'}
        </p>
      </div>
    </div>
  )
}
