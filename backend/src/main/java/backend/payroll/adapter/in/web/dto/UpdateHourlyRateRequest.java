package backend.payroll.adapter.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateHourlyRateRequest(
        @NotNull(message = "Luong theo gio khong duoc de trong")
        @DecimalMin(value = "0", message = "Luong theo gio phai lon hon hoac bang 0")
        BigDecimal hourlyRate
) {
}
