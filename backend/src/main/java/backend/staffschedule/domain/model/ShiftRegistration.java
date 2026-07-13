package backend.staffschedule.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record ShiftRegistration(
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

    public ShiftRegistration approve(Integer reviewerAccountId, LocalDateTime reviewedAt) {
        return withDecision(ShiftRegistrationStatus.APPROVED, reviewerAccountId, reviewedAt, null);
    }

    public ShiftRegistration reject(Integer reviewerAccountId, LocalDateTime reviewedAt, String reason) {
        return withDecision(ShiftRegistrationStatus.REJECTED, reviewerAccountId, reviewedAt, reason);
    }

    private ShiftRegistration withDecision(
            ShiftRegistrationStatus newStatus,
            Integer reviewerAccountId,
            LocalDateTime decisionTime,
            String reason
    ) {
        return new ShiftRegistration(
                id,
                staffId,
                staffName,
                staffEmail,
                workDate,
                startTime,
                endTime,
                newStatus,
                reviewerAccountId,
                decisionTime,
                reason,
                createdAt,
                decisionTime
        );
    }
}
