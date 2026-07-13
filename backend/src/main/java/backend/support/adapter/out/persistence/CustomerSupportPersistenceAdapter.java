package backend.support.adapter.out.persistence;

import backend.entity.Booking;
import backend.entity.Customer;
import backend.repository.BookingRepository;
import backend.repository.CustomerRepository;
import backend.support.application.port.out.LoadCustomerSupportContextPort;
import backend.support.domain.model.SupportBooking;
import backend.support.domain.model.SupportCustomer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CustomerSupportPersistenceAdapter implements LoadCustomerSupportContextPort {

    private final CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;

    @Override
    public Optional<SupportCustomer> loadCustomerByEmail(String email) {
        return customerRepository.findByAccount_Email(email).map(this::toCustomer);
    }

    @Override
    public Optional<SupportBooking> loadOwnedBooking(Integer bookingId, String customerEmail) {
        return bookingRepository.findByIdAndCustomer_Account_Email(bookingId, customerEmail)
                .map(this::toBooking);
    }

    private SupportCustomer toCustomer(Customer customer) {
        return new SupportCustomer(
                customer.getId(), customer.getFullName(), customer.getEmail(), customer.getPhone()
        );
    }

    private SupportBooking toBooking(Booking booking) {
        return new SupportBooking(
                booking.getId(),
                booking.getBookingCode(),
                booking.getRoom() == null ? null : booking.getRoom().getId(),
                booking.getRoom() == null ? null : booking.getRoom().getRoomName()
        );
    }
}
