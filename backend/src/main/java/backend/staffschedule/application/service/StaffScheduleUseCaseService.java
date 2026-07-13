package backend.staffschedule.application.service;

import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import backend.staffschedule.application.port.in.GetMyShiftBookingsUseCase;
import backend.staffschedule.application.port.in.GetMyStaffScheduleUseCase;
import backend.staffschedule.application.port.in.query.GetMyShiftBookingsQuery;
import backend.staffschedule.application.port.in.query.GetMyStaffScheduleQuery;
import backend.staffschedule.application.port.out.LoadStaffSchedulePort;
import backend.staffschedule.domain.model.StaffShift;
import backend.staffschedule.domain.model.StaffShiftBooking;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffScheduleUseCaseService implements GetMyStaffScheduleUseCase, GetMyShiftBookingsUseCase {

    private final LoadStaffSchedulePort loadStaffSchedulePort;

    @Override
    public List<StaffShift> getMySchedule(GetMyStaffScheduleQuery query) {
        Integer staffId = currentStaffId(query.staffEmail());
        LocalDate fromDate = query.fromDate() == null ? startOfCurrentWeek() : query.fromDate();
        LocalDate toDate = query.toDate() == null ? fromDate.plusDays(6) : query.toDate();

        if (fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("fromDate khong duoc sau toDate");
        }

        return loadStaffSchedulePort.loadShifts(staffId, fromDate, toDate);
    }

    @Override
    public List<StaffShiftBooking> getMyShiftBookings(GetMyShiftBookingsQuery query) {
        if (query.shiftId() == null) {
            throw new IllegalArgumentException("shiftId khong duoc de trong");
        }

        Integer staffId = currentStaffId(query.staffEmail());
        StaffShift shift = loadStaffSchedulePort.loadShift(query.shiftId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ca lam"));

        if (!staffId.equals(shift.staffId())) {
            throw new ForbiddenException("Ban chi duoc xem lich lam viec cua minh");
        }

        return loadStaffSchedulePort.loadBookingsInShiftWindow(shift.startsAt(), shift.endsAt());
    }

    private Integer currentStaffId(String email) {
        if (email == null || email.isBlank()) {
            throw new ForbiddenException("Ban can dang nhap bang tai khoan nhan vien");
        }

        return loadStaffSchedulePort.loadStaffIdByAccountEmail(email)
                .orElseThrow(() -> new ForbiddenException("Chi nhan vien moi duoc xem lich lam viec"));
    }

    private LocalDate startOfCurrentWeek() {
        LocalDate today = LocalDate.now();
        return today.minusDays(today.getDayOfWeek().getValue() - DayOfWeek.MONDAY.getValue());
    }
}
