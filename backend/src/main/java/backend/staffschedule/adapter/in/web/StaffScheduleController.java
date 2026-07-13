package backend.staffschedule.adapter.in.web;

import backend.common.ApiResponse;
import backend.staffschedule.adapter.in.web.dto.StaffShiftBookingResponse;
import backend.staffschedule.adapter.in.web.dto.StaffShiftResponse;
import backend.staffschedule.adapter.in.web.mapper.StaffScheduleWebMapper;
import backend.staffschedule.application.port.in.GetMyShiftBookingsUseCase;
import backend.staffschedule.application.port.in.GetMyStaffScheduleUseCase;
import backend.staffschedule.application.port.in.query.GetMyShiftBookingsQuery;
import backend.staffschedule.application.port.in.query.GetMyStaffScheduleQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/staff/schedule")
@RequiredArgsConstructor
public class StaffScheduleController {

    private final GetMyStaffScheduleUseCase getMyStaffScheduleUseCase;
    private final GetMyShiftBookingsUseCase getMyShiftBookingsUseCase;
    private final StaffScheduleWebMapper mapper;

    @GetMapping("/shifts")
    public ResponseEntity<ApiResponse<List<StaffShiftResponse>>> getMyShifts(
            Authentication authentication,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        List<StaffShiftResponse> data = getMyStaffScheduleUseCase.getMySchedule(
                        new GetMyStaffScheduleQuery(authentication.getName(), fromDate, toDate)
                )
                .stream()
                .map(mapper::toResponse)
                .toList();

        return ResponseEntity.ok(success("Lay lich lam viec thanh cong", data));
    }

    @GetMapping("/shifts/{shiftId}/bookings")
    public ResponseEntity<ApiResponse<List<StaffShiftBookingResponse>>> getMyShiftBookings(
            Authentication authentication,
            @PathVariable Integer shiftId
    ) {
        List<StaffShiftBookingResponse> data = getMyShiftBookingsUseCase.getMyShiftBookings(
                        new GetMyShiftBookingsQuery(authentication.getName(), shiftId)
                )
                .stream()
                .map(mapper::toResponse)
                .toList();

        return ResponseEntity.ok(success("Lay lich dat phong trong ca thanh cong", data));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
}
