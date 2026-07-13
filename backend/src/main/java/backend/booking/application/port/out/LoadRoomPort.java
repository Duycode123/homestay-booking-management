package backend.booking.application.port.out;

import backend.entity.Room;

import java.util.Optional;

public interface LoadRoomPort {
    Optional<Room> loadRoom(Integer roomId);

    Optional<Room> loadRoomForUpdate(Integer roomId);
}
