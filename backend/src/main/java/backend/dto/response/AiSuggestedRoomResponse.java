package backend.dto.response;

import backend.entity.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class AiSuggestedRoomResponse {

    private Integer roomId;
    private String roomName;
    private String roomTypeName;
    private String roomTypeDescription;
    private BigDecimal pricePerHour;
    private BigDecimal pricePerNight;
    private Integer capacity;
    private Integer bedroomCount;
    private Integer bedCount;
    private RoomStatus status;
    private String imageUrl;
    private Double averageRating;
    private Long approvedReviewCount;
    private Long upcomingBookingCount;
    private String nextBookedStartTime;
    private String equipmentSummary;
    private String unavailableEquipmentSummary;
    private List<String> equipmentItems;
    private Boolean availableInRequestedTime;
    private String reason;
    private String detailUrl;
    private String bookingUrl;
}
