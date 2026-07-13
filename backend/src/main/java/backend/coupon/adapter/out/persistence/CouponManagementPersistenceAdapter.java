package backend.coupon.adapter.out.persistence;

import backend.coupon.application.port.out.CouponCatalogPort;
import backend.coupon.application.port.out.CouponMutationPort;
import backend.coupon.domain.model.DiscountCode;
import backend.coupon.domain.model.DiscountType;
import backend.repository.BookingRepository;
import backend.repository.CouponUsageRepository;
import backend.repository.DiscountCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class CouponManagementPersistenceAdapter implements CouponCatalogPort, CouponMutationPort {

    private final DiscountCodeRepository discountCodeRepository;
    private final BookingRepository bookingRepository;
    private final CouponUsageRepository couponUsageRepository;

    @Override
    public List<DiscountCode> loadCoupons() {
        return discountCodeRepository.findAll(Sort.by(Sort.Direction.ASC, "code")).stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<DiscountCode> loadCoupon(Integer couponId) {
        return discountCodeRepository.findById(couponId)
                .map(this::toDomain);
    }

    @Override
    public Optional<DiscountCode> loadCouponByCode(String code) {
        return discountCodeRepository.findByCodeIgnoreCase(code)
                .map(this::toDomain);
    }

    @Override
    public boolean hasBookingReference(Integer couponId) {
        return bookingRepository.existsByDiscountCode_Id(couponId);
    }

    @Override
    public boolean hasUsage(Integer couponId) {
        return couponUsageRepository.existsByDiscountCode_Id(couponId);
    }

    @Override
    public DiscountCode save(DiscountCode coupon) {
        backend.entity.DiscountCode entity = coupon.id() == null
                ? new backend.entity.DiscountCode()
                : discountCodeRepository.findById(coupon.id()).orElseGet(backend.entity.DiscountCode::new);

        entity.setCode(coupon.code());
        entity.setType(toEntityDiscountType(coupon.type()));
        entity.setValue(coupon.value());
        entity.setMinOrderValue(coupon.minOrderValue());
        entity.setExpiresAt(coupon.expiresAt());

        return toDomain(discountCodeRepository.save(entity));
    }

    @Override
    public void deleteCoupon(Integer couponId) {
        discountCodeRepository.deleteById(couponId);
    }

    private DiscountCode toDomain(backend.entity.DiscountCode entity) {
        return new DiscountCode(
                entity.getId(),
                entity.getCode(),
                DiscountType.valueOf(entity.getType().name()),
                entity.getValue(),
                entity.getMinOrderValue(),
                entity.getExpiresAt()
        );
    }

    private backend.entity.DiscountType toEntityDiscountType(DiscountType type) {
        return backend.entity.DiscountType.valueOf(type.name());
    }
}
