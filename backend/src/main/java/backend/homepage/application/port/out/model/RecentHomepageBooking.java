package backend.homepage.application.port.out.model;

import java.time.LocalDateTime;

public record RecentHomepageBooking(
        Integer bookingId,
        String customerName,
        String roomName,
        HomepageBookingState state,
        LocalDateTime occurredAt
) {
}
