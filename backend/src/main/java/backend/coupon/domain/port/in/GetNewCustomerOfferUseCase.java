package backend.coupon.domain.port.in;

import backend.coupon.domain.model.NewCustomerOffer;

public interface GetNewCustomerOfferUseCase {

    NewCustomerOffer getOffer(String customerEmail);
}
