package backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class AiChatRequest {

    @NotBlank(message = "Câu hỏi không được để trống")
    private String message;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer people;

    private BigDecimal maxPricePerHour;

    /**
     * Context returned by the previous turn. Keeping it in the client session makes
     * the assistant multi-turn without persisting private conversations in the DB.
     */
    private AiConversationContextRequest context;

    /** Recent turns are used only to make the language response coherent. */
    private List<AiChatTurnRequest> history;
}
