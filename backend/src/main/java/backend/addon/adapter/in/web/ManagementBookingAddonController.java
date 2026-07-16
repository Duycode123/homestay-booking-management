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
@RequestMapping("/api/admin/bookings/{bookingId}/addons")
@RequiredArgsConstructor
public class ManagementBookingAddonController {
    private final AddonUseCase addonUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingAddonResponse>>> list(@PathVariable Integer bookingId,
                                                                         Authentication authentication) {
        var data = addonUseCase.listForManagement(bookingId, authentication.getName()).stream()
                .map(BookingAddonResponse::from).toList();
        return ResponseEntity.ok(response("Lay dich vu cua booking thanh cong", data));
    }

    @PatchMapping("/{itemId}/status")
    public ResponseEntity<ApiResponse<BookingAddonResponse>> status(@PathVariable Integer bookingId,
            @PathVariable Long itemId, @Valid @RequestBody AddonStatusRequest request, Authentication authentication) {
        var data = BookingAddonResponse.from(addonUseCase.updateStatus(bookingId, itemId, request.status(), authentication.getName()));
        return ResponseEntity.ok(response("Cap nhat dich vu thanh cong", data));
    }

    private <T> ApiResponse<T> response(String message, T data) { return ApiResponse.<T>builder().success(true).message(message).data(data).build(); }
}
