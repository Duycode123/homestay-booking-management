package backend.booking.application.port.out;

import backend.entity.Customer;

import java.util.Optional;

public interface LoadCustomerPort {
    Optional<Customer> loadCustomerByAccountEmail(String email);

    Optional<Customer> loadCustomerForBookingByAccountEmail(String email);
}
