package backend.homepage.application.port.out;

import backend.homepage.application.port.out.model.RecentHomepageBooking;

import java.util.List;

public interface LoadRecentHomepageBookingsPort {

    List<RecentHomepageBooking> loadRecentBookings(int limit);
}
