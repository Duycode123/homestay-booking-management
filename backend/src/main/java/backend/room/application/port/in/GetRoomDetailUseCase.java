package backend.room.application.port.in;

import backend.dto.response.RoomResponse;
import backend.room.application.port.in.query.GetRoomDetailQuery;

public interface GetRoomDetailUseCase {
    RoomResponse getRoom(GetRoomDetailQuery query);
}
