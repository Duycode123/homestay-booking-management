package backend.notification.adapter.in.web;

import backend.common.ApiResponse;
import backend.notification.adapter.in.web.dto.NotificationResponse;
import backend.notification.application.port.in.NotificationUseCase;
import backend.notification.application.port.in.command.NotificationCommand;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationUseCase notificationUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> list(
            Authentication authentication,
            @RequestParam(defaultValue = "30") int limit
    ) {
        List<NotificationResponse> data = notificationUseCase
                .listNotifications(authentication.getName(), limit)
                .stream().map(NotificationResponse::from).toList();
        return ResponseEntity.ok(success("Danh sach thong bao", data));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markRead(
            Authentication authentication,
            @PathVariable Long id
    ) {
        NotificationResponse data = NotificationResponse.from(notificationUseCase.markRead(
                new NotificationCommand(authentication.getName(), id)
        ));
        return ResponseEntity.ok(success("Da danh dau thong bao la da doc", data));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> markAllRead(
            Authentication authentication,
            @RequestParam(defaultValue = "30") int limit
    ) {
        List<NotificationResponse> data = notificationUseCase
                .markAllRead(authentication.getName(), limit)
                .stream().map(NotificationResponse::from).toList();
        return ResponseEntity.ok(success("Da danh dau tat ca thong bao la da doc", data));
    }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }
}
