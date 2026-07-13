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
    private Integer capacity;
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
}
