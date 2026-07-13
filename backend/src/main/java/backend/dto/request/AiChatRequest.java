package backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class AiChatRequest {

    @NotBlank(message = "Câu hỏi không được để trống")
    private String message;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer people;

    private BigDecimal maxPricePerHour;
}
