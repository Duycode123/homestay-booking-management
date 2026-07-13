package backend.homepage.application.service;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.homepage.application.model.HomepageRecentActivity;
import backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomepageQueryService {

    private final BookingRepository bookingRepository;

    public List<HomepageRecentActivity> getRecentActivities() {
        return bookingRepository.findTop10ByStatusNotOrderByCreatedAtDesc(BookingStatus.CANCELLED)
                .stream()
                .map(this::mapActivity)
                .limit(6)
                .toList();
    }

    private HomepageRecentActivity mapActivity(Booking booking) {
        return new HomepageRecentActivity(
                "booking-" + booking.getId(),
                booking.getCustomer() == null ? "" : booking.getCustomer().getFullName(),
                booking.getRoom() == null ? "" : booking.getRoom().getRoomName(),
                mapAction(booking.getStatus()),
                booking.getCreatedAt() == null ? booking.getStartTime() : booking.getCreatedAt()
        );
    }

    private String mapAction(BookingStatus status) {
        if (status == BookingStatus.DEPOSIT_PAID || status == BookingStatus.PAID) {
            return "PAID";
        }

        if (status == BookingStatus.CHECKED_IN || status == BookingStatus.COMPLETED) {
            return "CHECKED_IN";
        }

        return "BOOKED";
    }
}
