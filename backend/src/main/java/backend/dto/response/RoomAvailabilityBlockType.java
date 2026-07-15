package backend.dto.response;

/**
 * Public, non-sensitive reason why a requested room period is blocked.
 */
public enum RoomAvailabilityBlockType {
    PAYMENT_HOLD,
    BOOKED
}
