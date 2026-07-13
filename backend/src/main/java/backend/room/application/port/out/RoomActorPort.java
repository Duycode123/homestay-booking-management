package backend.room.application.port.out;

import backend.entity.User;

import java.util.Optional;

public interface RoomActorPort {
    Optional<User> loadUserByEmail(String email);
}
