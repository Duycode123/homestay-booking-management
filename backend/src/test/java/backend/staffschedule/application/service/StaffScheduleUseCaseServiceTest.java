package backend.staffschedule.application.service;

import backend.exception.ForbiddenException;
import backend.staffschedule.application.port.in.query.GetMyShiftBookingsQuery;
import backend.staffschedule.application.port.in.query.GetMyStaffScheduleQuery;
import backend.staffschedule.application.port.out.LoadStaffSchedulePort;
import backend.staffschedule.domain.model.StaffShift;
import backend.staffschedule.domain.model.StaffShiftBooking;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffScheduleUseCaseServiceTest {

    @Mock
    private LoadStaffSchedulePort loadStaffSchedulePort;

    private StaffScheduleUseCaseService service;

    @BeforeEach
    void setUp() {
        service = new StaffScheduleUseCaseService(loadStaffSchedulePort);
    }

    @Test
    void loadsOnlyCurrentStaffShiftsForRequestedRange() {
        LocalDate fromDate = LocalDate.of(2030, 1, 7);
        LocalDate toDate = LocalDate.of(2030, 1, 13);
        StaffShift shift = new StaffShift(10, 5, fromDate, LocalTime.of(9, 0), LocalTime.of(17, 0));

        when(loadStaffSchedulePort.loadStaffIdByAccountEmail("staff@example.com")).thenReturn(Optional.of(5));
        when(loadStaffSchedulePort.loadShifts(5, fromDate, toDate)).thenReturn(List.of(shift));

        List<StaffShift> result = service.getMySchedule(
                new GetMyStaffScheduleQuery("staff@example.com", fromDate, toDate)
        );

        assertEquals(List.of(shift), result);
        verify(loadStaffSchedulePort).loadShifts(5, fromDate, toDate);
    }

    @Test
    void rejectsWhenCurrentStaffTriesToOpenAnotherStaffShift() {
        StaffShift anotherStaffShift = new StaffShift(
                20,
                9,
                LocalDate.of(2030, 1, 7),
                LocalTime.of(9, 0),
                LocalTime.of(17, 0)
        );

        when(loadStaffSchedulePort.loadStaffIdByAccountEmail("staff@example.com")).thenReturn(Optional.of(5));
        when(loadStaffSchedulePort.loadShift(20)).thenReturn(Optional.of(anotherStaffShift));

        assertThrows(
                ForbiddenException.class,
                () -> service.getMyShiftBookings(new GetMyShiftBookingsQuery("staff@example.com", 20))
        );
    }

    @Test
    void loadsBookingsInsideOwnedShiftWindow() {
        StaffShift ownedShift = new StaffShift(
                20,
                5,
                LocalDate.of(2030, 1, 7),
                LocalTime.of(9, 0),
                LocalTime.of(17, 0)
        );
        StaffShiftBooking booking = new StaffShiftBooking(
                99,
                "Room A",
                "Customer One",
                LocalDateTime.of(2030, 1, 7, 10, 0),
                LocalDateTime.of(2030, 1, 7, 12, 0),
                "PAID",
                "Guitar"
        );

        when(loadStaffSchedulePort.loadStaffIdByAccountEmail("staff@example.com")).thenReturn(Optional.of(5));
        when(loadStaffSchedulePort.loadShift(20)).thenReturn(Optional.of(ownedShift));
        when(loadStaffSchedulePort.loadBookingsInShiftWindow(
                LocalDateTime.of(2030, 1, 7, 9, 0),
                LocalDateTime.of(2030, 1, 7, 17, 0)
        )).thenReturn(List.of(booking));

        List<StaffShiftBooking> result = service.getMyShiftBookings(
                new GetMyShiftBookingsQuery("staff@example.com", 20)
        );

        assertEquals(List.of(booking), result);
        verify(loadStaffSchedulePort).loadBookingsInShiftWindow(
                LocalDateTime.of(2030, 1, 7, 9, 0),
                LocalDateTime.of(2030, 1, 7, 17, 0)
        );
    }
}
