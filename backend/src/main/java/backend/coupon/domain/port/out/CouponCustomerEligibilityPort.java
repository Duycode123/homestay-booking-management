package backend.coupon.domain.port.out;

public interface CouponCustomerEligibilityPort {

    boolean hasBookingOtherThan(String customerEmail, Integer excludedBookingId);
}
