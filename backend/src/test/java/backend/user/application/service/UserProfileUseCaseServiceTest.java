package backend.user.application.service;

import backend.dto.response.NotificationSettingsResponse;
import backend.dto.response.UserResponse;
import backend.entity.Role;
import backend.entity.Staff;
import backend.entity.User;
import backend.entity.UserNotificationSettings;
import backend.user.application.model.UserAvatarUploadResult;
import backend.user.application.port.in.command.ChangeCurrentUserPasswordCommand;
import backend.user.application.port.in.command.UploadCurrentUserAvatarCommand;
import backend.user.application.port.in.command.UpdateCurrentUserNotificationSettingsCommand;
import backend.user.application.port.in.query.GetCurrentUserProfileQuery;
import backend.user.application.port.out.UserProfileAccountPort;
import backend.user.application.port.out.UserAvatarStoragePort;
import backend.user.application.port.out.UserProfileSecurityPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileUseCaseServiceTest {

    @Mock
    private UserProfileAccountPort userProfileAccountPort;

    @Mock
    private UserProfileSecurityPort userProfileSecurityPort;

    @Mock
    private UserAvatarStoragePort userAvatarStoragePort;

    private UserProfileUseCaseService userProfileUseCaseService;

    @BeforeEach
    void setUp() {
        userProfileUseCaseService = new UserProfileUseCaseService(
                userProfileAccountPort,
                userProfileSecurityPort,
                userAvatarStoragePort
        );
    }

    @Test
    void getProfileUsesStaffProfileForStaffAccount() {
        User user = staffUser();
        user.setAvatarUrl("https://res.cloudinary.com/demo/image/upload/v1/avatars/vinh.jpg");
        Staff staff = Staff.builder()
                .id(5)
                .account(user)
                .fullName("Vinh Nguyen")
                .email("vinh@example.com")
                .phone("0912345678")
                .build();

        when(userProfileAccountPort.loadUserByEmail("vinh@example.com")).thenReturn(Optional.of(user));
        when(userProfileAccountPort.loadStaffByAccountEmail("vinh@example.com")).thenReturn(Optional.of(staff));

        UserResponse response = userProfileUseCaseService.getProfile(
                new GetCurrentUserProfileQuery("vinh@example.com")
        );

        assertEquals("Vinh Nguyen", response.getFullName());
        assertEquals("0912345678", response.getPhone());
        assertEquals("STAFF", response.getRole());
        assertEquals("https://res.cloudinary.com/demo/image/upload/v1/avatars/vinh.jpg", response.getAvatarUrl());
    }

    @Test
    void uploadAvatarStoresSecureUrlForCurrentUser() {
        User user = staffUser();
        Staff staff = Staff.builder()
                .id(5)
                .account(user)
                .fullName("Vinh Nguyen")
                .email("vinh@example.com")
                .phone("0912345678")
                .build();

        when(userProfileAccountPort.loadUserByEmail("vinh@example.com")).thenReturn(Optional.of(user));
        when(userProfileAccountPort.loadStaffByAccountEmail("vinh@example.com")).thenReturn(Optional.of(staff));
        when(userAvatarStoragePort.uploadAvatar(any())).thenReturn(
                new UserAvatarUploadResult("https://res.cloudinary.com/demo/image/upload/v1/avatars/vinh.jpg")
        );
        when(userProfileAccountPort.saveUser(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userProfileUseCaseService.uploadAvatar(new UploadCurrentUserAvatarCommand(
                "vinh@example.com",
                "avatar.jpg",
                "image/jpeg",
                new byte[]{1, 2, 3}
        ));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userProfileAccountPort).saveUser(userCaptor.capture());
        assertEquals("https://res.cloudinary.com/demo/image/upload/v1/avatars/vinh.jpg", userCaptor.getValue().getAvatarUrl());
        assertEquals("https://res.cloudinary.com/demo/image/upload/v1/avatars/vinh.jpg", response.getAvatarUrl());
    }

    @Test
    void uploadAvatarRejectsNonImageContentType() {
        assertThrows(IllegalArgumentException.class, () -> userProfileUseCaseService.uploadAvatar(
                new UploadCurrentUserAvatarCommand(
                        "vinh@example.com",
                        "avatar.txt",
                        "text/plain",
                        new byte[]{1}
                )
        ));

        verify(userAvatarStoragePort, never()).uploadAvatar(any());
    }

    @Test
    void updateNotificationSettingsPersistsCurrentUserSettings() {
        User user = staffUser();
        UserNotificationSettings settings = UserNotificationSettings.builder()
                .id(2)
                .account(user)
                .newBooking(true)
                .bookingReminder(true)
                .shiftReminder(true)
                .roomIssue(true)
                .equipmentIssue(true)
                .build();

        when(userProfileAccountPort.loadUserByEmail("vinh@example.com")).thenReturn(Optional.of(user));
        when(userProfileAccountPort.loadNotificationSettingsByAccountEmail("vinh@example.com")).thenReturn(Optional.of(settings));
        when(userProfileAccountPort.saveNotificationSettings(any(UserNotificationSettings.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        NotificationSettingsResponse response = userProfileUseCaseService.updateNotificationSettings(
                new UpdateCurrentUserNotificationSettingsCommand(
                        "vinh@example.com",
                        false,
                        true,
                        false,
                        true,
                        false
                )
        );

        ArgumentCaptor<UserNotificationSettings> settingsCaptor = ArgumentCaptor.forClass(UserNotificationSettings.class);
        verify(userProfileAccountPort).saveNotificationSettings(settingsCaptor.capture());

        assertEquals(false, response.isNewBooking());
        assertEquals(false, response.isShiftReminder());
        assertEquals(false, response.isEquipmentIssue());
        assertEquals(false, settingsCaptor.getValue().isNewBooking());
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() {
        User user = staffUser();

        when(userProfileAccountPort.loadUserByEmail("vinh@example.com")).thenReturn(Optional.of(user));
        when(userProfileSecurityPort.matchesPassword("wrong-password", "encoded-password")).thenReturn(false);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                userProfileUseCaseService.changePassword(new ChangeCurrentUserPasswordCommand(
                        "vinh@example.com",
                        "wrong-password",
                        "new-password",
                        "new-password"
                ))
        );

        assertEquals("Mật khẩu hiện tại không đúng.", exception.getMessage());
        verify(userProfileAccountPort, never()).saveUser(any(User.class));
    }

    @Test
    void changePasswordRejectsNewPasswordSameAsCurrentPassword() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                userProfileUseCaseService.changePassword(new ChangeCurrentUserPasswordCommand(
                        "vinh@example.com",
                        "same-password",
                        "same-password",
                        "same-password"
                ))
        );

        assertEquals("Mat khau moi khong duoc trung voi mat khau hien tai", exception.getMessage());
        verify(userProfileAccountPort, never()).saveUser(any(User.class));
    }

    private User staffUser() {
        return User.builder()
                .id(1)
                .email("vinh@example.com")
                .password("encoded-password")
                .role(Role.STAFF)
                .build();
    }
}
