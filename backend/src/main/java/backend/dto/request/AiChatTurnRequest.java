package backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiChatTurnRequest {

    @Size(max = 16)
    private String role;

    @Size(max = 1000)
    private String content;
}
