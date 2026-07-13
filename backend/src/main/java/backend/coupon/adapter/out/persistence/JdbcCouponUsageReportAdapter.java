package backend.coupon.adapter.out.persistence;

import backend.coupon.application.model.CouponTopUsagePoint;
import backend.coupon.application.model.CouponUsageTrendPoint;
import backend.coupon.application.port.out.CouponUsageReportPort;
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
public class JdbcCouponUsageReportAdapter implements CouponUsageReportPort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public List<CouponUsageTrendPoint> loadUsageTrend(LocalDateTime from, LocalDateTime to) {
        String sql = """
                SELECT CAST(cu.used_at AS date) AS usage_date,
                       COUNT(*) AS usage_count,
                       COALESCE(SUM(cu.discount_amount), 0) AS discount_amount
                FROM coupon_usage cu
                WHERE cu.used_at >= ?
                  AND cu.used_at < ?
                GROUP BY usage_date
                ORDER BY usage_date
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new CouponUsageTrendPoint(
                        rs.getDate("usage_date").toLocalDate(),
                        rs.getLong("usage_count"),
                        money(rs.getBigDecimal("discount_amount"))
                ),
                Timestamp.valueOf(from),
                Timestamp.valueOf(to)
        );
    }

    @Override
    public List<CouponTopUsagePoint> loadTopCoupons(LocalDateTime from, LocalDateTime to) {
        String sql = """
                SELECT dc.id AS coupon_id,
                       dc.code AS code,
                       COUNT(*) AS usage_count,
                       COALESCE(SUM(cu.discount_amount), 0) AS discount_amount
                FROM coupon_usage cu
                JOIN discount_code dc ON dc.id = cu.discount_code_id
                WHERE cu.used_at >= ?
                  AND cu.used_at < ?
                GROUP BY dc.id, dc.code
                ORDER BY usage_count DESC, discount_amount DESC, dc.code ASC
                LIMIT 5
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new CouponTopUsagePoint(
                        rs.getInt("coupon_id"),
                        rs.getString("code"),
                        rs.getLong("usage_count"),
                        money(rs.getBigDecimal("discount_amount"))
                ),
                Timestamp.valueOf(from),
                Timestamp.valueOf(to)
        );
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }
}
