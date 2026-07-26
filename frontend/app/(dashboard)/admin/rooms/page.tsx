'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminToast from '@/components/admin/AdminToast'
import { IconPlus, IconRefresh, IconRooms } from '@/components/admin/AdminIcons'
import RoomDeleteConfirmModal from '@/components/admin/rooms/RoomDeleteConfirmModal'
import RoomDetailPanel from '@/components/admin/rooms/RoomDetailPanel'
import RoomFiltersBar from '@/components/admin/rooms/RoomFiltersBar'
import EquipmentFormModal from '@/components/admin/equipment/EquipmentFormModal'
import RoomEquipmentManager from '@/components/admin/rooms/RoomEquipmentManager'
import AdminAmenitiesManager from '@/components/admin/rooms/AdminAmenitiesManager'
import RoomFormModal from '@/components/admin/rooms/RoomFormModal'
import RoomTable from '@/components/admin/rooms/RoomTable'
import RoomTierManager from '@/components/admin/rooms/RoomTierManager'
import {
  createAdminEquipment,
  deleteAdminEquipment,
  EMPTY_EQUIPMENT_FORM,
  fetchAdminEquipment,
  toFormData as toEquipmentFormData,
  updateAdminEquipment,
} from '@/lib/admin/equipment/adminEquipmentApi'
import type { AdminEquipment, EquipmentFormData, EquipmentRoomOption } from '@/lib/admin/equipment/types'
import {
  createAdminRoom,
  createAdminRoomType,
  deleteAdminRoom,
  deleteAdminRoomType,
  EMPTY_ROOM_FORM,
  getAdminRoomTypes,
  getAdminRooms,
  getDefaultRoomForm,
  toRoomFormData,
  updateAdminRoomType,
  updateAdminRoom,
  updateRoomStatus,
} from '@/lib/admin/rooms/adminRoomApi'
import type {
  AdminRoom,
  AdminRoomTypeOption,
  RoomEquipmentOption,
  RoomFilters,
  RoomFormData,
  RoomTypeFormData,
} from '@/lib/admin/rooms/types'

const DEFAULT_FILTERS: RoomFilters = {
  query: '',
  roomTypeId: 'ALL',
  category: 'ALL',
  status: 'ALL',
  sortBy: 'updated',
}

type FormModalState =
  | { open: false }
  | { open: true; mode: 'create'; data: RoomFormData }
  | { open: true; mode: 'edit'; roomId: string; data: RoomFormData }

type EquipmentModalState =
  | { open: false }
  | { open: true; mode: 'create'; data: EquipmentFormData }
  | { open: true; mode: 'edit'; equipmentId: number; data: EquipmentFormData }

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function equipmentSelectionKey(name: string, type: AdminEquipment['equipmentType']) {
  return `${type}:${name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}`
}

function toRoomFormDataWithEquipment(room: AdminRoom, equipment: AdminEquipment[]): RoomFormData {
  return {
    ...toRoomFormData(room),
    selectedEquipmentKeys: equipment
      .filter((item) => item.roomId === Number(room.id))
      .map((item) => equipmentSelectionKey(item.equipmentName, item.equipmentType)),
  }
}

function filterAndSortRooms(rooms: AdminRoom[], filters: RoomFilters) {
  const query = normalize(filters.query)

  const filtered = rooms.filter((room) => {
    const matchQuery =
      !query ||
      normalize(room.name).includes(query) ||
      normalize(room.code).includes(query) ||
      normalize(room.categoryLabel).includes(query)
    const matchRoomType = filters.roomTypeId === 'ALL' || room.roomTypeId === filters.roomTypeId
    const matchCategory = filters.category === 'ALL' || room.category === filters.category
    const matchStatus = filters.status === 'ALL' || room.status === filters.status

    return matchQuery && matchRoomType && matchCategory && matchStatus
  })

  return [...filtered].sort((a, b) => {
    if (filters.sortBy === 'price-asc') return a.baseNightlyRate - b.baseNightlyRate
    if (filters.sortBy === 'price-desc') return b.baseNightlyRate - a.baseNightlyRate
    if (filters.sortBy === 'capacity') return b.capacity - a.capacity
    return 0
  })
}

function applyEquipmentToRooms(rooms: AdminRoom[], equipment: AdminEquipment[]) {
  const equipmentByRoomId = new Map<number, AdminEquipment[]>()

  equipment.forEach((item) => {
    equipmentByRoomId.set(item.roomId, [...(equipmentByRoomId.get(item.roomId) ?? []), item])
  })

  return rooms.map((room) => {
    const roomEquipment = equipmentByRoomId.get(Number(room.id)) ?? []

    return {
      ...room,
      equipmentCount: roomEquipment.length,
      equipments: roomEquipment.map((item) => item.equipmentName),
    }
  })
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<AdminRoom[]>([])
  const [roomTypes, setRoomTypes] = useState<AdminRoomTypeOption[]>([])
  const [equipment, setEquipment] = useState<AdminEquipment[]>([])
  const [filters, setFilters] = useState<RoomFilters>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<AdminRoom | null>(null)
  const [formModal, setFormModal] = useState<FormModalState>({ open: false })
  const [equipmentModal, setEquipmentModal] = useState<EquipmentModalState>({ open: false })
  const [deleteTarget, setDeleteTarget] = useState<AdminRoom | null>(null)
  const [toast, setToast] = useState('')

  const loadRooms = useCallback(async () => {
    setIsLoading(true)
    try {
      const [data, typeData] = await Promise.all([
        getAdminRooms(),
        getAdminRoomTypes().catch(() => []),
      ])

      let equipmentData: AdminEquipment[] = []
      try {
        equipmentData = await fetchAdminEquipment({
          query: '',
          equipmentType: 'ALL',
          status: 'ALL',
          sortBy: 'room',
          sortOrder: 'asc',
        })
      } catch (error) {
        setToast(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ táº£i danh sÃ¡ch thiáº¿t bá»‹.')
      }

      setEquipment(equipmentData)
      const roomsWithEquipment = applyEquipmentToRooms(data, equipmentData)
      setRooms(roomsWithEquipment)
      setRoomTypes(typeData)
      setSelected((current) => {
        if (!current) return null
        return roomsWithEquipment.find((room) => room.id === current.id) ?? null
      })
    } catch (error) {
      setRooms([])
      setEquipment([])
      setSelected(null)
      setToast(error instanceof Error ? error.message : 'Không thể tải danh sách phòng từ hệ thống.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRooms()
  }, [loadRooms])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const visibleRooms = useMemo(() => filterAndSortRooms(rooms, filters), [rooms, filters])

  const equipmentOptions = useMemo<RoomEquipmentOption[]>(() => {
    const options = new Map<string, RoomEquipmentOption>()
    equipment.forEach((item) => {
      const key = equipmentSelectionKey(item.equipmentName, item.equipmentType)
      if (!options.has(key)) {
        options.set(key, { key, name: item.equipmentName, equipmentType: item.equipmentType })
      }
    })
    return [...options.values()].sort((first, second) => first.name.localeCompare(second.name, 'vi'))
  }, [equipment])

  const stats = useMemo(() => {
    const active = rooms.filter((room) => room.status === 'active' || room.status === 'occupied').length
    const maintenance = rooms.filter((room) => room.status === 'maintenance').length

    return {
      total: rooms.length,
      active,
      maintenance,
    }
  }, [rooms])

  const syncRoomEquipment = async (roomId: number, selectedKeys: string[]) => {
    const selected = new Set(selectedKeys)
    const current = equipment.filter((item) => item.roomId === roomId)
    const currentKeys = new Set(current.map((item) => equipmentSelectionKey(item.equipmentName, item.equipmentType)))
    const toCreate = equipmentOptions.filter((option) => selected.has(option.key) && !currentKeys.has(option.key))
    const toDelete = current.filter((item) => !selected.has(equipmentSelectionKey(item.equipmentName, item.equipmentType)))

    await Promise.all([
      ...toCreate.map((option) => createAdminEquipment({
        roomId,
        equipmentName: option.name,
        equipmentType: option.equipmentType,
        status: 'GOOD',
        notes: '',
      })),
      ...toDelete.map((item) => deleteAdminEquipment(item.equipmentId)),
    ])
  }

  const handleCreate = async (data: RoomFormData) => {
    const created = await createAdminRoom(data)
    await syncRoomEquipment(Number(created.id), data.selectedEquipmentKeys)
    setToast('Thêm phòng homestay thành công.')
    await loadRooms()
  }

  const handleUpdate = async (data: RoomFormData) => {
    if (!formModal.open || formModal.mode !== 'edit') return

    const updated = await updateAdminRoom(formModal.roomId, data)
    if (!updated) throw new Error('Không tìm thấy phòng homestay.')
    await syncRoomEquipment(Number(formModal.roomId), data.selectedEquipmentKeys)

    setToast('Cập nhật phòng homestay thành công.')
    setSelected((current) => (current?.id === updated.id ? updated : current))
    await loadRooms()
  }

  const handleDelete = async (roomId: string) => {
    await deleteAdminRoom(roomId)
    setToast('Đã xóa phòng khỏi danh sách hoạt động.')
    setSelected((current) => (current?.id === roomId ? null : current))
    await loadRooms()
  }

  const handleCreateRoomType = async (data: RoomTypeFormData) => {
    await createAdminRoomType(data)
    setToast('Thêm hạng phòng thành công.')
    await loadRooms()
  }

  const handleUpdateRoomType = async (id: number, data: RoomTypeFormData) => {
    await updateAdminRoomType(id, data)
    setToast('Cập nhật hạng phòng thành công.')
    await loadRooms()
  }

  const handleDeleteRoomType = async (id: number) => {
    await deleteAdminRoomType(id)
    setToast('Đã xóa hạng phòng khỏi danh sách hoạt động.')
    await loadRooms()
  }

  const equipmentRoomOptions = useMemo<EquipmentRoomOption[]>(
    () => rooms.map((room) => ({ roomId: Number(room.id), roomName: room.name })),
    [rooms],
  )

  const createEquipmentInitialForm = useCallback(
    (roomId: number | null = null) => ({
      ...EMPTY_EQUIPMENT_FORM,
      roomId: roomId ?? equipmentRoomOptions[0]?.roomId ?? null,
    }),
    [equipmentRoomOptions],
  )

  const handleCreateEquipment = async (data: EquipmentFormData) => {
    await createAdminEquipment(data)
    setToast('Thêm tiện nghi thành công.')
    await loadRooms()
  }

  const handleUpdateEquipment = async (data: EquipmentFormData) => {
    if (!equipmentModal.open || equipmentModal.mode !== 'edit') return

    const updated = await updateAdminEquipment(equipmentModal.equipmentId, data)
    if (!updated) {
      throw new Error('Không tìm thấy tiện nghi.')
    }

    setToast('Cập nhật tiện nghi thành công.')
    await loadRooms()
  }

  const handleDeleteEquipment = async (id: number) => {
    await deleteAdminEquipment(id)
    setToast('Xóa tiện nghi thành công.')
    await loadRooms()
  }

  const handleMaintenance = async (room: AdminRoom) => {
    try {
      const updated = await updateRoomStatus(room.id, 'maintenance')
      if (!updated) throw new Error('Không tìm thấy phòng homestay.')

      setToast(`${room.name} đã được chuyển sang trạng thái bảo trì.`)
      setSelected((current) => (current?.id === room.id ? updated : current))
      await loadRooms()
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Không thể đổi trạng thái phòng.')
    }
  }

  return (
    <>
        <AdminPageHeader
          eyebrow="Quản lý phòng"
          title="Quản lý phòng homestay"
          description="Theo dõi danh sách phòng, hạng phòng, trạng thái vận hành và tiện nghi cho đội ngũ quản trị The Serene Villa."
          breadcrumbs={[
            { label: 'Tổng quan', href: '/admin/dashboard' },
            { label: 'Phòng homestay' },
          ]}
          actions={
            <>
              <button
                type="button"
                onClick={() => void loadRooms()}
                disabled={isLoading}
                title="Làm mới"
                aria-label="Làm mới"
                className={[
                  'group flex h-10 w-10 items-center justify-center rounded-full',
                  'border border-outline-variant bg-white text-on-surface-variant shadow-sm',
                  'transition-all hover:border-brand-orange/40 hover:text-brand-orange',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                ].join(' ')}
              >
                <IconRefresh
                  className={[
                    'h-[15px] w-[15px] transition-transform duration-300',
                    isLoading ? 'animate-spin' : 'group-hover:rotate-180',
                  ].join(' ')}
                />
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormModal({ open: true, mode: 'create', data: getDefaultRoomForm(roomTypes) })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 font-display text-sm font-medium text-white shadow-lg shadow-brand-orange/25 transition-all hover:bg-brand-orangeHover active:scale-[0.98]"
              >
                <IconPlus className="h-4 w-4" />
                Thêm phòng
              </button>
            </>
          }
        />

        <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 sm:px-8">
          <AdminToast message={toast} onDismiss={() => setToast('')} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminStatCard
              label="Tổng số phòng"
              value={stats.total}
              hint="Phòng đang quản lý"
              icon={<IconRooms className="h-5 w-5" />}
            />
            <AdminStatCard
              label="Đang hoạt động"
              value={stats.active}
              hint="Sẵn sàng hoặc đang có lịch"
              accent="secondary"
              icon={<span className="text-base">✓</span>}
            />
            <AdminStatCard
              label="Đang bảo trì"
              value={stats.maintenance}
              hint="Tạm khóa lịch đặt"
              accent="tertiary"
              icon={<span className="text-base">⚙</span>}
            />
          </div>

          <RoomTierManager
            roomTypes={roomTypes}
            rooms={rooms}
            isLoading={isLoading}
            onCreate={handleCreateRoomType}
            onUpdate={handleUpdateRoomType}
            onDelete={handleDeleteRoomType}
          />

          <RoomFiltersBar filters={filters} roomTypes={roomTypes} onChange={setFilters} resultCount={visibleRooms.length} />

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-on-surface">Danh sách phòng homestay</h2>
                <p className="text-xs text-on-surface-variant">
                  Quản lý trạng thái, giá thuê và tiện nghi gắn với từng phòng homestay.
                </p>
              </div>
              <p className="text-xs text-on-surface-variant">Chọn &quot;Chi tiết&quot; để mở hồ sơ phòng</p>
            </div>

            <RoomTable
              rooms={visibleRooms}
              isLoading={isLoading}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              onEdit={(room) =>
                setFormModal({ open: true, mode: 'edit', roomId: room.id, data: toRoomFormDataWithEquipment(room, equipment) })
              }
              onDelete={setDeleteTarget}
              onMaintenance={(room) => void handleMaintenance(room)}
            />
          </section>

          <AdminAmenitiesManager
            rooms={rooms}
            privateAmenities={
              <RoomEquipmentManager
                rooms={rooms}
                equipment={equipment}
                isLoading={isLoading}
                onCreate={(roomId) =>
                  setEquipmentModal({ open: true, mode: 'create', data: createEquipmentInitialForm(roomId) })
                }
                onEdit={(item) =>
                  setEquipmentModal({
                    open: true,
                    mode: 'edit',
                    equipmentId: item.equipmentId,
                    data: toEquipmentFormData(item),
                  })
                }
                onDelete={handleDeleteEquipment}
              />
            }
          />

          <p className="pb-4 text-center text-[11px] text-on-surface-variant">
            * Danh sách, thêm, sửa, xóa, đổi trạng thái, sức chứa, ảnh phòng và tiện nghi đã đồng bộ với hệ thống. Giá vẫn theo hạng phòng, mã phòng sinh theo ID hệ thống.
          </p>
        </div>

        <RoomDetailPanel
          room={selected}
          onClose={() => setSelected(null)}
          onEdit={(room) =>
            setFormModal({ open: true, mode: 'edit', roomId: room.id, data: toRoomFormDataWithEquipment(room, equipment) })
          }
        />

        <RoomFormModal
          open={formModal.open}
          mode={formModal.open ? formModal.mode : 'create'}
          initialData={formModal.open ? formModal.data : EMPTY_ROOM_FORM}
          roomTypes={roomTypes}
          equipmentOptions={equipmentOptions}
          onClose={() => setFormModal({ open: false })}
          onSubmit={formModal.open && formModal.mode === 'edit' ? handleUpdate : handleCreate}
        />

        <RoomDeleteConfirmModal
          room={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />

        <EquipmentFormModal
          open={equipmentModal.open}
          mode={equipmentModal.open ? equipmentModal.mode : 'create'}
          initialData={equipmentModal.open ? equipmentModal.data : createEquipmentInitialForm()}
          rooms={equipmentRoomOptions}
          onClose={() => setEquipmentModal({ open: false })}
          onSubmit={equipmentModal.open && equipmentModal.mode === 'edit' ? handleUpdateEquipment : handleCreateEquipment}
        />
    </>
  )
}
