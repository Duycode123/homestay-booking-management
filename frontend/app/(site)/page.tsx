"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import BookingQuickModal from "@/components/booking/BookingQuickModal";
import StaySearchBar from "@/components/public/StaySearchBar";
import NewCustomerOfferModal from "@/components/public/NewCustomerOfferModal";
import { useI18n } from "@/components/i18n/LocaleProvider";
import {
  formatCurrency,
  getNightlyDisplayPrice,
  type BookingRoom,
} from "@/components/booking/booking-data";
import {
  readQuickBookingDraft,
  shouldReopenQuickBooking,
} from "@/components/booking/quick-booking-draft";
import { useHomepageLiveData } from "@/hooks/useHomepageLiveData";
import { usePublicRoomCatalog } from "@/hooks/usePublicRoomCatalog";
import { useTodayRoomAvailability } from "@/hooks/useTodayRoomAvailability";
import { type AvailabilityTone } from "@/lib/homepage-live-service";
import { getAvailabilityLabel } from "@/lib/public/room-filters";
import { shouldBypassImageOptimization } from "@/lib/image-optimization";
import {
  getRoomCardAvailabilityState,
  isRoomTemporarilyUnavailable,
} from "@/lib/public/today-room-availability";

const homeCopy = {
  vi: {
    heroAlt:
      "Phòng ngủ homestay cao cấp với nội thất gỗ, chăn ga linen và cửa nhìn ra khu vườn",
    loadingAvailability: "Đang cập nhật lịch phòng...",
    closedHint: "Bạn vẫn có thể đặt lịch cho ngày tiếp theo.",
    heroEyebrow: "Boutique nature stay",
    heroTitleLine1: "Một kỳ nghỉ",
    heroTitleLine2: "vừa vặn với bạn.",
    heroDescription:
      "Không gian riêng tư, tiện nghi được chuẩn bị kỹ và lịch trống minh bạch. Chọn căn phòng phù hợp, đặt theo khung giờ linh hoạt và nhận hỗ trợ ngay khi cần.",
    checkAvailability: "Kiểm tra phòng trống",
    process: "Xem quy trình lưu trú",
    recentBookings: "Đặt phòng gần đây",
    liveFromSystem: "Cập nhật trực tiếp từ hệ thống",
    activityCount: "hoạt động",
    updatingActivities: "Đang cập nhật hoạt động...",
    noRecentBookings: "Chưa có lượt đặt phòng mới.",
    showingLatestData: "Đang hiển thị dữ liệu gần nhất.",
    stats: [
      { value: "Rõ ràng", label: "Lịch trống & giá" },
      { value: "Linh hoạt", label: "Khung giờ lưu trú" },
      { value: "Chu đáo", label: "Hỗ trợ tại chỗ" },
    ],
    topRatedEyebrow: "Gợi ý từ khách hàng",
    topRatedTitle: "Phòng được đánh giá cao",
    topRatedDescription:
      "Những phòng homestay được khách hàng yêu thích và đánh giá tốt nhất.",
    viewAll: "Xem tất cả",
    previousRooms: "Xem nhóm phòng trước",
    nextRooms: "Xem nhóm phòng tiếp theo",
    noRatedRooms: "Chưa có dữ liệu đánh giá phòng.",
    suspended: "Tạm ngưng",
    checkingSchedule: "Đang cập nhật lịch",
    checkSchedule: "Kiểm tra lịch",
    chooseAnotherDate: "Chọn ngày khác",
    bookNow: "Đặt phòng",
    capacity: "Sức chứa",
    pricePerNight: "Giá/đêm",
    bedrooms: "phòng ngủ",
    beds: "giường",
    reviews: "đánh giá",
    noReviews: "Chưa có lượt đánh giá",
    detail: "Chi tiết",
    whyEyebrow: "Vì sao chọn The Serene Villa",
    whyTitle: "Một kỳ nghỉ an tâm bắt đầu từ những điều được chuẩn bị kỹ.",
    whyDescription:
      "Chúng tôi biến những băn khoăn trước chuyến đi thành một hành trình rõ ràng: chọn đúng căn, biết chính xác chi phí và luôn có người đồng hành khi bạn cần.",
    exploreRooms: "Khám phá không gian lưu trú",
    whyFootnote:
      "The Serene Villa ưu tiên thông tin rõ ràng và trải nghiệm vừa yên bình vừa đáng tin cậy.",
    promises: [
      {
        icon: "calendar",
        title: "Lịch trống được đối chiếu thực tế",
        description:
          "Chỉ gợi ý những căn còn phù hợp với khoảng ngày bạn đã chọn.",
      },
      {
        icon: "shield",
        title: "Chi phí rõ ràng trước khi xác nhận",
        description:
          "Giá lưu trú, ưu đãi và khoản cần thanh toán luôn được hiển thị trước bước tiếp theo.",
      },
      {
        icon: "amenities",
        title: "Đón tiếp chu đáo theo từng kỳ lưu trú",
        description:
          "Đội ngũ chuẩn bị phòng, tiện nghi và hỗ trợ đúng vào thời điểm bạn cần.",
      },
    ],
    amenitiesEyebrow: "Tiện nghi homestay",
    amenitiesTitle: "Những điều nhỏ bé làm nên một kỳ nghỉ dễ chịu.",
    amenitiesDescription:
      "Mỗi không gian được chuẩn bị cho nhịp nghỉ riêng của bạn — từ kết nối, thư giãn đến những chi tiết sẵn sàng trước giờ nhận phòng.",
    amenitiesNote: "Các tiện nghi cụ thể luôn được cập nhật tại từng trang phòng.",
    amenitiesSummary:
      "Khám phá các nhóm tiện nghi được đội ngũ The Serene Villa duy trì trong suốt quá trình vận hành.",
    viewAmenities: "Xem toàn bộ tiện nghi",
  },
  en: {
    heroAlt:
      "Premium homestay bedroom with wooden furniture, linen bedding and a garden view",
    loadingAvailability: "Updating room availability...",
    closedHint: "You can still book for the next available date.",
    heroEyebrow: "Boutique nature stay",
    heroTitleLine1: "A stay that",
    heroTitleLine2: "fits your rhythm.",
    heroDescription:
      "Private spaces, carefully prepared amenities and transparent availability. Choose the right room, book a flexible stay and get support whenever you need it.",
    checkAvailability: "Check availability",
    process: "View stay process",
    recentBookings: "Recent bookings",
    liveFromSystem: "Live updates from the system",
    activityCount: "activities",
    updatingActivities: "Updating activities...",
    noRecentBookings: "No new paid bookings yet.",
    showingLatestData: "Showing the latest available data.",
    stats: [
      { value: "Clear", label: "Availability & price" },
      { value: "Flexible", label: "Stay schedule" },
      { value: "Thoughtful", label: "On-site support" },
    ],
    topRatedEyebrow: "Guest favourites",
    topRatedTitle: "Top-rated rooms",
    topRatedDescription:
      "Handpicked stays loved by guests for comfort, service and a calmer rhythm.",
    viewAll: "View all",
    previousRooms: "View previous rooms",
    nextRooms: "View next rooms",
    noRatedRooms: "No room ratings are available yet.",
    suspended: "Unavailable",
    checkingSchedule: "Updating schedule",
    checkSchedule: "Check schedule",
    chooseAnotherDate: "Choose another date",
    bookNow: "Book now",
    capacity: "Capacity",
    pricePerNight: "Price/night",
    bedrooms: "bedrooms",
    beds: "beds",
    reviews: "reviews",
    noReviews: "No reviews yet",
    detail: "Details",
    whyEyebrow: "Why choose The Serene Villa",
    whyTitle: "A calm stay begins with the details prepared in advance.",
    whyDescription:
      "We turn pre-trip uncertainty into a clear journey: choose the right room, understand the cost and always have someone ready to help.",
    exploreRooms: "Explore stays",
    whyFootnote:
      "The Serene Villa keeps the experience transparent, serene and reliable from search to checkout.",
    promises: [
      {
        icon: "calendar",
        title: "Real-time availability",
        description:
          "We only suggest rooms that match the dates you have selected.",
      },
      {
        icon: "shield",
        title: "Clear costs before confirmation",
        description:
          "Room rate, discounts and required payment are shown before the next step.",
      },
      {
        icon: "amenities",
        title: "Thoughtful preparation for every stay",
        description:
          "Our team prepares the room, amenities and support at the right moment.",
      },
    ],
    amenitiesEyebrow: "Homestay amenities",
    amenitiesTitle: "Small details that make a stay feel effortless.",
    amenitiesDescription:
      "Every space is prepared for your own pace — from connection and relaxation to essentials ready before check-in.",
    amenitiesNote: "Specific amenities are kept up to date on each room page.",
    amenitiesSummary:
      "Explore amenity groups maintained by The Serene Villa team throughout daily operations.",
    viewAmenities: "View all amenities",
  },
} as const;

type HomeCopy = (typeof homeCopy)[keyof typeof homeCopy];

const stats = [
  { value: "Rõ ràng", label: "Lịch trống & giá" },
  { value: "Linh hoạt", label: "Khung giờ lưu trú" },
  { value: "Chu đáo", label: "Hỗ trợ tại chỗ" },
];

const equipmentCategories = [
  {
    icon: "wifi",
    eyebrow: "Kết nối liền mạch",
    title: "Wi‑Fi tốc độ cao",
    description:
      "Kết nối ổn định trong từng không gian, phù hợp cho một buổi làm việc yên tĩnh hoặc giờ phút thư giãn riêng.",
    items: ["Wi‑Fi riêng", "Phủ sóng tốt", "Làm việc thoải mái"],
    featured: true,
    layout: "sm:col-span-2 lg:col-span-5",
  },
  {
    icon: "air",
    eyebrow: "Nghỉ ngơi dễ chịu",
    title: "Điều hòa sạch, mát lành",
    description:
      "Điều hòa inverter được vệ sinh và kiểm tra định kỳ trước mỗi lượt đón khách.",
    items: ["Làm lạnh nhanh", "Điều khiển riêng", "Tiết kiệm điện"],
    featured: false,
    layout: "lg:col-span-4",
  },
  {
    icon: "tv",
    eyebrow: "Giải trí tại phòng",
    title: "Smart TV",
    description:
      "Màn hình lớn kết nối Internet cho những giờ nghỉ ngơi trọn vẹn hơn.",
    items: ["YouTube", "Trình chiếu", "Màn hình lớn"],
    featured: false,
    layout: "lg:col-span-3",
  },
  {
    icon: "sliders",
    eyebrow: "Thư giãn riêng tư",
    title: "Nước nóng ổn định",
    description:
      "Hệ thống nước nóng riêng, vận hành an toàn và được kiểm tra thường xuyên.",
    items: ["Nhiệt độ ổn định", "Chống giật", "Phòng tắm riêng"],
    featured: false,
    layout: "lg:col-span-4",
  },
  {
    icon: "amenities",
    eyebrow: "Những điều nhỏ bé",
    title: "Tiện nghi sẵn sàng",
    description:
      "Tủ lạnh mini, ấm đun nước và các vật dụng cơ bản được bố trí gọn gàng trong phòng.",
    items: ["Tủ lạnh mini", "Ấm đun nước", "Vật dụng cơ bản"],
    featured: false,
    layout: "lg:col-span-3",
  },
  {
    icon: "shield",
    eyebrow: "Chỉn chu trước khi đến",
    title: "Sẵn sàng cho check‑in",
    description:
      "Phòng được kiểm tra vệ sinh, thiết bị và ghi chú yêu cầu trước giờ nhận phòng.",
    items: ["Kiểm tra phòng", "Đối chiếu booking", "Hỗ trợ tại chỗ"],
    featured: false,
    layout: "sm:col-span-2 lg:col-span-5",
  },
] as const;

const homestayStandards = [
  {
    icon: "bed" as const,
    title: "Không gian nghỉ dưỡng",
    description:
      "Phòng sạch sẽ, yên tĩnh và được chuẩn bị kỹ trước mỗi lượt khách.",
  },
  {
    icon: "sliders" as const,
    title: "Tiện nghi bảo trì định kỳ",
    description:
      "Wi-Fi, điều hòa, TV và máy nước nóng được kiểm tra trước mỗi lượt nhận phòng.",
  },
  {
    icon: "users" as const,
    title: "Đội ngũ hỗ trợ tại chỗ",
    description:
      "Nhân viên homestay hỗ trợ check-in và xử lý thay đổi lịch trong giờ vận hành.",
  },
] as const;

const experienceCommitments = [
  {
    name: "Trước khi nhận phòng",
    role: "Chuẩn bị chỉn chu",
    quote:
      "Thông tin phòng, tiện nghi và mức giá được trình bày rõ trước khi bạn xác nhận.",
  },
  {
    name: "Trong kỳ lưu trú",
    role: "Hỗ trợ đúng lúc",
    quote:
      "Đội ngũ vận hành theo dõi lịch nhận phòng và tiếp nhận sự cố ngay trên hệ thống.",
  },
];

type IconName =
  | (typeof equipmentCategories)[number]["icon"]
  | "bed"
  | "users"
  | "clock"
  | "star"
  | "check"
  | "bolt"
  | "calendar"
  | "sliders";

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    bed: (
      <>
        <path d="M3 18v-7M21 18v-5a3 3 0 0 0-3-3H9v8M3 14h18M6 10V7h5a3 3 0 0 1 3 3" />
      </>
    ),
    wifi: (
      <>
        <path d="M9 18V5l10-2v13" />
        <path d="M9 9l10-2" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </>
    ),
    bolt: <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7z" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <circle cx="9" cy="6" r="2" />
        <circle cx="15" cy="12" r="2" />
        <circle cx="7" cy="18" r="2" />
      </>
    ),
    shield: (
      <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-5" />
    ),
    tv: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8" />
      </>
    ),
    air: (
      <>
        <rect x="4" y="7" width="16" height="12" rx="2" />
        <circle cx="9" cy="13" r="2" />
        <path d="M14 11v4M17 10v6" />
      </>
    ),
    amenities: (
      <>
        <path d="M7 7a5 5 0 0 1 10 0v4a3 3 0 0 1-3 3h-1" />
        <path d="M10 14v3M14 14v3M8 20h8" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    star: (
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z" />
    ),
    check: <path d="M20 6 9 17l-5-5" />,
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      {paths[name]}
    </svg>
  );
}

function getAvailabilityBadgeClassName(tone: AvailabilityTone) {
  const toneClassName = {
    success:
      "border-secondary/12 bg-[#F2F5F1] text-secondary hover:border-secondary/22 hover:bg-[#EAF0EC]",
    warning:
      "border-brand-orange/30 bg-[#F7EEE4] text-[#7A5635] hover:border-brand-orange/45",
    muted: "border-outline-variant bg-white/70 text-on-surface-variant hover:bg-white",
  };

  return [
    "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-left font-display text-xs font-semibold transition sm:text-sm",
    toneClassName[tone],
  ].join(" ");
}

function getAvailabilityDotClassName(tone: AvailabilityTone) {
  const toneClassName = {
    success: "bg-[#93AE9D] shadow-[0_0_0_5px_rgba(147,174,157,0.15)]",
    warning: "bg-brand-orange shadow-[0_0_0_5px_rgba(184,138,89,0.14)]",
    muted: "bg-outline",
  };

  return ["h-2 w-2 rounded-full", toneClassName[tone]].join(" ");
}

function getTopRatedRooms(rooms: BookingRoom[]) {
  return rooms
    .filter(
      (room) =>
        typeof room.rating === "number" &&
        room.rating > 4 &&
        !isRoomTemporarilyUnavailable(room),
    )
    .sort((a, b) => {
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.reviews ?? 0) - (a.reviews ?? 0);
    })
    .slice(0, 8);
}

function TopRatedRoomsSection({
  rooms,
  isLoading,
  onOpenDetail,
  onBook,
}: {
  rooms: BookingRoom[];
  isLoading: boolean;
  onOpenDetail: (room: BookingRoom) => void;
  onBook: (room: BookingRoom) => void;
}) {
  const { locale, localizedHref } = useI18n();
  const copy = homeCopy[locale];
  const featuredRoom = rooms[0];
  const supportingRooms = rooms.slice(1, 3);

  return (
    <section id="top-rated-rooms" className="relative scroll-mt-24 overflow-hidden bg-[#F7F3EB] pb-24 pt-20 sm:pb-28 sm:pt-28">
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-28 h-80 w-80 rounded-full border border-brand-orange/10" />
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow text-brand-orange">{copy.topRatedEyebrow}</p>
            <h2 className="font-editorial mt-4 text-5xl font-medium leading-[0.95] tracking-[-0.035em] text-secondary sm:text-6xl lg:text-[4.75rem]">
              {copy.topRatedTitle}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-on-surface-variant">
              {copy.topRatedDescription}
            </p>
          </div>

          <Link
            href={localizedHref("/rooms?sort=rating")}
            className="group inline-flex min-h-11 w-fit items-center gap-3 border-b border-secondary/55 font-display text-sm font-semibold text-secondary"
          >
            {copy.viewAll}
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-12 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="min-h-[540px] animate-pulse rounded-[32px] bg-white/80" />
            <div className="grid gap-6">
              <div className="min-h-[255px] animate-pulse rounded-[28px] bg-white/80" />
              <div className="min-h-[255px] animate-pulse rounded-[28px] bg-white/80" />
            </div>
          </div>
        ) : featuredRoom ? (
          <div className="mt-12 grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-stretch">
            <TopRatedFeaturedRoom
              room={featuredRoom}
              onOpenDetail={onOpenDetail}
              onBook={onBook}
              copy={copy}
            />
            <div className="grid gap-6">
              {supportingRooms.map((room) => (
                <TopRatedSupportingRoom
                  key={room.id}
                  room={room}
                  onOpenDetail={onOpenDetail}
                  onBook={onBook}
                  copy={copy}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-[28px] border border-dashed border-outline-variant bg-white px-6 py-12 text-center shadow-[var(--shadow-card)]">
            <p className="font-display text-lg font-bold text-on-surface">
              {copy.noRatedRooms}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function getTopRatedRoomUi(room: BookingRoom, copy: HomeCopy) {
  const availabilityState = getRoomCardAvailabilityState(room);
  const availabilityStatus = room.availabilityStatus ?? "AVAILABLE";
  const availabilityLabel = availabilityState.isUnavailable
    ? copy.suspended
    : availabilityState.isChecking
      ? copy.checkingSchedule
      : getAvailabilityLabel(availabilityStatus, room);
  const bookingLabel = availabilityState.isChecking
    ? copy.checkSchedule
    : availabilityState.isUnavailable
      ? copy.suspended
      : availabilityState.isPaymentHeld
        ? copy.chooseAnotherDate
        : availabilityState.canStartBooking
          ? copy.bookNow
          : copy.chooseAnotherDate;

  return { availabilityState, availabilityLabel, bookingLabel };
}

function TopRatedFeaturedRoom({
  room,
  onOpenDetail,
  onBook,
  copy,
}: {
  room: BookingRoom;
  onOpenDetail: (room: BookingRoom) => void;
  onBook: (room: BookingRoom) => void;
  copy: HomeCopy;
}) {
  const imageSrc = room.image ?? "/images/homestay-luxury-hero.webp";
  const { availabilityState, availabilityLabel, bookingLabel } = getTopRatedRoomUi(room, copy);

  return (
    <article className="group relative min-h-[540px] overflow-hidden rounded-[30px] bg-secondary shadow-[var(--homestay-shadow-elevated)]">
      <button
        type="button"
        onClick={() => onOpenDetail(room)}
        className="absolute inset-0 block w-full text-left"
        aria-label={`${copy.detail}: ${room.name}`}
      >
        <Image src={imageSrc} alt={room.name} fill quality={94} unoptimized={shouldBypassImageOptimization(imageSrc)} sizes="(min-width: 1024px) 55vw, 100vw" className={["object-cover transition duration-700 ease-out group-hover:scale-[1.025]", room.imageClassName].join(" ")} />
        <span className="absolute inset-0 bg-[linear-gradient(to_top,rgba(18,40,33,0.54),transparent_52%)]" />
      </button>

      <div className="absolute inset-x-4 bottom-4 z-10 rounded-[22px] bg-[#FFFDFC]/96 p-5 shadow-[0_20px_50px_rgba(30,42,36,0.15)] backdrop-blur-md sm:inset-x-7 sm:bottom-7 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-6 sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-on-surface-variant">
            <span className="text-brand-orange">★ {(room.rating ?? 0).toFixed(1)}</span>
            <span>{room.capacity}</span>
            <span className="h-1 w-1 rounded-full bg-outline" />
            <span>{availabilityLabel}</span>
          </div>
          <h3 className="font-editorial mt-2 text-3xl font-medium leading-none text-secondary sm:text-4xl">{room.name}</h3>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-0 sm:justify-end">
          <p className="mr-2 font-editorial text-2xl font-medium text-secondary">{formatCurrency(getNightlyDisplayPrice(room.pricePerHour))}</p>
          <button
            type="button"
            onClick={() => onOpenDetail(room)}
            className="min-h-11 border-b border-secondary/45 px-1 font-display text-xs font-semibold text-secondary"
          >
            {copy.detail}
          </button>
          <button
            type="button"
            onClick={() => onBook(room)}
            disabled={
              availabilityState.isUnavailable || availabilityState.isChecking
            }
            className="min-h-11 rounded-xl bg-secondary px-4 font-display text-xs font-semibold text-white shadow-[0_10px_24px_rgba(23,58,49,0.16)] transition hover:-translate-y-0.5 hover:bg-secondary-container disabled:cursor-not-allowed disabled:opacity-55"
          >
            {bookingLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

function TopRatedSupportingRoom({ room, onOpenDetail, onBook, copy }: {
  room: BookingRoom;
  onOpenDetail: (room: BookingRoom) => void;
  onBook: (room: BookingRoom) => void;
  copy: HomeCopy;
}) {
  const imageSrc = room.image ?? "/images/homestay-luxury-hero.webp";
  const { availabilityState, availabilityLabel, bookingLabel } = getTopRatedRoomUi(room, copy);

  return (
    <article className="group grid min-h-[258px] overflow-hidden rounded-[26px] bg-[#FFFDFC] shadow-[var(--homestay-shadow-card)] sm:grid-cols-[0.92fr_1.08fr]">
      <button type="button" onClick={() => onOpenDetail(room)} className="relative min-h-[220px] overflow-hidden text-left sm:min-h-full" aria-label={`${copy.detail}: ${room.name}`}>
        <Image src={imageSrc} alt={room.name} fill quality={92} unoptimized={shouldBypassImageOptimization(imageSrc)} sizes="(min-width: 1024px) 24vw, 100vw" className={["object-cover transition duration-700 ease-out group-hover:scale-[1.035]", room.imageClassName].join(" ")} />
      </button>
      <div className="flex min-w-0 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-on-surface-variant">
          <span className="text-brand-orange">★ {(room.rating ?? 0).toFixed(1)}</span>
          <span className="h-1 w-1 rounded-full bg-outline" />
          <span>{availabilityLabel}</span>
        </div>
        <h3 className="font-editorial mt-3 text-[1.8rem] font-medium leading-[1.02] text-secondary">{room.name}</h3>
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-on-surface-variant">{room.description}</p>
        <p className="font-editorial mt-4 text-2xl font-medium text-secondary">{formatCurrency(getNightlyDisplayPrice(room.pricePerHour))}</p>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
          <button type="button" onClick={() => onOpenDetail(room)} className="min-h-10 border-b border-secondary/45 px-1 font-display text-xs font-semibold text-secondary">{copy.detail}</button>
          <button type="button" onClick={() => onBook(room)} disabled={availabilityState.isUnavailable || availabilityState.isChecking} className="min-h-10 rounded-xl bg-secondary px-4 font-display text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-secondary-container disabled:cursor-not-allowed disabled:opacity-55">{bookingLabel}</button>
        </div>
      </div>
    </article>
  );
}

function ChevronIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function TrustSpotlight() {
  const { locale, localizedHref } = useI18n();
  const copy = homeCopy[locale];
  const promises = copy.promises;

  return (
    <section
      id="why-serene"
      className="scroll-mt-24 bg-[#EFEAE1] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-secondary/10 bg-secondary px-6 py-8 text-white shadow-[0_28px_70px_rgba(23,58,49,0.2)] sm:px-9 sm:py-11 lg:px-12 lg:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-28 -top-36 h-[28rem] w-[28rem] rounded-full border border-white/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-44 right-10 h-[30rem] w-[30rem] rounded-full border border-brand-orange/20"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-[30%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"
          />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
            <div className="flex flex-col justify-between">
              <div>
                <p className="eyebrow text-primary-fixed">
                  {copy.whyEyebrow}
                </p>
                <h2 className="font-editorial mt-4 max-w-xl text-4xl font-semibold leading-[1.06] text-white sm:text-5xl lg:text-[3.5rem]">
                  {copy.whyTitle}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-8 text-white/72 sm:text-[1.05rem]">
                  {copy.whyDescription}
                </p>
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href={localizedHref("/rooms")}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 font-display text-sm font-semibold text-secondary transition-[background-color,color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-primary-fixed hover:shadow-[0_14px_28px_rgba(0,0,0,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none"
                >
                  {copy.exploreRooms}
                </Link>
                <Link
                  href={localizedHref("/process")}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 bg-white/[0.03] px-6 font-display text-sm font-semibold text-white transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none"
                >
                  {copy.process}
                </Link>
              </div>
            </div>

            <div className="grid gap-3 self-center">
              {promises.map((promise, index) => (
                <article
                  key={promise.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.055] p-5 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/28 hover:bg-white/[0.09] motion-reduce:transform-none sm:p-6"
                >
                  <div
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1 origin-bottom scale-y-0 bg-primary-fixed transition-transform duration-200 group-hover:scale-y-100"
                  />
                  <div className="relative flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-primary-fixed transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none">
                      <Icon name={promise.icon as IconName} className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-fixed">
                        0{index + 1}
                      </p>
                      <h3 className="mt-1 font-display text-base font-bold text-white sm:text-[1.05rem]">
                        {promise.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-6 text-white/64">
                        {promise.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
              <p className="pt-2 text-xs leading-5 text-white/52">
                {copy.whyFootnote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const seasons = [
  {
    name: "Mùa xuân",
    shortName: "Xuân",
    number: "01",
    image: "/images/seasons/serene-spring.webp",
    alt: "Hoa xuân và những chiếc đèn lồng giữa khuôn viên The Serene Villa",
    title: "Sắc xuân dịu dàng trong từng khoảng trời.",
    description:
      "Mùa xuân tại The Serene Villa hiện lên trong sắc hoa hồng nhẹ, những tán cây vừa thay lá và ánh sáng trong trẻo đầu ngày. Đèn lồng khẽ đung đưa giữa khuôn viên, mang đến một không gian tươi mới, thanh lịch và đầy cảm hứng cho những khởi đầu bình yên.",
  },
  {
    name: "Mùa hạ",
    shortName: "Hạ",
    number: "02",
    image: "/images/seasons/serene-summer.webp",
    alt: "Lối đá nhìn ra mặt nước trong ánh hoàng hôn mùa hạ",
    title: "Những ngày dài khép lại bên ánh hoàng hôn.",
    description:
      "Mùa hạ tại The Serene Villa là những buổi chiều ngập nắng, lối đá dẫn xuống mặt nước và sắc hoa rực rỡ trong ánh hoàng hôn. Đây là lúc bạn có thể tạm rời nhịp sống vội vàng, tận hưởng làn gió dịu và lưu lại những khoảnh khắc thật chậm bên thiên nhiên.",
  },
  {
    name: "Mùa thu",
    shortName: "Thu",
    number: "03",
    image: "/images/seasons/serene-autumn.webp",
    alt: "Căn villa nép mình giữa rừng lá đỏ và mặt hồ mùa thu",
    title: "Khi khu rừng khoác lên mình sắc màu ấm áp.",
    description:
      "Mùa thu phủ quanh The Serene Villa những gam đỏ, cam và vàng trầm ấm. Căn villa nép mình dưới tán cây, bên mặt hồ phủ lá, tạo nên một không gian yên tĩnh dành cho những buổi đọc sách, thưởng trà và lắng nghe thiên nhiên chuyển mùa.",
  },
  {
    name: "Mùa đông",
    shortName: "Đông",
    number: "04",
    image: "/images/seasons/serene-winter.webp",
    alt: "Lối đi phủ tuyết trong ánh nắng mùa đông tại The Serene Villa",
    title: "Bình yên hiện hữu giữa miền tuyết trắng.",
    description:
      "Mùa đông tại The Serene Villa mở ra với lối đi phủ tuyết, những hàng cây trắng xóa và ánh nắng dịu trải dài trên khu nghỉ dưỡng. Bên ngoài là không khí lạnh trong trẻo, còn bên trong luôn là một không gian ấm áp, riêng tư để bạn nghỉ ngơi và tái tạo năng lượng.",
  },
] as const;

const textVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 90 : -90,
    filter: "blur(10px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -70 : 70,
    filter: "blur(8px)",
  }),
};

const reducedMotionVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

function SereneExperience() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduceMotion = useReducedMotion();

  const activeSeason = seasons[activeIndex];
  const nextSeason = seasons[(activeIndex + 1) % seasons.length];

  const showNextSeason = () => {
    setDirection(1);
    setActiveIndex((currentIndex) => (currentIndex + 1) % seasons.length);
  };

  return (
    <section
      id="why-serene"
      className="relative isolate z-0 scroll-mt-24 overflow-hidden bg-[#f3eee5] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,.88fr)_minmax(0,1.12fr)] lg:gap-16">
          <div className="relative flex min-h-[410px] items-center lg:min-h-[580px]">
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.div
                key={activeSeason.name}
                custom={direction}
                variants={reduceMotion ? reducedMotionVariants : textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: reduceMotion ? 0.2 : 0.58,
                  ease: [0.22, 1, 0.36, 1] as const,
                }}
                className="w-full"
              >
                <div className="flex items-center gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b67a43]">
                    {activeSeason.name} tại The Serene Villa
                  </p>
                  <span className="h-px flex-1 bg-[#d8cbb9]" />
                </div>

                <h2 className="font-editorial mt-5 max-w-[620px] text-4xl font-semibold leading-[1.08] text-[#234D42] sm:text-5xl lg:text-[3.45rem]">
                  {activeSeason.title}
                </h2>

                <p className="mt-6 max-w-[610px] text-base leading-8 text-[#70736e] sm:text-[1.05rem]">
                  {activeSeason.description}
                </p>

                <div className="mt-9 flex items-center gap-5">
                  <span className="font-editorial text-3xl font-semibold text-[#234D42]">
                    {activeSeason.number}
                  </span>
                  <div className="h-px w-16 bg-[#b67a43]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#959a94]">
                    04 mùa
                  </span>
                </div>

                <p className="mt-7 text-sm italic text-[#8a8e88]">
                  Chạm vào tấm ảnh phía trước để khám phá mùa tiếp theo.
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative z-0 mx-auto h-[500px] w-full max-w-[720px] sm:h-[620px] lg:h-[680px]">
            <div
              className="pointer-events-none absolute bottom-[3%] left-[8%] h-28 w-[82%] rounded-[50%] bg-[#234D42]/20 blur-3xl"
              aria-hidden="true"
            />

            {seasons.map((season, index) => {
              const depth =
                (index - activeIndex + seasons.length) % seasons.length;
              const isActive = depth === 0;

              return (
                <motion.button
                  key={season.name}
                  type="button"
                  onClick={showNextSeason}
                  disabled={!isActive}
                  tabIndex={isActive ? 0 : -1}
                  aria-label={
                    isActive
                      ? `Chuyển từ ${season.name} sang ${nextSeason.name}`
                      : `${season.name} đang nằm phía sau`
                  }
                  initial={false}
                  animate={{
                    x: `${depth * 22}%`,
                    y: depth * 18,
                    rotate: depth === 0 ? -2 : depth * 3,
                    scale: 1 - depth * 0.045,
                    opacity: 1 - depth * 0.07,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 145,
                    damping: 22,
                    mass: 0.9,
                  }}
                  whileHover={
                    !reduceMotion && isActive
                      ? {
                        y: -8,
                        scale: 1.015,
                      }
                      : undefined
                  }
                  whileTap={
                    !reduceMotion && isActive
                      ? {
                        scale: 0.985,
                      }
                      : undefined
                  }
                  className={[
                    "group absolute left-[1%] top-[3%] w-[58%] min-w-[220px] rounded-[4px] text-left outline-none",
                    "focus-visible:ring-2 focus-visible:ring-[#b67a43] focus-visible:ring-offset-4",
                    isActive ? "cursor-pointer" : "cursor-default",
                  ].join(" ")}
                  style={{
                    zIndex: 20 - depth,
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                >
                  <span
                    className={[
                      "block rounded-[4px] bg-[#fdfcf9] p-2.5 pb-4 transition-shadow duration-500 sm:p-3 sm:pb-5",
                      isActive
                        ? "shadow-[0_32px_80px_rgba(19,52,43,0.28)]"
                        : "shadow-[0_22px_55px_rgba(19,52,43,0.18)]",
                    ].join(" ")}
                  >
                    <span className="relative block aspect-[4/5] overflow-hidden bg-[#d8d0c3]">
                      <Image
                        src={season.image}
                        alt={season.alt}
                        fill
                        sizes="(max-width: 639px) 58vw, (max-width: 1023px) 390px, 420px"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transform-none"
                        priority={index === 0}
                      />

                      <span
                        className="absolute inset-0 bg-gradient-to-t from-[#234D42]/55 via-transparent to-black/5"
                        aria-hidden="true"
                      />

                      <span className="absolute right-3 top-3 rounded-full border border-white/40 bg-[#234D42]/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                        {season.shortName}
                      </span>

                      <span className="absolute bottom-4 left-4 right-4 block text-white">
                        <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#f3d3a4]">
                          The Serene Villa
                        </span>
                        <span className="font-editorial mt-1 block text-xl font-semibold sm:text-2xl">
                          {season.name}
                        </span>
                      </span>
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

const sereneMoments = [
  {
    number: "01",
    time: "Buổi sáng",
    title: "Thức dậy trong ánh sáng dịu nhẹ",
    description:
      "Bắt đầu ngày mới bằng không khí trong lành, một tách đồ uống ấm và khoảng thời gian không cần vội.",
    image: "/images/seasons/serene-morning.webp",
    alt: "Không gian mùa xuân trong trẻo vào buổi sáng tại The Serene Villa",
  },
  {
    number: "02",
    time: "Buổi chiều",
    title: "Dành thời gian cho những điều mình thích",
    description:
      "Đọc sách, nghỉ bên hiên, đi dạo giữa khoảng xanh hoặc đơn giản là tận hưởng sự yên tĩnh.",
    image: "/images/seasons/serene-afternoon.webp",
    alt: "Khung cảnh mùa hạ ngập nắng vào buổi chiều tại The Serene Villa",
  },
  {
    number: "03",
    time: "Buổi tối",
    title: "Khép lại một ngày trong sự ấm áp",
    description:
      "Ánh đèn dịu, căn phòng riêng tư và một nhịp sống chậm giúp bạn thật sự thư giãn trước khi nghỉ ngơi.",
    image: "/images/seasons/serene-evenings.webp",
    alt: "Không gian mùa thu ấm áp khi ngày dần khép lại tại The Serene Villa",
  },
] as const;

const sereneMomentContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const sereneMomentVariants = {
  hidden: {
    opacity: 0,
    y: 42,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

function SereneDayExperience() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[#F8F5EF] py-16 sm:py-20 lg:py-24">
      <motion.div
        aria-hidden="true"
        animate={
          reduceMotion
            ? undefined
            : {
              y: [0, -14, 0],
              rotate: [0, 2, 0],
            }
        }
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -right-40 top-10 h-[30rem] w-[30rem] rounded-full border border-secondary/10"
      />

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{
            duration: reduceMotion ? 0.2 : 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="grid gap-6 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] lg:items-end"
        >
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-brand-orange" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-orange">
                Nhịp sống tại The Serene Villa
              </p>
            </div>

            <h2 className="font-editorial mt-5 max-w-2xl text-4xl font-semibold leading-[1.06] tracking-[-0.02em] text-secondary sm:text-5xl">
              Một ngày không cần bắt đầu bằng sự vội vàng.
            </h2>
          </div>

          <p className="max-w-xl text-base leading-8 text-on-surface-variant lg:justify-self-end">
            Mỗi khoảng thời gian tại The Serene Villa đều dành cho một nhịp nghỉ
            nhẹ nhàng hơn — từ buổi sáng trong trẻo đến những phút cuối ngày
            thật yên tĩnh.
          </p>
        </motion.div>

        <div className="relative mt-11">
          <motion.div
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: reduceMotion ? 0.2 : 1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute left-[12%] right-[12%] top-6 hidden h-px origin-left bg-gradient-to-r from-brand-orange/15 via-brand-orange/65 to-brand-orange/15 md:block"
          />

          <motion.div
            variants={sereneMomentContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="relative grid gap-5 md:grid-cols-3"
          >
            {sereneMoments.map((moment) => (
              <motion.article
                key={moment.time}
                variants={sereneMomentVariants}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                      y: -7,
                      transition: { duration: 0.25 },
                    }
                }
                className="group relative overflow-hidden rounded-[22px] border border-outline-variant bg-white shadow-[0_14px_34px_rgba(63,51,35,0.07)]"
              >
                <span className="absolute left-1/2 top-2 z-20 hidden h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-4 border-[#F8F5EF] bg-secondary font-display text-[10px] font-bold text-white shadow-sm md:flex">
                  {moment.number}
                </span>

                <div className="relative aspect-[4/3] overflow-hidden bg-[#ddd5c9]">
                  <motion.div
                    className="absolute inset-0"
                    whileHover={reduceMotion ? undefined : { scale: 1.045 }}
                    transition={{
                      duration: 0.75,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Image
                      src={moment.image}
                      alt={moment.alt}
                      fill
                      sizes="(max-width: 767px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </motion.div>

                  <div className="absolute inset-0 bg-gradient-to-t from-[#234D42]/65 via-[#234D42]/5 to-transparent" />

                  <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-[#234D42]/65 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md transition-colors duration-300 group-hover:bg-brand-orange/85">
                    {moment.time}
                  </span>

                  <span className="absolute bottom-4 right-4 font-editorial text-3xl font-semibold text-white/85 md:hidden">
                    {moment.number}
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-orange">
                    Khoảnh khắc {moment.number}
                  </p>

                  <h3 className="font-editorial mt-2 text-2xl font-semibold leading-tight text-secondary">
                    {moment.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                    {moment.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const sereneAfterglow = [
  {
    number: "01",
    eyebrow: "Một giấc ngủ sâu hơn",
    title: "Sự yên tĩnh còn ở lại",
    quote:
      "Không gian đủ tĩnh để cơ thể được nghỉ ngơi, tâm trí chậm lại và một ngày mới bắt đầu nhẹ nhàng hơn.",
    detail: "Giá trị của sự riêng tư",
  },
  {
    number: "02",
    eyebrow: "Một nhịp sống chậm hơn",
    title: "Thời gian được cảm nhận trọn vẹn",
    quote:
      "Không cần chạy theo lịch trình dày đặc. Bạn có thể đọc một trang sách lâu hơn, ngắm ánh sáng đổi màu và tận hưởng từng khoảng lặng.",
    detail: "Giá trị của thiên nhiên",
  },
  {
    number: "03",
    eyebrow: "Một cảm giác được tôn trọng",
    title: "Chăm sóc không đồng nghĩa với làm phiền",
    quote:
      "Luôn có người sẵn sàng khi cần, nhưng khoảng riêng của bạn vẫn được giữ nguyên trong suốt kỳ lưu trú.",
    detail: "Giá trị của sự đồng hành",
  },
] as const;

const afterglowVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 72 : -72,
    scale: 0.96,
    filter: "blur(7px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -56 : 56,
    scale: 0.97,
    filter: "blur(5px)",
  }),
};

const reducedAfterglowVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

function GuestStoriesSection() {
  const [activeStory, setActiveStory] = useState(0);
  const [storyDirection, setStoryDirection] = useState(1);
  const reduceMotion = useReducedMotion();

  const activeItem = sereneAfterglow[activeStory];

  const changeStory = (step: number) => {
    setStoryDirection(step);
    setActiveStory(
      (currentStory) =>
        (currentStory + step + sereneAfterglow.length) % sereneAfterglow.length,
    );
  };

  const selectStory = (nextIndex: number) => {
    if (nextIndex === activeStory) return;
    setStoryDirection(nextIndex > activeStory ? 1 : -1);
    setActiveStory(nextIndex);
  };

  return (
    <section className="relative isolate overflow-hidden bg-secondary py-16 text-white sm:py-20 lg:py-24">
      <motion.span
        aria-hidden="true"
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute right-[5%] top-6 font-editorial text-[14rem] leading-none text-white/[0.035] sm:text-[20rem]"
      >
        “
      </motion.span>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-28 h-[34rem] w-[34rem] rounded-full border border-primary-fixed/10"
      />

      <div className="relative mx-auto grid max-w-[1400px] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] lg:items-center lg:gap-16">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -34 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{
            duration: reduceMotion ? 0.2 : 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="max-w-xl"
        >
          <p className="eyebrow text-primary-fixed">Dư âm sau kỳ nghỉ</p>

          <h2 className="font-editorial mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-white sm:text-5xl">
            Những điều chúng tôi mong bạn mang theo khi rời The Serene Villa.
          </h2>

          <p className="mt-5 text-base leading-8 text-white/68">
            Không chỉ là những bức ảnh đẹp, giá trị của một kỳ nghỉ nằm ở cảm
            giác còn ở lại: ngủ sâu hơn, sống chậm hơn và được tôn trọng trong
            khoảng riêng của mình.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => changeStory(-1)}
              className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/[0.04] text-white transition-[background-color,border-color,transform] hover:-translate-x-0.5 hover:border-primary-fixed/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-fixed"
              aria-label="Xem nội dung trước"
            >
              <ChevronIcon className="h-5 w-5 rotate-180 stroke-[2.2] transition-transform group-hover:-translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={() => changeStory(1)}
              className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/[0.04] text-white transition-[background-color,border-color,transform] hover:translate-x-0.5 hover:border-primary-fixed/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-fixed"
              aria-label="Xem nội dung tiếp theo"
            >
              <ChevronIcon className="h-5 w-5 stroke-[2.2] transition-transform group-hover:translate-x-0.5" />
            </button>

            <div
              className="ml-2 flex items-center gap-2"
              aria-label="Chọn nội dung"
            >
              {sereneAfterglow.map((item, index) => (
                <button
                  key={item.number}
                  type="button"
                  onClick={() => selectStory(index)}
                  aria-label={`Xem nội dung ${index + 1}`}
                  aria-current={index === activeStory ? "true" : undefined}
                  className={[
                    "h-2 rounded-full transition-[width,background-color] duration-300",
                    index === activeStory
                      ? "w-8 bg-primary-fixed"
                      : "w-2 bg-white/25 hover:bg-white/45",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>
        </motion.div>

        <div className="relative min-h-[390px] sm:min-h-[410px]">
          {[2, 1].map((offset) => {
            const previewIndex =
              (activeStory + offset) % sereneAfterglow.length;
            const preview = sereneAfterglow[previewIndex];

            return (
              <motion.div
                key={`${preview.number}-${offset}`}
                aria-hidden="true"
                animate={{
                  x: offset === 1 ? 24 : 44,
                  y: offset === 1 ? 22 : 42,
                  rotate: offset === 1 ? 1.8 : 3.4,
                  scale: offset === 1 ? 0.97 : 0.94,
                  opacity: offset === 1 ? 0.55 : 0.28,
                }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 24,
                }}
                className="pointer-events-none absolute inset-0 hidden rounded-[26px] border border-white/12 bg-[#23493f] p-8 sm:block"
                style={{ zIndex: 3 - offset }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-fixed/65">
                  {preview.eyebrow}
                </p>
              </motion.div>
            );
          })}

          <AnimatePresence initial={false} mode="wait" custom={storyDirection}>
            <motion.article
              key={activeItem.number}
              custom={storyDirection}
              variants={
                reduceMotion ? reducedAfterglowVariants : afterglowVariants
              }
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: reduceMotion ? 0.18 : 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              drag={reduceMotion ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.16}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70) changeStory(1);
                if (info.offset.x > 70) changeStory(-1);
              }}
              className="absolute inset-0 z-10 flex cursor-grab flex-col overflow-hidden rounded-[26px] border border-white/14 bg-white p-7 text-on-surface shadow-[0_30px_80px_rgba(0,0,0,0.22)] active:cursor-grabbing sm:p-9"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-6">
                <span className="font-editorial text-7xl leading-[0.75] text-brand-orange/35">
                  “
                </span>

                <span className="font-editorial text-4xl font-semibold text-[#ded5c8]">
                  {activeItem.number}
                </span>
              </div>

              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
                {activeItem.eyebrow}
              </p>

              <h3 className="font-editorial mt-3 text-3xl font-semibold leading-tight text-secondary sm:text-[2.15rem]">
                {activeItem.title}
              </h3>

              <blockquote className="mt-5 text-base leading-8 text-on-surface-variant sm:text-[1.05rem]">
                {activeItem.quote}
              </blockquote>

              <div className="mt-auto flex items-center justify-between gap-4 border-t border-outline-variant pt-5">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                  {activeItem.detail}
                </p>

                <span className="text-xs text-on-surface-variant">
                  Kéo để chuyển
                </span>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function EquipmentShowcase() {
  const { locale, localizedHref } = useI18n();
  const copy = homeCopy[locale];

  return (
    <section
      id="equipment"
      className="scroll-mt-20 bg-[#EFEAE1] pb-20 pt-14 sm:pb-24 sm:pt-20"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-8 border-b border-outline-variant pb-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="eyebrow text-brand-orange">{copy.amenitiesEyebrow}</p>
            <h2 className="font-editorial mt-3 max-w-2xl text-4xl font-semibold leading-[1.08] text-secondary sm:text-5xl">
              {copy.amenitiesTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">
              {copy.amenitiesDescription}
            </p>
          </div>

          <div className="flex items-center gap-4 lg:justify-end">
            <p className="hidden max-w-44 text-right text-xs leading-5 text-on-surface-variant sm:block">
              {copy.amenitiesNote}
            </p>
            <span
              className="flex h-12 min-w-12 items-center justify-center rounded-full border border-outline bg-[#F7F3EC] px-3 font-display text-sm font-bold text-secondary"
              aria-label="6 nhóm tiện nghi chính"
            >
              06
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="max-w-xl text-sm leading-6 text-on-surface-variant">
            {copy.amenitiesSummary}
          </p>
          <Link
            href={localizedHref("/amenities")}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-outline bg-transparent px-5 font-display text-sm font-semibold text-secondary transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary motion-reduce:transform-none"
          >
            {copy.viewAmenities}
          </Link>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          {equipmentCategories.map((category) => (
            <article
              key={category.title}
              className={[
                "group relative overflow-hidden rounded-[20px] border p-6 sm:p-7",
                "transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out",
                "focus-within:ring-2 focus-within:ring-secondary/35",
                category.layout,
                category.featured
                  ? "border-secondary bg-secondary text-white shadow-[0_22px_50px_rgba(20,57,47,0.18)] hover:-translate-y-0.5 hover:bg-[#173B32]"
                  : "border-outline-variant bg-white/90 shadow-[0_12px_30px_rgba(63,51,35,0.06)] hover:-translate-y-0.5 hover:border-brand-orange/50 hover:bg-[#FFFEFB] hover:shadow-[0_18px_36px_rgba(63,51,35,0.09)]",
              ].join(" ")}
            >
              {category.featured && (
                <div
                  aria-hidden
                  className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-white/10"
                />
              )}
              <div
                className={[
                  "relative mb-6 flex h-11 w-11 items-center justify-center rounded-full",
                  "transition-[background-color,color,transform] duration-200 group-hover:scale-105 motion-reduce:transform-none",
                  category.featured
                    ? "bg-white/12 text-primary-fixed"
                    : "bg-primary-container text-brand-orange group-hover:bg-brand-orange group-hover:text-white",
                ].join(" ")}
              >
                <Icon name={category.icon} />
              </div>
              <p
                className={
                  category.featured
                    ? "relative text-xs font-semibold uppercase tracking-[0.16em] text-primary-fixed"
                    : "text-xs font-semibold uppercase tracking-[0.16em] text-brand-orange"
                }
              >
                {category.eyebrow}
              </p>
              <h3
                className={
                  category.featured
                    ? "relative mt-3 font-editorial text-3xl font-semibold leading-tight text-white sm:text-[2rem]"
                    : "mt-3 font-editorial text-2xl font-semibold leading-tight text-secondary"
                }
              >
                {category.title}
              </h3>
              <p
                className={
                  category.featured
                    ? "relative mt-3 max-w-lg text-sm leading-6 text-white/72"
                    : "mt-3 text-sm leading-6 text-on-surface-variant"
                }
              >
                {category.description}
              </p>
              <div
                className={
                  category.featured
                    ? "relative mt-6 flex flex-wrap gap-2 border-t border-white/15 pt-4"
                    : "mt-6 flex flex-wrap gap-2 border-t border-outline-variant pt-4"
                }
              >
                {category.items.map((item) => (
                  <span
                    key={item}
                    className={
                      category.featured
                        ? "rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/88"
                        : "rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface-variant"
                    }
                  >
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 border-l-2 border-brand-orange/55 pl-4 text-xs leading-5 text-on-surface-variant sm:text-sm">
          Tiện nghi riêng có thể khác theo từng hạng phòng. Vui lòng xem trang
          chi tiết phòng để kiểm tra danh sách chính xác trước khi đặt.
        </p>
      </div>
    </section>
  );
}

type QuickBookingState = {
  room: BookingRoom;
  initialDate?: string;
  initialEndDate?: string;
  initialStartTime?: string;
  initialDuration?: number;
  initialNote?: string;
};

export default function HomePage() {
  const router = useRouter();
  const { locale, localizedHref } = useI18n();
  const copy = homeCopy[locale];
  const {
    availabilityStatus,
    isLoading: isLiveDataLoading,
  } = useHomepageLiveData();
  const { rooms, isLoading: isRoomCatalogLoading } = usePublicRoomCatalog();
  const [availabilityHintVisible, setAvailabilityHintVisible] = useState(false);
  const [quickBooking, setQuickBooking] = useState<QuickBookingState | null>(
    null,
  );
  const topRatedCandidates = useMemo(() => getTopRatedRooms(rooms), [rooms]);
  const { rooms: topRatedRooms, isLoading: isTopRatedAvailabilityLoading } =
    useTodayRoomAvailability(topRatedCandidates);

  useEffect(() => {
    if (!shouldReopenQuickBooking(window.location.search)) return;

    const draft = readQuickBookingDraft();
    if (!draft) {
      window.history.replaceState(window.history.state, "", localizedHref("/"));
      return;
    }

    const draftRoom = draft.selectedRoom ?? draft.room;
    const restoredRoom =
      rooms.find((room) => room.id === draftRoom?.id) ?? draftRoom;

    if (restoredRoom) {
      setQuickBooking({
        room: restoredRoom,
        initialDate: draft.selectedDate ?? draft.initialDate,
        initialEndDate: draft.selectedEndDate ?? draft.initialEndDate,
        initialStartTime:
          draft.selectedStartTime ??
          draft.selectedSlot?.startTime ??
          draft.initialStartTime,
        initialDuration: draft.selectedDuration ?? draft.initialDuration,
        initialNote: draft.customerNote ?? draft.initialNote,
      });
    }

    window.history.replaceState(window.history.state, "", localizedHref("/"));
  }, [localizedHref, rooms]);

  const goToRooms = () => {
    router.push(localizedHref("/rooms"));
  };

  const handleAvailabilityBadgeClick = () => {
    if (availabilityStatus.status === "CLOSED") {
      setAvailabilityHintVisible(true);
      return;
    }

    goToRooms();
  };

  return (
    <main
      id="main-content"
      className="min-h-screen overflow-x-hidden bg-brand-bgGray text-on-surface"
    >
      <NewCustomerOfferModal />

      <section className="relative overflow-hidden bg-[#F7F3EB] pb-24 pt-7 sm:pb-28 sm:pt-10 lg:pb-32 lg:pt-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(63,70,64,0.13)_0.55px,transparent_0.55px)] [background-size:5px_5px]" />
        <div className="relative mx-auto max-w-[1460px] px-4 sm:px-8 lg:px-10">
          <div className="relative lg:grid lg:min-h-[610px] lg:grid-cols-[minmax(0,1.42fr)_minmax(390px,0.72fr)] lg:items-end">
            <figure className="relative min-h-[420px] overflow-hidden rounded-bl-[30px] rounded-tl-[30px] rounded-tr-[clamp(72px,12vw,190px)] bg-surface-container shadow-[0_30px_80px_rgba(37,48,42,0.13)] sm:min-h-[540px] lg:col-start-1 lg:row-start-1 lg:min-h-[610px]">
              <Image
                src="/images/main.png"
                alt={copy.heroAlt}
                fill
                priority
                quality={94}
                sizes="(min-width: 1024px) 68vw, 100vw"
                className="object-cover object-[62%_center]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(37,36,29,0.18),transparent_44%,rgba(255,255,255,0.04))]" />
              <figcaption className="absolute bottom-5 left-5 rounded-xl bg-[#FBF8F2]/92 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary shadow-[0_14px_34px_rgba(32,42,37,0.1)] backdrop-blur-md sm:bottom-7 sm:left-7">
                The Serene Villa <span className="mx-2 text-brand-orange">·</span> Hà Nội
              </figcaption>
            </figure>

            <article className="relative z-10 -mt-9 rounded-tl-[44px] rounded-tr-[18px] bg-[#FFFDFC]/96 px-6 pb-7 pt-9 shadow-[0_28px_70px_rgba(40,50,44,0.13)] sm:mx-7 sm:-mt-14 sm:px-10 sm:pb-9 sm:pt-11 lg:col-start-2 lg:row-start-1 lg:mx-0 lg:mb-8 lg:-ml-24 lg:mt-0 lg:min-h-[430px] lg:rounded-tl-[58px] lg:rounded-tr-[22px] lg:px-12 lg:pb-10 lg:pt-12">
              <p className="eyebrow text-brand-orange">
                {locale === "vi" ? "Một địa chỉ để chậm lại" : "An address for slowing down"}
              </p>
              <h1 className="font-editorial mt-5 text-[3.25rem] font-medium leading-[0.9] tracking-[-0.045em] text-secondary sm:text-[4.5rem] lg:text-[5rem]">
                {copy.heroTitleLine1}
                <span className="mt-1 block">{copy.heroTitleLine2}</span>
              </h1>
              <p className="mt-6 max-w-md text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8">
                {copy.heroDescription}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4 border-b border-outline-variant pb-6">
                <Link
                  href="#top-rated-rooms"
                  className="group inline-flex min-h-11 items-center gap-3 border-b border-secondary/55 font-display text-sm font-semibold text-secondary"
                >
                  {locale === "vi" ? "Xem phòng được yêu thích" : "View guest favourites"}
                  <span aria-hidden className="transition-transform group-hover:translate-y-0.5">↓</span>
                </Link>
                <button
                  type="button"
                  onClick={handleAvailabilityBadgeClick}
                  className={getAvailabilityBadgeClassName(availabilityStatus.tone)}
                  aria-live="polite"
                >
                  <span className={getAvailabilityDotClassName(availabilityStatus.tone)} />
                  <span>{isLiveDataLoading ? copy.loadingAvailability : availabilityStatus.label}</span>
                </button>
              </div>

              {availabilityHintVisible && availabilityStatus.status === "CLOSED" && (
                <p className="mt-4 max-w-md text-xs leading-6 text-on-surface-variant">
                  {copy.closedHint}
                </p>
              )}
            </article>

            <div aria-hidden="true" className="absolute right-1 top-6 hidden h-[82%] flex-col items-center gap-5 text-brand-orange lg:flex">
              <span className="font-editorial text-2xl text-secondary">01</span>
              <span className="h-20 w-px bg-brand-orange/45" />
              <span className="[writing-mode:vertical-rl] text-[10px] font-semibold uppercase tracking-[0.28em]">Arrival</span>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-20 mx-auto -mt-16 w-full max-w-[1340px] px-4 sm:-mt-20 sm:px-8 lg:-mt-24">
        <StaySearchBar />
      </div>

      <SereneExperience />

      <TopRatedRoomsSection
        rooms={topRatedRooms}
        isLoading={isRoomCatalogLoading || isTopRatedAvailabilityLoading}
        onOpenDetail={(room) => router.push(localizedHref(`/rooms/${room.id}`))}
        onBook={(room) => setQuickBooking({ room })}
      />

      <section
        id="about"
        className="relative isolate scroll-mt-24 overflow-hidden bg-[#EFEAE1] py-16 sm:py-20 lg:py-24"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full border border-secondary/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 left-[42%] h-[26rem] w-[26rem] rounded-full border border-brand-orange/10"
        />

        <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end lg:gap-12">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-brand-orange" />
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-orange">
                  Giá trị The Serene Villa
                </p>
              </div>

              <h2 className="font-editorial mt-5 max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-0.025em] text-secondary sm:text-5xl lg:text-[3.45rem]">
                Một khoảng nghỉ{" "}
                <span className="relative inline-block text-brand-orange">
                  đủ riêng
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-[6px] w-full rounded-full bg-brand-orange/15"
                  />
                </span>{" "}
                để bạn trở về với nhịp của mình.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-on-surface-variant sm:text-[1.05rem]">
                The Serene Villa mang đến không gian yên tĩnh, gần gũi với thiên
                nhiên và được chăm sóc vừa đủ, để mỗi vị khách có thể nghỉ ngơi
                theo cách riêng mà không bị làm phiền.
              </p>
            </div>

            <aside className="relative overflow-hidden rounded-[24px] bg-secondary p-6 text-white shadow-[0_24px_58px_rgba(20,57,47,0.2)] sm:p-7">
              <div
                aria-hidden="true"
                className="absolute -right-14 -top-14 h-40 w-40 rounded-full border border-white/10"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-16 -left-12 h-36 w-36 rounded-full border border-primary-fixed/15"
              />

              <div className="relative">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-fixed">
                  The Serene Way
                </p>

                <p className="font-editorial mt-4 text-2xl font-semibold leading-snug text-white sm:text-[1.75rem]">
                  Đủ gần khi bạn cần,
                  <span className="block text-primary-fixed">
                    đủ riêng khi bạn muốn.
                  </span>
                </p>

                <p className="mt-4 text-sm leading-6 text-white/68">
                  Một cách đón tiếp tôn trọng sự riêng tư và nhịp nghỉ của từng
                  vị khách.
                </p>

                <Link
                  href={localizedHref("/amenities")}
                  className="group mt-6 inline-flex items-center gap-2 font-display text-sm font-semibold text-white transition-colors hover:text-primary-fixed"
                >
                  Khám phá trải nghiệm
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </div>
            </aside>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            <article className="group rounded-[20px] border border-outline-variant bg-white/78 p-5 shadow-[0_12px_30px_rgba(63,51,35,0.055)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-brand-orange/35 hover:shadow-[0_18px_38px_rgba(63,51,35,0.09)] sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-brand-orange transition-colors duration-200 group-hover:bg-brand-orange group-hover:text-white">
                  <Icon name="bed" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-orange">
                    01 · Không gian
                  </p>
                  <h3 className="font-editorial mt-2 text-2xl font-semibold leading-tight text-secondary">
                    Riêng tư để thật sự nghỉ ngơi
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                    Không gian đủ tĩnh để bạn ngủ sâu, thư giãn và tận hưởng
                    thời gian theo cách của riêng mình.
                  </p>
                </div>
              </div>
            </article>

            <article className="group rounded-[20px] border border-outline-variant bg-white/78 p-5 shadow-[0_12px_30px_rgba(63,51,35,0.055)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-brand-orange/35 hover:shadow-[0_18px_38px_rgba(63,51,35,0.09)] sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-brand-orange transition-colors duration-200 group-hover:bg-brand-orange group-hover:text-white">
                  <Icon name="amenities" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-orange">
                    02 · Thiên nhiên
                  </p>
                  <h3 className="font-editorial mt-2 text-2xl font-semibold leading-tight text-secondary">
                    Gần hơn với những nhịp điệu tự nhiên
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                    Ánh sáng, khoảng xanh và không khí dễ chịu hiện diện trong
                    từng buổi sáng và mỗi khoảng nghỉ.
                  </p>
                </div>
              </div>
            </article>

            <article className="group rounded-[20px] border border-outline-variant bg-white/78 p-5 shadow-[0_12px_30px_rgba(63,51,35,0.055)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-brand-orange/35 hover:shadow-[0_18px_38px_rgba(63,51,35,0.09)] sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-brand-orange transition-colors duration-200 group-hover:bg-brand-orange group-hover:text-white">
                  <Icon name="users" className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-orange">
                    03 · Đồng hành
                  </p>
                  <h3 className="font-editorial mt-2 text-2xl font-semibold leading-tight text-secondary">
                    Chăm sóc vừa đủ, không làm phiền
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                    Đội ngũ luôn sẵn sàng khi bạn cần và lùi lại khi bạn muốn
                    giữ trọn khoảng riêng.
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div className="mt-7 flex flex-col justify-between gap-4 border-t border-outline-variant pt-6 sm:flex-row sm:items-center">
            <p className="max-w-2xl text-sm leading-6 text-on-surface-variant">
              Tiện nghi cụ thể được trình bày tại từng hạng phòng và trang tiện
              nghi, giúp bạn kiểm tra đầy đủ trước khi lựa chọn.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={localizedHref("/amenities")}
                className="inline-flex h-11 items-center justify-center rounded-full border border-outline bg-transparent px-5 font-display text-sm font-semibold text-secondary transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-white"
              >
                Xem toàn bộ tiện nghi
              </Link>

              <Link
                href={localizedHref("/about")}
                className="inline-flex h-11 items-center justify-center rounded-full bg-secondary px-5 font-display text-sm font-semibold text-white shadow-[0_12px_26px_rgba(23,58,49,0.15)] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-secondary-container"
              >
                Tìm hiểu về chúng tôi
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SereneDayExperience />

      <GuestStoriesSection />

      <section className="relative overflow-hidden border-y border-outline-variant bg-[#F8F5EF] py-14 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full border border-secondary/8"
        />

        <div className="relative mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-7 px-5 sm:px-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="eyebrow text-brand-orange">Kỳ nghỉ của bạn</p>

            <h2 className="font-editorial mt-3 text-4xl font-semibold tracking-[-0.02em] text-secondary sm:text-5xl">
              Chọn một căn phòng phù hợp với nhịp nghỉ của bạn.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-on-surface-variant sm:text-base">
              Xem lịch trống, so sánh các hạng phòng và bắt đầu hành trình tại
              The Serene Villa chỉ trong vài bước.
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <Link
              href={localizedHref("/rooms")}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-secondary px-6 font-display text-sm font-semibold text-white shadow-[0_14px_32px_rgba(23,58,49,0.16)] transition-all hover:-translate-y-0.5 hover:bg-secondary-container sm:flex-none"
            >
              Kiểm tra phòng trống
            </Link>

            <Link
              href={localizedHref("/support")}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-outline bg-transparent px-6 font-display text-sm font-semibold text-secondary transition-[border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-orange hover:text-brand-orange sm:flex-none"
            >
              Nhận tư vấn
            </Link>
          </div>
        </div>
      </section>

      {quickBooking && (
        <BookingQuickModal
          room={quickBooking.room}
          open
          initialDate={quickBooking.initialDate}
          initialEndDate={quickBooking.initialEndDate}
          initialStartTime={quickBooking.initialStartTime}
          initialDuration={quickBooking.initialDuration}
          initialNote={quickBooking.initialNote}
          sourceRoute="/"
          returnPath="/"
          onClose={() => setQuickBooking(null)}
        />
      )}
    </main>
  );
}
