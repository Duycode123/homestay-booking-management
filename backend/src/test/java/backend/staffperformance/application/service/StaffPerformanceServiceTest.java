package backend.staffperformance.application.service;

import backend.entity.Role;
import backend.exception.ForbiddenException;
import backend.staffperformance.application.model.AttendancePerformanceRow;
import backend.staffperformance.application.model.StaffPerformanceActor;
import backend.staffperformance.application.model.StaffPerformanceReport;
import backend.staffperformance.application.model.StaffPerformanceReview;
import backend.staffperformance.application.port.in.query.GetMyStaffPerformanceQuery;
import backend.staffperformance.application.port.out.StaffPerformancePort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffPerformanceServiceTest {

    @Mock
    private StaffPerformancePort staffPerformancePort;

    private StaffPerformanceService service;

    @BeforeEach
    void setUp() {
        service = new StaffPerformanceService(staffPerformancePort);
    }

    @Test
    void getMyPerformanceSummarizesDoneHoursLateMissingAndReviews() {
        when(staffPerformancePort.loadActorByEmail("staff@example.com"))
                .thenReturn(Optional.of(new StaffPerformanceActor(1, 9, Role.STAFF)));
        when(staffPerformancePort.loadAttendanceRows(eq(9), any(), any())).thenReturn(List.of(
                new AttendancePerformanceRow(
                        "DONE",
                        LocalDateTime.of(2026, 7, 1, 8, 5),
                        new BigDecimal("4.25"),
                        LocalTime.of(8, 0)
                ),
                new AttendancePerformanceRow(
                        "DONE",
                        LocalDateTime.of(2026, 7, 2, 7, 55),
                        new BigDecimal("3.75"),
                        LocalTime.of(8, 0)
                ),
                new AttendancePerformanceRow(
                        "MISSING_CHECKOUT",
                        LocalDateTime.of(2026, 7, 3, 8, 0),
                        null,
                        LocalTime.of(8, 0)
                )
        ));
        when(staffPerformancePort.loadReviews(eq(9), any(), any())).thenReturn(List.of(
                new StaffPerformanceReview(5, "Ho tro tot", 101, LocalDateTime.of(2026, 7, 2, 12, 0)),
                new StaffPerformanceReview(4, "Phong sach", 102, LocalDateTime.of(2026, 7, 3, 12, 0))
        ));

        StaffPerformanceReport report = service.getMyPerformance(new GetMyStaffPerformanceQuery(
                "staff@example.com",
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 7, 31)
        ));

        assertEquals(2, report.worklog().totalShifts());
        assertEquals(new BigDecimal("8.00"), report.worklog().totalHours());
        assertEquals(1, report.worklog().lateCount());
        assertEquals(1, report.worklog().missingCheckout());
        assertEquals(new BigDecimal("4.50"), report.reviews().avgRating());
        assertEquals(2, report.reviews().items().size());
    }

    @Test
    void getMyPerformanceRejectsNonStaff() {
        when(staffPerformancePort.loadActorByEmail("admin@example.com"))
                .thenReturn(Optional.of(new StaffPerformanceActor(1, null, Role.ADMIN)));

        assertThrows(
                ForbiddenException.class,
                () -> service.getMyPerformance(new GetMyStaffPerformanceQuery(
                        "admin@example.com",
                        LocalDate.of(2026, 7, 1),
                        LocalDate.of(2026, 7, 31)
                ))
        );
    }
}
