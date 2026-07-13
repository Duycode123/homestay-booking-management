package backend.room.application.port.in;

import backend.dto.response.RoomTypeResponse;
import backend.room.application.port.in.command.UpdateRoomTypeCommand;

public interface UpdateRoomTypeUseCase {
    RoomTypeResponse updateRoomType(UpdateRoomTypeCommand command);
}
