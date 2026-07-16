package backend.room.application.port.in.command;

import backend.entity.RoomStatus;

import java.util.List;

public record UpdateRoomCommand(
        Integer roomId,
        String roomName,
        Integer roomTypeId,
        Integer maxPeople,
        Integer bedroomCount,
        Integer bedCount,
        String imageUrl,
        List<String> additionalImageUrls,
        RoomStatus status,
        String currentUserEmail
) {
    public UpdateRoomCommand(Integer roomId, String roomName, Integer roomTypeId, Integer maxPeople, String imageUrl, List<String> additionalImageUrls, RoomStatus status, String currentUserEmail) {
        this(roomId, roomName, roomTypeId, maxPeople, 1, 1, imageUrl, additionalImageUrls, status, currentUserEmail);
    }

    public UpdateRoomCommand(Integer roomId, String roomName, Integer roomTypeId, Integer maxPeople, String imageUrl, RoomStatus status, String currentUserEmail) {
        this(roomId, roomName, roomTypeId, maxPeople, 1, 1, imageUrl, List.of(), status, currentUserEmail);
    }
}
