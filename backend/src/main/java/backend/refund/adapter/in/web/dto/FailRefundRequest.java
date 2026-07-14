package backend.refund.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FailRefundRequest(
        @NotBlank(message = "Ly do that bai khong duoc de trong")
        @Size(min = 10, max = 500, message = "Ly do that bai phai tu 10 den 500 ky tu")
        String failureReason
) {
}
