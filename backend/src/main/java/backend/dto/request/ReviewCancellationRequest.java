package backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewCancellationRequest {

    @Size(max = 500, message = "Ghi chu duyet khong duoc vuot qua 500 ky tu")
    private String adminNote;
}
