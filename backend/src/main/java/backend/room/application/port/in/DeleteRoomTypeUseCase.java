package backend.room.application.port.in;

import backend.room.application.port.in.command.DeleteRoomTypeCommand;

public interface DeleteRoomTypeUseCase {
    void deleteRoomType(DeleteRoomTypeCommand command);
}
