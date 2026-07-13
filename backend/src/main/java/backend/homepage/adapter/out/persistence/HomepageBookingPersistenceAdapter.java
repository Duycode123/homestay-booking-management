package backend.homepage.adapter.out.persistence;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.homepage.application.port.out.LoadRecentHomepageBookingsPort;
import backend.homepage.application.port.out.model.HomepageBookingState;
import backend.homepage.application.port.out.model.RecentHomepageBooking;
import backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class HomepageBookingPersistenceAdapter implements LoadRecentHomepageBookingsPort {

    private final BookingRepository bookingRepository;

    @Override
    public List<RecentHomepageBooking> loadRecentBookings(int limit) {
        return bookingRepository.findTop10ByStatusNotOrderByCreatedAtDesc(BookingStatus.CANCELLED)
                .stream()
                .limit(limit)
                .map(this::toSnapshot)
                .toList();
    }

    private RecentHomepageBooking toSnapshot(Booking booking) {
        return new RecentHomepageBooking(
                booking.getId(),
                booking.getCustomer() == null ? "" : booking.getCustomer().getFullName(),
                booking.getRoom() == null ? "" : booking.getRoom().getRoomName(),
                toState(booking.getStatus()),
                booking.getCreatedAt() == null ? booking.getStartTime() : booking.getCreatedAt()
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
