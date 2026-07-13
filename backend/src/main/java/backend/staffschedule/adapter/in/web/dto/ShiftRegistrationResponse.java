package backend.staffschedule.adapter.in.web.dto;

import backend.staffschedule.domain.model.ShiftRegistration;
import backend.staffschedule.domain.model.ShiftRegistrationStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record ShiftRegistrationResponse(
        Integer id,
        Integer staffId,
        String staffName,
        String staffEmail,
        LocalDate workDate,
        LocalTime startTime,
        LocalTime endTime,
        ShiftRegistrationStatus status,
        Integer reviewedByAccountId,
        LocalDateTime reviewedAt,
        String rejectionReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static ShiftRegistrationResponse from(ShiftRegistration registration) {
        return new ShiftRegistrationResponse(
                registration.id(),
                registration.staffId(),
                registration.staffName(),
                registration.staffEmail(),
                registration.workDate(),
                registration.startTime(),
                registration.endTime(),
                registration.status(),
                registration.reviewedByAccountId(),
                registration.reviewedAt(),
                registration.rejectionReason(),
                registration.createdAt(),
                registration.updatedAt()
        );
    }
}
