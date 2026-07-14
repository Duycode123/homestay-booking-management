package backend.refund.application.service;

import backend.exception.ResourceNotFoundException;
import backend.refund.application.port.in.GetCustomerRefundUseCase;
import backend.refund.application.port.in.ManageRefundUseCase;
import backend.refund.application.port.in.command.CompleteRefundCommand;
import backend.refund.application.port.in.command.FailRefundCommand;
import backend.refund.application.port.in.command.StartRefundCommand;
import backend.refund.application.port.in.query.RefundSearchQuery;
import backend.refund.application.port.out.RefundPersistencePort;
import backend.refund.application.port.out.RefundNotificationPort;
import backend.refund.domain.model.BookingRefund;
import backend.refund.domain.model.RefundStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RefundUseCaseService implements ManageRefundUseCase, GetCustomerRefundUseCase {

    private final RefundPersistencePort refundPersistencePort;
    private final RefundNotificationPort refundNotificationPort;
    private final Clock clock;

    @Override
    public List<BookingRefund> listRefunds(RefundSearchQuery query) {
        String search = normalize(query == null ? null : query.search());
        RefundStatus status = query == null ? null : query.status();

        return refundPersistencePort.findAll().stream()
                .filter(refund -> status == null || refund.status() == status)
                .filter(refund -> search == null || matches(refund, search))
                .toList();
    }

    @Override
    public BookingRefund getRefundForCustomer(Integer bookingId, String customerEmail) {
        if (bookingId == null) {
            throw new IllegalArgumentException("bookingId khong duoc de trong");
        }
        return refundPersistencePort.findByBookingIdAndCustomerEmail(bookingId, customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so hoan tien"));
    }

    @Override
    @Transactional
    public BookingRefund startRefund(StartRefundCommand command) {
        BookingRefund refund = loadForUpdate(command.refundId());
        if (refund.status() != RefundStatus.PENDING
                && refund.status() != RefundStatus.FAILED
                && refund.status() != RefundStatus.RETRY_REQUIRED) {
            throw new IllegalStateException("Ho so hoan tien khong the bat dau xu ly o trang thai hien tai");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        return refundPersistencePort.save(copy(
                refund,
                RefundStatus.PROCESSING,
                refund.transactionReference(),
                refund.proofImageUrl(),
                refund.adminNote(),
                null,
                required(command.adminEmail(), "Khong xac dinh duoc admin xu ly"),
                now,
                null
        ));
    }

    @Override
    @Transactional
    public BookingRefund completeRefund(CompleteRefundCommand command) {
        BookingRefund refund = loadForUpdate(command.refundId());
        if (refund.status() != RefundStatus.PROCESSING) {
            throw new IllegalStateException("Chi ho so dang xu ly moi co the xac nhan hoan tat");
        }

        String reference = normalizeLimited(
                command.transactionReference(),
                100,
                "Ma giao dich ngan hang toi da 100 ky tu"
        );
        if (reference == null) {
            reference = buildReconciliationReference(refund);
        }
        if (reference.length() > 100) {
            throw new IllegalArgumentException("Ma doi soat hoan tien toi da 100 ky tu");
        }

        String proofImageUrl = normalizeUrl(command.proofImageUrl());

        BookingRefund completed = refundPersistencePort.save(copy(
                refund,
                RefundStatus.COMPLETED,
                reference,
                proofImageUrl,
                normalizeLimited(command.adminNote(), 500, "Ghi chu toi da 500 ky tu"),
                null,
                required(command.adminEmail(), "Khong xac dinh duoc admin xu ly"),
                refund.processingAt(),
                LocalDateTime.now(clock)
        ));
        refundNotificationPort.notifyCompleted(completed);
        return completed;
    }

    @Override
    @Transactional
    public BookingRefund failRefund(FailRefundCommand command) {
        BookingRefund refund = loadForUpdate(command.refundId());
        if (refund.status() != RefundStatus.PROCESSING) {
            throw new IllegalStateException("Chi ho so dang xu ly moi co the ghi nhan that bai");
        }

        String reason = required(command.failureReason(), "Ly do that bai khong duoc de trong");
        if (reason.length() < 10 || reason.length() > 500) {
            throw new IllegalArgumentException("Ly do that bai phai tu 10 den 500 ky tu");
        }

        BookingRefund failed = refundPersistencePort.save(copy(
                refund,
                RefundStatus.RETRY_REQUIRED,
                refund.transactionReference(),
                refund.proofImageUrl(),
                refund.adminNote(),
                reason,
                required(command.adminEmail(), "Khong xac dinh duoc admin xu ly"),
                refund.processingAt(),
                null
        ));
        refundNotificationPort.notifyRequiresAttention(failed);
        return failed;
    }

    private BookingRefund loadForUpdate(Long refundId) {
        if (refundId == null) {
            throw new IllegalArgumentException("refundId khong duoc de trong");
        }
        return refundPersistencePort.findByIdForUpdate(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ho so hoan tien"));
    }

    private boolean matches(BookingRefund refund, String search) {
        return contains(refund.bookingCode(), search)
                || contains(refund.customerName(), search)
                || contains(refund.customerEmail(), search)
                || contains(refund.roomName(), search)
                || contains(refund.transactionReference(), search);
    }

    private boolean contains(String value, String search) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(search);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(message);
        return value.trim();
    }

    private String normalizeLimited(String value, int maxLength, String message) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.trim();
        if (normalized.length() > maxLength) throw new IllegalArgumentException(message);
        return normalized;
    }

    private String normalizeUrl(String value) {
        String url = normalizeLimited(value, 1000, "Duong dan anh bien lai toi da 1000 ky tu");
        if (url != null && !url.matches("^https?://.+")) {
            throw new IllegalArgumentException("Anh bien lai phai la URL HTTP hoac HTTPS hop le");
        }
        return url;
    }

    private String buildReconciliationReference(BookingRefund refund) {
        String bookingCode = refund.bookingCode() == null
                ? "BOOKING"
                : refund.bookingCode().replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);
        return "REFUND-" + bookingCode + "-" + refund.id();
    }

    private BookingRefund copy(
            BookingRefund refund,
            RefundStatus status,
            String transactionReference,
            String proofImageUrl,
            String adminNote,
            String failureReason,
            String processedBy,
            LocalDateTime processingAt,
            LocalDateTime completedAt
    ) {
        return new BookingRefund(
                refund.id(), refund.bookingId(), refund.bookingCode(), refund.customerName(), refund.customerEmail(),
                refund.roomName(), refund.recipientBankCode(), refund.recipientBankName(),
                refund.recipientAccountNumber(), refund.recipientAccountHolder(),
                refund.originalPaymentTransactionId(), refund.amount(), refund.method(), status,
                transactionReference, proofImageUrl, adminNote, failureReason, processedBy, refund.expectedAt(),
                refund.createdAt(), LocalDateTime.now(clock), processingAt, completedAt, refund.version()
        );
    }
}
