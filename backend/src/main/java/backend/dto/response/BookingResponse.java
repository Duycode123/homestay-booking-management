package backend.dto.response;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Customer;
import backend.entity.PaymentMethod;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    private BigDecimal totalHours;
    private BigDecimal pricePerHour;
    private BigDecimal originalAmount;
    private String couponCode;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;

    private BookingStatus status;
    private PaymentMethod paymentMethod;
    private String note;
    private String equipmentNotes;
    private Boolean canReview;
    private Boolean alreadyReviewed;

    public BookingResponse(Booking booking) {
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
        this.totalHours = booking.getTotalHours();
        this.pricePerHour = booking.getPricePerHour();
        this.originalAmount = booking.getTotalHours() == null || booking.getPricePerHour() == null
                ? null
                : booking.getTotalHours().multiply(booking.getPricePerHour());
        this.couponCode = booking.getDiscountCode() == null ? null : booking.getDiscountCode().getCode();
        this.discountAmount = this.originalAmount == null || booking.getTotalAmount() == null
                ? null
                : this.originalAmount.subtract(booking.getTotalAmount()).max(BigDecimal.ZERO);
        this.totalAmount = booking.getTotalAmount();
        this.status = booking.getStatus();
        this.paymentMethod = booking.getPaymentMethod();
        this.note = booking.getNote();
        this.equipmentNotes = booking.getInstrumentNote();
    }

    public BookingResponse(Booking booking, boolean alreadyReviewed) {
        this(booking);
        this.alreadyReviewed = alreadyReviewed;
        this.canReview = booking.getStatus() == BookingStatus.COMPLETED && !alreadyReviewed;
    }
}
