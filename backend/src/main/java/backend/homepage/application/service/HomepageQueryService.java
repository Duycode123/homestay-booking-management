package backend.homepage.application.service;

import backend.homepage.application.model.HomepageRecentActivity;
import backend.homepage.application.port.in.GetRecentHomepageActivitiesUseCase;
import backend.homepage.application.port.out.LoadRecentHomepageBookingsPort;
import backend.homepage.application.port.out.model.RecentHomepageBooking;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomepageQueryService implements GetRecentHomepageActivitiesUseCase {

    private static final int ACTIVITY_LIMIT = 6;

    private final LoadRecentHomepageBookingsPort loadRecentHomepageBookingsPort;

    @Override
    public List<HomepageRecentActivity> getRecentActivities() {
        return loadRecentHomepageBookingsPort.loadRecentBookings(ACTIVITY_LIMIT)
                .stream()
                .map(this::mapActivity)
                .toList();
    }

    private HomepageRecentActivity mapActivity(RecentHomepageBooking booking) {
        return new HomepageRecentActivity(
                "booking-" + booking.bookingId(),
                booking.customerName(),
                booking.roomName(),
                booking.state().name(),
                booking.occurredAt()
        );
    }
}
