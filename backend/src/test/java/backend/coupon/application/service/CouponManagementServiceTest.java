package backend.coupon.application.service;

import backend.coupon.application.port.in.command.CreateCouponCommand;
import backend.coupon.application.port.in.command.DeleteCouponCommand;
import backend.coupon.application.port.in.command.UpdateCouponCommand;
import backend.coupon.application.port.out.CouponCatalogPort;
import backend.coupon.application.port.out.CouponMutationPort;
import backend.coupon.domain.model.DiscountCode;
import backend.coupon.domain.model.DiscountType;
import backend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CouponManagementServiceTest {

    @Mock
    private CouponCatalogPort couponCatalogPort;

    @Mock
    private CouponMutationPort couponMutationPort;

    private CouponManagementService couponManagementService;

    @BeforeEach
    void setUp() {
        couponManagementService = new CouponManagementService(couponCatalogPort, couponMutationPort);
    }

    @Test
    void createCouponNormalizesCodeAndMoney() {
        when(couponCatalogPort.loadCouponByCode("SUMMER10")).thenReturn(Optional.empty());
        when(couponMutationPort.save(any(DiscountCode.class))).thenAnswer(invocation -> {
            DiscountCode coupon = invocation.getArgument(0);
            return new DiscountCode(
                    7,
                    coupon.code(),
                    coupon.type(),
                    coupon.value(),
                    coupon.minOrderValue(),
                    coupon.expiresAt()
            );
        });

        DiscountCode createdCoupon = couponManagementService.createCoupon(new CreateCouponCommand(
                " summer10 ",
                DiscountType.PERCENTAGE,
                new BigDecimal("10"),
                new BigDecimal("100000.456"),
                LocalDate.of(2026, 8, 1)
        ));

        ArgumentCaptor<DiscountCode> couponCaptor = ArgumentCaptor.forClass(DiscountCode.class);
        verify(couponMutationPort).save(couponCaptor.capture());

        assertEquals(7, createdCoupon.id());
        assertEquals("SUMMER10", couponCaptor.getValue().code());
        assertEquals(new BigDecimal("10.00"), couponCaptor.getValue().value());
        assertEquals(new BigDecimal("100000.46"), couponCaptor.getValue().minOrderValue());
    }

    @Test
    void createCouponRejectsDuplicateCode() {
        when(couponCatalogPort.loadCouponByCode("SUMMER10")).thenReturn(Optional.of(coupon(3, "SUMMER10")));

        assertThrows(
                IllegalStateException.class,
                () -> couponManagementService.createCoupon(new CreateCouponCommand(
                        "SUMMER10",
                        DiscountType.PERCENTAGE,
                        BigDecimal.TEN,
                        BigDecimal.ZERO,
                        null
                ))
        );
        verify(couponMutationPort, never()).save(any());
    }

    @Test
    void createCouponRejectsPercentageGreaterThanOneHundred() {
        assertThrows(
                IllegalArgumentException.class,
                () -> couponManagementService.createCoupon(new CreateCouponCommand(
                        "TOO_MUCH",
                        DiscountType.PERCENTAGE,
                        new BigDecimal("100.01"),
                        BigDecimal.ZERO,
                        null
                ))
        );
        verify(couponMutationPort, never()).save(any());
    }

    @Test
    void updateCouponAllowsKeepingExistingCode() {
        DiscountCode existingCoupon = coupon(3, "SUMMER10");
        when(couponCatalogPort.loadCoupon(3)).thenReturn(Optional.of(existingCoupon));
        when(couponCatalogPort.loadCouponByCode("SUMMER10")).thenReturn(Optional.of(existingCoupon));
        when(couponMutationPort.save(any(DiscountCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DiscountCode updatedCoupon = couponManagementService.updateCoupon(new UpdateCouponCommand(
                3,
                "summer10",
                DiscountType.FIXED_AMOUNT,
                new BigDecimal("50000"),
                null,
                null
        ));

        assertEquals(3, updatedCoupon.id());
        assertEquals("SUMMER10", updatedCoupon.code());
        assertEquals(DiscountType.FIXED_AMOUNT, updatedCoupon.type());
    }

    @Test
    void deleteCouponRejectsUnknownCoupon() {
        when(couponCatalogPort.loadCoupon(99)).thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> couponManagementService.deleteCoupon(new DeleteCouponCommand(99))
        );
        verify(couponMutationPort, never()).deleteCoupon(99);
    }

    @Test
    void deleteCouponRejectsAppliedCoupon() {
        when(couponCatalogPort.loadCoupon(3)).thenReturn(Optional.of(coupon(3, "SUMMER10")));
        when(couponCatalogPort.hasBookingReference(3)).thenReturn(true);

        assertThrows(
                IllegalStateException.class,
                () -> couponManagementService.deleteCoupon(new DeleteCouponCommand(3))
        );
        verify(couponMutationPort, never()).deleteCoupon(3);
    }

    private DiscountCode coupon(Integer id, String code) {
        return new DiscountCode(
                id,
                code,
                DiscountType.PERCENTAGE,
                BigDecimal.TEN,
                BigDecimal.ZERO,
                null
        );
    }
}
