package backend.refund.adapter.in.web;

import backend.common.ApiResponse;
import backend.refund.adapter.in.web.dto.RefundResponse;
import backend.refund.application.port.in.GetCustomerRefundUseCase;
import backend.refund.application.port.out.BuildRefundTransferQrPort;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class CustomerRefundController {

    private final GetCustomerRefundUseCase getCustomerRefundUseCase;
    private final BuildRefundTransferQrPort buildRefundTransferQrPort;

    @GetMapping("/{bookingId}/refund")
    public ResponseEntity<ApiResponse<RefundResponse>> getRefund(
            @PathVariable Integer bookingId,
            Authentication authentication
    ) {
        var refund = getCustomerRefundUseCase.getRefundForCustomer(bookingId, authentication.getName());
        RefundResponse data = RefundResponse.from(refund, buildRefundTransferQrPort.build(refund).orElse(null));
        return ResponseEntity.ok(ApiResponse.<RefundResponse>builder()
                .success(true)
                .message("Lay trang thai hoan tien thanh cong")
                .data(data)
                .build());
    }
}
