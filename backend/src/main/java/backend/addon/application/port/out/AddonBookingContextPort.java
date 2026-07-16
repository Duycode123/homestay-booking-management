package backend.addon.application.port.out;

import backend.addon.application.model.AddonActor;
import backend.addon.application.model.AddonBookingContext;

import java.math.BigDecimal;
import java.util.Optional;

public interface AddonBookingContextPort {
    Optional<Integer> findRoomTierId(Integer roomId);

    Optional<AddonBookingContext> loadBookingForUpdate(Integer bookingId);

    Optional<AddonActor> findActor(String email);

    boolean canStaffAccessBooking(String email, Integer bookingId);

    void addDeliveredAddonAmount(Integer bookingId, BigDecimal amount);
}
