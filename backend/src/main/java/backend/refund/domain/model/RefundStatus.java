package backend.refund.domain.model;

public enum RefundStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    RETRY_REQUIRED
}
