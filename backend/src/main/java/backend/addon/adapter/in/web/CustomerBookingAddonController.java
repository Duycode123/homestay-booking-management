package backend.addon.adapter.in.web;

import backend.addon.adapter.in.web.dto.*;
import backend.addon.application.port.in.AddonUseCase;
import backend.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bookings/{bookingId}/addons")
@RequiredArgsConstructor
public class CustomerBookingAddonController {
    private final AddonUseCase addonUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingAddonResponse>>> list(@PathVariable Integer bookingId,
                                                                         Authentication authentication) {
        return ok("Lay dich vu cua booking thanh cong", addonUseCase.listForCustomer(bookingId, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<List<BookingAddonResponse>>> request(@PathVariable Integer bookingId,
            @Valid @RequestBody List<AddonSelectionRequest> requests, Authentication authentication) {
        var items = addonUseCase.requestDuringStay(bookingId, authentication.getName(),
                requests.stream().map(AddonSelectionRequest::toDomain).toList());
        return ok("Da gui yeu cau dich vu den nhan vien", items);
    }

    @PatchMapping("/{itemId}/cancel")
    public ResponseEntity<ApiResponse<BookingAddonResponse>> cancel(@PathVariable Integer bookingId,
            @PathVariable Long itemId, Authentication authentication) {
        var data = BookingAddonResponse.from(addonUseCase.cancelCustomerRequest(bookingId, itemId, authentication.getName()));
        return ResponseEntity.ok(response("Da huy yeu cau dich vu", data));
    }

    private ResponseEntity<ApiResponse<List<BookingAddonResponse>>> ok(String message, List<backend.addon.domain.model.BookingAddonItem> items) {
        return ResponseEntity.ok(response(message, items.stream().map(BookingAddonResponse::from).toList()));
    }
    private <T> ApiResponse<T> response(String message, T data) { return ApiResponse.<T>builder().success(true).message(message).data(data).build(); }
}
