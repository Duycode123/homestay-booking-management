package backend.room.application.port.in;

import backend.dto.response.RoomTypeResponse;

import java.util.List;

public interface ListRoomTypesUseCase {
    List<RoomTypeResponse> getRoomTypes();
}
