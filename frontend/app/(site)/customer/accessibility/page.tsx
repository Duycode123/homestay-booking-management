"use client";

import { useState } from "react";
import {
  CustomerCard,
  CustomerPageHeader,
  CustomerPageShell,
} from "@/components/customer/CustomerPageShell";
import { useAccessibilitySettings } from "@/hooks/useAccessibilitySettings";
import type { AccessibilitySettings } from "@/lib/accessibility-settings-service";

type BooleanSettingKey =
  | "darkMode"
  | "highContrast"
  | "reducedMotion"
  | "enhancedFocus";

const fontOptions: Array<{
  value: AccessibilitySettings["fontSize"];
  label: string;
}> = [
  { value: "default", label: "Mặc định" },
  { value: "large", label: "Lớn" },
  { value: "extra-large", label: "Rất lớn" },
];

const accessCommitments = [
  "Hỗ trợ điều hướng bằng bàn phím",
  "Nút và ô nhập liệu có nhãn rõ ràng",
  "Trạng thái phòng có mô tả bằng chữ",
  "Giao diện hỗ trợ phóng to văn bản",
];

export default function CustomerAccessibilityPage() {
  const { settings, updateSetting, resetSettings, isLoaded } =
    useAccessibilitySettings();
  const [message, setMessage] = useState("");

  const handleToggle = (key: BooleanSettingKey, checked: boolean) => {
    updateSetting(key, checked);
    setMessage("");
  };

  const handleReset = () => {
    resetSettings();
    setMessage("Đã đặt lại cài đặt trợ năng.");
  };

  return (
    <CustomerPageShell>
      <CustomerPageHeader
        title="Màn hình và trợ năng"
        description="Tùy chỉnh cách hiển thị để sử dụng Homestay Booking thoải mái hơn."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <CustomerCard>
          <CardTitle
            title="Cài đặt hiển thị"
            description="Những lựa chọn ảnh hưởng đến màu nền, cỡ chữ và độ rõ của toàn bộ ứng dụng."
          />
          <div className="grid gap-4">
            <SettingSwitch
              id="dark-mode"
              label="Chế độ tối"
              description="Giảm độ sáng giao diện, phù hợp khi sử dụng trong môi trường ánh sáng yếu."
              checked={settings.darkMode}
              disabled={!isLoaded}
              onChange={(checked) => handleToggle("darkMode", checked)}
            />

            <FontSizeControl
              value={settings.fontSize}
              disabled={!isLoaded}
              onChange={(value) => {
                updateSetting("fontSize", value);
                setMessage("");
              }}
            />

            <SettingSwitch
              id="high-contrast"
              label="Độ tương phản cao"
              description="Tăng độ rõ giữa chữ, nền và đường viền."
              checked={settings.highContrast}
              disabled={!isLoaded}
              onChange={(checked) => handleToggle("highContrast", checked)}
            />
          </div>
        </CustomerCard>

        <CustomerCard>
          <CardTitle
            title="Trải nghiệm thao tác"
            description="Giảm hiệu ứng gây phân tâm và giúp vị trí focus dễ nhận biết hơn."
          />
          <div className="grid gap-4">
            <SettingSwitch
              id="reduced-motion"
              label="Giảm chuyển động"
              description="Giảm animation, hover scale và hiệu ứng chuyển cảnh."
              checked={settings.reducedMotion}
              disabled={!isLoaded}
              onChange={(checked) => handleToggle("reducedMotion", checked)}
            />

            <SettingSwitch
              id="enhanced-focus"
              label="Làm nổi bật vị trí đang chọn"
              description="Hiển thị viền rõ khi điều hướng bằng bàn phím."
              checked={settings.enhancedFocus}
              disabled={!isLoaded}
              onChange={(checked) => handleToggle("enhancedFocus", checked)}
            />
          </div>
        </CustomerCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <CustomerCard>
          <CardTitle
            title="Cam kết khả năng truy cập"
            description="Các tiêu chuẩn này được áp dụng trong code, không cần bật tắt riêng."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {accessCommitments.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] px-4 py-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFE8D6] font-display text-xs font-bold text-[#6B3200]">
                  ✓
                </span>
                <span className="text-sm font-semibold text-[#1A1C1E]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </CustomerCard>

        <CustomerCard>
          <CardTitle
            title="Đã lưu trên trình duyệt"
            description="Các cài đặt sẽ tự áp dụng lại khi bạn mở Homestay Booking lần sau."
          />
          <button
            type="button"
            onClick={handleReset}
            className="h-12 w-full rounded-2xl border border-[#C9C2B6] bg-white px-5 font-display text-sm font-semibold text-[#1A1C1E] transition hover:bg-[#FAF8F4] focus:outline-none focus:ring-2 focus:ring-[#FF7518]/30"
          >
            Đặt lại mặc định
          </button>
          <p
            aria-live="polite"
            className="mt-3 min-h-6 text-sm font-semibold text-[#0A4D27]"
          >
            {message}
          </p>
        </CustomerCard>
      </div>
    </CustomerPageShell>
  );
}

function CardTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-xl font-bold text-[#1A1C1E]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[#5C5348]">{description}</p>
    </div>
  );
}

function SettingSwitch({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl">
        <label
          htmlFor={id}
          className="font-display text-base font-bold text-[#1A1C1E]"
        >
          {label}
        </label>
        <p className="mt-1 text-sm leading-6 text-[#5C5348]">{description}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#6B3200]">
          Trạng thái: {checked ? "Đang bật" : "Đang tắt"}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-8 w-14 shrink-0 rounded-full border transition focus:outline-none focus:ring-2 focus:ring-[#FF7518]/40 disabled:cursor-not-allowed disabled:opacity-60",
          checked
            ? "border-[#FF7518] bg-[#FF7518]"
            : "border-[#C9C2B6] bg-white",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-6 w-6 rounded-full bg-white shadow-[0_2px_8px_rgba(26,28,30,0.18)] transition",
            checked ? "left-7" : "left-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function FontSizeControl({
  value,
  disabled,
  onChange,
}: {
  value: AccessibilitySettings["fontSize"];
  disabled?: boolean;
  onChange: (value: AccessibilitySettings["fontSize"]) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-[#E8E4DC] bg-[#FAF8F4] p-5">
      <legend className="font-display text-base font-bold text-[#1A1C1E]">
        Cỡ chữ
      </legend>
      <div
        className="mt-4 grid gap-3 sm:grid-cols-3"
        role="radiogroup"
        aria-label="Cỡ chữ"
      >
        {fontOptions.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={[
                "rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#FF7518]/40 disabled:cursor-not-allowed disabled:opacity-60",
                selected
                  ? "border-[#FF7518] bg-[#FFE8D6] text-[#6B3200]"
                  : "border-[#C9C2B6] bg-white text-[#1A1C1E] hover:bg-[#FFF7EF]",
              ].join(" ")}
            >
              <span className="block font-display text-sm font-bold">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
