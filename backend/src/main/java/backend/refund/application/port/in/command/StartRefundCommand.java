package backend.refund.application.port.in.command;

public record StartRefundCommand(Long refundId, String adminEmail) {
}
