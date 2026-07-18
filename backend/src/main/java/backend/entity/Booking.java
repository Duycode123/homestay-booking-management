package backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "booking")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discount_code_id")
    private DiscountCode discountCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checkin_staff_id")
    private Staff checkinStaff;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "checkin_time")
    private LocalDateTime checkinTime;

    @Column(name = "checkout_time")
    private LocalDateTime checkoutTime;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "payment_method", nullable = false, columnDefinition = "payment_method")
    private PaymentMethod paymentMethod;

    @Column(name = "applied_hourly_rate", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerHour;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "room_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal roomAmount;

    @Column(name = "addon_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal addonAmount = BigDecimal.ZERO.setScale(2);

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "booking_status")
    private BookingStatus status;

    @Column(name = "notes", length = 500)
    private String note;

    @Column(name = "equipment_notes", length = 500)
    private String instrumentNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "cancellation_request_status", length = 20)
    private CancellationRequestStatus cancellationRequestStatus;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "cancellation_requested_at")
    private LocalDateTime cancellationRequestedAt;

    @Column(name = "cancellation_reviewed_at")
    private LocalDateTime cancellationReviewedAt;

    @Column(name = "cancellation_reviewed_by", length = 255)
    private String cancellationReviewedBy;

    @Column(name = "cancellation_admin_note", length = 500)
    private String cancellationAdminNote;

    @Column(name = "refund_amount", precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refund_percentage")
    private Integer refundPercentage;

    @Column(name = "refund_method", length = 100)
    private String refundMethod;

    @Column(name = "expected_refund_at")
    private LocalDateTime expectedRefundAt;

    @Column(name = "refund_bank_code", length = 20)
    private String refundBankCode;

    @Column(name = "refund_bank_name", length = 100)
    private String refundBankName;

    @Column(name = "refund_account_number", length = 30)
    private String refundAccountNumber;

    @Column(name = "refund_account_holder", length = 100)
    private String refundAccountHolder;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = BookingStatus.PENDING_PAYMENT;
        }
        if (roomAmount == null) {
            roomAmount = totalAmount == null ? BigDecimal.ZERO.setScale(2) : totalAmount;
        }
        if (addonAmount == null) {
            addonAmount = BigDecimal.ZERO.setScale(2);
        }
    }

    public String getBookingCode() {
        return id == null ? null : "BR%08d".formatted(id);
    }

    public BigDecimal getTotalHours() {
        if (startTime == null || endTime == null) {
            return null;
        }

        return BigDecimal.valueOf(Duration.between(startTime, endTime).toMinutes())
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }
}
