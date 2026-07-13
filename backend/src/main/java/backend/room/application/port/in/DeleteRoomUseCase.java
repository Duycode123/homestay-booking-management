package backend.room.application.port.in;

import backend.room.application.port.in.command.DeleteRoomCommand;

public interface DeleteRoomUseCase {
    void deleteRoom(DeleteRoomCommand command);
}
