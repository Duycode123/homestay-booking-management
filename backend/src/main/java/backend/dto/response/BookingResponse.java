package backend.dto.response;

import backend.addon.adapter.in.web.dto.BookingAddonResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.CancellationRequestStatus;
import backend.entity.Customer;
import backend.entity.PaymentMethod;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class BookingResponse {

    private Integer bookingId;
    private String bookingCode;

    private Integer customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private Integer roomId;
    private String roomName;
    private String typeName;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime checkinTime;
    private LocalDateTime checkoutTime;
    private Integer checkinStaffId;
    private String checkinStaffName;

    private BigDecimal totalHours;
    private BigDecimal pricePerHour;
    private BigDecimal originalAmount;
    private BigDecimal roomAmount;
    private BigDecimal addonAmount;
    private String couponCode;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private List<BookingAddonResponse> addons = List.of();

    private BookingStatus status;
    private PaymentMethod paymentMethod;
    private String note;
    private String equipmentNotes;
    private Boolean canReview;
    private Boolean alreadyReviewed;
    private CancellationRequestStatus cancellationRequestStatus;
    private String cancellationReason;
    private LocalDateTime cancellationRequestedAt;
    private LocalDateTime cancellationReviewedAt;
    private String cancellationReviewedBy;
    private String cancellationAdminNote;
    private BigDecimal refundAmount;
    private Integer refundPercentage;
    private String refundMethod;
    private LocalDateTime expectedRefundAt;
    private String refundBankCode;
    private String refundBankName;
    private String refundAccountNumber;
    private String refundAccountHolder;

    public BookingResponse(Booking booking) {
        this(booking, BigDecimal.ZERO);
    }

    public BookingResponse(Booking booking, BigDecimal successfulPaymentAmount) {
        this.bookingId = booking.getId();
        this.bookingCode = booking.getBookingCode();

        if (booking.getCustomer() != null) {
            Customer customer = booking.getCustomer();
            this.customerId = customer.getId();
            this.customerName = customer.getFullName();
            this.customerPhone = customer.getPhone();
            this.customerEmail = customer.getEmail();

            if (this.customerEmail == null && customer.getAccount() != null) {
                this.customerEmail = customer.getAccount().getEmail();
            }
        }

        if (booking.getRoom() != null) {
            this.roomId = booking.getRoom().getId();
            this.roomName = booking.getRoom().getRoomName();

            if (booking.getRoom().getRoomType() != null) {
                this.typeName = booking.getRoom().getRoomType().getTypeName();
            }
        }

        this.startTime = booking.getStartTime();
        this.endTime = booking.getEndTime();
        this.checkinTime = booking.getCheckinTime();
        this.checkoutTime = booking.getCheckoutTime();
        if (booking.getCheckinStaff() != null) {
            this.checkinStaffId = booking.getCheckinStaff().getId();
            this.checkinStaffName = booking.getCheckinStaff().getFullName();
        }
        this.totalHours = booking.getTotalHours();
        this.pricePerHour = booking.getPricePerHour();
        this.originalAmount = booking.getRoomAmount() != null ? booking.getRoomAmount()
                : booking.getTotalHours() == null || booking.getPricePerHour() == null
                ? null
                : booking.getTotalHours().multiply(booking.getPricePerHour());
        this.roomAmount = this.originalAmount;
        this.addonAmount = booking.getAddonAmount() == null ? BigDecimal.ZERO.setScale(2) : booking.getAddonAmount();
        this.couponCode = booking.getDiscountCode() == null ? null : booking.getDiscountCode().getCode();
        this.discountAmount = this.originalAmount == null || booking.getTotalAmount() == null
                ? null
                : this.originalAmount.subtract(booking.getTotalAmount().subtract(this.addonAmount)).max(BigDecimal.ZERO);
        this.totalAmount = booking.getTotalAmount();
        BigDecimal normalizedTotal = booking.getTotalAmount() == null
                ? BigDecimal.ZERO
                : booking.getTotalAmount().max(BigDecimal.ZERO);
        BigDecimal normalizedPaid = successfulPaymentAmount == null
                ? BigDecimal.ZERO
                : successfulPaymentAmount.max(BigDecimal.ZERO).min(normalizedTotal);
        this.paidAmount = normalizedPaid;
        this.remainingAmount = normalizedTotal.subtract(normalizedPaid).max(BigDecimal.ZERO);
        this.status = booking.getStatus();
        this.paymentMethod = booking.getPaymentMethod();
        this.note = booking.getNote();
        this.equipmentNotes = booking.getInstrumentNote();
        this.cancellationRequestStatus = booking.getCancellationRequestStatus();
        this.cancellationReason = booking.getCancellationReason();
        this.cancellationRequestedAt = booking.getCancellationRequestedAt();
        this.cancellationReviewedAt = booking.getCancellationReviewedAt();
        this.cancellationReviewedBy = booking.getCancellationReviewedBy();
        this.cancellationAdminNote = booking.getCancellationAdminNote();
        this.refundAmount = booking.getRefundAmount();
        this.refundPercentage = booking.getRefundPercentage();
        this.refundMethod = booking.getRefundMethod();
        this.expectedRefundAt = booking.getExpectedRefundAt();
        this.refundBankCode = booking.getRefundBankCode();
        this.refundBankName = booking.getRefundBankName();
        this.refundAccountNumber = booking.getRefundAccountNumber();
        this.refundAccountHolder = booking.getRefundAccountHolder();
    }

    public BookingResponse(Booking booking, boolean alreadyReviewed) {
        this(booking);
        this.alreadyReviewed = alreadyReviewed;
        this.canReview = booking.getStatus() == BookingStatus.COMPLETED && !alreadyReviewed;
    }

    public BookingResponse(Booking booking, BigDecimal successfulPaymentAmount, boolean alreadyReviewed) {
        this(booking, successfulPaymentAmount);
        this.alreadyReviewed = alreadyReviewed;
        this.canReview = booking.getStatus() == BookingStatus.COMPLETED && !alreadyReviewed;
    }
}
