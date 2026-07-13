package backend.room.application.port.out;

import backend.entity.Room;
import backend.entity.RoomType;

public interface RoomMutationPort {
    Room saveRoom(Room room);

    void deleteRoom(Room room);

    RoomType saveRoomType(RoomType roomType);

    void deleteRoomType(RoomType roomType);
}
