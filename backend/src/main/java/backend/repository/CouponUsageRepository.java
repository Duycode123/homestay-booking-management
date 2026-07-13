package backend.repository;

import backend.entity.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {
    boolean existsByBooking_Id(Integer bookingId);

    boolean existsByDiscountCode_Id(Integer discountCodeId);
}
