package backend.refund.adapter.out.persistence;

import backend.booking.application.port.out.CreatePendingRefundPort;
import backend.entity.Booking;
import backend.entity.PaymentMethod;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.refund.application.port.out.RefundPersistencePort;
import backend.refund.domain.model.BookingRefund;
import backend.refund.domain.model.RefundMethod;
import backend.refund.domain.model.RefundStatus;
import backend.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RefundPersistenceAdapter implements RefundPersistencePort, CreatePendingRefundPort {

    private final BookingRefundJpaRepository repository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Override
    public List<BookingRefund> findAll() {
        return repository.findAllDetailed().stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<BookingRefund> findByIdForUpdate(Long refundId) {
        return repository.findDetailedByIdForUpdate(refundId).map(this::toDomain);
    }

    @Override
    public Optional<BookingRefund> findByBookingIdAndCustomerEmail(Integer bookingId, String customerEmail) {
        return repository.findByBookingIdAndCustomerEmail(bookingId, customerEmail).map(this::toDomain);
    }

    @Override
    public BookingRefund save(BookingRefund refund) {
        BookingRefundEntity entity = repository.findById(refund.id())
                .orElseThrow(() -> new IllegalStateException("Khong tim thay ho so hoan tien de cap nhat"));
        entity.setStatus(refund.status());
        entity.setTransactionReference(refund.transactionReference());
        entity.setProofImageUrl(refund.proofImageUrl());
        entity.setAdminNote(refund.adminNote());
        entity.setFailureReason(refund.failureReason());
        entity.setProcessedBy(refund.processedBy());
        entity.setUpdatedAt(refund.updatedAt());
        entity.setProcessingAt(refund.processingAt());
        entity.setCompletedAt(refund.completedAt());
        return toDomain(repository.save(entity));
    }

    @Override
    public void createPendingRefundIfAbsent(
            Booking booking,
            BigDecimal amount,
            String refundMethod,
            LocalDateTime expectedAt
    ) {
        if (booking == null || booking.getId() == null) {
            throw new IllegalArgumentException("Booking hoan tien khong hop le");
        }
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("So tien hoan phai lon hon 0");
        }
        if (repository.findByBooking_Id(booking.getId()).isPresent()) return;

        PaymentTransaction originalTransaction = paymentTransactionRepository
                .findTopByBooking_IdAndStatusOrderByPaidAtDesc(booking.getId(), PaymentTransactionStatus.SUCCEEDED)
                .orElse(null);

        BookingRefundEntity entity = new BookingRefundEntity();
        entity.setBooking(booking);
        entity.setOriginalPaymentTransaction(originalTransaction);
        entity.setAmount(amount);
        entity.setRecipientBankCode(booking.getRefundBankCode());
        entity.setRecipientBankName(booking.getRefundBankName());
        entity.setRecipientAccountNumber(booking.getRefundAccountNumber());
        entity.setRecipientAccountHolder(booking.getRefundAccountHolder());
        entity.setMethod(resolveMethod(booking, refundMethod));
        entity.setStatus(RefundStatus.PENDING);
        entity.setExpectedAt(expectedAt);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(entity.getCreatedAt());
        repository.save(entity);
    }

    private RefundMethod resolveMethod(Booking booking, String refundMethod) {
        if (booking.getPaymentMethod() == PaymentMethod.CASH) return RefundMethod.CASH_COUNTER;
        if (refundMethod != null && refundMethod.toLowerCase().contains("chuyen khoan")) {
            return RefundMethod.MANUAL_BANK_TRANSFER;
        }
        return RefundMethod.ORIGINAL_PAYMENT_METHOD;
    }

    private BookingRefund toDomain(BookingRefundEntity entity) {
        Booking booking = entity.getBooking();
        String customerName = booking.getCustomer() == null ? null : booking.getCustomer().getFullName();
        String customerEmail = booking.getCustomer() == null || booking.getCustomer().getAccount() == null
                ? null
                : booking.getCustomer().getAccount().getEmail();
        String roomName = booking.getRoom() == null ? null : booking.getRoom().getRoomName();

        return new BookingRefund(
                entity.getId(),
                booking.getId(),
                booking.getBookingCode(),
                customerName,
                customerEmail,
                roomName,
                entity.getRecipientBankCode(),
                entity.getRecipientBankName(),
                entity.getRecipientAccountNumber(),
                entity.getRecipientAccountHolder(),
                entity.getOriginalPaymentTransaction() == null ? null : entity.getOriginalPaymentTransaction().getId(),
                entity.getAmount(),
                entity.getMethod(),
                entity.getStatus(),
                entity.getTransactionReference(),
                entity.getProofImageUrl(),
                entity.getAdminNote(),
                entity.getFailureReason(),
                entity.getProcessedBy(),
                entity.getExpectedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getProcessingAt(),
                entity.getCompletedAt(),
                entity.getVersion()
        );
    }
}
