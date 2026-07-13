package backend.booking.application.port.out;

import backend.entity.User;

import java.util.Optional;

public interface LoadUserPort {
    Optional<User> loadUserByEmail(String email);
}
