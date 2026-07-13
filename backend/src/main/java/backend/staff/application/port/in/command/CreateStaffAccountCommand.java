package backend.staff.application.port.in.command;

import java.time.LocalDate;

public record CreateStaffAccountCommand(
        String fullName,
        String email,
        String phone,
        LocalDate dateOfBirth,
        String initialPassword
) {
}
