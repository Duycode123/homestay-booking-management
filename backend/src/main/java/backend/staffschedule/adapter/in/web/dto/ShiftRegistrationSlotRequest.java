package backend.staffschedule.adapter.in.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record ShiftRegistrationSlotRequest(
        @NotNull(message = "Ngay lam viec khong duoc de trong")
        LocalDate workDate,

        @NotNull(message = "Gio bat dau khong duoc de trong")
        LocalTime startTime,

        @NotNull(message = "Gio ket thuc khong duoc de trong")
        LocalTime endTime
) {
}
