package backend.room.application.port.in;

import backend.dto.response.PagedResponse;
import backend.dto.response.RoomResponse;
import backend.room.application.port.in.query.ListRoomsQuery;

import java.util.List;

public interface ListRoomsUseCase {
    List<RoomResponse> getRooms(ListRoomsQuery query);

    PagedResponse<RoomResponse> getRoomsPage(ListRoomsQuery query);
}
