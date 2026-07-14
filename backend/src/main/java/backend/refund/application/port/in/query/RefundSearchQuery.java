package backend.refund.application.port.in.query;

import backend.refund.domain.model.RefundStatus;

public record RefundSearchQuery(RefundStatus status, String search) {
}
