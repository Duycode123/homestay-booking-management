package backend.coupon.adapter.out.persistence;

import backend.coupon.domain.model.DiscountCode;
import backend.coupon.domain.model.DiscountType;
import backend.coupon.domain.port.out.LoadDiscountCodePort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class JdbcDiscountCodeAdapter implements LoadDiscountCodePort {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Optional<DiscountCode> findByCode(String code) {
        String sql = """
                select id, code, type, value, min_order_value, expires_at
                from discount_code
                where upper(code) = ?
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> mapDiscountCode(rs), code)
                .stream()
                .findFirst();
    }

    private DiscountCode mapDiscountCode(ResultSet rs) throws SQLException {
        return new DiscountCode(
                rs.getInt("id"),
                rs.getString("code"),
                DiscountType.valueOf(rs.getString("type")),
                rs.getBigDecimal("value"),
                rs.getBigDecimal("min_order_value"),
                rs.getDate("expires_at") == null ? null : rs.getDate("expires_at").toLocalDate()
        );
    }
}
