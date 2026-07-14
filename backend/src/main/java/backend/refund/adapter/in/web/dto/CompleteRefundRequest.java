package backend.refund.adapter.in.web.dto;

import jakarta.validation.constraints.Size;

public record CompleteRefundRequest(
        @Size(max = 100, message = "Ma giao dich ngan hang toi da 100 ky tu")
        String transactionReference,

        @Size(max = 1000, message = "Duong dan anh bien lai toi da 1000 ky tu")
        String proofImageUrl,

        @Size(max = 500, message = "Ghi chu toi da 500 ky tu")
        String adminNote
) {
}
