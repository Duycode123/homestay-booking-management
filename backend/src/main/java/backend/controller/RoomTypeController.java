package backend.controller;

import backend.common.ApiResponse;
import backend.dto.request.CreateRoomTypeRequest;
import backend.dto.request.UpdateRoomTypeRequest;
import backend.dto.response.RoomTypeResponse;
import backend.room.application.port.in.CreateRoomTypeUseCase;
import backend.room.application.port.in.DeleteRoomTypeUseCase;
import backend.room.application.port.in.GetRoomTypeDetailUseCase;
import backend.room.application.port.in.ListRoomTypesUseCase;
import backend.room.application.port.in.UpdateRoomTypeUseCase;
import backend.room.application.port.in.command.CreateRoomTypeCommand;
import backend.room.application.port.in.command.DeleteRoomTypeCommand;
import backend.room.application.port.in.command.UpdateRoomTypeCommand;
import backend.room.application.port.in.query.GetRoomTypeDetailQuery;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/room-types")
@RequiredArgsConstructor
public class RoomTypeController {

    private final ListRoomTypesUseCase listRoomTypesUseCase;
    private final GetRoomTypeDetailUseCase getRoomTypeDetailUseCase;
    private final CreateRoomTypeUseCase createRoomTypeUseCase;
    private final UpdateRoomTypeUseCase updateRoomTypeUseCase;
    private final DeleteRoomTypeUseCase deleteRoomTypeUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoomTypeResponse>>> getRoomTypes() {
        return ResponseEntity.ok(ApiResponse.<List<RoomTypeResponse>>builder()
                .success(true)
                .message("Lấy danh sách loại phòng thành công")
                .data(listRoomTypesUseCase.getRoomTypes())
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomTypeResponse>> getRoomType(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.<RoomTypeResponse>builder()
                .success(true)
                .message("Lấy thông tin loại phòng thành công")
                .data(getRoomTypeDetailUseCase.getRoomType(new GetRoomTypeDetailQuery(id)))
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoomTypeResponse>> createRoomType(
            @Valid @RequestBody CreateRoomTypeRequest request,
            Authentication authentication
    ) {
        RoomTypeResponse roomType = createRoomTypeUseCase.createRoomType(new CreateRoomTypeCommand(
                request.getTypeName(),
                request.getDescription(),
                request.getPricePerHour(),
                authentication.getName()
        ));

        return ResponseEntity.status(201).body(ApiResponse.<RoomTypeResponse>builder()
                .success(true)
                .message("Thêm loại phòng thành công")
                .data(roomType)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomTypeResponse>> updateRoomType(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateRoomTypeRequest request,
            Authentication authentication
    ) {
        RoomTypeResponse roomType = updateRoomTypeUseCase.updateRoomType(new UpdateRoomTypeCommand(
                id,
                request.getTypeName(),
                request.getDescription(),
                request.getPricePerHour(),
                authentication.getName()
        ));

        return ResponseEntity.ok(ApiResponse.<RoomTypeResponse>builder()
                .success(true)
                .message("Cập nhật loại phòng thành công")
                .data(roomType)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRoomType(
            @PathVariable Integer id,
            Authentication authentication
    ) {
        deleteRoomTypeUseCase.deleteRoomType(new DeleteRoomTypeCommand(id, authentication.getName()));

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa loại phòng thành công")
                .build());
    }
}
