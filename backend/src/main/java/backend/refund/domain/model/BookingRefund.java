package backend.refund.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingRefund(
        Long id,
        Integer bookingId,
        String bookingCode,
        String customerName,
        String customerEmail,
        String roomName,
        String recipientBankCode,
        String recipientBankName,
        String recipientAccountNumber,
        String recipientAccountHolder,
        Long originalPaymentTransactionId,
        BigDecimal amount,
        RefundMethod method,
        RefundStatus status,
        String transactionReference,
        String proofImageUrl,
        String adminNote,
        String failureReason,
        String processedBy,
        LocalDateTime expectedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime processingAt,
        LocalDateTime completedAt,
        long version
) {
}
