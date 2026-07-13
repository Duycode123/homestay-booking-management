package backend.booking.application.port.out;

public interface LoadReviewPort {
    boolean existsReviewByBookingId(Integer bookingId);
}
