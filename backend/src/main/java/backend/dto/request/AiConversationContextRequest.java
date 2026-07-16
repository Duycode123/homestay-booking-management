package backend.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class AiConversationContextRequest {

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
