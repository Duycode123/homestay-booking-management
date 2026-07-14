package backend.refund.application.service;

import backend.refund.application.port.in.command.CompleteRefundCommand;
import backend.refund.application.port.in.command.FailRefundCommand;
import backend.refund.application.port.in.command.StartRefundCommand;
import backend.refund.application.port.out.RefundNotificationPort;
import backend.refund.application.port.out.RefundPersistencePort;
import backend.refund.domain.model.BookingRefund;
import backend.refund.domain.model.RefundMethod;
import backend.refund.domain.model.RefundStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefundUseCaseServiceTest {

    @Mock
    private RefundPersistencePort persistencePort;

    @Mock
    private RefundNotificationPort notificationPort;

    private RefundUseCaseService service;

    private final Clock clock = Clock.fixed(
            Instant.parse("2026-07-14T12:00:00Z"),
            ZoneId.of("Asia/Ho_Chi_Minh")
    );

    @BeforeEach
    void setUp() {
        service = new RefundUseCaseService(persistencePort, notificationPort, clock);
    }

    @Test
    void startsPendingRefundAndRecordsProcessor() {
        BookingRefund pending = refund(RefundStatus.PENDING);
        when(persistencePort.findByIdForUpdate(10L)).thenReturn(Optional.of(pending));
        when(persistencePort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        BookingRefund result = service.startRefund(new StartRefundCommand(10L, "admin@example.com"));

        assertEquals(RefundStatus.PROCESSING, result.status());
        assertEquals("admin@example.com", result.processedBy());
        assertEquals(LocalDateTime.of(2026, 7, 14, 19, 0), result.processingAt());
    }

    @Test
    void completesOnlyProcessingRefundAndNotifiesCustomer() {
        BookingRefund processing = refund(RefundStatus.PROCESSING);
        when(persistencePort.findByIdForUpdate(10L)).thenReturn(Optional.of(processing));
        when(persistencePort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        BookingRefund result = service.completeRefund(new CompleteRefundCommand(
                10L,
                "RF202607140010",
                "https://res.cloudinary.com/demo/refund.png",
                "Da doi soat ngan hang",
                "admin@example.com"
        ));

        assertEquals(RefundStatus.COMPLETED, result.status());
        assertEquals("RF202607140010", result.transactionReference());
        verify(notificationPort).notifyCompleted(result);
    }

    @Test
    void rejectsCompletingPendingRefund() {
        when(persistencePort.findByIdForUpdate(10L)).thenReturn(Optional.of(refund(RefundStatus.PENDING)));

        assertThrows(IllegalStateException.class, () -> service.completeRefund(new CompleteRefundCommand(
                10L, "RF001", null, null, "admin@example.com"
        )));
    }

    @Test
    void generatesReconciliationReferenceWhenOptionalEvidenceIsOmitted() {
        BookingRefund processing = refund(RefundStatus.PROCESSING);
        when(persistencePort.findByIdForUpdate(10L)).thenReturn(Optional.of(processing));
        when(persistencePort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        BookingRefund result = service.completeRefund(new CompleteRefundCommand(
                10L, null, null, null, "admin@example.com"
        ));

        assertEquals(RefundStatus.COMPLETED, result.status());
        assertEquals("REFUND-BR00000018-10", result.transactionReference());
        assertEquals(null, result.proofImageUrl());
        assertEquals("admin@example.com", result.processedBy());
        verify(notificationPort).notifyCompleted(result);
    }

    @Test
    void marksFailedTransferForRetryAndKeepsBookingCancelledFlowIndependent() {
        BookingRefund processing = refund(RefundStatus.PROCESSING);
        when(persistencePort.findByIdForUpdate(10L)).thenReturn(Optional.of(processing));
        when(persistencePort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        BookingRefund result = service.failRefund(new FailRefundCommand(
                10L,
                "Ngan hang tu choi giao dich hoan tien",
                "admin@example.com"
        ));

        assertEquals(RefundStatus.RETRY_REQUIRED, result.status());
        verify(notificationPort).notifyRequiresAttention(result);
    }

    private BookingRefund refund(RefundStatus status) {
        LocalDateTime processingAt = status == RefundStatus.PROCESSING
                ? LocalDateTime.of(2026, 7, 14, 18, 30)
                : null;
        return new BookingRefund(
                10L,
                18,
                "BR00000018",
                "Nguyen Van A",
                "customer@example.com",
                "Deluxe Balcony 201",
                "970422",
                "MB Bank",
                "0123456789",
                "NGUYEN VAN A",
                5L,
                new BigDecimal("500000.00"),
                RefundMethod.MANUAL_BANK_TRANSFER,
                status,
                null,
                null,
                null,
                null,
                null,
                LocalDateTime.of(2026, 7, 17, 19, 0),
                LocalDateTime.of(2026, 7, 14, 18, 0),
                LocalDateTime.of(2026, 7, 14, 18, 0),
                processingAt,
                null,
                0
        );
    }
}
