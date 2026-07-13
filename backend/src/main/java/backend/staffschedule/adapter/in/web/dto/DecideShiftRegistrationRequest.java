package backend.staffschedule.adapter.in.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DecideShiftRegistrationRequest(
        @NotNull(message = "approved khong duoc de trong")
        Boolean approved,

        @Size(max = 500, message = "Ly do tu choi khong duoc vuot qua 500 ky tu")
        String rejectionReason
) {
}
