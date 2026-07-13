package backend.service;

import backend.entity.Booking;
import backend.entity.CouponUsage;
import backend.repository.CouponUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class CouponUsageTrackingService {

    private static final int MONEY_SCALE = 2;

    private final CouponUsageRepository couponUsageRepository;

    @Transactional
    public void recordPaidBookingUsage(Booking booking) {
        if (booking == null || booking.getId() == null || booking.getDiscountCode() == null) {
            return;
        }

        if (couponUsageRepository.existsByBooking_Id(booking.getId())) {
            return;
        }

        BigDecimal originalAmount = booking.getTotalHours()
                .multiply(booking.getPricePerHour())
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal discountAmount = originalAmount
                .subtract(booking.getTotalAmount())
                .max(BigDecimal.ZERO)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        couponUsageRepository.save(CouponUsage.builder()
                .booking(booking)
                .customer(booking.getCustomer())
                .discountCode(booking.getDiscountCode())
                .discountAmount(discountAmount)
                .build());
    }
}
