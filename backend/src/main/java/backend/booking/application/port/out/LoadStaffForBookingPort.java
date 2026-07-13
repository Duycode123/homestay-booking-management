package backend.booking.application.port.out;

import backend.entity.Staff;

import java.util.Optional;

public interface LoadStaffForBookingPort {
    Optional<Staff> loadStaffByAccountEmail(String email);
}
