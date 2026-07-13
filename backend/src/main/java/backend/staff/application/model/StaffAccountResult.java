package backend.staff.application.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record StaffAccountResult(
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
}
