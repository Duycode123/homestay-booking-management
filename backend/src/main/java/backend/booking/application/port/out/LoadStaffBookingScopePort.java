package backend.booking.application.port.out;

import java.util.Set;

/**
 * Resolves the bookings that a staff account may manage from its assigned shifts.
 */
public interface LoadStaffBookingScopePort {

    Set<Integer> loadAccessibleBookingIds(String accountEmail);

    boolean canAccessBooking(String accountEmail, Integer bookingId);
}
