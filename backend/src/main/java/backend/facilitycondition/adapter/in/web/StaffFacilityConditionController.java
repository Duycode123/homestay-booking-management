package backend.facilitycondition.adapter.in.web;

import backend.common.ApiResponse;
import backend.facilitycondition.adapter.in.web.dto.request.RecordFacilityConditionRequest;
import backend.facilitycondition.adapter.in.web.dto.request.UpdateRoomStatusRequest;
import backend.facilitycondition.adapter.in.web.dto.response.FacilityConditionReportResponse;
import backend.facilitycondition.application.port.in.RecordEquipmentConditionUseCase;
import backend.facilitycondition.application.port.in.RecordRoomConditionUseCase;
import backend.facilitycondition.application.port.in.UpdateRoomStatusUseCase;
import backend.facilitycondition.application.port.in.command.RecordEquipmentConditionCommand;
import backend.facilitycondition.application.port.in.command.RecordRoomConditionCommand;
import backend.facilitycondition.application.port.in.command.UpdateRoomStatusCommand;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff/facility")
@RequiredArgsConstructor
public class StaffFacilityConditionController {

    private final UpdateRoomStatusUseCase updateRoomStatusUseCase;
    private final RecordRoomConditionUseCase recordRoomConditionUseCase;
    private final RecordEquipmentConditionUseCase recordEquipmentConditionUseCase;

    @PostMapping("/rooms/{roomId}/status")
    public ResponseEntity<ApiResponse<FacilityConditionReportResponse>> updateRoomStatus(
            Authentication authentication,
            @PathVariable Integer roomId,
            @RequestBody(required = false) @Valid UpdateRoomStatusRequest request
    ) {
        UpdateRoomStatusRequest safeRequest = request == null ? new UpdateRoomStatusRequest() : request;
        FacilityConditionReportResponse data = FacilityConditionReportResponse.from(
                updateRoomStatusUseCase.updateRoomStatus(new UpdateRoomStatusCommand(
                        authentication.getName(),
                        roomId,
                        safeRequest.getStatus(),
                        safeRequest.getNote(),
                        safeRequest.getImageUrl()
                ))
        );

        return ResponseEntity.ok(success("Da cap nhat trang thai phong", data));
    }

    @PostMapping("/rooms/{roomId}/condition")
    public ResponseEntity<ApiResponse<FacilityConditionReportResponse>> recordRoomCondition(
            Authentication authentication,
            @PathVariable Integer roomId,
            @RequestBody(required = false) @Valid RecordFacilityConditionRequest request
    ) {
        RecordFacilityConditionRequest safeRequest = request == null ? new RecordFacilityConditionRequest() : request;
        FacilityConditionReportResponse data = FacilityConditionReportResponse.from(
                recordRoomConditionUseCase.recordRoomCondition(new RecordRoomConditionCommand(
                        authentication.getName(),
                        roomId,
                        safeRequest.getCondition(),
                        safeRequest.getNote(),
                        safeRequest.getImageUrl()
                ))
        );

        return ResponseEntity.ok(success("Da ghi nhan tinh trang phong", data));
    }

    @PostMapping("/equipment/{equipmentId}/condition")
    public ResponseEntity<ApiResponse<FacilityConditionReportResponse>> recordEquipmentCondition(
            Authentication authentication,
            @PathVariable Integer equipmentId,
            @RequestBody(required = false) @Valid RecordFacilityConditionRequest request
    ) {
        RecordFacilityConditionRequest safeRequest = request == null ? new RecordFacilityConditionRequest() : request;
        FacilityConditionReportResponse data = FacilityConditionReportResponse.from(
                recordEquipmentConditionUseCase.recordEquipmentCondition(new RecordEquipmentConditionCommand(
                        authentication.getName(),
                        equipmentId,
                        safeRequest.getCondition(),
                        safeRequest.getNote(),
                        safeRequest.getImageUrl()
                ))
        );

        return ResponseEntity.ok(success(
                data.maintenanceSuggested()
                        ? "Da ghi nhan thiet bi hong va tao de xuat bao tri"
                        : "Da ghi nhan tinh trang thiet bi",
                data
        ));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
