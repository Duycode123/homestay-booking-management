package backend.booking.application.port.in;

import backend.booking.application.port.in.query.GetRoomAvailabilityQuery;
import backend.dto.response.RoomAvailabilityResponse;

public interface GetRoomAvailabilityUseCase {
    RoomAvailabilityResponse getAvailableSlots(GetRoomAvailabilityQuery query);
}
