package backend.auth.application.port.in;

import backend.auth.application.port.in.command.LoginUserCommand;
import backend.dto.response.AuthResponse;

public interface LoginUserUseCase {
    AuthResponse login(LoginUserCommand command);
}
