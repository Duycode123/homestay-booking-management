package backend.dto.response;

import backend.entity.RoomType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class RoomTypeResponse {
    private Integer id;
    private String typeName;
    private String description;
    private BigDecimal pricePerHour;
    private Integer capacity;

    public static RoomTypeResponse from(RoomType roomType) {
        return RoomTypeResponse.builder()
                .id(roomType.getId())
                .typeName(roomType.getTypeName())
                .description(roomType.getDescription())
                .pricePerHour(roomType.getPricePerHour())
                .capacity(roomType.getCapacity())
                .build();
    }
}
