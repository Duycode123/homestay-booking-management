package backend.coupon.application.port.out;

import backend.coupon.application.model.CouponTopUsagePoint;
import backend.coupon.application.model.CouponUsageTrendPoint;

import java.time.LocalDateTime;
import java.util.List;

public interface CouponUsageReportPort {

    List<CouponUsageTrendPoint> loadUsageTrend(LocalDateTime from, LocalDateTime to);

    List<CouponTopUsagePoint> loadTopCoupons(LocalDateTime from, LocalDateTime to);
}
