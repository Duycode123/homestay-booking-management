package backend.coupon.application.service;

import backend.coupon.application.port.in.CreateCouponUseCase;
import backend.coupon.application.port.in.DeleteCouponUseCase;
import backend.coupon.application.port.in.GetCouponDetailUseCase;
import backend.coupon.application.port.in.ListCouponsUseCase;
import backend.coupon.application.port.in.UpdateCouponUseCase;
import backend.coupon.application.port.in.command.CreateCouponCommand;
import backend.coupon.application.port.in.command.DeleteCouponCommand;
import backend.coupon.application.port.in.command.UpdateCouponCommand;
import backend.coupon.application.port.in.query.GetCouponDetailQuery;
import backend.coupon.application.port.out.CouponCatalogPort;
import backend.coupon.application.port.out.CouponMutationPort;
import backend.coupon.domain.model.DiscountCode;
import backend.coupon.domain.model.DiscountType;
import backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CouponManagementService implements
        ListCouponsUseCase,
        GetCouponDetailUseCase,
        CreateCouponUseCase,
        UpdateCouponUseCase,
        DeleteCouponUseCase {

    private static final int MONEY_SCALE = 2;
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private final CouponCatalogPort couponCatalogPort;
    private final CouponMutationPort couponMutationPort;

    @Override
    public List<DiscountCode> getCoupons() {
        return couponCatalogPort.loadCoupons();
    }

    @Override
    public DiscountCode getCouponDetail(GetCouponDetailQuery query) {
        Integer couponId = requireCouponId(query.couponId());
        return couponCatalogPort.loadCoupon(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay coupon"));
    }

    @Override
    @Transactional
    public DiscountCode createCoupon(CreateCouponCommand command) {
        DiscountCode coupon = buildCoupon(
                null,
                command.code(),
                command.type(),
                command.value(),
                command.minOrderValue(),
                command.expiresAt()
        );

        ensureCodeIsUnique(coupon.code(), null);
        return couponMutationPort.save(coupon);
    }

    @Override
    @Transactional
    public DiscountCode updateCoupon(UpdateCouponCommand command) {
        Integer couponId = requireCouponId(command.couponId());
        couponCatalogPort.loadCoupon(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay coupon"));

        DiscountCode coupon = buildCoupon(
                couponId,
                command.code(),
                command.type(),
                command.value(),
                command.minOrderValue(),
                command.expiresAt()
        );

        ensureCodeIsUnique(coupon.code(), couponId);
        return couponMutationPort.save(coupon);
    }

    @Override
    @Transactional
    public void deleteCoupon(DeleteCouponCommand command) {
        Integer couponId = requireCouponId(command.couponId());
        couponCatalogPort.loadCoupon(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay coupon"));

        if (couponCatalogPort.hasBookingReference(couponId) || couponCatalogPort.hasUsage(couponId)) {
            throw new IllegalStateException("Khong the xoa coupon da duoc ap dung cho don dat phong");
        }

        couponMutationPort.deleteCoupon(couponId);
    }

    private DiscountCode buildCoupon(
            Integer couponId,
            String code,
            DiscountType type,
            BigDecimal value,
            BigDecimal minOrderValue,
            LocalDate expiresAt
    ) {
        DiscountType normalizedType = requireType(type);
        BigDecimal normalizedValue = normalizePositiveMoney(value);
        validateDiscountValue(normalizedType, normalizedValue);

        return new DiscountCode(
                couponId,
                normalizeCode(code),
                normalizedType,
                normalizedValue,
                normalizeOptionalNonNegativeMoney(minOrderValue),
                expiresAt
        );
    }

    private void ensureCodeIsUnique(String code, Integer currentCouponId) {
        couponCatalogPort.loadCouponByCode(code)
                .filter(existingCoupon -> !existingCoupon.id().equals(currentCouponId))
                .ifPresent(existingCoupon -> {
                    throw new IllegalStateException("Ma coupon da ton tai");
                });
    }

    private Integer requireCouponId(Integer couponId) {
        if (couponId == null) {
            throw new IllegalArgumentException("couponId khong duoc de trong");
        }
        return couponId;
    }

    private String normalizeCode(String code) {
        if (code == null || code.trim().isBlank()) {
            throw new IllegalArgumentException("Ma coupon khong duoc de trong");
        }
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private DiscountType requireType(DiscountType type) {
        if (type == null) {
            throw new IllegalArgumentException("Loai coupon khong duoc de trong");
        }
        return type;
    }

    private BigDecimal normalizePositiveMoney(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Gia tri coupon phai lon hon 0");
        }

        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private void validateDiscountValue(DiscountType type, BigDecimal value) {
        if (type == DiscountType.PERCENTAGE && value.compareTo(ONE_HUNDRED) > 0) {
            throw new IllegalArgumentException("Coupon phan tram khong duoc lon hon 100");
        }
    }

    private BigDecimal normalizeOptionalNonNegativeMoney(BigDecimal value) {
        if (value == null) {
            return null;
        }
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Gia tri don toi thieu khong duoc am");
        }
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }
}
