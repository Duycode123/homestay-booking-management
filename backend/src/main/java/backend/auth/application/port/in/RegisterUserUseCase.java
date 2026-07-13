package backend.auth.application.port.in;

import backend.auth.application.port.in.command.RegisterUserCommand;
import backend.dto.response.AuthResponse;

public interface RegisterUserUseCase {
    AuthResponse register(RegisterUserCommand command);
}
