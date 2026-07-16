package backend.addon.adapter.out.persistence;

import backend.addon.application.model.AddonActor;
import backend.addon.application.model.AddonBookingContext;
import backend.addon.application.port.out.AddonBookingContextPort;
import backend.booking.application.port.out.LoadStaffBookingScopePort;
import backend.entity.Booking;
import backend.entity.User;
import backend.repository.BookingRepository;
import backend.repository.RoomRepository;
import backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JpaAddonBookingContextAdapter implements AddonBookingContextPort {
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final LoadStaffBookingScopePort staffBookingScopePort;

    @Override
    public Optional<Integer> findRoomTierId(Integer roomId) {
        return roomRepository.findById(roomId).map(room -> room.getRoomType().getId());
    }

    @Override
    public Optional<AddonBookingContext> loadBookingForUpdate(Integer bookingId) {
        return bookingRepository.findByIdForUpdate(bookingId).map(this::toContext);
    }

    @Override
    public Optional<AddonActor> findActor(String email) {
        return userRepository.findByEmail(email).map(user -> new AddonActor(user.getId(), user.getEmail(), user.getRole().name()));
    }

    @Override
    public boolean canStaffAccessBooking(String email, Integer bookingId) {
        return staffBookingScopePort.canAccessBooking(email, bookingId);
    }

    @Override
    public void addDeliveredAddonAmount(Integer bookingId, BigDecimal amount) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId).orElseThrow();
        booking.setAddonAmount(value(booking.getAddonAmount()).add(amount));
        booking.setTotalAmount(value(booking.getTotalAmount()).add(amount));
        bookingRepository.save(booking);
    }

    private AddonBookingContext toContext(Booking booking) {
        User account = booking.getCustomer().getAccount();
        return new AddonBookingContext(booking.getId(), booking.getRoom().getRoomType().getId(), account.getEmail(),
                booking.getStatus().name(), booking.getTotalAmount(), value(booking.getAddonAmount()));
    }

    private BigDecimal value(BigDecimal value) { return value == null ? BigDecimal.ZERO.setScale(2) : value; }
}
