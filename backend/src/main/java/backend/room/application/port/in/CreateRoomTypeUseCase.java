package backend.room.application.port.in;

import backend.dto.response.RoomTypeResponse;
import backend.room.application.port.in.command.CreateRoomTypeCommand;

public interface CreateRoomTypeUseCase {
    RoomTypeResponse createRoomType(CreateRoomTypeCommand command);
}
