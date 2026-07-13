package backend.support.domain.model;

public record SupportBooking(
        Integer id,
        String bookingCode,
        Integer roomId,
        String roomName
) {
}
