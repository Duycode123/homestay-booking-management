package backend.report.adapter.out.persistence;

import backend.report.domain.model.ReportBucket;
import backend.report.domain.model.RoomPerformanceSummary;
import backend.report.domain.model.RevenueUsagePeriod;
import backend.report.domain.model.RoomUsageSummary;
import backend.report.domain.port.out.RoomPerformanceReportPort;
import backend.report.domain.port.out.RevenueUsageReportPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class JdbcRevenueUsageReportAdapter implements RevenueUsageReportPort, RoomPerformanceReportPort {

    private static final String REPORTABLE_STATUSES = "'PAID', 'CHECKED_IN', 'COMPLETED'";

    private final JdbcTemplate jdbcTemplate;

    @Override
    public List<RevenueUsagePeriod> loadRevenueUsagePeriods(
            LocalDateTime from,
            LocalDateTime to,
            ReportBucket bucket
    ) {
        String sql = """
                SELECT date_trunc('%s', b.start_time) AS period_start,
                       COALESCE(SUM(b.total_price), 0) AS revenue,
                       COUNT(*) AS booking_count,
                       COALESCE(SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600), 0) AS usage_hours
                FROM booking b
                WHERE b.start_time >= ?
                  AND b.start_time < ?
                  AND b.status::text IN (%s)
                GROUP BY period_start
                ORDER BY period_start
                """.formatted(bucket.getSqlUnit(), REPORTABLE_STATUSES);

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new RevenueUsagePeriod(
                        rs.getTimestamp("period_start").toLocalDateTime(),
                        money(rs.getBigDecimal("revenue")),
                        rs.getLong("booking_count"),
                        hours(rs.getBigDecimal("usage_hours"))
                ),
                Timestamp.valueOf(from),
                Timestamp.valueOf(to)
        );
    }

    @Override
    public List<RoomUsageSummary> loadRoomUsageSummaries(LocalDateTime from, LocalDateTime to) {
        String sql = """
                SELECT r.id AS room_id,
                       r.name AS room_name,
                       rt.name AS room_type_name,
                       COALESCE(SUM(b.total_price), 0) AS revenue,
                       COUNT(b.id) AS booking_count,
                       COALESCE(SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600), 0) AS usage_hours
                FROM booking b
                JOIN room r ON r.id = b.room_id
                JOIN room_tier rt ON rt.id = r.room_tier_id
                WHERE b.start_time >= ?
                  AND b.start_time < ?
                  AND b.status::text IN (%s)
                GROUP BY r.id, r.name, rt.name
                ORDER BY booking_count DESC, revenue DESC, r.name ASC
                """.formatted(REPORTABLE_STATUSES);

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new RoomUsageSummary(
                        rs.getInt("room_id"),
                        rs.getString("room_name"),
                        rs.getString("room_type_name"),
                        money(rs.getBigDecimal("revenue")),
                        rs.getLong("booking_count"),
                        hours(rs.getBigDecimal("usage_hours"))
                ),
                Timestamp.valueOf(from),
                Timestamp.valueOf(to)
        );
    }

    @Override
    public List<RoomPerformanceSummary> loadRoomPerformanceSummaries(LocalDateTime from, LocalDateTime to) {
        String sql = """
                SELECT r.id AS room_id,
                       r.name AS room_name,
                       rt.name AS room_type_name,
                       COUNT(b.id) AS successful_booking_count
                FROM room r
                JOIN room_tier rt ON rt.id = r.room_tier_id
                LEFT JOIN booking b
                       ON b.room_id = r.id
                      AND b.start_time >= ?
                      AND b.start_time < ?
                      AND b.status::text IN (%s)
                GROUP BY r.id, r.name, rt.name
                ORDER BY successful_booking_count DESC, r.name ASC
                """.formatted(REPORTABLE_STATUSES);

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new RoomPerformanceSummary(
                        rs.getInt("room_id"),
                        rs.getString("room_name"),
                        rs.getString("room_type_name"),
                        rs.getLong("successful_booking_count")
                ),
                Timestamp.valueOf(from),
                Timestamp.valueOf(to)
        );
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal hours(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }
}
