package backend.coupon.adapter.in.web;

import backend.common.ApiResponse;
import backend.coupon.adapter.in.web.dto.ValidateCouponRequest;
import backend.coupon.adapter.in.web.dto.ValidateCouponResponse;
import backend.coupon.adapter.in.web.dto.NewCustomerOfferResponse;
import backend.coupon.adapter.in.web.mapper.CouponWebMapper;
import backend.coupon.domain.model.CouponValidationResult;
import backend.coupon.domain.port.in.ValidateCouponUseCase;
import backend.coupon.domain.port.in.GetNewCustomerOfferUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final ValidateCouponUseCase validateCouponUseCase;
    private final GetNewCustomerOfferUseCase getNewCustomerOfferUseCase;
    private final CouponWebMapper mapper;

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<ValidateCouponResponse>> validateCoupon(
            @Valid @RequestBody ValidateCouponRequest request,
            Authentication authentication
    ) {
        String customerEmail = authenticatedEmail(authentication);
        CouponValidationResult result = validateCouponUseCase.validate(mapper.toCommand(request, customerEmail));
        return ResponseEntity.ok(ApiResponse.<ValidateCouponResponse>builder()
                .success(result.valid())
                .message(result.reason())
                .data(mapper.toResponse(result))
                .build());
    }

    @GetMapping("/new-customer-offer")
    public ResponseEntity<ApiResponse<NewCustomerOfferResponse>> getNewCustomerOffer(
            Authentication authentication
    ) {
        var offer = getNewCustomerOfferUseCase.getOffer(authenticatedEmail(authentication));
        return ResponseEntity.ok(ApiResponse.<NewCustomerOfferResponse>builder()
                .success(true)
                .message(offer.message())
                .data(NewCustomerOfferResponse.from(offer))
                .build());
    }

    private String authenticatedEmail(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return authentication.getName();
    }
}
