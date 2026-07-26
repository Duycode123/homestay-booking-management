package backend.room.application.port.in.command;

import backend.entity.AccommodationType;
import backend.entity.RoomStatus;

import java.math.BigDecimal;
import java.util.List;

public record UpdateRoomCommand(
        Integer roomId,
        String roomName,
        Integer roomTypeId,
        Integer maxPeople,
        Integer bedroomCount,
        Integer bedCount,
        Integer bathroomCount,
        AccommodationType accommodationType,
        String description,
        String addressLine,
        String ward,
        String district,
        String city,
        BigDecimal latitude,
        BigDecimal longitude,
        Integer checkInRadiusMeters,
        BigDecimal baseNightlyRate,
        String imageUrl,
        List<String> additionalImageUrls,
        RoomStatus status,
        String currentUserEmail
) {
    public UpdateRoomCommand(
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
        this(
                roomId, roomName, roomTypeId, maxPeople, bedroomCount, bedCount,
                1, AccommodationType.VILLA, null, null, null, null, "Hà Nội",
                null, null, 100, null,
                imageUrl, additionalImageUrls, status, currentUserEmail
        );
    }

    public UpdateRoomCommand(Integer roomId, String roomName, Integer roomTypeId, Integer maxPeople, String imageUrl, List<String> additionalImageUrls, RoomStatus status, String currentUserEmail) {
        this(roomId, roomName, roomTypeId, maxPeople, 1, 1, imageUrl, additionalImageUrls, status, currentUserEmail);
    }

    public UpdateRoomCommand(Integer roomId, String roomName, Integer roomTypeId, Integer maxPeople, String imageUrl, RoomStatus status, String currentUserEmail) {
        this(roomId, roomName, roomTypeId, maxPeople, 1, 1, imageUrl, List.of(), status, currentUserEmail);
    }
}
