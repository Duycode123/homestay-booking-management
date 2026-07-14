package backend.refund.adapter.in.web.dto;

import backend.refund.domain.model.BookingRefund;
import backend.refund.domain.model.RefundMethod;
import backend.refund.domain.model.RefundStatus;
import backend.refund.application.model.RefundTransferInstruction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RefundResponse(
        Long refundId,
        Integer bookingId,
        String bookingCode,
        String customerName,
        String customerEmail,
        String roomName,
        String recipientBankCode,
        String recipientBankName,
        String recipientAccountNumber,
        String recipientAccountHolder,
        String transferContent,
        String transferQrUrl,
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
        LocalDateTime completedAt
) {
    public static RefundResponse from(BookingRefund refund, RefundTransferInstruction instruction) {
        return new RefundResponse(
                refund.id(), refund.bookingId(), refund.bookingCode(), refund.customerName(), refund.customerEmail(),
                refund.roomName(), refund.recipientBankCode(), refund.recipientBankName(),
                refund.recipientAccountNumber(), refund.recipientAccountHolder(),
                instruction == null ? null : instruction.content(), instruction == null ? null : instruction.qrUrl(),
                refund.originalPaymentTransactionId(), refund.amount(), refund.method(), refund.status(),
                refund.transactionReference(), refund.proofImageUrl(), refund.adminNote(), refund.failureReason(),
                refund.processedBy(), refund.expectedAt(), refund.createdAt(), refund.updatedAt(), refund.processingAt(),
                refund.completedAt()
        );
    }
}
