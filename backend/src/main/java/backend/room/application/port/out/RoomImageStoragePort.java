package backend.room.application.port.out;

import backend.room.application.model.RoomImageFile;
import backend.room.application.model.RoomImageUploadResult;

public interface RoomImageStoragePort {
    RoomImageUploadResult uploadRoomImage(RoomImageFile imageFile);
}
