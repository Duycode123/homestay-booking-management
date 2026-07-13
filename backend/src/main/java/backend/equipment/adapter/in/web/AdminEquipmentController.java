package backend.equipment.adapter.in.web;

import backend.common.ApiResponse;
import backend.equipment.adapter.in.web.dto.request.CreateEquipmentRequest;
import backend.equipment.adapter.in.web.dto.request.UpdateEquipmentRequest;
import backend.equipment.adapter.in.web.dto.response.EquipmentResponse;
import backend.equipment.application.port.in.CreateEquipmentUseCase;
import backend.equipment.application.port.in.DeleteEquipmentUseCase;
import backend.equipment.application.port.in.GetEquipmentDetailUseCase;
import backend.equipment.application.port.in.ListEquipmentUseCase;
import backend.equipment.application.port.in.UpdateEquipmentUseCase;
import backend.equipment.application.port.in.command.CreateEquipmentCommand;
import backend.equipment.application.port.in.command.DeleteEquipmentCommand;
import backend.equipment.application.port.in.command.UpdateEquipmentCommand;
import backend.equipment.application.port.in.query.GetEquipmentDetailQuery;
import backend.equipment.application.port.in.query.ListEquipmentQuery;
import backend.equipment.domain.model.EquipmentStatus;
import backend.equipment.domain.model.EquipmentType;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/equipment")
@RequiredArgsConstructor
public class AdminEquipmentController {

    private final ListEquipmentUseCase listEquipmentUseCase;
    private final GetEquipmentDetailUseCase getEquipmentDetailUseCase;
    private final CreateEquipmentUseCase createEquipmentUseCase;
    private final UpdateEquipmentUseCase updateEquipmentUseCase;
    private final DeleteEquipmentUseCase deleteEquipmentUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> getEquipment(
            @RequestParam(required = false) Integer roomId,
            @RequestParam(required = false) EquipmentType type,
            @RequestParam(required = false) EquipmentStatus status,
            Authentication authentication
    ) {
        List<EquipmentResponse> data = listEquipmentUseCase.getEquipment(
                        new ListEquipmentQuery(roomId, type, status, authentication.getName())
                ).stream()
                .map(EquipmentResponse::from)
                .toList();

        return ResponseEntity.ok(success("Lay danh sach thiet bi thanh cong", data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> getEquipmentDetail(
            @PathVariable Integer id,
            Authentication authentication
    ) {
        EquipmentResponse data = EquipmentResponse.from(
                getEquipmentDetailUseCase.getEquipmentDetail(new GetEquipmentDetailQuery(id, authentication.getName()))
        );

        return ResponseEntity.ok(success("Lay chi tiet thiet bi thanh cong", data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EquipmentResponse>> createEquipment(
            @Valid @RequestBody CreateEquipmentRequest request,
            Authentication authentication
    ) {
        EquipmentResponse data = EquipmentResponse.from(createEquipmentUseCase.createEquipment(
                new CreateEquipmentCommand(
                        request.getRoomId(),
                        request.getType(),
                        request.getName(),
                        request.getStatus(),
                        request.getNotes(),
                        authentication.getName()
                )
        ));

        return ResponseEntity.status(201).body(success("Them thiet bi thanh cong", data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> updateEquipment(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateEquipmentRequest request,
            Authentication authentication
    ) {
        EquipmentResponse data = EquipmentResponse.from(updateEquipmentUseCase.updateEquipment(
                new UpdateEquipmentCommand(
                        id,
                        request.getRoomId(),
                        request.getType(),
                        request.getName(),
                        request.getStatus(),
                        request.getNotes(),
                        authentication.getName()
                )
        ));

        return ResponseEntity.ok(success("Cap nhat thiet bi thanh cong", data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEquipment(
            @PathVariable Integer id,
            Authentication authentication
    ) {
        deleteEquipmentUseCase.deleteEquipment(new DeleteEquipmentCommand(id, authentication.getName()));

        return ResponseEntity.ok(success("Xoa thiet bi thanh cong", null));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
