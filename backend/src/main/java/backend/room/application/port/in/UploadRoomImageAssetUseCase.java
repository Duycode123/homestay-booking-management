package backend.room.application.port.in;

import backend.room.application.model.RoomImageUploadResult;
import backend.room.application.port.in.command.UploadRoomImageAssetCommand;

public interface UploadRoomImageAssetUseCase {
    RoomImageUploadResult uploadRoomImage(UploadRoomImageAssetCommand command);
}
