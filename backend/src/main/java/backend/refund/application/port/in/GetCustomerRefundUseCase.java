package backend.refund.application.port.in;

import backend.refund.domain.model.BookingRefund;

public interface GetCustomerRefundUseCase {
    BookingRefund getRefundForCustomer(Integer bookingId, String customerEmail);
}
