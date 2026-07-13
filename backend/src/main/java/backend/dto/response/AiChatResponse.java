package backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class AiChatResponse {

    private String answer;
    private List<AiSuggestedRoomResponse> suggestedRooms;
    private LocalDateTime interpretedStartTime;
    private LocalDateTime interpretedEndTime;
    private Integer interpretedPeople;
    private List<String> suggestedQuestions;
    private boolean usedAi;
    private String mode;
}
