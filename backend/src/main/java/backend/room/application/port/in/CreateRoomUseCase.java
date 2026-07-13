package backend.room.application.port.in;

import backend.dto.response.RoomResponse;
import backend.room.application.port.in.command.CreateRoomCommand;

public interface CreateRoomUseCase {
    RoomResponse createRoom(CreateRoomCommand command);
}
