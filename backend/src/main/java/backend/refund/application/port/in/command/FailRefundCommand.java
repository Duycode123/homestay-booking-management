package backend.refund.application.port.in.command;

public record FailRefundCommand(Long refundId, String failureReason, String adminEmail) {
}
