package backend.controller;

import backend.booking.application.port.in.GetRoomAvailabilityUseCase;
import backend.booking.application.port.in.query.GetRoomAvailabilityQuery;
import backend.common.ApiResponse;
import backend.dto.request.CreateRoomRequest;
import backend.dto.request.UpdateRoomRequest;
import backend.dto.response.PagedResponse;
import backend.dto.response.RoomAvailabilityResponse;
import backend.dto.response.RoomResponse;
import backend.entity.RoomStatus;
import backend.room.application.port.in.CreateRoomUseCase;
import backend.room.application.port.in.DeleteRoomUseCase;
import backend.room.application.port.in.GetRoomDetailUseCase;
import backend.room.application.port.in.ListRoomsUseCase;
import backend.room.application.port.in.UpdateRoomStatusUseCase;
import backend.room.application.port.in.UpdateRoomUseCase;
import backend.room.application.port.in.command.CreateRoomCommand;
import backend.room.application.port.in.command.DeleteRoomCommand;
import backend.room.application.port.in.command.UpdateRoomCommand;
import backend.room.application.port.in.command.UpdateRoomStatusCommand;
import backend.room.application.port.in.query.GetRoomDetailQuery;
import backend.room.application.port.in.query.ListRoomsQuery;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final ListRoomsUseCase listRoomsUseCase;
    private final GetRoomDetailUseCase getRoomDetailUseCase;
    private final CreateRoomUseCase createRoomUseCase;
    private final UpdateRoomUseCase updateRoomUseCase;
    private final UpdateRoomStatusUseCase updateRoomStatusUseCase;
    private final DeleteRoomUseCase deleteRoomUseCase;
    private final GetRoomAvailabilityUseCase getRoomAvailabilityUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getRooms(
            @RequestParam(required = false) Integer roomTypeId,
            @RequestParam(required = false) RoomStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        ListRoomsQuery query = new ListRoomsQuery(roomTypeId, status, search, minCapacity, page, size);

        if (page != null || size != null) {
            PagedResponse<RoomResponse> roomsPage = listRoomsUseCase.getRoomsPage(query);
            return ResponseEntity.ok(ApiResponse.<PagedResponse<RoomResponse>>builder()
                    .success(true)
                    .message("Lay danh sach phong thanh cong")
                    .data(roomsPage)
                    .build());
        }

        return ResponseEntity.ok(ApiResponse.<List<RoomResponse>>builder()
                .success(true)
                .message("Lay danh sach phong thanh cong")
                .data(listRoomsUseCase.getRooms(query))
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoom(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.<RoomResponse>builder()
                .success(true)
                .message("Lay thong tin phong thanh cong")
                .data(getRoomDetailUseCase.getRoom(new GetRoomDetailQuery(id)))
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            Authentication authentication
    ) {
        RoomResponse room = createRoomUseCase.createRoom(new CreateRoomCommand(
                request.getRoomName(),
                request.getRoomTypeId(),
                request.getMaxPeople(),
                request.getImageUrl(),
                request.getStatus(),
                authentication.getName()
        ));

        return ResponseEntity.status(201).body(ApiResponse.<RoomResponse>builder()
                .success(true)
                .message("Them phong homestay thanh cong")
                .data(room)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoom(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateRoomRequest request,
            Authentication authentication
    ) {
        RoomResponse room = updateRoomUseCase.updateRoom(new UpdateRoomCommand(
                id,
                request.getRoomName(),
                request.getRoomTypeId(),
                request.getMaxPeople(),
                request.getImageUrl(),
                request.getStatus(),
                authentication.getName()
        ));

        return ResponseEntity.ok(ApiResponse.<RoomResponse>builder()
                .success(true)
                .message("Cap nhat phong homestay thanh cong")
                .data(room)
                .build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoomStatus(
            @PathVariable Integer id,
            @RequestParam RoomStatus status,
            Authentication authentication
    ) {
        RoomResponse room = updateRoomStatusUseCase.updateRoomStatus(new UpdateRoomStatusCommand(
                id,
                status,
                authentication.getName()
        ));

        return ResponseEntity.ok(ApiResponse.<RoomResponse>builder()
                .success(true)
                .message("Cap nhat trang thai phong thanh cong")
                .data(room)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(
            @PathVariable Integer id,
            Authentication authentication
    ) {
        deleteRoomUseCase.deleteRoom(new DeleteRoomCommand(id, authentication.getName()));

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xoa phong homestay thanh cong")
                .build());
    }

    @GetMapping("/{id}/available-slots")
    public ResponseEntity<ApiResponse<RoomAvailabilityResponse>> getAvailableSlots(
            @PathVariable Integer id,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to
    ) {
        return ResponseEntity.ok(ApiResponse.<RoomAvailabilityResponse>builder()
                .success(true)
                .message("Lay lich trong cua phong thanh cong")
                .data(getRoomAvailabilityUseCase.getAvailableSlots(new GetRoomAvailabilityQuery(id, from, to)))
                .build());
    }
}
