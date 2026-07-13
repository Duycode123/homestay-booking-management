package backend.homepage.application.service;

import backend.homepage.application.model.HomepageRecentActivity;
import backend.homepage.application.port.out.LoadRecentHomepageBookingsPort;
import backend.homepage.application.port.out.model.HomepageBookingState;
import backend.homepage.application.port.out.model.RecentHomepageBooking;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HomepageQueryServiceTest {

    @Test
    void mapsPersistenceSnapshotToPublicActivity() {
        LoadRecentHomepageBookingsPort port = mock(LoadRecentHomepageBookingsPort.class);
        LocalDateTime occurredAt = LocalDateTime.of(2026, 7, 13, 10, 30);
        when(port.loadRecentBookings(6)).thenReturn(List.of(
                new RecentHomepageBooking(17, "Nguyen An", "Garden Room", HomepageBookingState.PAID, occurredAt)
        ));

        HomepageQueryService service = new HomepageQueryService(port);

        List<HomepageRecentActivity> result = service.getRecentActivities();

        assertEquals(List.of(new HomepageRecentActivity(
                "booking-17", "Nguyen An", "Garden Room", "PAID", occurredAt
        )), result);
        verify(port).loadRecentBookings(6);
    }
}
