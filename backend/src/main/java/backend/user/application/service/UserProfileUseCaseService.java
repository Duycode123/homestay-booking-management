package backend.user.application.service;

import backend.dto.response.NotificationSettingsResponse;
import backend.dto.response.UserResponse;
import backend.entity.Customer;
import backend.entity.Role;
import backend.entity.Staff;
import backend.entity.User;
import backend.entity.UserNotificationSettings;
import backend.user.application.model.UserProfileUpdateResult;
import backend.user.application.model.UserAvatarFile;
import backend.user.application.model.UserAvatarUploadResult;
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
import backend.user.application.port.out.UserProfileAccountPort;
import backend.user.application.port.out.UserAvatarStoragePort;
import backend.user.application.port.out.UserProfileSecurityPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserProfileUseCaseService implements
        GetCurrentUserProfileUseCase,
        UpdateCurrentUserProfileUseCase,
        UploadCurrentUserAvatarUseCase,
        ChangeCurrentUserPasswordUseCase,
        GetCurrentUserNotificationSettingsUseCase,
        UpdateCurrentUserNotificationSettingsUseCase {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9]{9,11}$");
    private static final int MAX_AVATAR_BYTES = 5 * 1024 * 1024;
    private static final int MAX_AVATAR_URL_LENGTH = 500;

    private final UserProfileAccountPort userProfileAccountPort;
    private final UserProfileSecurityPort userProfileSecurityPort;
    private final UserAvatarStoragePort userAvatarStoragePort;

    @Override
    public UserResponse getProfile(GetCurrentUserProfileQuery query) {
        User user = getCurrentUser(query.currentUserEmail());
        Customer customer = loadCustomerProfile(user);
        Staff staff = loadStaffProfile(user);
        return toUserResponse(user, customer, staff);
    }

    @Override
    @Transactional
    public UserProfileUpdateResult updateProfile(UpdateCurrentUserProfileCommand command) {
        String fullName = normalizeRequired(command.fullName(), "Ho ten khong duoc de trong");
        String email = normalizeRequired(command.email(), "Email chua dung dinh dang").toLowerCase();
        String phone = normalizeOptional(command.phone());

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Email chua dung dinh dang");
        }

        if (!phone.isBlank() && !PHONE_PATTERN.matcher(phone).matches()) {
            throw new IllegalArgumentException("So dien thoai phai co 9-11 chu so");
        }

        User user = getCurrentUser(command.currentUserEmail());
        if (!user.getEmail().equalsIgnoreCase(email) && userProfileAccountPort.existsUserByEmail(email)) {
            throw new IllegalArgumentException("Email nay da duoc su dung");
        }

        Customer customer = loadCustomerProfile(user);
        Staff staff = loadStaffProfile(user);

        user.setEmail(email);
        User savedUser = userProfileAccountPort.saveUser(user);

        if (customer != null) {
            customer.setFullName(fullName);
            customer.setEmail(email);
            customer.setPhone(phone);
            customer = userProfileAccountPort.saveCustomer(customer);
        }

        if (staff != null) {
            staff.setFullName(fullName);
            staff.setEmail(email);
            staff.setPhone(phone);
            staff = userProfileAccountPort.saveStaff(staff);
        }

        return new UserProfileUpdateResult(
                toUserResponse(savedUser, customer, staff),
                userProfileSecurityPort.generateAccessToken(savedUser),
                userProfileSecurityPort.generateRefreshToken(savedUser)
        );
    }

    @Override
    @Transactional
    public UserResponse uploadAvatar(UploadCurrentUserAvatarCommand command) {
        validateAvatar(command);

        User user = getCurrentUser(command.currentUserEmail());
        Customer customer = loadCustomerProfile(user);
        Staff staff = loadStaffProfile(user);

        UserAvatarUploadResult uploadResult = userAvatarStoragePort.uploadAvatar(new UserAvatarFile(
                command.fileName(),
                command.contentType(),
                command.content()
        ));

        user.setAvatarUrl(normalizeAvatarUrl(uploadResult.secureUrl()));
        User savedUser = userProfileAccountPort.saveUser(user);

        return toUserResponse(savedUser, customer, staff);
    }

    @Override
    @Transactional
    public void changePassword(ChangeCurrentUserPasswordCommand command) {
        String currentPassword = normalizeRequired(
                command.currentPassword(),
                "Mat khau hien tai khong duoc trong"
        );
        String newPassword = normalizeRequired(
                command.newPassword(),
                "Mat khau moi phai co it nhat 8 ky tu"
        );
        String confirmPassword = command.confirmPassword() == null
                ? newPassword
                : normalizeRequired(command.confirmPassword(), "Mat khau xac nhan khong duoc trong");

        if (newPassword.length() < 8) {
            throw new IllegalArgumentException("Mat khau moi phai co it nhat 8 ky tu");
        }

        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("Mat khau xac nhan khong khop");
        }

        if (newPassword.equals(currentPassword)) {
            throw new IllegalArgumentException("Mat khau moi khong duoc trung voi mat khau hien tai");
        }

        User user = getCurrentUser(command.currentUserEmail());
        if (!userProfileSecurityPort.matchesPassword(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("M\u1eadt kh\u1ea9u hi\u1ec7n t\u1ea1i kh\u00f4ng \u0111\u00fang.");
        }

        user.setPassword(userProfileSecurityPort.encodePassword(newPassword));
        userProfileAccountPort.saveUser(user);
    }

    @Override
    public NotificationSettingsResponse getNotificationSettings(GetCurrentUserProfileQuery query) {
        User user = getCurrentUser(query.currentUserEmail());
        UserNotificationSettings settings = userProfileAccountPort.loadNotificationSettingsByAccountEmail(user.getEmail())
                .orElseGet(() -> defaultNotificationSettings(user));
        return toNotificationSettingsResponse(settings);
    }

    @Override
    @Transactional
    public NotificationSettingsResponse updateNotificationSettings(UpdateCurrentUserNotificationSettingsCommand command) {
        User user = getCurrentUser(command.currentUserEmail());
        UserNotificationSettings settings = getOrCreateNotificationSettings(user);

        settings.setNewBooking(requireBoolean(command.newBooking(), "newBooking khong duoc de trong"));
        settings.setBookingReminder(requireBoolean(command.bookingReminder(), "bookingReminder khong duoc de trong"));
        settings.setShiftReminder(requireBoolean(command.shiftReminder(), "shiftReminder khong duoc de trong"));
        settings.setRoomIssue(requireBoolean(command.roomIssue(), "roomIssue khong duoc de trong"));
        settings.setEquipmentIssue(requireBoolean(command.equipmentIssue(), "equipmentIssue khong duoc de trong"));

        return toNotificationSettingsResponse(userProfileAccountPort.saveNotificationSettings(settings));
    }

    private User getCurrentUser(String currentUserEmail) {
        String email = normalizeRequired(currentUserEmail, "Phien dang nhap khong hop le");
        return userProfileAccountPort.loadUserByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan hien tai"));
    }

    private UserResponse toUserResponse(User user, Customer customer, Staff staff) {
        String email = user.getEmail();
        String fullName = null;
        String phone = "";

        if (user.getRole() == Role.STAFF && staff != null) {
            fullName = staff.getFullName();
            phone = normalizeOptional(staff.getPhone());
        } else if (customer != null) {
            fullName = customer.getFullName();
            phone = normalizeOptional(customer.getPhone());
        }

        if (fullName == null || fullName.isBlank()) {
            fullName = email != null && email.contains("@") ? email.substring(0, email.indexOf("@")) : email;
        }

        if (fullName == null || fullName.isBlank()) {
            fullName = "Nguoi dung";
        }

        return UserResponse.builder()
                .id(user.getId())
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .avatarUrl(normalizeOptional(user.getAvatarUrl()))
                .role(user.getRole().name())
                .build();
    }

    private Customer loadCustomerProfile(User user) {
        if (user.getRole() != Role.CUSTOMER) {
            return null;
        }

        return userProfileAccountPort.loadCustomerByAccountEmail(user.getEmail()).orElse(null);
    }

    private Staff loadStaffProfile(User user) {
        if (user.getRole() != Role.STAFF) {
            return null;
        }

        return userProfileAccountPort.loadStaffByAccountEmail(user.getEmail()).orElse(null);
    }

    private void validateAvatar(UploadCurrentUserAvatarCommand command) {
        byte[] content = command.content();
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("Vui long chon anh dai dien");
        }
        if (content.length > MAX_AVATAR_BYTES) {
            throw new IllegalArgumentException("Anh dai dien khong duoc vuot qua 5MB");
        }

        String contentType = normalizeRequired(command.contentType(), "File tai len phai la anh");
        if (!contentType.toLowerCase().startsWith("image/")) {
            throw new IllegalArgumentException("File tai len phai la anh");
        }
    }

    private String normalizeAvatarUrl(String avatarUrl) {
        String normalized = normalizeRequired(avatarUrl, "Cloudinary khong tra ve URL anh dai dien");
        if (normalized.length() > MAX_AVATAR_URL_LENGTH) {
            throw new IllegalStateException("URL anh dai dien toi da 500 ky tu");
        }
        if (!normalized.matches("^https?://.+")) {
            throw new IllegalStateException("URL anh dai dien phai la link http hoac https");
        }

        return normalized;
    }

    private UserNotificationSettings getOrCreateNotificationSettings(User user) {
        return userProfileAccountPort.loadNotificationSettingsByAccountEmail(user.getEmail())
                .orElseGet(() -> defaultNotificationSettings(user));
    }

    private UserNotificationSettings defaultNotificationSettings(User user) {
        return UserNotificationSettings.builder()
                .account(user)
                .newBooking(true)
                .bookingReminder(true)
                .shiftReminder(true)
                .roomIssue(true)
                .equipmentIssue(true)
                .build();
    }

    private NotificationSettingsResponse toNotificationSettingsResponse(UserNotificationSettings settings) {
        return NotificationSettingsResponse.builder()
                .newBooking(settings.isNewBooking())
                .bookingReminder(settings.isBookingReminder())
                .shiftReminder(settings.isShiftReminder())
                .roomIssue(settings.isRoomIssue())
                .equipmentIssue(settings.isEquipmentIssue())
                .build();
    }

    private boolean requireBoolean(Boolean value, String message) {
        if (value == null) {
            throw new IllegalArgumentException(message);
        }

        return value;
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }

    private String normalizeOptional(String value) {
        return value == null ? "" : value.trim();
    }
}
