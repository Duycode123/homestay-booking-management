'use client'

import ProjectSelect from '@/components/ui/ProjectSelect'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { StaffPageShell } from './StaffShared'
import { fetchAdminEquipment } from '@/lib/admin/equipment/adminEquipmentApi'
import { fetchRooms } from '@/lib/rooms-api'
import { fetchShiftBookings, fetchStaffSchedule, type StaffScheduleShift, type StaffShiftBooking } from '@/lib/staff-schedule-service'
import {
  parseBackendId,
  recordStaffEquipmentCondition,
  recordStaffRoomCondition,
  updateStaffRoomStatus,
} from '@/lib/staff-facility-service'
import {
  createIssueId, getEquipmentStatusMeta, getEquipmentTypeLabel, getIssueStatusMeta, getPriorityMeta,
  getRoomCategoryLabel, getRoomStatusMeta, getTargetName, mapBackendEquipmentToStaffEquipment,
  mapBackendRoomsToStaffRooms, mapEquipmentStatusToCondition, mapIssueTypeToCondition,
  mapRoomStatusToBackend, normalizeText,
  type EquipmentStatus, type EquipmentType, type IssueStatus, type IssueType, type Meta, type Priority,
  type ReportIssueDraft, type ReportIssueErrors, type RoomCategory, type RoomStatus, type StaffEquipment,
  type StaffIssue, type StaffRoom, type StaffRoomsTab,
} from './staff-rooms-domain'

const initialRooms: StaffRoom[] = [
  {
    id: 'room-a',
    name: 'Deluxe Balcony 201',
    category: 'DELUXE',
    capacity: 6,
    status: 'IN_USE',
    currentBooking: { bookingId: 'BK-0702-60', customerName: 'Gia đình Nguyễn', timeRange: '08:00 - 09:30' },
    equipment: ['Wi-Fi 5G', 'Điều hòa âm trần', 'Smart TV 50 inch', 'Máy nước nóng'],
    updatedAt: '08:16 hôm nay',
    assignedStaff: 'Gia Hân',
    note: 'Ưu tiên kiểm tra điều hòa sau mỗi lượt khách.',
  },
  {
    id: 'room-b',
    name: 'Deluxe City View 202',
    category: 'STANDARD',
    capacity: 4,
    status: 'AVAILABLE',
    equipment: ['Wi-Fi 5G', 'Điều hòa âm trần', 'Smart TV 50 inch'],
    updatedAt: '07:45 hôm nay',
    assignedStaff: 'Hoàng Nam',
    note: 'Sẵn sàng nhận booking walk-in.',
  },
  {
    id: 'family-garden-302',
    name: 'Family Garden 302',
    category: 'FAMILY',
    capacity: 10,
    status: 'CLEANING',
    currentBooking: { bookingId: 'BK-0702-61', customerName: 'Gia đình Trần', timeRange: '10:00 - 11:30' },
    equipment: ['Wi-Fi gia đình', 'Hai điều hòa inverter', 'Smart TV 55 inch'],
    updatedAt: '08:05 hôm nay',
    assignedStaff: 'Nhân viên',
    note: 'Khách yêu cầu kiểm tra TV trước khi vào phòng.',
  },
  {
    id: 'standard-garden-102',
    name: 'Standard Garden 102',
    category: 'STANDARD',
    capacity: 3,
    status: 'ISSUE',
    equipment: ['Wi-Fi tốc độ cao', 'Điều hòa Panasonic', 'Máy nước nóng'],
    updatedAt: '07:30 hôm nay',
    assignedStaff: 'Minh Quân',
    note: 'Máy nước nóng có tiếng lạ, cần kỹ thuật kiểm tra.',
  },
  {
    id: 'family-suite-301',
    name: 'Family Suite 301',
    category: 'FAMILY',
    capacity: 8,
    status: 'MAINTENANCE',
    equipment: ['Wi-Fi gia đình', 'Hai điều hòa inverter', 'Smart TV 55 inch', 'Bình nước nóng'],
    updatedAt: 'Hôm qua, 21:15',
    assignedStaff: 'Gia Hân',
    note: 'Đang bảo trì điều hòa và ổ điện khu TV.',
  },
  {
    id: 'standard-garden-101',
    name: 'Standard Garden 101',
    category: 'STANDARD',
    capacity: 5,
    status: 'AVAILABLE',
    equipment: ['Wi-Fi tốc độ cao', 'Điều hòa Daikin', 'Smart TV 43 inch'],
    updatedAt: '08:00 hôm nay',
    assignedStaff: 'Hoàng Nam',
    note: 'Phòng sạch, tiện nghi đủ checklist.',
  },
]

const initialEquipment: StaffEquipment[] = [
  {
    id: 'eq-wifi-001',
    code: 'EQ-WIFI-001',
    name: 'Wi-Fi tốc độ cao',
    type: 'WIFI',
    location: 'Deluxe Balcony 201',
    status: 'AVAILABLE',
    quantity: 4,
    lastCheckedAt: '08:00 hôm nay',
    note: 'Kết nối ổn định trong toàn bộ phòng.',
  },
  {
    id: 'eq-ac-014',
    code: 'EQ-AC-014',
    name: 'Điều hòa Daikin',
    type: 'AIR_CONDITIONER',
    location: 'Deluxe Balcony 201',
    status: 'IN_USE',
    quantity: 1,
    lastCheckedAt: '07:50 hôm nay',
    currentBookingId: 'BK-0702-60',
    note: 'Đang sử dụng trong phòng có khách.',
  },
  {
    id: 'eq-tv-006',
    code: 'EQ-TV-006',
    name: 'Smart TV 50 inch',
    type: 'TV',
    location: 'Deluxe City View 202',
    status: 'INSPECTION',
    quantity: 1,
    lastCheckedAt: 'Hôm qua, 20:40',
    note: 'Kết nối Internet đôi lúc không ổn định.',
  },
  {
    id: 'eq-water-heater-002',
    code: 'EQ-WH-002',
    name: 'Máy nước nóng Ariston',
    type: 'WATER_HEATER',
    location: 'Standard Garden 102',
    status: 'MAINTENANCE',
    quantity: 1,
    lastCheckedAt: 'Hôm qua, 19:10',
    note: 'Cần kiểm tra bộ chống giật.',
  },
  {
    id: 'eq-fridge-003',
    code: 'EQ-FRIDGE-003',
    name: 'Tủ lạnh mini',
    type: 'OTHER',
    location: 'Kho tiện nghi',
    status: 'AVAILABLE',
    quantity: 1,
    lastCheckedAt: '07:35 hôm nay',
    note: 'Đã kiểm tra nguồn và nhiệt độ.',
  },
  {
    id: 'eq-kettle-018',
    code: 'EQ-KETTLE-018',
    name: 'Ấm đun nước',
    type: 'OTHER',
    location: 'Đang cho thuê',
    status: 'BROKEN',
    quantity: 2,
    lastCheckedAt: 'Hôm qua, 18:20',
    currentBookingId: 'BK-0701-43',
    note: 'Một ấm bị lỏng đầu cắm.',
  },
]

const initialIssues: StaffIssue[] = [
  {
    id: 'ISS-0701-01',
    title: 'Smart TV Deluxe City View 202 mất kết nối',
    targetType: 'EQUIPMENT',
    targetId: 'eq-tv-006',
    targetName: 'Smart TV 50 inch',
    issueType: 'AMENITY',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    reporter: 'Nhân viên',
    createdAt: '08:10 hôm nay',
    description: 'TV thường xuyên mất kết nối Internet, cần kỹ thuật kiểm tra trước giờ khách nhận phòng.',
  },
  {
    id: 'ISS-0701-02',
    title: 'Standard Garden 102 cần kiểm tra máy nước nóng',
    targetType: 'ROOM',
    targetId: 'standard-garden-102',
    targetName: 'Standard Garden 102',
    issueType: 'DEVICE',
    priority: 'MEDIUM',
    status: 'OPEN',
    reporter: 'Gia Hân',
    createdAt: '07:32 hôm nay',
    description: 'Nước nóng không ổn định, khách phản ánh nhiệt độ giảm nhanh khi sử dụng.',
  },
  {
    id: 'ISS-0630-04',
    title: 'Family Suite 301 bảo trì ổ điện',
    targetType: 'ROOM',
    targetId: 'family-suite-301',
    targetName: 'Family Suite 301',
    issueType: 'POWER',
    priority: 'URGENT',
    status: 'RESOLVED',
    reporter: 'Minh Quân',
    createdAt: 'Hôm qua, 21:05',
    description: 'Ổ điện khu TV chập chờn, đã khóa phòng để bảo trì.',
  },
]

const tabs: Array<{ id: StaffRoomsTab; label: string }> = [
  { id: 'ROOMS', label: 'Phòng homestay' },
  { id: 'EQUIPMENT', label: 'Tiện nghi' },
  { id: 'ISSUES', label: 'Sự cố' },
]

const roomStatuses: Array<RoomStatus | 'ALL'> = ['ALL', 'AVAILABLE', 'IN_USE', 'CLEANING', 'MAINTENANCE', 'ISSUE']
const roomCategories: Array<RoomCategory | 'ALL'> = ['ALL', 'STANDARD', 'DELUXE', 'FAMILY']
const equipmentTypes: Array<EquipmentType | 'ALL'> = ['ALL', 'WIFI', 'AIR_CONDITIONER', 'TV', 'WATER_HEATER', 'OTHER']
const equipmentStatuses: Array<EquipmentStatus | 'ALL'> = ['ALL', 'AVAILABLE', 'IN_USE', 'INSPECTION', 'MAINTENANCE', 'BROKEN']
const issueStatuses: Array<IssueStatus | 'ALL'> = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const issuePriorities: Array<Priority | 'ALL'> = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']

const issueTypeLabels: Record<IssueType, string> = {
  AMENITY: 'Tiện nghi',
  POWER: 'Điện',
  DEVICE: 'Tiện nghi',
  CLEANING: 'Vệ sinh',
  OTHER: 'Khác',
}

type DutyBookingAssignment = {
  shift: StaffScheduleShift
  booking: StaffShiftBooking
}

function toDateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getStaffDutyRange() {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(to.getDate() + 14)
  return { fromDate: toDateKey(from), toDate: toDateKey(to) }
}

async function loadDutyBookingAssignments(shifts: StaffScheduleShift[]): Promise<DutyBookingAssignment[]> {
  const results = await Promise.allSettled(
    shifts.map(async (shift) => {
      const bookings = await fetchShiftBookings(shift.shiftId)
      return bookings.map((booking) => ({ shift, booking }))
    }),
  )
  const unique = new Map<number, DutyBookingAssignment>()
  results.flatMap((result) => result.status === 'fulfilled' ? result.value : []).forEach((assignment) => {
    if (!unique.has(assignment.booking.bookingId)) unique.set(assignment.booking.bookingId, assignment)
  })
  return [...unique.values()]
}

function applyDutyAssignments(rooms: StaffRoom[], assignments: DutyBookingAssignment[]) {
  const now = Date.now()
  return rooms.map((room) => {
    const candidates = assignments
      .filter(({ booking }) => normalizeText(booking.roomName) === normalizeText(room.name))
      .sort((first, second) => new Date(first.booking.startTime).getTime() - new Date(second.booking.startTime).getTime())
    const assignment = candidates.find(({ booking }) => new Date(booking.endTime).getTime() >= now) ?? candidates[0]

    if (!assignment) {
      return {
        ...room,
        currentBooking: undefined,
        updatedAt: 'Không có booking trong ca của bạn',
        assignedStaff: 'Chưa được phân công',
      }
    }

    const start = new Date(assignment.booking.startTime)
    const end = new Date(assignment.booking.endTime)
    const shiftDate = new Date(`${assignment.shift.date}T00:00:00`)
    const shiftName = getDutyShiftName(assignment.shift.startTime)
    return {
      ...room,
      currentBooking: {
        bookingId: `BR${String(assignment.booking.bookingId).padStart(8, '0')}`,
        customerName: assignment.booking.customerName,
        timeRange: `${start.toLocaleDateString('vi-VN')} · ${formatTime(start)} - ${formatTime(end)}`,
      },
      updatedAt: `${shiftDate.toLocaleDateString('vi-VN')} · ${assignment.shift.startTime.slice(0, 5)} - ${assignment.shift.endTime.slice(0, 5)}`,
      assignedStaff: `Bạn · ${shiftName}`,
    }
  })
}

function getDutyShiftName(startTime: string) {
  const hour = Number(startTime.slice(0, 2))
  if (hour < 12) return 'Ca sáng'
  if (hour < 18) return 'Ca chiều'
  return 'Ca tối'
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function StaffRoomsPage() {
  const [activeTab, setActiveTab] = useState<StaffRoomsTab>('ROOMS')
  const [rooms, setRooms] = useState<StaffRoom[]>([])
  const [equipment, setEquipment] = useState<StaffEquipment[]>([])
  const [issues, setIssues] = useState<StaffIssue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [roomQuery, setRoomQuery] = useState('')
  const [roomStatus, setRoomStatus] = useState<RoomStatus | 'ALL'>('ALL')
  const [roomCategory, setRoomCategory] = useState<RoomCategory | 'ALL'>('ALL')
  const [equipmentQuery, setEquipmentQuery] = useState('')
  const [equipmentType, setEquipmentType] = useState<EquipmentType | 'ALL'>('ALL')
  const [equipmentStatus, setEquipmentStatus] = useState<EquipmentStatus | 'ALL'>('ALL')
  const [issueQuery, setIssueQuery] = useState('')
  const [issueStatus, setIssueStatus] = useState<IssueStatus | 'ALL'>('ALL')
  const [issuePriority, setIssuePriority] = useState<Priority | 'ALL'>('ALL')
  const [selectedRoom, setSelectedRoom] = useState<StaffRoom | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<StaffEquipment | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<StaffIssue | null>(null)
  const [reportTarget, setReportTarget] = useState<{ targetType: 'ROOM' | 'EQUIPMENT'; targetId?: string } | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const filteredRooms = useMemo(() => {
    const query = normalizeText(roomQuery)
    return rooms.filter((room) => {
      const matchesQuery =
        !query ||
        normalizeText([room.name, getRoomCategoryLabel(room.category), room.assignedStaff, room.currentBooking?.customerName].join(' ')).includes(query)
      const matchesStatus = roomStatus === 'ALL' || room.status === roomStatus
      const matchesCategory = roomCategory === 'ALL' || room.category === roomCategory
      return matchesQuery && matchesStatus && matchesCategory
    })
  }, [roomCategory, roomQuery, roomStatus, rooms])

  const filteredEquipment = useMemo(() => {
    const query = normalizeText(equipmentQuery)
    return equipment.filter((item) => {
      const matchesQuery =
        !query ||
        normalizeText([item.name, item.code, item.location, getEquipmentTypeLabel(item.type), item.note].join(' ')).includes(query)
      const matchesType = equipmentType === 'ALL' || item.type === equipmentType
      const matchesStatus = equipmentStatus === 'ALL' || item.status === equipmentStatus
      return matchesQuery && matchesType && matchesStatus
    })
  }, [equipment, equipmentQuery, equipmentStatus, equipmentType])

  const filteredIssues = useMemo(() => {
    const query = normalizeText(issueQuery)
    return issues.filter((issue) => {
      const matchesQuery =
        !query ||
        normalizeText([issue.id, issue.title, issue.targetName, issue.reporter, issue.description].join(' ')).includes(query)
      const matchesStatus = issueStatus === 'ALL' || issue.status === issueStatus
      const matchesPriority = issuePriority === 'ALL' || issue.priority === issuePriority
      return matchesQuery && matchesStatus && matchesPriority
    })
  }, [issuePriority, issueQuery, issueStatus, issues])

  const kpis = useMemo(
    () => [
      {
        label: 'Đang sử dụng',
        value: rooms.filter((room) => room.status === 'IN_USE').length,
        helper: 'Phòng có booking hiện tại',
        icon: <IconRoom />,
        className: 'bg-secondary text-on-secondary',
      },
      {
        label: 'Sẵn sàng',
        value: rooms.filter((room) => room.status === 'AVAILABLE').length,
        helper: 'Có thể nhận khách ngay',
        icon: <IconCheck />,
        className: 'bg-on-secondary-container text-[#001A0D]',
      },
      {
        label: 'Cần vệ sinh',
        value: rooms.filter((room) => room.status === 'CLEANING').length,
        helper: 'Đang chờ chuẩn bị lại',
        icon: <IconSpark />,
        className: 'bg-primary-container text-brand-orange',
      },
      {
        label: 'Tiện nghi cần kiểm tra',
        value: equipment.filter((item) => ['INSPECTION', 'MAINTENANCE', 'BROKEN'].includes(item.status)).length,
        helper: 'Lỗi, bảo trì hoặc kiểm tra',
        icon: <IconTool />,
        className: 'bg-error-container text-error',
      },
    ],
    [equipment, rooms],
  )

  const showToast = (message: string) => setToastMessage(message)

  const refreshData = async () => {
    setIsLoading(true)
    try {
      const range = getStaffDutyRange()
      const [roomsResult, equipmentResult, shiftsResult] = await Promise.allSettled([
        fetchRooms(),
        fetchAdminEquipment({
          query: '',
          equipmentType: 'ALL',
          status: 'ALL',
          sortBy: 'room',
          sortOrder: 'asc',
        }),
        fetchStaffSchedule(range.fromDate, range.toDate),
      ])

      if (roomsResult.status === 'rejected') {
        throw roomsResult.reason
      }

      const backendEquipment = equipmentResult.status === 'fulfilled' ? equipmentResult.value : []
      const shifts = shiftsResult.status === 'fulfilled' ? shiftsResult.value : []
      const bookingAssignments = await loadDutyBookingAssignments(shifts)
      setRooms(applyDutyAssignments(mapBackendRoomsToStaffRooms(roomsResult.value, backendEquipment), bookingAssignments))
      setEquipment(backendEquipment.map(mapBackendEquipmentToStaffEquipment))

      if (equipmentResult.status === 'rejected') {
        showToast(equipmentResult.reason instanceof Error ? equipmentResult.reason.message : 'Không thể tải danh sách tiện nghi.')
      } else if (shiftsResult.status === 'rejected') {
        showToast(shiftsResult.reason instanceof Error ? shiftsResult.reason.message : 'Không thể tải ca làm được phân công.')
      } else {
        showToast('Đã làm mới dữ liệu vận hành mới nhất.')
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể tải dữ liệu vận hành từ backend.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshData()
  }, [])

  const updateRoomStatus = async (room: StaffRoom, nextStatus: RoomStatus) => {
    const updatedAt = 'Vừa cập nhật'
    setRooms((current) =>
      current.map((item) => (item.id === room.id ? { ...item, status: nextStatus, updatedAt } : item)),
    )
    setSelectedRoom((current) => (current?.id === room.id ? { ...current, status: nextStatus, updatedAt } : current))
    showToast(`Đã cập nhật trạng thái ${room.name} thành ${getRoomStatusMeta(nextStatus).label}.`)
    const backendRoomId = parseBackendId(room.id)
    if (!backendRoomId) {
      showToast(`Da cap nhat local ${room.name}. Phong nay chua co id backend de dong bo.`)
      return
    }

    try {
      await updateStaffRoomStatus(backendRoomId, mapRoomStatusToBackend(nextStatus), `Staff changed status to ${nextStatus}`)
      showToast(`Da dong bo trang thai ${room.name} voi backend.`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể đồng bộ trạng thái phòng.')
    }
  }

  const updateEquipmentStatus = async (item: StaffEquipment, nextStatus: EquipmentStatus) => {
    const lastCheckedAt = 'Vừa cập nhật'
    setEquipment((current) =>
      current.map((equipmentItem) =>
        equipmentItem.id === item.id
          ? { ...equipmentItem, status: nextStatus, lastCheckedAt }
          : equipmentItem,
      ),
    )
    setSelectedEquipment((current) => (current?.id === item.id ? { ...current, status: nextStatus, lastCheckedAt } : current))
    showToast(`Đã cập nhật ${item.name} thành ${getEquipmentStatusMeta(nextStatus).label}.`)
    const backendEquipmentId = parseBackendId(item.id)
    if (!backendEquipmentId) {
      showToast(`Da cap nhat local ${item.name}. Thiet bi nay chua co id backend de dong bo.`)
      return
    }

    try {
      await recordStaffEquipmentCondition(
        backendEquipmentId,
        mapEquipmentStatusToCondition(nextStatus),
        `Staff changed equipment status to ${nextStatus}`,
      )
      showToast(`Da dong bo tinh trang ${item.name} voi backend.`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể đồng bộ tình trạng tiện nghi.')
    }
  }

  const updateIssueStatus = (issue: StaffIssue, nextStatus: IssueStatus) => {
    setIssues((current) => current.map((item) => (item.id === issue.id ? { ...item, status: nextStatus } : item)))
    setSelectedIssue((current) => (current?.id === issue.id ? { ...current, status: nextStatus } : current))
    showToast(`Đã cập nhật ${issue.id} thành ${getIssueStatusMeta(nextStatus).label}.`)
  }

  const submitIssue = async (draft: ReportIssueDraft) => {
    const targetName = getTargetName(draft.targetType, draft.targetId, rooms, equipment)
    const nextIssue: StaffIssue = {
      id: createIssueId(issues.length + 1),
      title: draft.title.trim(),
      targetType: draft.targetType,
      targetId: draft.targetId,
      targetName,
      issueType: draft.issueType,
      priority: draft.priority,
      status: 'OPEN',
      reporter: 'Nhân viên',
      createdAt: 'Vừa xong',
      description: draft.description.trim(),
    }

    setIssues((current) => [nextIssue, ...current])
    setReportTarget(null)
    setActiveTab('ISSUES')
    showToast('Đã ghi nhận sự cố. Bộ phận phụ trách sẽ kiểm tra.')
    const backendTargetId = parseBackendId(draft.targetId)
    if (!backendTargetId) {
      showToast('Da ghi nhan su co local. Doi tuong nay chua co id backend de dong bo.')
      return
    }

    try {
      if (draft.targetType === 'ROOM') {
        await recordStaffRoomCondition(backendTargetId, mapIssueTypeToCondition(draft.issueType), draft.description.trim())
      } else {
        await recordStaffEquipmentCondition(backendTargetId, mapIssueTypeToCondition(draft.issueType), draft.description.trim())
      }

      showToast('Da ghi nhan su co va dong bo backend.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể đồng bộ sự cố với backend.')
    }
  }

  const resetRoomFilters = () => {
    setRoomQuery('')
    setRoomStatus('ALL')
    setRoomCategory('ALL')
  }

  const resetEquipmentFilters = () => {
    setEquipmentQuery('')
    setEquipmentType('ALL')
    setEquipmentStatus('ALL')
  }

  const resetIssueFilters = () => {
    setIssueQuery('')
    setIssueStatus('ALL')
    setIssuePriority('ALL')
  }

  return (
    <AuthGuard allowedRoles={['STAFF']}>
      <StaffPageShell>
            <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Vận hành phòng homestay</p>
                <h1 className="mt-2 font-display text-[32px] font-bold leading-10 text-on-surface">
                  Phòng & Tiện nghi
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={refreshData}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-outline bg-white px-4 font-display text-sm font-bold text-on-surface shadow-[var(--homestay-shadow-card)] transition hover:bg-surface-container-low"
                >
                  <IconRefresh />
                  Làm mới
                </button>
                <button
                  type="button"
                  onClick={() => setReportTarget({ targetType: 'ROOM' })}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-orange px-5 font-display text-sm font-bold text-white shadow-[0_14px_30px_rgba(178,132,85,0.22)] transition hover:bg-brand-orangeHover"
                >
                  <IconPlus />
                  Báo sự cố
                </button>
              </div>
            </header>

            {isLoading ? (
              <RoomsSkeleton />
            ) : (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {kpis.map((kpi) => (
                    <KpiCard key={kpi.label} {...kpi} />
                  ))}
                </section>

                <section className="rounded-3xl border border-outline-variant bg-white p-3 shadow-[var(--homestay-shadow-card)]">
                  <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                    {tabs.map((tab) => {
                      const active = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={[
                            'whitespace-nowrap rounded-2xl px-5 py-3 font-display text-sm font-bold transition',
                            active
                              ? 'bg-secondary text-on-secondary shadow-[0_10px_24px_rgba(4,42,22,0.16)]'
                              : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                          ].join(' ')}
                        >
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </section>

                {activeTab === 'ROOMS' && (
                  <RoomsTab
                    rooms={filteredRooms}
                    query={roomQuery}
                    status={roomStatus}
                    category={roomCategory}
                    onChangeQuery={setRoomQuery}
                    onChangeStatus={setRoomStatus}
                    onChangeCategory={setRoomCategory}
                    onReset={resetRoomFilters}
                    onView={setSelectedRoom}
                    onReport={(room) => setReportTarget({ targetType: 'ROOM', targetId: room.id })}
                    onUpdateStatus={updateRoomStatus}
                  />
                )}

                {activeTab === 'EQUIPMENT' && (
                  <EquipmentTab
                    equipment={filteredEquipment}
                    query={equipmentQuery}
                    type={equipmentType}
                    status={equipmentStatus}
                    onChangeQuery={setEquipmentQuery}
                    onChangeType={setEquipmentType}
                    onChangeStatus={setEquipmentStatus}
                    onReset={resetEquipmentFilters}
                    onView={setSelectedEquipment}
                    onReport={(item) => setReportTarget({ targetType: 'EQUIPMENT', targetId: item.id })}
                    onUpdateStatus={updateEquipmentStatus}
                  />
                )}

                {activeTab === 'ISSUES' && (
                  <IssuesTab
                    issues={filteredIssues}
                    query={issueQuery}
                    status={issueStatus}
                    priority={issuePriority}
                    onChangeQuery={setIssueQuery}
                    onChangeStatus={setIssueStatus}
                    onChangePriority={setIssuePriority}
                    onReset={resetIssueFilters}
                    onCreate={() => setReportTarget({ targetType: 'ROOM' })}
                    onView={setSelectedIssue}
                    onUpdateStatus={updateIssueStatus}
                  />
                )}
              </>
            )}

        {selectedRoom && (
          <RoomDetailPanel
            room={selectedRoom}
            issues={issues.filter((issue) => issue.targetId === selectedRoom.id)}
            onClose={() => setSelectedRoom(null)}
            onReport={() => {
              setSelectedRoom(null)
              setReportTarget({ targetType: 'ROOM', targetId: selectedRoom.id })
            }}
          />
        )}
        {selectedEquipment && (
          <EquipmentDetailPanel
            equipment={selectedEquipment}
            issues={issues.filter((issue) => issue.targetId === selectedEquipment.id)}
            onClose={() => setSelectedEquipment(null)}
            onReport={() => {
              setSelectedEquipment(null)
              setReportTarget({ targetType: 'EQUIPMENT', targetId: selectedEquipment.id })
            }}
          />
        )}
        {selectedIssue && (
          <IssueDetailPanel
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onUpdateStatus={updateIssueStatus}
          />
        )}
        {reportTarget && (
          <ReportIssueModal
            initialTarget={reportTarget}
            rooms={rooms}
            equipment={equipment}
            onCancel={() => setReportTarget(null)}
            onSubmit={submitIssue}
          />
        )}
        {toastMessage && <Toast message={toastMessage} />}
      </StaffPageShell>
    </AuthGuard>
  )
}

function KpiCard({
  label,
  value,
  helper,
  icon,
  className,
}: {
  label: string
  value: number
  helper: string
  icon: ReactNode
  className: string
}) {
  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-sm font-bold text-on-surface-variant">{label}</p>
          <p className="mt-3 font-display text-4xl font-bold leading-none text-on-surface">{value}</p>
        </div>
        <span className={['flex h-12 w-12 items-center justify-center rounded-2xl', className].join(' ')}>
          {icon}
        </span>
      </div>
      <p className="mt-4 text-sm text-on-surface-variant">{helper}</p>
    </article>
  )
}

function RoomsTab({
  rooms,
  query,
  status,
  category,
  onChangeQuery,
  onChangeStatus,
  onChangeCategory,
  onReset,
  onView,
  onReport,
  onUpdateStatus,
}: {
  rooms: StaffRoom[]
  query: string
  status: RoomStatus | 'ALL'
  category: RoomCategory | 'ALL'
  onChangeQuery: (query: string) => void
  onChangeStatus: (status: RoomStatus | 'ALL') => void
  onChangeCategory: (category: RoomCategory | 'ALL') => void
  onReset: () => void
  onView: (room: StaffRoom) => void
  onReport: (room: StaffRoom) => void
  onUpdateStatus: (room: StaffRoom, status: RoomStatus) => void
}) {
  return (
    <section className="space-y-4">
      <Toolbar>
        <SearchInput value={query} onChange={onChangeQuery} placeholder="Tìm phòng, loại phòng, khách..." />
        <FilterSelect
          label="Trạng thái"
          value={status}
          onChange={(value) => onChangeStatus(value as RoomStatus | 'ALL')}
          options={roomStatuses.map((item) => ({ value: item, label: item === 'ALL' ? 'Tất cả trạng thái' : getRoomStatusMeta(item).label }))}
        />
        <FilterSelect
          label="Loại phòng"
          value={category}
          onChange={(value) => onChangeCategory(value as RoomCategory | 'ALL')}
          options={roomCategories.map((item) => ({ value: item, label: item === 'ALL' ? 'Tất cả loại phòng' : getRoomCategoryLabel(item) }))}
        />
      </Toolbar>

      {rooms.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onView={() => onView(room)}
              onReport={() => onReport(room)}
              onUpdateStatus={(nextStatus) => onUpdateStatus(room, nextStatus)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Không có phòng phù hợp"
          description="Thử đổi từ khóa, trạng thái hoặc loại phòng để xem thêm kết quả."
          actionLabel="Đặt lại bộ lọc"
          onAction={onReset}
        />
      )}
    </section>
  )
}

function EquipmentTab({
  equipment,
  query,
  type,
  status,
  onChangeQuery,
  onChangeType,
  onChangeStatus,
  onReset,
  onView,
  onReport,
  onUpdateStatus,
}: {
  equipment: StaffEquipment[]
  query: string
  type: EquipmentType | 'ALL'
  status: EquipmentStatus | 'ALL'
  onChangeQuery: (query: string) => void
  onChangeType: (type: EquipmentType | 'ALL') => void
  onChangeStatus: (status: EquipmentStatus | 'ALL') => void
  onReset: () => void
  onView: (item: StaffEquipment) => void
  onReport: (item: StaffEquipment) => void
  onUpdateStatus: (item: StaffEquipment, status: EquipmentStatus) => void
}) {
  return (
    <section className="space-y-4">
      <Toolbar>
        <SearchInput value={query} onChange={onChangeQuery} placeholder="Tìm tiện nghi, mã, vị trí..." />
        <FilterSelect
          label="Loại"
          value={type}
          onChange={(value) => onChangeType(value as EquipmentType | 'ALL')}
          options={equipmentTypes.map((item) => ({ value: item, label: item === 'ALL' ? 'Tất cả loại tiện nghi' : getEquipmentTypeLabel(item) }))}
        />
        <FilterSelect
          label="Trạng thái"
          value={status}
          onChange={(value) => onChangeStatus(value as EquipmentStatus | 'ALL')}
          options={equipmentStatuses.map((item) => ({
            value: item,
            label: item === 'ALL' ? 'Tất cả trạng thái' : getEquipmentStatusMeta(item).label,
          }))}
        />
      </Toolbar>

      {equipment.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {equipment.map((item) => (
            <EquipmentCard
              key={item.id}
              equipment={item}
              onView={() => onView(item)}
              onReport={() => onReport(item)}
              onUpdateStatus={(nextStatus) => onUpdateStatus(item, nextStatus)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Không có tiện nghi phù hợp"
          description="Không tìm thấy tiện nghi theo bộ lọc hiện tại."
          actionLabel="Đặt lại bộ lọc"
          onAction={onReset}
        />
      )}
    </section>
  )
}

function IssuesTab({
  issues,
  query,
  status,
  priority,
  onChangeQuery,
  onChangeStatus,
  onChangePriority,
  onReset,
  onCreate,
  onView,
  onUpdateStatus,
}: {
  issues: StaffIssue[]
  query: string
  status: IssueStatus | 'ALL'
  priority: Priority | 'ALL'
  onChangeQuery: (query: string) => void
  onChangeStatus: (status: IssueStatus | 'ALL') => void
  onChangePriority: (priority: Priority | 'ALL') => void
  onReset: () => void
  onCreate: () => void
  onView: (issue: StaffIssue) => void
  onUpdateStatus: (issue: StaffIssue, status: IssueStatus) => void
}) {
  return (
    <section className="space-y-4">
      <Toolbar>
        <SearchInput value={query} onChange={onChangeQuery} placeholder="Tìm mã, tiêu đề, người báo..." />
        <FilterSelect
          label="Trạng thái"
          value={status}
          onChange={(value) => onChangeStatus(value as IssueStatus | 'ALL')}
          options={issueStatuses.map((item) => ({ value: item, label: item === 'ALL' ? 'Tất cả trạng thái' : getIssueStatusMeta(item).label }))}
        />
        <FilterSelect
          label="Mức độ"
          value={priority}
          onChange={(value) => onChangePriority(value as Priority | 'ALL')}
          options={issuePriorities.map((item) => ({ value: item, label: item === 'ALL' ? 'Tất cả mức độ' : getPriorityMeta(item).label }))}
        />
      </Toolbar>

      {issues.length > 0 ? (
        <div className="grid gap-4">
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onView={() => onView(issue)}
              onUpdateStatus={(nextStatus) => onUpdateStatus(issue, nextStatus)}
            />
          ))}
        </div>
      ) : query || status !== 'ALL' || priority !== 'ALL' ? (
        <EmptyState
          title="Không có sự cố phù hợp"
          description="Không tìm thấy sự cố theo điều kiện đang chọn."
          actionLabel="Đặt lại bộ lọc"
          onAction={onReset}
        />
      ) : (
        <EmptyState
          title="Chưa có sự cố"
          description="Khi nhân viên báo sự cố, danh sách xử lý sẽ xuất hiện tại đây."
          actionLabel="Báo sự cố mới"
          onAction={onCreate}
        />
      )}
    </section>
  )
}

function RoomCard({
  room,
  onView,
  onReport,
  onUpdateStatus,
}: {
  room: StaffRoom
  onView: () => void
  onReport: () => void
  onUpdateStatus: (status: RoomStatus) => void
}) {
  const status = getRoomStatusMeta(room.status)

  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--homestay-shadow-elevated)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold text-on-surface">{room.name}</h2>
            <StatusBadge meta={status} />
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            {getRoomCategoryLabel(room.category)} · {room.capacity} người
          </p>
        </div>
        <ProjectSelect
          value={room.status}
          onChange={(event) => onUpdateStatus(event.target.value as RoomStatus)}
          className="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 font-display text-sm font-bold text-on-surface outline-none transition focus:border-brand-orange"
          aria-label={`Đổi trạng thái ${room.name}`}
        >
          {roomStatuses
            .filter((item): item is RoomStatus => item !== 'ALL')
            .map((item) => (
              <option key={item} value={item}>
                {getRoomStatusMeta(item).label}
              </option>
            ))}
        </ProjectSelect>
      </div>

      <div className="mt-5 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
        {room.currentBooking ? (
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-wide text-brand-orange">Booking thuộc ca của bạn</p>
            <p className="mt-2 font-display text-base font-bold text-on-surface">{room.currentBooking.customerName}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {room.currentBooking.bookingId} · {room.currentBooking.timeRange}
            </p>
          </div>
        ) : (
          <div>
            <p className="font-display text-sm font-bold text-on-surface">Không có booking trong ca của bạn</p>
            <p className="mt-1 text-sm text-on-surface-variant">Thông tin booking của ca nhân viên khác được bảo mật.</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {room.equipment.slice(0, 4).map((item) => (
          <span key={item} className="rounded-full border border-outline-variant bg-white px-3 py-1 text-xs font-semibold text-on-surface-variant">
            {item}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Ca phụ trách" value={room.updatedAt} />
        <Metric label="Phân công" value={room.assignedStaff ?? 'Chưa được phân công'} />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onView} className="btn-secondary">
          Xem chi tiết
        </button>
        <button type="button" onClick={onReport} className="btn-warm">
          Báo sự cố
        </button>
      </div>
    </article>
  )
}

function EquipmentCard({
  equipment,
  onView,
  onReport,
  onUpdateStatus,
}: {
  equipment: StaffEquipment
  onView: () => void
  onReport: () => void
  onUpdateStatus: (status: EquipmentStatus) => void
}) {
  const status = getEquipmentStatusMeta(equipment.status)

  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--homestay-shadow-elevated)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-xs font-bold uppercase tracking-wide text-brand-orange">{equipment.code}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold text-on-surface">{equipment.name}</h2>
            <StatusBadge meta={status} />
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            {getEquipmentTypeLabel(equipment.type)} · {equipment.location}
          </p>
        </div>
        <ProjectSelect
          value={equipment.status}
          onChange={(event) => onUpdateStatus(event.target.value as EquipmentStatus)}
          className="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 font-display text-sm font-bold text-on-surface outline-none transition focus:border-brand-orange"
          aria-label={`Đổi trạng thái ${equipment.name}`}
        >
          {equipmentStatuses
            .filter((item): item is EquipmentStatus => item !== 'ALL')
            .map((item) => (
              <option key={item} value={item}>
                {getEquipmentStatusMeta(item).label}
              </option>
            ))}
        </ProjectSelect>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Số lượng" value={`${equipment.quantity ?? 1}`} />
        <Metric label="Kiểm tra gần nhất" value={equipment.lastCheckedAt} />
        <Metric label="Booking" value={equipment.currentBookingId ?? 'Không có'} />
      </div>

      {equipment.note && (
        <p className="mt-4 rounded-2xl border border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface-variant">
          {equipment.note}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onView} className="btn-secondary">
          Xem chi tiết
        </button>
        <button type="button" onClick={onReport} className="btn-warm">
          Báo sự cố
        </button>
      </div>
    </article>
  )
}

function IssueCard({
  issue,
  onView,
  onUpdateStatus,
}: {
  issue: StaffIssue
  onView: () => void
  onUpdateStatus: (status: IssueStatus) => void
}) {
  return (
    <article className="rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-display text-xs font-bold uppercase tracking-wide text-brand-orange">{issue.id}</p>
          <h2 className="mt-2 font-display text-xl font-bold text-on-surface">{issue.title}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {issue.targetType === 'ROOM' ? 'Phòng' : 'Tiện nghi'} · {issue.targetName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge meta={getPriorityMeta(issue.priority)} />
          <StatusBadge meta={getIssueStatusMeta(issue.status)} />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-on-surface-variant">{issue.description}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Người báo" value={issue.reporter} />
        <Metric label="Thời gian" value={issue.createdAt} />
        <Metric label="Loại sự cố" value={issueTypeLabels[issue.issueType]} />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onView} className="btn-secondary">
          Xem chi tiết
        </button>
        <ProjectSelect
          value={issue.status}
          onChange={(event) => onUpdateStatus(event.target.value as IssueStatus)}
          className="h-11 rounded-xl border border-outline-variant bg-surface-container-low px-3 font-display text-sm font-bold text-on-surface outline-none transition focus:border-brand-orange"
          aria-label={`Cập nhật trạng thái ${issue.id}`}
        >
          {issueStatuses
            .filter((item): item is IssueStatus => item !== 'ALL')
            .map((item) => (
              <option key={item} value={item}>
                {getIssueStatusMeta(item).label}
              </option>
            ))}
        </ProjectSelect>
      </div>
    </article>
  )
}

function ReportIssueModal({
  initialTarget,
  rooms,
  equipment,
  onCancel,
  onSubmit,
}: {
  initialTarget: { targetType: 'ROOM' | 'EQUIPMENT'; targetId?: string }
  rooms: StaffRoom[]
  equipment: StaffEquipment[]
  onCancel: () => void
  onSubmit: (draft: ReportIssueDraft) => void
}) {
  const [draft, setDraft] = useState<ReportIssueDraft>({
    targetType: initialTarget.targetType,
    targetId: initialTarget.targetId ?? '',
    issueType: 'DEVICE',
    priority: 'MEDIUM',
    title: '',
    description: '',
  })
  const [errors, setErrors] = useState<ReportIssueErrors>({})
  const targets = draft.targetType === 'ROOM' ? rooms : equipment

  const updateDraft = <Key extends keyof ReportIssueDraft>(key: Key, value: ReportIssueDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const handleSubmit = () => {
    const nextErrors: ReportIssueErrors = {}
    if (!draft.targetId) nextErrors.targetId = 'Vui lòng chọn phòng hoặc tiện nghi.'
    if (!draft.title.trim()) nextErrors.title = 'Vui lòng nhập tiêu đề sự cố.'
    if (draft.description.trim().length < 8) nextErrors.description = 'Mô tả cần ít nhất 8 ký tự.'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onSubmit(draft)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#173A31]/45 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" onClick={onCancel}>
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-elevated)] sm:max-w-2xl sm:rounded-3xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">Báo cáo vận hành</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">Báo sự cố</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Ghi nhận nhanh để đội phụ trách kiểm tra và xử lý.</p>
          </div>
          <button type="button" onClick={onCancel} className="icon-button" aria-label="Đóng modal">
            <IconClose />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Loại đối tượng">
            <ProjectSelect
              value={draft.targetType}
              onChange={(event) =>
                setDraft((current) => ({ ...current, targetType: event.target.value as 'ROOM' | 'EQUIPMENT', targetId: '' }))
              }
              className="input-field"
            >
              <option value="ROOM">Phòng</option>
              <option value="EQUIPMENT">Tiện nghi</option>
            </ProjectSelect>
          </Field>

          <Field label="Chọn phòng/tiện nghi" error={errors.targetId}>
            <ProjectSelect
              value={draft.targetId}
              onChange={(event) => updateDraft('targetId', event.target.value)}
              className="input-field"
            >
              <option value="">Chọn đối tượng</option>
              {targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.name}
                </option>
              ))}
            </ProjectSelect>
          </Field>

          <Field label="Loại sự cố">
            <ProjectSelect
              value={draft.issueType}
              onChange={(event) => updateDraft('issueType', event.target.value as IssueType)}
              className="input-field"
            >
              {Object.entries(issueTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </ProjectSelect>
          </Field>

          <Field label="Mức độ ưu tiên">
            <ProjectSelect
              value={draft.priority}
              onChange={(event) => updateDraft('priority', event.target.value as Priority)}
              className="input-field"
            >
              {issuePriorities
                .filter((item): item is Priority => item !== 'ALL')
                .map((item) => (
                  <option key={item} value={item}>
                    {getPriorityMeta(item).label}
                  </option>
                ))}
            </ProjectSelect>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Tiêu đề sự cố" error={errors.title}>
              <input
                value={draft.title}
                onChange={(event) => updateDraft('title', event.target.value)}
                className="input-field"
                placeholder="Ví dụ: Smart TV Deluxe City View 202 mất kết nối"
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Mô tả chi tiết" error={errors.description}>
              <textarea
                value={draft.description}
                onChange={(event) => updateDraft('description', event.target.value)}
                className="input-field min-h-32 resize-none py-3"
                placeholder="Mô tả hiện tượng, thời điểm phát hiện và mức ảnh hưởng tới ca làm."
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Hủy
          </button>
          <button type="button" onClick={handleSubmit} className="btn-warm">
            Gửi báo cáo
          </button>
        </div>
      </div>
    </div>
  )
}

function RoomDetailPanel({
  room,
  issues,
  onClose,
  onReport,
}: {
  room: StaffRoom
  issues: StaffIssue[]
  onClose: () => void
  onReport: () => void
}) {
  return (
    <SidePanel title={room.name} eyebrow="Chi tiết phòng" onClose={onClose}>
      <StatusBadge meta={getRoomStatusMeta(room.status)} />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Loại phòng" value={getRoomCategoryLabel(room.category)} />
        <Metric label="Sức chứa" value={`${room.capacity} người`} />
        <Metric label="Phụ trách" value={room.assignedStaff ?? 'Chưa phân công'} />
        <Metric label="Cập nhật" value={room.updatedAt} />
      </div>
      <PanelSection title="Booking hiện tại">
        {room.currentBooking ? (
          <p className="text-sm text-on-surface-variant">
            {room.currentBooking.customerName} · {room.currentBooking.bookingId} · {room.currentBooking.timeRange}
          </p>
        ) : (
          <p className="text-sm text-on-surface-variant">Chưa có booking hiện tại.</p>
        )}
      </PanelSection>
      <PanelSection title="Tiện nghi trong phòng">
        <div className="flex flex-wrap gap-2">
          {room.equipment.map((item) => (
            <span key={item} className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
              {item}
            </span>
          ))}
        </div>
      </PanelSection>
      <PanelSection title="Lịch sử sự cố gần đây">
        {issues.length > 0 ? (
          <div className="space-y-2">
            {issues.map((issue) => (
              <div key={issue.id} className="rounded-2xl border border-outline-variant bg-surface-container-low p-3">
                <p className="font-display text-sm font-bold text-on-surface">{issue.title}</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {issue.id} · {getIssueStatusMeta(issue.status).label}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">Chưa có sự cố nào được ghi nhận.</p>
        )}
      </PanelSection>
      <PanelSection title="Ghi chú nội bộ">
        <p className="text-sm leading-6 text-on-surface-variant">{room.note ?? 'Không có ghi chú.'}</p>
      </PanelSection>
      <button type="button" onClick={onReport} className="btn-warm mt-6 w-full">
        Báo sự cố cho phòng này
      </button>
    </SidePanel>
  )
}

function EquipmentDetailPanel({
  equipment,
  issues,
  onClose,
  onReport,
}: {
  equipment: StaffEquipment
  issues: StaffIssue[]
  onClose: () => void
  onReport: () => void
}) {
  return (
    <SidePanel title={equipment.name} eyebrow={equipment.code} onClose={onClose}>
      <StatusBadge meta={getEquipmentStatusMeta(equipment.status)} />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Loại" value={getEquipmentTypeLabel(equipment.type)} />
        <Metric label="Vị trí" value={equipment.location} />
        <Metric label="Số lượng" value={`${equipment.quantity ?? 1}`} />
        <Metric label="Kiểm tra gần nhất" value={equipment.lastCheckedAt} />
      </div>
      <PanelSection title="Booking đang sử dụng">
        <p className="text-sm text-on-surface-variant">{equipment.currentBookingId ?? 'Không có booking đang sử dụng.'}</p>
      </PanelSection>
      <PanelSection title="Lịch sử kiểm tra">
        <div className="space-y-2 text-sm text-on-surface-variant">
          <p>08:00 hôm nay · Checklist nhanh trước ca.</p>
          <p>{equipment.lastCheckedAt} · Ghi nhận trạng thái hiện tại.</p>
        </div>
      </PanelSection>
      <PanelSection title="Sự cố liên quan">
        {issues.length > 0 ? (
          <div className="space-y-2">
            {issues.map((issue) => (
              <div key={issue.id} className="rounded-2xl border border-outline-variant bg-surface-container-low p-3">
                <p className="font-display text-sm font-bold text-on-surface">{issue.title}</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {issue.id} · {getIssueStatusMeta(issue.status).label}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">Chưa có sự cố nào được ghi nhận.</p>
        )}
      </PanelSection>
      <PanelSection title="Ghi chú kỹ thuật">
        <p className="text-sm leading-6 text-on-surface-variant">{equipment.note ?? 'Không có ghi chú.'}</p>
      </PanelSection>
      <button type="button" onClick={onReport} className="btn-warm mt-6 w-full">
        Báo sự cố cho tiện nghi này
      </button>
    </SidePanel>
  )
}

function IssueDetailPanel({
  issue,
  onClose,
  onUpdateStatus,
}: {
  issue: StaffIssue
  onClose: () => void
  onUpdateStatus: (issue: StaffIssue, status: IssueStatus) => void
}) {
  return (
    <SidePanel title={issue.title} eyebrow={issue.id} onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        <StatusBadge meta={getPriorityMeta(issue.priority)} />
        <StatusBadge meta={getIssueStatusMeta(issue.status)} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Đối tượng" value={issue.targetName} />
        <Metric label="Loại" value={issueTypeLabels[issue.issueType]} />
        <Metric label="Người báo" value={issue.reporter} />
        <Metric label="Thời gian" value={issue.createdAt} />
      </div>
      <PanelSection title="Mô tả">
        <p className="text-sm leading-6 text-on-surface-variant">{issue.description}</p>
      </PanelSection>
      <PanelSection title="Cập nhật trạng thái">
        <ProjectSelect
          value={issue.status}
          onChange={(event) => onUpdateStatus(issue, event.target.value as IssueStatus)}
          className="input-field"
        >
          {issueStatuses
            .filter((item): item is IssueStatus => item !== 'ALL')
            .map((item) => (
              <option key={item} value={item}>
                {getIssueStatusMeta(item).label}
              </option>
            ))}
        </ProjectSelect>
      </PanelSection>
    </SidePanel>
  )
}

function SidePanel({ title, eyebrow, children, onClose }: { title: string; eyebrow: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[#173A31]/45 backdrop-blur-sm" onClick={onClose}>
      <aside className="h-full w-full overflow-y-auto border-l border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-elevated)] sm:max-w-xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-brand-orange">{eyebrow}</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-on-surface">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Đóng chi tiết">
            <IconClose />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </aside>
    </div>
  )
}

function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-outline-variant bg-white p-4 shadow-[var(--homestay-shadow-card)]">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_220px]">{children}</div>
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
        <IconSearch />
      </span>
      <input
        data-search-input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-low pl-11 pr-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/70 focus:border-brand-orange focus:bg-white"
      />
    </label>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <ProjectSelect
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 font-display text-sm font-bold text-on-surface outline-none transition focus:border-brand-orange focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </ProjectSelect>
    </label>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-display text-sm font-bold text-on-surface">{label}</span>
      <span className="mt-2 block">{children}</span>
      {error && <span className="mt-2 block text-sm font-semibold text-error">{error}</span>}
    </label>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-3">
      <p className="font-display text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-2 text-sm font-semibold text-on-surface">{value}</p>
    </div>
  )
}

function StatusBadge({ meta }: { meta: Meta }) {
  return (
    <span className={['inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-xs font-bold', meta.className].join(' ')}>
      {meta.dotClassName && <span className={['h-1.5 w-1.5 rounded-full', meta.dotClassName].join(' ')} />}
      {meta.label}
    </span>
  )
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="font-display text-base font-bold text-on-surface">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="rounded-3xl border border-dashed border-outline bg-white px-5 py-14 text-center shadow-[var(--homestay-shadow-card)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-brand-orange">
        <IconEmpty />
      </div>
      <h2 className="mt-5 font-display text-xl font-bold text-on-surface">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{description}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn-warm mx-auto mt-6">
          {actionLabel}
        </button>
      )}
    </div>
  )
}

function RoomsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-3xl border border-outline-variant bg-white p-5 shadow-[var(--homestay-shadow-card)]">
            <div className="h-4 w-28 rounded bg-surface-container-high" />
            <div className="mt-6 h-9 w-16 rounded bg-surface-container-high" />
            <div className="mt-5 h-3 w-40 rounded bg-surface-container-high" />
          </div>
        ))}
      </div>
      <div className="h-20 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--homestay-shadow-card)]" />
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-3xl border border-outline-variant bg-white shadow-[var(--homestay-shadow-card)]" />
        ))}
      </div>
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-secondary-container bg-secondary px-4 py-3 text-sm font-semibold text-on-secondary shadow-[var(--homestay-shadow-elevated)]">
      {message}
    </div>
  )
}

function IconLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 9v6M8 5v14M12 3v18M16 6v12M20 10v4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function IconMenuDot({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" opacity={active ? 1 : 0.68} />
      <path d="M7 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity={active ? 1 : 0.68} />
    </svg>
  )
}

function IconRoom() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 20V6.8L12 3l8 3.8V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 20v-7h6v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function IconTool() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M14.5 6.5l3 3M5 19l6.2-6.2M15 4a4 4 0 0 0 5 5L10.5 18.5a3 3 0 0 1-4.2 0l-.8-.8a3 3 0 0 1 0-4.2L15 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.3-5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 3v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15ZM16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function IconEmpty() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-9Z" stroke="currentColor" strokeWidth="2" />
      <path d="M9 10h6M9 14h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
