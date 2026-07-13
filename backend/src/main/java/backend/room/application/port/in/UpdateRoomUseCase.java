package backend.room.application.port.in;

import backend.dto.response.RoomResponse;
import backend.room.application.port.in.command.UpdateRoomCommand;

public interface UpdateRoomUseCase {
    RoomResponse updateRoom(UpdateRoomCommand command);
}
