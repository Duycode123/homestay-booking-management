package backend.attendance.application.service;

import backend.attendance.application.model.AttendanceActor;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttendanceUseCaseServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 7, 3, 9, 0);

    @Mock
    private AttendanceActorPort attendanceActorPort;

    @Mock
    private StaffShiftPort staffShiftPort;

    @Mock
    private AttendanceRecordPort attendanceRecordPort;

    private AttendanceUseCaseService attendanceUseCaseService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);
        attendanceUseCaseService = new AttendanceUseCaseService(
                attendanceActorPort,
                staffShiftPort,
                attendanceRecordPort,
                fixedClock
        );
    }

    @Test
    void checkInCreatesWorkingAttendanceForCurrentShift() {
        when(attendanceActorPort.loadActorByEmail("staff@example.com"))
                .thenReturn(Optional.of(new AttendanceActor(7, 3, Role.STAFF)));
        when(staffShiftPort.loadCurrentShift(3, NOW)).thenReturn(Optional.of(currentShift()));
        when(attendanceRecordPort.existsWorkingAttendance(3, 12)).thenReturn(false);
        when(attendanceRecordPort.existsAttendanceForShift(3, 12)).thenReturn(false);
        when(attendanceRecordPort.save(any(AttendanceRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AttendanceRecord attendanceRecord = attendanceUseCaseService.checkIn(
                new CheckInShiftCommand("staff@example.com")
        );

        ArgumentCaptor<AttendanceRecord> attendanceCaptor = ArgumentCaptor.forClass(AttendanceRecord.class);
        verify(attendanceRecordPort).save(attendanceCaptor.capture());

        assertEquals(3, attendanceRecord.staffId());
        assertEquals(12, attendanceRecord.shiftId());
        assertEquals(NOW, attendanceRecord.checkInTime());
        assertEquals(AttendanceStatus.WORKING, attendanceRecord.status());
        assertEquals(AttendanceStatus.WORKING, attendanceCaptor.getValue().status());
    }

    @Test
    void checkInRejectsDuplicateWorkingAttendanceForShift() {
        when(attendanceActorPort.loadActorByEmail("staff@example.com"))
                .thenReturn(Optional.of(new AttendanceActor(7, 3, Role.STAFF)));
        when(staffShiftPort.loadCurrentShift(3, NOW)).thenReturn(Optional.of(currentShift()));
        when(attendanceRecordPort.existsWorkingAttendance(3, 12)).thenReturn(true);

        assertThrows(
                IllegalStateException.class,
                () -> attendanceUseCaseService.checkIn(new CheckInShiftCommand("staff@example.com"))
        );
        verify(attendanceRecordPort, never()).save(any());
    }

    @Test
    void checkInRejectsShiftThatAlreadyHasCompletedAttendance() {
        when(attendanceActorPort.loadActorByEmail("staff@example.com"))
                .thenReturn(Optional.of(new AttendanceActor(7, 3, Role.STAFF)));
        when(staffShiftPort.loadCurrentShift(3, NOW)).thenReturn(Optional.of(currentShift()));
        when(attendanceRecordPort.existsWorkingAttendance(3, 12)).thenReturn(false);
        when(attendanceRecordPort.existsAttendanceForShift(3, 12)).thenReturn(true);

        assertThrows(
                IllegalStateException.class,
                () -> attendanceUseCaseService.checkIn(new CheckInShiftCommand("staff@example.com"))
        );
        verify(attendanceRecordPort, never()).save(any());
    }

    @Test
    void checkOutCompletesWorkingAttendanceAndCalculatesDuration() {
        UUID attendanceId = UUID.randomUUID();
        AttendanceRecord workingAttendance = AttendanceRecord.builder()
                .id(attendanceId)
                .staffId(3)
                .shiftId(12)
                .checkInTime(LocalDateTime.of(2026, 7, 3, 7, 30))
                .status(AttendanceStatus.WORKING)
                .build();

        when(attendanceActorPort.loadActorByEmail("staff@example.com"))
                .thenReturn(Optional.of(new AttendanceActor(7, 3, Role.STAFF)));
        when(attendanceRecordPort.loadWorkingAttendance(3)).thenReturn(Optional.of(workingAttendance));
        when(attendanceRecordPort.save(any(AttendanceRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AttendanceRecord attendanceRecord = attendanceUseCaseService.checkOut(
                new CheckOutShiftCommand("staff@example.com")
        );

        assertEquals(attendanceId, attendanceRecord.id());
        assertEquals(NOW, attendanceRecord.checkOutTime());
        assertEquals(new BigDecimal("1.50"), attendanceRecord.workDurationHours());
        assertEquals(AttendanceStatus.DONE, attendanceRecord.status());
    }

    @Test
    void getCurrentAttendanceReturnsLatestRecordForCurrentShift() {
        AttendanceRecord attendanceRecord = AttendanceRecord.builder()
                .id(UUID.randomUUID())
                .staffId(3)
                .shiftId(12)
                .checkInTime(NOW.minusMinutes(30))
                .status(AttendanceStatus.WORKING)
                .build();

        when(attendanceActorPort.loadActorByEmail("staff@example.com"))
                .thenReturn(Optional.of(new AttendanceActor(7, 3, Role.STAFF)));
        when(staffShiftPort.loadCurrentShift(3, NOW)).thenReturn(Optional.of(currentShift()));
        when(attendanceRecordPort.loadLatestAttendanceForShift(3, 12)).thenReturn(Optional.of(attendanceRecord));

        Optional<AttendanceRecord> result = attendanceUseCaseService.getCurrentAttendance(
                new GetCurrentShiftAttendanceQuery("staff@example.com")
        );

        assertTrue(result.isPresent());
        assertEquals(attendanceRecord, result.get());
    }

    @Test
    void checkInRejectsNonStaffActor() {
        when(attendanceActorPort.loadActorByEmail("customer@example.com"))
                .thenReturn(Optional.of(new AttendanceActor(8, null, Role.CUSTOMER)));

        assertThrows(
                ForbiddenException.class,
                () -> attendanceUseCaseService.checkIn(new CheckInShiftCommand("customer@example.com"))
        );
        verify(staffShiftPort, never()).loadCurrentShift(any(), any());
    }

    private StaffShift currentShift() {
        return new StaffShift(
                12,
                3,
                LocalDate.of(2026, 7, 3),
                LocalTime.of(8, 0),
                LocalTime.of(12, 0)
        );
    }
}
