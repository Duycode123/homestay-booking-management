package backend.staffperformance.application.service;

import backend.entity.Role;
import backend.exception.ForbiddenException;
import backend.staffperformance.application.model.AttendancePerformanceRow;
import backend.staffperformance.application.model.StaffPerformanceActor;
import backend.staffperformance.application.model.StaffPerformanceReport;
import backend.staffperformance.application.model.StaffPerformanceReview;
import backend.staffperformance.application.model.StaffReviewSummary;
import backend.staffperformance.application.model.StaffWorklogSummary;
import backend.staffperformance.application.port.in.GetMyStaffPerformanceUseCase;
import backend.staffperformance.application.port.in.query.GetMyStaffPerformanceQuery;
import backend.staffperformance.application.port.out.StaffPerformancePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffPerformanceService implements GetMyStaffPerformanceUseCase {

    private static final int HOURS_SCALE = 2;
    private static final int RATING_SCALE = 2;

    private final StaffPerformancePort staffPerformancePort;

    @Override
    public StaffPerformanceReport getMyPerformance(GetMyStaffPerformanceQuery query) {
        StaffPerformanceActor actor = loadStaffActor(query.currentUserEmail());
        DateRange dateRange = resolveDateRange(query.fromDate(), query.toDate());
        LocalDateTime fromInclusive = dateRange.fromDate().atStartOfDay();
        LocalDateTime toExclusive = dateRange.toDate().plusDays(1).atStartOfDay();

        List<AttendancePerformanceRow> attendanceRows = staffPerformancePort.loadAttendanceRows(
                actor.staffId(),
                fromInclusive,
                toExclusive
        );
        List<StaffPerformanceReview> reviews = staffPerformancePort.loadReviews(
                actor.staffId(),
                fromInclusive,
                toExclusive
        );

        return new StaffPerformanceReport(
                dateRange.fromDate(),
                dateRange.toDate(),
                summarizeWorklog(attendanceRows),
                summarizeReviews(reviews)
        );
    }

    private StaffPerformanceActor loadStaffActor(String email) {
        String normalizedEmail = normalizeRequired(email, "Khong tim thay nguoi dung dang nhap");
        StaffPerformanceActor actor = staffPerformancePort.loadActorByEmail(normalizedEmail)
                .orElseThrow(() -> new ForbiddenException("Khong tim thay tai khoan nhan vien"));

        if (actor.role() != Role.STAFF || actor.staffId() == null) {
            throw new ForbiddenException("Chi nhan vien moi duoc xem hieu suat lam viec");
        }

        return actor;
    }

    private DateRange resolveDateRange(LocalDate fromDate, LocalDate toDate) {
        LocalDate today = LocalDate.now();
        LocalDate resolvedFrom = fromDate == null ? today.withDayOfMonth(1) : fromDate;
        LocalDate resolvedTo = toDate == null ? today : toDate;

        if (resolvedFrom.isAfter(resolvedTo)) {
            throw new IllegalArgumentException("fromDate khong duoc sau toDate");
        }

        return new DateRange(resolvedFrom, resolvedTo);
    }

    private StaffWorklogSummary summarizeWorklog(List<AttendancePerformanceRow> rows) {
        long totalShifts = rows.stream()
                .filter(row -> "DONE".equals(row.status()))
                .count();
        BigDecimal totalHours = rows.stream()
                .filter(row -> "DONE".equals(row.status()))
                .map(AttendancePerformanceRow::workDurationHours)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(HOURS_SCALE, RoundingMode.HALF_UP);
        long lateCount = rows.stream()
                .filter(this::isLate)
                .count();
        long missingCheckout = rows.stream()
                .filter(row -> "MISSING_CHECKOUT".equals(row.status()))
                .count();

        return new StaffWorklogSummary(totalShifts, totalHours, lateCount, missingCheckout);
    }

    private boolean isLate(AttendancePerformanceRow row) {
        return row.shiftStartTime() != null
                && row.checkInTime() != null
                && row.checkInTime().toLocalTime().isAfter(row.shiftStartTime());
    }

    private StaffReviewSummary summarizeReviews(List<StaffPerformanceReview> reviews) {
        BigDecimal avgRating = BigDecimal.ZERO.setScale(RATING_SCALE, RoundingMode.HALF_UP);
        List<Integer> ratings = reviews.stream()
                .map(StaffPerformanceReview::rating)
                .filter(value -> value != null)
                .toList();
        if (!ratings.isEmpty()) {
            BigDecimal ratingTotal = ratings.stream()
                    .map(BigDecimal::valueOf)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            avgRating = ratingTotal.divide(BigDecimal.valueOf(ratings.size()), RATING_SCALE, RoundingMode.HALF_UP);
        }

        return new StaffReviewSummary(avgRating, reviews);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }

    private record DateRange(LocalDate fromDate, LocalDate toDate) {
    }
}
