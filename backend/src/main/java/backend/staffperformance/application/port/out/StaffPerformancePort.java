package backend.staffperformance.application.port.out;

import backend.staffperformance.application.model.AttendancePerformanceRow;
import backend.staffperformance.application.model.StaffPerformanceActor;
import backend.staffperformance.application.model.StaffPerformanceReview;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface StaffPerformancePort {
    Optional<StaffPerformanceActor> loadActorByEmail(String email);

    List<AttendancePerformanceRow> loadAttendanceRows(Integer staffId, LocalDateTime fromInclusive, LocalDateTime toExclusive);

    List<StaffPerformanceReview> loadReviews(Integer staffId, LocalDateTime fromInclusive, LocalDateTime toExclusive);
}
