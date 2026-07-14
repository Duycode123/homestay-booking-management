import RoomDetailPageClient from '@/components/public/RoomDetailPageClient'

export default async function RoomDetailPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  return <RoomDetailPageClient roomId={roomId} />
}
