package backend.staffschedule.adapter.in.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record SubmitShiftRegistrationsRequest(
        @NotEmpty(message = "Danh sach ca dang ky khong duoc de trong")
        List<@Valid ShiftRegistrationSlotRequest> slots
) {
}
