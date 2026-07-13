package backend.room.application.port.in;

import backend.dto.response.RoomTypeResponse;
import backend.room.application.port.in.query.GetRoomTypeDetailQuery;

public interface GetRoomTypeDetailUseCase {
    RoomTypeResponse getRoomType(GetRoomTypeDetailQuery query);
}
