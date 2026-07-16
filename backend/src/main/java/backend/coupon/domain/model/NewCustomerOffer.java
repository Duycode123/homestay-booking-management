package backend.coupon.domain.model;

public record NewCustomerOffer(
        boolean eligible,
        String code,
        int discountPercent,
        String message
) {
}
