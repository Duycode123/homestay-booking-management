package backend.auth.application.port.in.command;

import java.time.LocalDate;

public record RegisterUserCommand(
        String fullName,
        String email,
        String phone,
        LocalDate dateOfBirth,
        String password,
        String emailVerificationUrlBase
) {
}
