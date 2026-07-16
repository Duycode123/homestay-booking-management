package backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class AiConversationContextResponse {

    private String conversationId;
    private String intent;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer adults;
    private Integer children;
    private Integer bedrooms;
    private Integer beds;
    private BigDecimal maxNightlyPrice;
    private List<String> amenities;
    private Integer selectedRoomId;
}
