package backend.dto.response;

import backend.entity.Room;
import backend.entity.AccommodationType;
import backend.entity.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Stream;
import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class RoomResponse {
    private Integer id;
    private String roomName;
    private RoomTypeResponse roomType;
    private Integer floor;
    private Integer maxPeople;
    private Integer bedroomCount;
    private Integer bedCount;
    private RoomStatus status;
    private String description;
    private AccommodationType accommodationType;
    private String addressLine;
    private String ward;
    private String district;
    private String city;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer checkInRadiusMeters;
    private Integer bathroomCount;
    private BigDecimal baseNightlyRate;
    private String imageUrl;
    private List<String> imageUrls;

    public static RoomResponse from(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .roomName(room.getRoomName())
                .roomType(RoomTypeResponse.from(room.getRoomType()))
                .floor(room.getFloor())
                .maxPeople(room.getMaxPeople())
                .bedroomCount(room.getBedroomCount())
                .bedCount(room.getBedCount())
                .status(room.getStatus())
                .description(room.getDescription())
                .accommodationType(room.getAccommodationType())
                .addressLine(room.getAddressLine())
                .ward(room.getWard())
                .district(room.getDistrict())
                .city(room.getCity())
                .latitude(room.getLatitude())
                .longitude(room.getLongitude())
                .checkInRadiusMeters(room.getCheckInRadiusMeters())
                .bathroomCount(room.getBathroomCount())
                .baseNightlyRate(room.getBaseNightlyRate())
                .imageUrl(room.getImageUrl())
                .imageUrls(Stream.of(room.getImageUrl(), room.getImageUrl2(), room.getImageUrl3(), room.getImageUrl4())
                        .filter(value -> value != null && !value.isBlank())
                        .toList())
                .build();
    }
}
