package backend.controller;

import backend.booking.application.port.in.CancelBookingForManagementUseCase;
import backend.booking.application.port.in.GetBookingManagementDetailUseCase;
import backend.booking.application.port.in.ListBookingsForManagementUseCase;
import backend.booking.application.port.in.SettleBookingAtCheckoutUseCase;
import backend.booking.application.port.in.UpdateBookingStatusUseCase;
import backend.booking.application.port.in.ReviewCustomerCancellationUseCase;
import backend.booking.application.port.in.command.CancelBookingForManagementCommand;
import backend.booking.application.port.in.command.SettleBookingAtCheckoutCommand;
import backend.controller.request.SettleBookingAtCheckoutRequest;
import backend.booking.application.port.in.command.UpdateBookingStatusCommand;
import backend.booking.application.port.in.command.ReviewCustomerCancellationCommand;
import backend.booking.application.port.in.query.GetBookingManagementDetailQuery;
import backend.booking.application.port.in.query.ListBookingsForManagementQuery;
import backend.dto.request.CancelBookingRequest;
import backend.dto.request.ReviewCancellationRequest;
import backend.dto.response.CustomerBookingCancellationResponse;
import backend.dto.response.BookingResponse;
import backend.dto.response.PagedResponse;
import backend.entity.BookingStatus;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/bookings")
public class AdminBookingController {

    private final ListBookingsForManagementUseCase listBookingsForManagementUseCase;
    private final GetBookingManagementDetailUseCase getBookingManagementDetailUseCase;
    private final UpdateBookingStatusUseCase updateBookingStatusUseCase;
    private final CancelBookingForManagementUseCase cancelBookingForManagementUseCase;
    private final SettleBookingAtCheckoutUseCase settleBookingAtCheckoutUseCase;
    private final ReviewCustomerCancellationUseCase reviewCustomerCancellationUseCase;

    public AdminBookingController(
            ListBookingsForManagementUseCase listBookingsForManagementUseCase,
            GetBookingManagementDetailUseCase getBookingManagementDetailUseCase,
            UpdateBookingStatusUseCase updateBookingStatusUseCase,
            CancelBookingForManagementUseCase cancelBookingForManagementUseCase,
            SettleBookingAtCheckoutUseCase settleBookingAtCheckoutUseCase,
            ReviewCustomerCancellationUseCase reviewCustomerCancellationUseCase
    ) {
        this.listBookingsForManagementUseCase = listBookingsForManagementUseCase;
        this.getBookingManagementDetailUseCase = getBookingManagementDetailUseCase;
        this.updateBookingStatusUseCase = updateBookingStatusUseCase;
        this.cancelBookingForManagementUseCase = cancelBookingForManagementUseCase;
        this.settleBookingAtCheckoutUseCase = settleBookingAtCheckoutUseCase;
        this.reviewCustomerCancellationUseCase = reviewCustomerCancellationUseCase;
    }

    @GetMapping
    public ResponseEntity<?> getAllBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Integer roomId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction,
            Authentication authentication
    ) {
        ListBookingsForManagementQuery query = new ListBookingsForManagementQuery(
                status,
                roomId,
                search,
                from,
                to,
                page,
                size,
                sortBy,
                direction,
                authentication.getName()
        );

        if (page != null || size != null) {
            PagedResponse<BookingResponse> data = listBookingsForManagementUseCase.getBookingsPage(query);
            return ResponseEntity.ok(success("Lay danh sach don dat phong thanh cong", data));
        }

        List<BookingResponse> data = listBookingsForManagementUseCase.getAllBookings(query);

        return ResponseEntity.ok(success("Lay danh sach don dat phong thanh cong", data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingDetail(
            @PathVariable Integer id,
            Authentication authentication
    ) {
        String currentUserEmail = authentication.getName();

        BookingResponse data = getBookingManagementDetailUseCase.getBookingDetail(
                new GetBookingManagementDetailQuery(id, currentUserEmail)
        );

        return ResponseEntity.ok(success("Lay chi tiet don dat phong thanh cong", data));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable Integer id,
            @RequestParam BookingStatus status,
            Authentication authentication
    ) {
        String currentUserEmail = authentication.getName();

        BookingResponse data = updateBookingStatusUseCase.updateBookingStatus(
                new UpdateBookingStatusCommand(id, status, currentUserEmail)
        );

        return ResponseEntity.ok(success("Cap nhat trang thai don dat phong thanh cong", data));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Integer id,
            @RequestBody(required = false) @Valid CancelBookingRequest request,
            Authentication authentication
    ) {
        String currentUserEmail = authentication.getName();

        BookingResponse data = cancelBookingForManagementUseCase.cancelBooking(
                new CancelBookingForManagementCommand(
                        id,
                        request != null ? request.getReason() : null,
                        currentUserEmail
                )
        );

        return ResponseEntity.ok(success("Huy don dat phong thanh cong", data));
    }

    @PostMapping("/{id}/settle-checkout")
    public ResponseEntity<?> settleAtCheckout(
            @PathVariable Integer id,
            @RequestBody @Valid SettleBookingAtCheckoutRequest request,
            Authentication authentication
    ) {
        BookingResponse data = settleBookingAtCheckoutUseCase.settleBookingAtCheckout(
                new SettleBookingAtCheckoutCommand(id, request.getMethod(), authentication.getName())
        );

        return ResponseEntity.ok(success("Ket toan va checkout thanh cong", data));
    }

    @PostMapping("/{id}/cancellation-request/approve")
    public ResponseEntity<?> approveCancellationRequest(
            @PathVariable Integer id,
            @RequestBody(required = false) @Valid ReviewCancellationRequest request,
            Authentication authentication
    ) {
        CustomerBookingCancellationResponse data = reviewCustomerCancellationUseCase.reviewCustomerCancellation(
                new ReviewCustomerCancellationCommand(
                        id,
                        true,
                        request == null ? null : request.getAdminNote(),
                        authentication.getName()
                )
        );
        return ResponseEntity.ok(success("Da duyet yeu cau huy va tao ho so cho hoan tien", data));
    }

    @PostMapping("/{id}/cancellation-request/reject")
    public ResponseEntity<?> rejectCancellationRequest(
            @PathVariable Integer id,
            @RequestBody(required = false) @Valid ReviewCancellationRequest request,
            Authentication authentication
    ) {
        CustomerBookingCancellationResponse data = reviewCustomerCancellationUseCase.reviewCustomerCancellation(
                new ReviewCustomerCancellationCommand(
                        id,
                        false,
                        request == null ? null : request.getAdminNote(),
                        authentication.getName()
                )
        );
        return ResponseEntity.ok(success("Da tu choi yeu cau huy phong", data));
    }

    private Map<String, Object> success(String message, Object data) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        return response;
    }
}
