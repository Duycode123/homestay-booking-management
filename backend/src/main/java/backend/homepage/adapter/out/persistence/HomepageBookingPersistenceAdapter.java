package backend.homepage.adapter.out.persistence;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentTransactionStatus;
import backend.homepage.application.port.out.LoadRecentHomepageBookingsPort;
import backend.homepage.application.port.out.model.HomepageBookingState;
import backend.homepage.application.port.out.model.RecentHomepageBooking;
import backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class HomepageBookingPersistenceAdapter implements LoadRecentHomepageBookingsPort {

    private final BookingRepository bookingRepository;

    @Override
    public List<RecentHomepageBooking> loadRecentBookings(int limit) {
        return bookingRepository.findRecentPaidHomepageBookings(
                        PaymentTransactionStatus.SUCCEEDED,
                        List.of(
                                BookingStatus.DEPOSIT_PAID,
                                BookingStatus.PAID,
                                BookingStatus.CHECKED_IN,
                                BookingStatus.COMPLETED
                        ),
                        PageRequest.of(0, limit)
                )
                .stream()
                .map(projection -> toSnapshot(projection.getBooking(), projection.getOccurredAt()))
                .toList();
    }

    private RecentHomepageBooking toSnapshot(Booking booking, LocalDateTime occurredAt) {
        return new RecentHomepageBooking(
                booking.getId(),
                booking.getCustomer() == null ? "" : booking.getCustomer().getFullName(),
                booking.getRoom() == null ? "" : booking.getRoom().getRoomName(),
                toState(booking.getStatus()),
                occurredAt == null ? booking.getCreatedAt() : occurredAt
        );
    }

    private HomepageBookingState toState(BookingStatus status) {
        if (status == BookingStatus.DEPOSIT_PAID || status == BookingStatus.PAID) {
            return HomepageBookingState.PAID;
        }
        if (status == BookingStatus.CHECKED_IN || status == BookingStatus.COMPLETED) {
            return HomepageBookingState.CHECKED_IN;
        }
        return HomepageBookingState.BOOKED;
    }
}
