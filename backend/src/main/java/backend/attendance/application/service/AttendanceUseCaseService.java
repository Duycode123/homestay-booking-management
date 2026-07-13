package backend.attendance.application.service;

import backend.attendance.application.model.AttendanceActor;
import backend.attendance.application.port.in.CheckInShiftUseCase;
import backend.attendance.application.port.in.CheckOutShiftUseCase;
import backend.attendance.application.port.in.GetCurrentShiftAttendanceUseCase;
import backend.attendance.application.port.in.command.CheckInShiftCommand;
import backend.attendance.application.port.in.command.CheckOutShiftCommand;
import backend.attendance.application.port.in.query.GetCurrentShiftAttendanceQuery;
import backend.attendance.application.port.out.AttendanceActorPort;
import backend.attendance.application.port.out.AttendanceRecordPort;
import backend.attendance.application.port.out.StaffShiftPort;
import backend.attendance.domain.model.AttendanceRecord;
import backend.attendance.domain.model.AttendanceStatus;
import backend.attendance.domain.model.StaffShift;
import backend.entity.Role;
import backend.exception.ForbiddenException;
import backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceUseCaseService implements CheckInShiftUseCase, CheckOutShiftUseCase, GetCurrentShiftAttendanceUseCase {

    private final AttendanceActorPort attendanceActorPort;
    private final StaffShiftPort staffShiftPort;
    private final AttendanceRecordPort attendanceRecordPort;
    private final Clock clock;

    @Override
    public Optional<AttendanceRecord> getCurrentAttendance(GetCurrentShiftAttendanceQuery query) {
        AttendanceActor actor = loadStaffActor(query.currentUserEmail());
        LocalDateTime now = LocalDateTime.now(clock);
        return staffShiftPort.loadCurrentShift(actor.staffId(), now)
                .flatMap(shift -> attendanceRecordPort.loadLatestAttendanceForShift(actor.staffId(), shift.id()));
    }

    @Override
    @Transactional
    public AttendanceRecord checkIn(CheckInShiftCommand command) {
        AttendanceActor actor = loadStaffActor(command.currentUserEmail());
        LocalDateTime now = LocalDateTime.now(clock);
        StaffShift currentShift = staffShiftPort.loadCurrentShift(actor.staffId(), now)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay ca hien tai"));

        if (attendanceRecordPort.existsWorkingAttendance(actor.staffId(), currentShift.id())) {
            throw new IllegalStateException("Ban da check-in ca nay");
        }

        if (attendanceRecordPort.existsAttendanceForShift(actor.staffId(), currentShift.id())) {
            throw new IllegalStateException("Ca nay da duoc cham cong");
        }

        AttendanceRecord attendanceRecord = AttendanceRecord.builder()
                .id(UUID.randomUUID())
                .staffId(actor.staffId())
                .shiftId(currentShift.id())
                .checkInTime(now)
                .status(AttendanceStatus.WORKING)
                .build();

        return attendanceRecordPort.save(attendanceRecord);
    }

    @Override
    @Transactional
    public AttendanceRecord checkOut(CheckOutShiftCommand command) {
        AttendanceActor actor = loadStaffActor(command.currentUserEmail());
        LocalDateTime now = LocalDateTime.now(clock);
        AttendanceRecord workingAttendance = attendanceRecordPort.loadWorkingAttendance(actor.staffId())
                .orElseThrow(() -> new IllegalStateException("Chua co check-in cho ca hien tai"));

        if (now.isBefore(workingAttendance.checkInTime())) {
            throw new IllegalStateException("Thoi diem check-out phai sau check-in");
        }

        AttendanceRecord completedAttendance = workingAttendance.toBuilder()
                .checkOutTime(now)
                .workDurationHours(calculateDurationHours(workingAttendance.checkInTime(), now))
                .status(AttendanceStatus.DONE)
                .build();

        return attendanceRecordPort.save(completedAttendance);
    }

    @Scheduled(cron = "${app.attendance.missing-checkout-cron:0 55 23 * * *}")
    @Transactional
    public void markMissingCheckoutsAtEndOfDay() {
        attendanceRecordPort.markMissingCheckoutsBefore(LocalDateTime.now(clock).toLocalDate().plusDays(1).atStartOfDay());
    }

    private AttendanceActor loadStaffActor(String currentUserEmail) {
        String normalizedEmail = normalizeRequired(currentUserEmail, "Nguoi dung hien tai khong hop le");
        AttendanceActor actor = attendanceActorPort.loadActorByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));

        if (actor.role() != Role.STAFF || actor.staffId() == null) {
            throw new ForbiddenException("Chi nhan vien moi duoc check-in/check-out ca lam");
        }

        return actor;
    }

    private BigDecimal calculateDurationHours(LocalDateTime checkInTime, LocalDateTime checkOutTime) {
        long seconds = Duration.between(checkInTime, checkOutTime).getSeconds();
        return BigDecimal.valueOf(seconds)
                .divide(BigDecimal.valueOf(3600), 2, RoundingMode.HALF_UP);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }
}
