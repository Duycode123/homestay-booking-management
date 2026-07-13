import type { TimeSlot } from './types'

export function applySlotSelection(slots: TimeSlot[], selectedIds: Set<string>): TimeSlot[] {
  return slots.map((slot) => {
    if (slot.status === 'booked' || slot.status === 'past') return slot
    if (selectedIds.has(slot.id)) return { ...slot, status: 'selected' }
    return { ...slot, status: 'available' }
  })
}

export function getSelectedIdsFromSlots(slots: TimeSlot[]): Set<string> {
  return new Set(slots.filter((s) => s.status === 'selected').map((s) => s.id))
}

export function getSelectedSlots(slots: TimeSlot[]): TimeSlot[] {
  return slots
    .filter((s) => s.status === 'selected')
    .sort((a, b) => a.start.localeCompare(b.start))
}

/** Single click: select one slot or extend the consecutive block. */
export function selectSlotClick(
  slots: TimeSlot[],
  slotId: string,
  currentSelectedIds: Set<string>,
): Set<string> {
  const index = slots.findIndex((s) => s.id === slotId)
  if (index === -1) return currentSelectedIds

  const slot = slots[index]
  if (slot.status === 'booked' || slot.status === 'past') return currentSelectedIds

  if (currentSelectedIds.has(slotId)) return currentSelectedIds

  if (currentSelectedIds.size === 0) return new Set([slotId])

  const selectedIndices = [...currentSelectedIds]
    .map((id) => slots.findIndex((s) => s.id === id))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)

  const min = selectedIndices[0]
  const max = selectedIndices[selectedIndices.length - 1]

  if (index === min - 1 || index === max + 1) {
    const next = new Set(currentSelectedIds)
    next.add(slotId)
    return next
  }

  const from = Math.min(index, min)
  const to = Math.max(index, max)
  const rangeSlots = slots.slice(from, to + 1)
  const rangeOk = rangeSlots.every(
    (s) =>
      s.status === 'available' ||
      s.status === 'selected' ||
      currentSelectedIds.has(s.id),
  )

  if (rangeOk) {
    const next = new Set(currentSelectedIds)
    rangeSlots.forEach((s) => {
      if (s.status !== 'booked' && s.status !== 'past') next.add(s.id)
    })
    return next
  }

  return new Set([slotId])
}

/** Double click: only allow removing a boundary slot of the selected block. */
export function deselectSlotClick(
  slots: TimeSlot[],
  slotId: string,
  currentSelectedIds: Set<string>,
): Set<string> {
  if (!currentSelectedIds.has(slotId)) return currentSelectedIds

  const slot = slots.find((s) => s.id === slotId)
  if (!slot || slot.status !== 'selected') return currentSelectedIds

  const selectedIndices = [...currentSelectedIds]
    .map((id) => slots.findIndex((s) => s.id === id))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)

  const targetIndex = slots.findIndex((s) => s.id === slotId)
  if (targetIndex < 0) return currentSelectedIds

  // Prevent creating holes inside a selected range (e.g. 12-15 cannot remove 13/14).
  if (selectedIndices.length > 1) {
    const min = selectedIndices[0]
    const max = selectedIndices[selectedIndices.length - 1]
    if (targetIndex !== min && targetIndex !== max) return currentSelectedIds
  }

  const next = new Set(currentSelectedIds)
  next.delete(slotId)
  return next
}

export function formatSlotRange(slots: TimeSlot[]): string {
  if (slots.length === 0) return '—'
  const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start))
  return `${sorted[0].start} – ${sorted[sorted.length - 1].end}`
}
