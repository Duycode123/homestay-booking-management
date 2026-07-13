package backend.controller;

import backend.common.ApiResponse;
import backend.dto.request.ChangePasswordRequest;
import backend.dto.request.NotificationSettingsRequest;
import backend.dto.request.UpdateProfileRequest;
import backend.dto.response.NotificationSettingsResponse;
import backend.dto.response.UserResponse;
import backend.security.AuthCookieService;
import backend.user.application.model.UserProfileUpdateResult;
import backend.user.application.port.in.ChangeCurrentUserPasswordUseCase;
import backend.user.application.port.in.GetCurrentUserNotificationSettingsUseCase;
import backend.user.application.port.in.GetCurrentUserProfileUseCase;
import backend.user.application.port.in.UploadCurrentUserAvatarUseCase;
import backend.user.application.port.in.UpdateCurrentUserNotificationSettingsUseCase;
import backend.user.application.port.in.UpdateCurrentUserProfileUseCase;
import backend.user.application.port.in.command.ChangeCurrentUserPasswordCommand;
import backend.user.application.port.in.command.UploadCurrentUserAvatarCommand;
import backend.user.application.port.in.command.UpdateCurrentUserNotificationSettingsCommand;
import backend.user.application.port.in.command.UpdateCurrentUserProfileCommand;
import backend.user.application.port.in.query.GetCurrentUserProfileQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final GetCurrentUserProfileUseCase getCurrentUserProfileUseCase;
    private final UpdateCurrentUserProfileUseCase updateCurrentUserProfileUseCase;
    private final UploadCurrentUserAvatarUseCase uploadCurrentUserAvatarUseCase;
    private final ChangeCurrentUserPasswordUseCase changeCurrentUserPasswordUseCase;
    private final GetCurrentUserNotificationSettingsUseCase getCurrentUserNotificationSettingsUseCase;
    private final UpdateCurrentUserNotificationSettingsUseCase updateCurrentUserNotificationSettingsUseCase;
    private final AuthCookieService authCookieService;

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return getCurrentUserProfileUseCase.getProfile(
                new GetCurrentUserProfileQuery(authentication == null ? null : authentication.getName())
        );
    }

    @RequestMapping(value = "/me", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<UserResponse> updateMe(
            Authentication authentication,
            @RequestBody(required = false) UpdateProfileRequest request
    ) {
        UserProfileUpdateResult result = updateCurrentUserProfileUseCase.updateProfile(
                new UpdateCurrentUserProfileCommand(
                        authentication == null ? null : authentication.getName(),
                        request == null ? null : request.getFullName(),
                        request == null ? null : request.getEmail(),
                        request == null ? null : request.getPhone()
                )
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.accessCookie(result.accessToken()).toString())
                .header(HttpHeaders.SET_COOKIE, authCookieService.refreshCookie(result.refreshToken()).toString())
                .body(result.userResponse());
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserResponse uploadAvatar(
            Authentication authentication,
            @RequestPart("file") MultipartFile file
    ) {
        return uploadCurrentUserAvatarUseCase.uploadAvatar(new UploadCurrentUserAvatarCommand(
                authentication == null ? null : authentication.getName(),
                file.getOriginalFilename(),
                file.getContentType(),
                readFile(file)
        ));
    }

    @RequestMapping(value = {"/me/password", "/me/change-password"}, method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<ApiResponse<String>> changePassword(
            Authentication authentication,
            @RequestBody(required = false) ChangePasswordRequest request
    ) {
        changeCurrentUserPasswordUseCase.changePassword(new ChangeCurrentUserPasswordCommand(
                authentication == null ? null : authentication.getName(),
                request == null ? null : request.getCurrentPassword(),
                request == null ? null : request.getNewPassword(),
                request == null ? null : request.getConfirmPassword()
        ));

        return ResponseEntity.ok(
                ApiResponse.<String>builder()
                        .success(true)
                        .message("C\u1eadp nh\u1eadt m\u1eadt kh\u1ea9u th\u00e0nh c\u00f4ng")
                        .build()
        );
    }

    @GetMapping("/me/notification-settings")
    public NotificationSettingsResponse getNotificationSettings(Authentication authentication) {
        return getCurrentUserNotificationSettingsUseCase.getNotificationSettings(
                new GetCurrentUserProfileQuery(authentication == null ? null : authentication.getName())
        );
    }

    @PutMapping("/me/notification-settings")
    public NotificationSettingsResponse updateNotificationSettings(
            Authentication authentication,
            @RequestBody(required = false) NotificationSettingsRequest request
    ) {
        return updateCurrentUserNotificationSettingsUseCase.updateNotificationSettings(
                new UpdateCurrentUserNotificationSettingsCommand(
                        authentication == null ? null : authentication.getName(),
                        request == null ? null : request.getNewBooking(),
                        request == null ? null : request.getBookingReminder(),
                        request == null ? null : request.getShiftReminder(),
                        request == null ? null : request.getRoomIssue(),
                        request == null ? null : request.getEquipmentIssue()
                )
        );
    }

    private byte[] readFile(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw new IllegalArgumentException("Khong the doc file anh tai len");
        }
    }
}
