package backend.staffschedule.adapter.in.web;

import backend.common.ApiResponse;
import backend.staffschedule.adapter.in.web.dto.ShiftRegistrationResponse;
import backend.staffschedule.adapter.in.web.dto.SubmitShiftRegistrationsRequest;
import backend.staffschedule.application.port.in.GetMyShiftRegistrationsUseCase;
import backend.staffschedule.application.port.in.SubmitShiftRegistrationsUseCase;
import backend.staffschedule.application.port.in.command.ShiftRegistrationSlotCommand;
import backend.staffschedule.application.port.in.command.SubmitShiftRegistrationsCommand;
import backend.staffschedule.application.port.in.query.GetMyShiftRegistrationsQuery;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/staff/shift-registrations")
@RequiredArgsConstructor
public class StaffShiftRegistrationController {

    private final SubmitShiftRegistrationsUseCase submitShiftRegistrationsUseCase;
    private final GetMyShiftRegistrationsUseCase getMyShiftRegistrationsUseCase;

    @PostMapping
    public ResponseEntity<ApiResponse<List<ShiftRegistrationResponse>>> submitRegistrations(
            Authentication authentication,
            @Valid @RequestBody SubmitShiftRegistrationsRequest request
    ) {
        List<ShiftRegistrationResponse> data = submitShiftRegistrationsUseCase.submitShiftRegistrations(
                        new SubmitShiftRegistrationsCommand(
                                authentication.getName(),
                                request.slots().stream()
                                        .map(slot -> new ShiftRegistrationSlotCommand(
                                                slot.workDate(),
                                                slot.startTime(),
                                                slot.endTime()
                                        ))
                                        .toList()
                        )
                )
                .stream()
                .map(ShiftRegistrationResponse::from)
                .toList();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(success("Dang ky ca lam thanh cong", data));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ShiftRegistrationResponse>>> getMyRegistrations(
            Authentication authentication,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        List<ShiftRegistrationResponse> data = getMyShiftRegistrationsUseCase.getMyShiftRegistrations(
                        new GetMyShiftRegistrationsQuery(authentication.getName(), fromDate, toDate)
                )
                .stream()
                .map(ShiftRegistrationResponse::from)
                .toList();

        return ResponseEntity.ok(success("Lay danh sach dang ky ca lam thanh cong", data));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
