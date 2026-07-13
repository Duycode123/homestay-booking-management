package backend.staff.adapter.in.web.dto;

import backend.staff.application.model.StaffAccountResult;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record StaffAccountResponse(
        Integer accountId,
        Integer staffId,
        String email,
        String fullName,
        String phone,
        LocalDate dateOfBirth,
        String avatarUrl,
        String role,
        boolean emailVerified,
        boolean enabled,
        LocalDateTime createdAt,
        String initialPassword
) {
    public static StaffAccountResponse from(StaffAccountResult result) {
        return new StaffAccountResponse(
                result.accountId(),
                result.staffId(),
                result.email(),
                result.fullName(),
                result.phone(),
                result.dateOfBirth(),
                result.avatarUrl(),
                result.role(),
                result.emailVerified(),
                result.enabled(),
                result.createdAt(),
                result.initialPassword()
        );
    }
}
