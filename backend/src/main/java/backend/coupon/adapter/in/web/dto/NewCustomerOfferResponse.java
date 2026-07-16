package backend.coupon.adapter.in.web.dto;

import backend.coupon.domain.model.NewCustomerOffer;

public record NewCustomerOfferResponse(
        boolean eligible,
        String code,
        int discountPercent,
        String message
) {
    public static NewCustomerOfferResponse from(NewCustomerOffer offer) {
        return new NewCustomerOfferResponse(
                offer.eligible(),
                offer.code(),
                offer.discountPercent(),
                offer.message()
        );
    }
}
