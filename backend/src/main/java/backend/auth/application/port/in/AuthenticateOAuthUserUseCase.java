package backend.auth.application.port.in;

import backend.auth.application.port.in.command.OAuthUserCommand;
import backend.dto.response.AuthResponse;

public interface AuthenticateOAuthUserUseCase {
    AuthResponse authenticate(OAuthUserCommand command);
}
