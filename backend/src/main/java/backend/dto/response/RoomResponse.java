package backend.dto.response;

import backend.entity.Room;
import backend.entity.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Stream;

@Getter
@Builder
@AllArgsConstructor
public class RoomResponse {
    private Integer id;
    private String roomName;
    private RoomTypeResponse roomType;
    private Integer floor;
    private Integer maxPeople;
    private RoomStatus status;
    private String description;
    private String imageUrl;
    private List<String> imageUrls;

    public static RoomResponse from(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .roomName(room.getRoomName())
                .roomType(RoomTypeResponse.from(room.getRoomType()))
                .floor(room.getFloor())
                .maxPeople(room.getMaxPeople())
                .status(room.getStatus())
                .description(room.getDescription())
                .imageUrl(room.getImageUrl())
                .imageUrls(Stream.of(room.getImageUrl(), room.getImageUrl2(), room.getImageUrl3(), room.getImageUrl4())
                        .filter(value -> value != null && !value.isBlank())
                        .toList())
                .build();
    }
}
