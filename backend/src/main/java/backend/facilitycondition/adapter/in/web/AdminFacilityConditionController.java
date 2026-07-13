package backend.facilitycondition.adapter.in.web;

import backend.common.ApiResponse;
import backend.facilitycondition.adapter.in.web.dto.request.UpdateFacilityConditionReportStatusRequest;
import backend.facilitycondition.adapter.in.web.dto.response.FacilityConditionReportResponse;
import backend.facilitycondition.application.port.in.GetFacilityConditionHistoryUseCase;
import backend.facilitycondition.application.port.in.UpdateFacilityConditionReportStatusUseCase;
import backend.facilitycondition.application.port.in.command.UpdateFacilityConditionReportStatusCommand;
import backend.facilitycondition.application.port.in.query.FacilityConditionHistoryQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/facility")
@RequiredArgsConstructor
public class AdminFacilityConditionController {

    private final GetFacilityConditionHistoryUseCase getFacilityConditionHistoryUseCase;
    private final UpdateFacilityConditionReportStatusUseCase updateFacilityConditionReportStatusUseCase;

    @GetMapping("/condition-reports")
    public ResponseEntity<ApiResponse<List<FacilityConditionReportResponse>>> getConditionReports(
            @RequestParam(required = false) Integer roomId,
            @RequestParam(required = false) Integer equipmentId,
            @RequestParam(required = false) Boolean maintenanceSuggested,
            @RequestParam(required = false) Integer limit
    ) {
        List<FacilityConditionReportResponse> data = getFacilityConditionHistoryUseCase
                .getHistory(new FacilityConditionHistoryQuery(roomId, equipmentId, maintenanceSuggested, limit))
                .stream()
                .map(FacilityConditionReportResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.<List<FacilityConditionReportResponse>>builder()
                .success(true)
                .message("Danh sach lich su ghi nhan tinh trang co so vat chat")
                .data(data)
                .build());
    }

    @PatchMapping("/condition-reports/{reportId}/status")
    public ResponseEntity<ApiResponse<FacilityConditionReportResponse>> updateConditionReportStatus(
            @PathVariable UUID reportId,
            @RequestBody UpdateFacilityConditionReportStatusRequest request
    ) {
        FacilityConditionReportResponse data = FacilityConditionReportResponse.from(
                updateFacilityConditionReportStatusUseCase.updateReportStatus(
                        new UpdateFacilityConditionReportStatusCommand(
                                reportId,
                                request.status(),
                                request.adminNote()
                        )
                )
        );

        return ResponseEntity.ok(ApiResponse.<FacilityConditionReportResponse>builder()
                .success(true)
                .message("Da cap nhat trang thai xu ly bao cao co so vat chat")
                .data(data)
                .build());
    }
}
