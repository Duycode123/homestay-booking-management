package backend.coupon.application.port.in;

import backend.coupon.application.model.CouponUsageReport;
import backend.coupon.application.port.in.query.GetCouponUsageReportQuery;

public interface GetCouponUsageReportUseCase {

    CouponUsageReport getCouponUsageReport(GetCouponUsageReportQuery query);
}
