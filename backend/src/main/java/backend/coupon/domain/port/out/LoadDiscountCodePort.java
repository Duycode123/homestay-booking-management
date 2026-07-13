package backend.coupon.domain.port.out;

import backend.coupon.domain.model.DiscountCode;

import java.util.Optional;

public interface LoadDiscountCodePort {
    Optional<DiscountCode> findByCode(String code);
}
