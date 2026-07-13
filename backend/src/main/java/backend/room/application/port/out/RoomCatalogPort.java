package backend.room.application.port.out;

import backend.entity.Room;
import backend.entity.RoomType;
import backend.room.application.model.PageResult;
import backend.room.application.port.out.model.RoomSearchCriteria;

import java.util.List;
import java.util.Optional;

public interface RoomCatalogPort {
    List<Room> loadRooms(RoomSearchCriteria criteria);

    PageResult<Room> searchRooms(RoomSearchCriteria criteria);

    Optional<Room> loadRoom(Integer roomId);

    Optional<Room> loadRoomForUpdate(Integer roomId);

    boolean existsRoomName(String roomName);

    boolean existsBookingForRoom(Integer roomId);

    boolean existsEquipmentForRoom(Integer roomId);

    boolean existsRoomTypeName(String typeName);

    boolean existsRoomForRoomType(Integer roomTypeId);

    List<RoomType> loadRoomTypes();

    Optional<RoomType> loadRoomType(Integer roomTypeId);
}
