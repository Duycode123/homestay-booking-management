package backend.room.application.port.in.command;

import backend.entity.RoomStatus;

import java.util.List;

public record CreateRoomCommand(
        String roomName,
        Integer roomTypeId,
        Integer maxPeople,
        String imageUrl,
        List<String> additionalImageUrls,
        RoomStatus status,
        String currentUserEmail
) {
    public CreateRoomCommand(String roomName, Integer roomTypeId, Integer maxPeople, String imageUrl, RoomStatus status, String currentUserEmail) {
        this(roomName, roomTypeId, maxPeople, imageUrl, List.of(), status, currentUserEmail);
    }
}
