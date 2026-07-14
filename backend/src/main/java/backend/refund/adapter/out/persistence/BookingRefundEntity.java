package backend.refund.adapter.out.persistence;

import backend.entity.Booking;
import backend.entity.PaymentTransaction;
import backend.refund.domain.model.RefundMethod;
import backend.refund.domain.model.RefundStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "booking_refund")
class BookingRefundEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_payment_transaction_id")
    private PaymentTransaction originalPaymentTransaction;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "recipient_bank_code", length = 20)
    private String recipientBankCode;

    @Column(name = "recipient_bank_name", length = 100)
    private String recipientBankName;

    @Column(name = "recipient_account_number", length = 30)
    private String recipientAccountNumber;

    @Column(name = "recipient_account_holder", length = 100)
    private String recipientAccountHolder;

    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false, length = 40)
    private RefundMethod method;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RefundStatus status;

    @Column(name = "transaction_reference", unique = true, length = 100)
    private String transactionReference;

    @Column(name = "proof_image_url", length = 1000)
    private String proofImageUrl;

    @Column(name = "admin_note", length = 500)
    private String adminNote;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "processed_by", length = 255)
    private String processedBy;

    @Column(name = "expected_at")
    private LocalDateTime expectedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "processing_at")
    private LocalDateTime processingAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Version
    @Column(name = "version", nullable = false)
    private long version;
}
