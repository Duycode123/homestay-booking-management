package backend.refund.application.port.out;

import backend.refund.domain.model.BookingRefund;

import java.util.List;
import java.util.Optional;

public interface RefundPersistencePort {
    List<BookingRefund> findAll();

    Optional<BookingRefund> findByIdForUpdate(Long refundId);

    Optional<BookingRefund> findByBookingIdAndCustomerEmail(Integer bookingId, String customerEmail);

    BookingRefund save(BookingRefund refund);
}
