package backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AiAgentActionResponse {

    private String type;
    private String label;
    private String href;
    private Integer roomId;
}
