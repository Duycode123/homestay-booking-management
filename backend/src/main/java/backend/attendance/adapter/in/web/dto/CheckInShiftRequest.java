package backend.attendance.adapter.in.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record CheckInShiftRequest(
        @NotNull(message = "Vĩ độ hiện tại không được để trống")
        @DecimalMin(value = "-90.0", message = "Vĩ độ không hợp lệ")
        @DecimalMax(value = "90.0", message = "Vĩ độ không hợp lệ")
        BigDecimal latitude,

        @NotNull(message = "Kinh độ hiện tại không được để trống")
        @DecimalMin(value = "-180.0", message = "Kinh độ không hợp lệ")
        @DecimalMax(value = "180.0", message = "Kinh độ không hợp lệ")
        BigDecimal longitude,

        @PositiveOrZero(message = "Độ chính xác GPS không hợp lệ")
        BigDecimal accuracyMeters
) {
}
