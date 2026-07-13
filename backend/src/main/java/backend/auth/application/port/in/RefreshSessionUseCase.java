package backend.auth.application.port.in;

import backend.auth.application.port.in.command.RefreshSessionCommand;
import backend.dto.response.AuthResponse;

public interface RefreshSessionUseCase {
    AuthResponse refresh(RefreshSessionCommand command);
}
