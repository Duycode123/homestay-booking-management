package backend.auth.application.port.in.command;

public record LoginUserCommand(
        String email,
        String password
) {
}
