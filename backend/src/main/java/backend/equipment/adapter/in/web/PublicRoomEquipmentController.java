package backend.equipment.adapter.in.web;

import backend.common.ApiResponse;
import backend.equipment.adapter.in.web.dto.response.EquipmentResponse;
import backend.equipment.application.port.in.ListPublicEquipmentUseCase;
import backend.equipment.application.port.in.query.ListPublicEquipmentQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rooms/equipment")
@RequiredArgsConstructor
public class PublicRoomEquipmentController {

    private final ListPublicEquipmentUseCase listPublicEquipmentUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> getPublicEquipment(
            @RequestParam(required = false) Integer roomId
    ) {
        List<EquipmentResponse> data = listPublicEquipmentUseCase.getPublicEquipment(
                        new ListPublicEquipmentQuery(roomId)
                ).stream()
                .map(EquipmentResponse::from)
                .toList();

        return ResponseEntity.ok(success("Lay danh sach thiet bi phong thanh cong", data));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
