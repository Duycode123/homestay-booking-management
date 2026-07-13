package backend.room.application.port.in;

import backend.dto.response.RoomResponse;
import backend.room.application.port.in.command.UpdateRoomStatusCommand;

public interface UpdateRoomStatusUseCase {
    RoomResponse updateRoomStatus(UpdateRoomStatusCommand command);
}
