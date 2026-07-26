package backend.staffschedule.application.service;

import backend.staffschedule.application.port.in.command.DecideShiftRegistrationCommand;
import backend.staffschedule.application.port.in.command.ShiftRegistrationSlotCommand;
import backend.staffschedule.application.port.in.command.SubmitShiftRegistrationsCommand;
import backend.staffschedule.application.port.out.ShiftAssignmentPort;
import backend.staffschedule.application.port.out.ShiftRegistrationActorPort;
import backend.staffschedule.application.port.out.ShiftRegistrationPort;
import backend.staffschedule.domain.model.ShiftRegistration;
import backend.staffschedule.domain.model.ShiftRegistrationStatus;
import backend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShiftRegistrationUseCaseServiceTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 7, 16, 9, 0);

    @Mock
    private ShiftRegistrationActorPort actorPort;

    @Mock
    private ShiftRegistrationPort registrationPort;

    @Mock
    private ShiftAssignmentPort assignmentPort;

    private ShiftRegistrationUseCaseService service;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(NOW.atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant(),
                ZoneId.of("Asia/Ho_Chi_Minh"));
        service = new ShiftRegistrationUseCaseService(actorPort, registrationPort, assignmentPort, clock);
    }

    @Test
    void locksStaffDayBeforeCheckingAndSavingRegistration() {
        LocalDate workDate = LocalDate.of(2026, 7, 20);
        ShiftRegistrationSlotCommand slot = new ShiftRegistrationSlotCommand(
                workDate,
                LocalTime.of(8, 0),
                LocalTime.of(12, 0)
        );
        when(actorPort.loadStaffIdByAccountEmail("staff@example.com")).thenReturn(Optional.of(5));
        when(registrationPort.save(org.mockito.ArgumentMatchers.any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.submitShiftRegistrations(new SubmitShiftRegistrationsCommand(
                "staff@example.com",
                List.of(slot)
        ));

        InOrder order = inOrder(assignmentPort, registrationPort);
        order.verify(assignmentPort).lockStaffSchedule(5, workDate);
        order.verify(registrationPort).existsOverlappingPendingOrApprovedRegistration(
                5, workDate, slot.startTime(), slot.endTime()
        );
        order.verify(assignmentPort).existsOverlappingAssignedShift(
                5, workDate, slot.startTime(), slot.endTime()
        );
        order.verify(registrationPort).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void secondAdminSeesDecisionCommittedByFirstAdminAfterLock() {
        ShiftRegistration pendingSnapshot = registration(ShiftRegistrationStatus.PENDING, null);
        ShiftRegistration approvedAfterLock = registration(ShiftRegistrationStatus.APPROVED, 91);

        when(actorPort.loadAccountIdByEmail("admin@example.com")).thenReturn(Optional.of(92));
        when(registrationPort.loadRegistration(44)).thenReturn(Optional.of(pendingSnapshot));
        when(registrationPort.loadRegistrationForUpdate(44)).thenReturn(Optional.of(approvedAfterLock));

        assertThrows(IllegalStateException.class, () -> service.decideShiftRegistration(
                new DecideShiftRegistrationCommand(44, "admin@example.com", true, null)
        ));

        verify(assignmentPort).lockStaffSchedule(5, pendingSnapshot.workDate());
        verify(registrationPort, never()).updateDecision(org.mockito.ArgumentMatchers.any());
        verify(assignmentPort, never()).createAssignedShift(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void approvalAssignsTheSelectedAccommodationToTheNewShift() {
        ShiftRegistration pending = registration(ShiftRegistrationStatus.PENDING, null);
        when(actorPort.loadAccountIdByEmail("admin@example.com")).thenReturn(Optional.of(92));
        when(registrationPort.loadRegistration(44)).thenReturn(Optional.of(pending));
        when(registrationPort.loadRegistrationForUpdate(44)).thenReturn(Optional.of(pending));
        when(assignmentPort.isRoomAssignable(8)).thenReturn(true);
        when(registrationPort.updateDecision(org.mockito.ArgumentMatchers.any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.decideShiftRegistration(
                new DecideShiftRegistrationCommand(44, "admin@example.com", true, null, 8)
        );

        verify(assignmentPort).createAssignedShift(
                5,
                pending.workDate(),
                pending.startTime(),
                pending.endTime(),
                8
        );
    }

    @Test
    void approvalRejectsAccommodationWithoutValidCheckInLocation() {
        ShiftRegistration pending = registration(ShiftRegistrationStatus.PENDING, null);
        when(actorPort.loadAccountIdByEmail("admin@example.com")).thenReturn(Optional.of(92));
        when(registrationPort.loadRegistration(44)).thenReturn(Optional.of(pending));
        when(registrationPort.loadRegistrationForUpdate(44)).thenReturn(Optional.of(pending));
        when(assignmentPort.isRoomAssignable(8)).thenReturn(false);

        assertThrows(
                ResourceNotFoundException.class,
                () -> service.decideShiftRegistration(
                        new DecideShiftRegistrationCommand(44, "admin@example.com", true, null, 8)
                )
        );

        verify(registrationPort, never()).updateDecision(org.mockito.ArgumentMatchers.any());
    }

    private ShiftRegistration registration(ShiftRegistrationStatus status, Integer reviewerId) {
        return new ShiftRegistration(
                44,
                5,
                "Nhan vien A",
                "staff@example.com",
                LocalDate.of(2026, 7, 20),
                LocalTime.of(8, 0),
                LocalTime.of(12, 0),
                status,
                reviewerId,
                reviewerId == null ? null : NOW,
                null,
                NOW.minusDays(1),
                NOW
        );
    }
}
