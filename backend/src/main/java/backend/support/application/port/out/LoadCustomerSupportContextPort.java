package backend.support.application.port.out;

import backend.support.domain.model.SupportBooking;
import backend.support.domain.model.SupportCustomer;

import java.util.Optional;

public interface LoadCustomerSupportContextPort {

    Optional<SupportCustomer> loadCustomerByEmail(String email);

    Optional<SupportBooking> loadOwnedBooking(Integer bookingId, String customerEmail);
}
