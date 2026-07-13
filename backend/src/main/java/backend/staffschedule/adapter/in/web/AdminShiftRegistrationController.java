package backend.staffschedule.adapter.in.web;

import backend.common.ApiResponse;
import backend.staffschedule.adapter.in.web.dto.DecideShiftRegistrationRequest;
import backend.staffschedule.adapter.in.web.dto.ShiftRegistrationResponse;
import backend.staffschedule.application.port.in.DecideShiftRegistrationUseCase;
import backend.staffschedule.application.port.in.ListShiftRegistrationsForAdminUseCase;
import backend.staffschedule.application.port.in.command.DecideShiftRegistrationCommand;
import backend.staffschedule.application.port.in.query.ListShiftRegistrationsQuery;
import backend.staffschedule.domain.model.ShiftRegistrationStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/shift-registrations")
@RequiredArgsConstructor
public class AdminShiftRegistrationController {

    private final ListShiftRegistrationsForAdminUseCase listShiftRegistrationsForAdminUseCase;
    private final DecideShiftRegistrationUseCase decideShiftRegistrationUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShiftRegistrationResponse>>> getShiftRegistrations(
            @RequestParam(required = false) ShiftRegistrationStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Integer staffId
    ) {
        List<ShiftRegistrationResponse> data = listShiftRegistrationsForAdminUseCase.listShiftRegistrations(
                        new ListShiftRegistrationsQuery(status, fromDate, toDate, staffId)
                )
                .stream()
                .map(ShiftRegistrationResponse::from)
                .toList();

        return ResponseEntity.ok(success("Lay danh sach dang ky ca lam thanh cong", data));
    }

    @PatchMapping("/{registrationId}/decision")
    public ResponseEntity<ApiResponse<ShiftRegistrationResponse>> decideShiftRegistration(
            Authentication authentication,
            @PathVariable Integer registrationId,
            @Valid @RequestBody DecideShiftRegistrationRequest request
    ) {
        ShiftRegistrationResponse data = ShiftRegistrationResponse.from(
                decideShiftRegistrationUseCase.decideShiftRegistration(new DecideShiftRegistrationCommand(
                        registrationId,
                        authentication.getName(),
                        request.approved(),
                        request.rejectionReason()
                ))
        );

        return ResponseEntity.ok(success("Cap nhat trang thai dang ky ca lam thanh cong", data));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
