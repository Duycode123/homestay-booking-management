package backend.refund.application.port.in.command;

public record CompleteRefundCommand(
        Long refundId,
        String transactionReference,
        String proofImageUrl,
        String adminNote,
        String adminEmail
) {
}
