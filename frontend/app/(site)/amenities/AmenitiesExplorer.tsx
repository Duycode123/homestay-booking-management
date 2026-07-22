"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";

type AmenityIcon =
    "rest" | "climate" | "bathroom" | "connection" | "daily" | "arrival";

type AmenityGroup = {
    id: string;
    number: string;
    label: string;
    title: string;
    description: string;
    items: readonly string[];
    note: string;
    icon: AmenityIcon;
};

const amenityGroupsByLocale: Record<"vi" | "en", readonly AmenityGroup[]> = {
    vi: [
    {
        id: "rest",
        number: "01",
        label: "Giấc ngủ",
        title: "Không gian để cơ thể thật sự được nghỉ ngơi",
        description:
            "Phòng được bố trí theo hướng yên tĩnh, riêng tư và hạn chế những yếu tố làm gián đoạn khoảng thời gian nghỉ của bạn.",
        items: [
            "Giường, chăn và gối được chuẩn bị trước mỗi lượt khách",
            "Không gian riêng tư theo từng hạng phòng",
            "Ổ điện thuận tiện tại khu vực nghỉ",
            "Khu vực để hành lý gọn gàng",
        ],
        note: "Cấu hình giường và diện tích thay đổi theo từng hạng phòng.",
        icon: "rest" as AmenityIcon,
    },
    {
        id: "climate",
        number: "02",
        label: "Không khí phòng",
        title: "Nhiệt độ dễ chịu trong suốt kỳ lưu trú",
        description:
            "Thiết bị làm mát và thông khí được kiểm tra để căn phòng luôn thoải mái khi bạn trở về nghỉ ngơi.",
        items: [
            "Điều hòa điều khiển riêng",
            "Khả năng làm mát phù hợp diện tích phòng",
            "Kiểm tra vận hành trước check-in",
            "Vệ sinh và bảo trì theo quy trình",
        ],
        note: "Hướng dẫn sử dụng thiết bị được cung cấp tại phòng khi cần.",
        icon: "climate" as AmenityIcon,
    },
    {
        id: "bathroom",
        number: "03",
        label: "Phòng tắm",
        title: "Khoảng thư giãn riêng sau một ngày dài",
        description:
            "Phòng tắm được chuẩn bị sạch sẽ, gọn gàng và có những vật dụng cơ bản cần thiết cho kỳ lưu trú.",
        items: [
            "Máy nước nóng",
            "Khăn tắm",
            "Đồ dùng cá nhân cơ bản",
            "Kiểm tra thiết bị và an toàn điện",
        ],
        note: "Danh sách vật dụng cụ thể được hiển thị tại trang chi tiết phòng.",
        icon: "bathroom" as AmenityIcon,
    },
    {
        id: "connection",
        number: "04",
        label: "Kết nối",
        title: "Kết nối khi cần, tạm rời màn hình khi muốn",
        description:
            "Bạn có thể duy trì công việc nhẹ, giải trí trong phòng hoặc dành trọn thời gian cho chính mình.",
        items: [
            "Wi‑Fi tốc độ cao",
            "Smart TV",
            "Kết nối giải trí trong phòng",
            "Không gian phù hợp cho công việc nhẹ",
        ],
        note: "Tốc độ kết nối thực tế có thể thay đổi theo thời điểm sử dụng.",
        icon: "connection" as AmenityIcon,
    },
    {
        id: "daily",
        number: "05",
        label: "Sinh hoạt",
        title: "Những tiện ích nhỏ giúp kỳ nghỉ nhẹ nhàng hơn",
        description:
            "Các vật dụng hằng ngày được sắp xếp gọn gàng để bạn không phải chuẩn bị quá nhiều trước chuyến đi.",
        items: [
            "Tủ lạnh mini",
            "Ấm đun nước",
            "Khu vực để hành lý",
            "Vật dụng sinh hoạt cơ bản",
        ],
        note: "Một số tiện ích có thể chỉ áp dụng cho hạng phòng cụ thể.",
        icon: "daily" as AmenityIcon,
    },
    {
        id: "arrival",
        number: "06",
        label: "Đón tiếp",
        title: "Mọi thứ sẵn sàng trước khi bạn mở cửa phòng",
        description:
            "Đội ngũ kiểm tra không gian, thiết bị và thông tin đặt chỗ trước thời điểm khách đến.",
        items: [
            "Kiểm tra vệ sinh phòng",
            "Kiểm tra thiết bị thiết yếu",
            "Đối chiếu thông tin đặt chỗ",
            "Tiếp nhận yêu cầu hỗ trợ trong kỳ lưu trú",
        ],
        note: "Các yêu cầu riêng cần được xác nhận trước để đội ngũ chuẩn bị.",
        icon: "arrival" as AmenityIcon,
    },
    ],
    en: [
        {
            id: "rest",
            number: "01",
            label: "Rest & sleep",
            title: "A space where your body can genuinely rest",
            description:
                "Each room is arranged for quiet and privacy, with fewer distractions during the time you set aside to slow down.",
            items: [
                "Bed, linen, and pillows prepared before every stay",
                "Private space shaped by each room tier",
                "Convenient outlets around the sleeping area",
                "A tidy place for luggage",
            ],
            note: "Bed configuration and room size vary by room tier.",
            icon: "rest",
        },
        {
            id: "climate",
            number: "02",
            label: "Room climate",
            title: "Comfortable temperatures throughout your stay",
            description:
                "Cooling and ventilation are checked so the room feels comfortable whenever you come back to rest.",
            items: [
                "Individually controlled air conditioning",
                "Cooling capacity suitable for the room size",
                "Operation checked before check-in",
                "Cleaning and maintenance follow a routine",
            ],
            note: "Instructions for room equipment are available whenever needed.",
            icon: "climate",
        },
        {
            id: "bathroom",
            number: "03",
            label: "Bathroom",
            title: "A private reset after a long day",
            description:
                "Bathrooms are kept clean, considered, and stocked with the essentials for a comfortable stay.",
            items: [
                "Hot-water system",
                "Bath towels",
                "Essential personal-care items",
                "Equipment and electrical-safety checks",
            ],
            note: "The exact list of room items is shown on each room detail page.",
            icon: "bathroom",
        },
        {
            id: "connection",
            number: "04",
            label: "Connection",
            title: "Stay connected when you need to, unplug when you want",
            description:
                "Work lightly, enjoy in-room entertainment, or simply reserve more time for yourself.",
            items: [
                "High-speed Wi-Fi",
                "Smart TV",
                "In-room entertainment connection",
                "A corner suited to light work",
            ],
            note: "Actual connection speed can vary by time of use.",
            icon: "connection",
        },
        {
            id: "daily",
            number: "05",
            label: "Everyday comfort",
            title: "Small comforts that make the stay feel lighter",
            description:
                "Useful everyday items are arranged with care, so you do not have to prepare too much before your trip.",
            items: [
                "Mini refrigerator",
                "Electric kettle",
                "A luggage area",
                "Essential daily items",
            ],
            note: "Some amenities are available only in selected room tiers.",
            icon: "daily",
        },
        {
            id: "arrival",
            number: "06",
            label: "Arrival",
            title: "Everything ready before you open the door",
            description:
                "Our team reviews the room, essential equipment, and reservation details before guests arrive.",
            items: [
                "Room-cleanliness check",
                "Essential-equipment check",
                "Reservation details confirmed",
                "Support requests received during the stay",
            ],
            note: "Special requests should be confirmed in advance so the team can prepare.",
            icon: "arrival",
        },
    ],
};

const explorerCopy = {
    vi: {
        eyebrow: "Tiện nghi trong phòng",
        count: "06 nhóm thiết yếu",
        title: "Tìm theo nhu cầu, không cần đọc một danh sách quá dài.",
        description:
            "Chọn từng nhóm để xem lợi ích, tiện nghi đi kèm và những lưu ý quan trọng trước khi đặt phòng.",
        navigationLabel: "Nhóm tiện nghi trong phòng",
        note: "Lưu ý:",
    },
    en: {
        eyebrow: "In-room amenities",
        count: "06 essential groups",
        title: "Explore by need, without reading through a long list.",
        description:
            "Choose a group to see its benefits, included amenities, and key details before reserving.",
        navigationLabel: "In-room amenity groups",
        note: "Please note:",
    },
} as const;

function AmenityIcon({
    name,
    className = "h-5 w-5",
}: {
    name: AmenityIcon;
    className?: string;
}) {
    const paths: Record<AmenityIcon, ReactNode> = {
        rest: (
            <>
                <path d="M3 18v-7M21 18v-5a3 3 0 0 0-3-3H9v8M3 14h18M6 10V7h5a3 3 0 0 1 3 3" />
            </>
        ),
        climate: (
            <>
                <path d="M4 7h16v10H4z" />
                <path d="M8 11h8M7 20c1.4-1.8 3.2-2.7 5-2.7s3.6.9 5 2.7" />
            </>
        ),
        bathroom: (
            <>
                <path d="M7 3v9M7 6h7a4 4 0 0 1 4 4v2" />
                <path d="M4 13h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Z" />
                <path d="M7 20v1M17 20v1" />
            </>
        ),
        connection: (
            <>
                <path d="M5 9a10 10 0 0 1 14 0M8 12a6 6 0 0 1 8 0M11 15a2 2 0 0 1 2 0" />
                <circle cx="12" cy="19" r="1" />
            </>
        ),
        daily: (
            <>
                <rect x="5" y="3" width="14" height="18" rx="2" />
                <path d="M5 11h14M9 7h1M9 15h1" />
            </>
        ),
        arrival: (
            <>
                <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />
                <path d="m8.5 12 2.2 2.2 4.8-5" />
            </>
        ),
    };

    return (
        <svg
            aria-hidden="true"
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {paths[name]}
        </svg>
    );
}

export default function AmenitiesExplorer() {
    const { locale } = useI18n();
    const amenityGroups = amenityGroupsByLocale[locale];
    const copy = explorerCopy[locale];
    const [activeIndex, setActiveIndex] = useState(0);
    const reduceMotion = useReducedMotion();
    const activeGroup = amenityGroups[activeIndex] ?? amenityGroups[0];

    return (
        <section
            id="amenity-list"
            className="scroll-mt-24 bg-[#F7F3EC] py-14 sm:py-16 lg:py-20"
        >
            <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
                <div className="grid gap-6 border-b border-outline-variant pb-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
                    <div>
                        <p className="eyebrow text-brand-orange">{copy.eyebrow}</p>
                        <p className="mt-3 font-editorial text-3xl font-semibold text-secondary">
                            {copy.count}
                        </p>
                    </div>

                    <div>
                        <h2 className="font-editorial max-w-3xl text-4xl font-semibold leading-[1.08] text-secondary sm:text-5xl">
                            {copy.title}
                        </h2>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base">
                            {copy.description}
                        </p>
                    </div>
                </div>

                <div className="mt-8 grid gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
                    <nav
                        aria-label={copy.navigationLabel}
                        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-8 sm:px-8 lg:mx-0 lg:block lg:overflow-visible lg:rounded-[22px] lg:border lg:border-outline-variant lg:bg-white/70 lg:p-2"
                    >
                        {amenityGroups.map((group, index) => {
                            const isActive = activeIndex === index;

                            return (
                                <button
                                    key={group.id}
                                    type="button"
                                    onClick={() => setActiveIndex(index)}
                                    aria-pressed={isActive}
                                    aria-controls="active-amenity-panel"
                                    className={[
                                        "group flex shrink-0 items-center gap-3 rounded-full border px-4 py-3 text-left transition-[background-color,border-color,color,transform] duration-200",
                                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
                                        "lg:mb-1 lg:w-full lg:rounded-[15px] lg:border-transparent lg:px-4 lg:py-3.5 lg:last:mb-0",
                                        isActive
                                            ? "border-secondary bg-secondary text-white shadow-[0_10px_24px_rgba(23,58,49,0.14)]"
                                            : "border-outline-variant bg-white text-secondary hover:-translate-y-0.5 hover:border-brand-orange/35 lg:bg-transparent lg:hover:translate-y-0 lg:hover:bg-[#F7F3EC]",
                                    ].join(" ")}
                                >
                                    <span
                                        className={[
                                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                                            isActive
                                                ? "bg-white/12 text-primary-fixed"
                                                : "bg-primary-container text-brand-orange",
                                        ].join(" ")}
                                    >
                                        <AmenityIcon
                                            name={group.icon}
                                            className="h-[18px] w-[18px]"
                                        />
                                    </span>

                                    <span>
                                        <span
                                            className={[
                                                "block text-[9px] font-semibold uppercase tracking-[0.16em]",
                                                isActive ? "text-primary-fixed" : "text-brand-orange",
                                            ].join(" ")}
                                        >
                                            {group.number}
                                        </span>
                                        <span className="mt-0.5 block whitespace-nowrap font-display text-sm font-semibold">
                                            {group.label}
                                        </span>
                                    </span>

                                    <span
                                        aria-hidden="true"
                                        className={[
                                            "ml-auto hidden text-lg transition-transform lg:block",
                                            isActive
                                                ? "translate-x-0 text-primary-fixed"
                                                : "-translate-x-1 text-outline group-hover:translate-x-0",
                                        ].join(" ")}
                                    >
                                        →
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    <div
                        id="active-amenity-panel"
                        className="relative min-h-[420px] overflow-hidden rounded-[24px] border border-outline-variant bg-white shadow-[0_18px_46px_rgba(63,51,35,0.075)]"
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-secondary/8"
                        />

                        <AnimatePresence mode="wait" initial={false}>
                            <motion.article
                                key={activeGroup.id}
                                initial={
                                    reduceMotion
                                        ? { opacity: 0 }
                                        : { opacity: 0, x: 28, filter: "blur(6px)" }
                                }
                                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                exit={
                                    reduceMotion
                                        ? { opacity: 0 }
                                        : { opacity: 0, x: -20, filter: "blur(4px)" }
                                }
                                transition={{
                                    duration: reduceMotion ? 0.15 : 0.38,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="relative flex min-h-[420px] flex-col p-6 sm:p-8 lg:p-9"
                            >
                                <div className="flex items-start justify-between gap-5">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-brand-orange">
                                        <AmenityIcon name={activeGroup.icon} />
                                    </span>

                                    <span className="font-editorial text-5xl font-semibold text-[#E2D9CC]">
                                        {activeGroup.number}
                                    </span>
                                </div>

                                <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
                                    {activeGroup.label}
                                </p>

                                <h3 className="font-editorial mt-3 max-w-3xl text-3xl font-semibold leading-tight text-secondary sm:text-[2.35rem]">
                                    {activeGroup.title}
                                </h3>

                                <p className="mt-4 max-w-3xl text-sm leading-7 text-on-surface-variant sm:text-base">
                                    {activeGroup.description}
                                </p>

                                <motion.ul
                                    key={`${activeGroup.id}-items`}
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: {},
                                        visible: {
                                            transition: {
                                                staggerChildren: reduceMotion ? 0 : 0.06,
                                                delayChildren: reduceMotion ? 0 : 0.08,
                                            },
                                        },
                                    }}
                                    className="mt-7 grid gap-3 sm:grid-cols-2"
                                >
                                    {activeGroup.items.map((item) => (
                                        <motion.li
                                            key={item}
                                            variants={{
                                                hidden: { opacity: 0, y: 10 },
                                                visible: {
                                                    opacity: 1,
                                                    y: 0,
                                                    transition: { duration: 0.28 },
                                                },
                                            }}
                                            className="flex items-start gap-3 rounded-[14px] border border-outline-variant bg-[#FAF8F4] px-4 py-3 text-sm leading-6 text-on-surface"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] text-white"
                                            >
                                                ✓
                                            </span>
                                            {item}
                                        </motion.li>
                                    ))}
                                </motion.ul>

                                <p className="mt-auto border-t border-outline-variant pt-5 text-xs leading-5 text-on-surface-variant">
                                    <span className="font-semibold text-secondary">{copy.note}</span>{" "}
                                    {activeGroup.note}
                                </p>
                            </motion.article>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
