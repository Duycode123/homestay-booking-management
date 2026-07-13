package backend.staffnotification.adapter.in.web;

import backend.common.ApiResponse;
import backend.staffnotification.adapter.in.web.dto.StaffNotificationResponse;
import backend.staffnotification.application.port.in.StaffNotificationUseCase;
import backend.staffnotification.application.port.in.command.StaffNotificationCommand;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/notifications")
@RequiredArgsConstructor
public class StaffNotificationController {

    private final StaffNotificationUseCase staffNotificationUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StaffNotificationResponse>>> listNotifications(Authentication authentication) {
        List<StaffNotificationResponse> data = staffNotificationUseCase.listNotifications(authentication.getName())
                .stream()
                .map(StaffNotificationResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.<List<StaffNotificationResponse>>builder()
                .success(true)
                .message("Danh sach thong bao nhan vien")
                .data(data)
                .build());
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<StaffNotificationResponse>> markRead(
            Authentication authentication,
            @PathVariable Long id
    ) {
        StaffNotificationResponse data = StaffNotificationResponse.from(
                staffNotificationUseCase.markRead(new StaffNotificationCommand(authentication.getName(), id))
        );

        return ResponseEntity.ok(ApiResponse.<StaffNotificationResponse>builder()
                .success(true)
                .message("Da danh dau thong bao la da doc")
                .data(data)
                .build());
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<StaffNotificationResponse>> resolve(
            Authentication authentication,
            @PathVariable Long id
    ) {
        StaffNotificationResponse data = StaffNotificationResponse.from(
                staffNotificationUseCase.resolve(new StaffNotificationCommand(authentication.getName(), id))
        );

        return ResponseEntity.ok(ApiResponse.<StaffNotificationResponse>builder()
                .success(true)
                .message("Da xu ly thong bao")
                .data(data)
                .build());
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<List<StaffNotificationResponse>>> markAllRead(Authentication authentication) {
        List<StaffNotificationResponse> data = staffNotificationUseCase.markAllRead(authentication.getName())
                .stream()
                .map(StaffNotificationResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.<List<StaffNotificationResponse>>builder()
                .success(true)
                .message("Da danh dau tat ca thong bao la da doc")
                .data(data)
                .build());
    }
}
