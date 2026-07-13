package backend.staff.application.service;

import backend.entity.Role;
import backend.entity.Staff;
import backend.entity.User;
import backend.exception.ResourceNotFoundException;
import backend.staff.application.model.StaffAccountResult;
import backend.staff.application.port.in.CreateStaffAccountUseCase;
import backend.staff.application.port.in.DisableStaffAccountUseCase;
import backend.staff.application.port.in.GetStaffAccountDetailUseCase;
import backend.staff.application.port.in.ListStaffAccountsUseCase;
import backend.staff.application.port.in.command.CreateStaffAccountCommand;
import backend.staff.application.port.in.command.DisableStaffAccountCommand;
import backend.staff.application.port.out.StaffAccountPort;
import backend.staff.application.port.out.StaffEmailVerificationNotificationPort;
import backend.staff.application.port.out.StaffPasswordPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Locale;
import java.util.HexFormat;
import java.util.UUID;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffManagementUseCaseService implements
        CreateStaffAccountUseCase,
        ListStaffAccountsUseCase,
        GetStaffAccountDetailUseCase,
        DisableStaffAccountUseCase {

    public static final String DEFAULT_INITIAL_PASSWORD = "123123";
    private static final int EMAIL_VERIFICATION_EXPIRATION_HOURS = 24;

    private final StaffAccountPort staffAccountPort;
    private final StaffPasswordPort staffPasswordPort;
    private final StaffEmailVerificationNotificationPort staffEmailVerificationNotificationPort;

    @Override
    @Transactional
    public StaffAccountResult createStaffAccount(CreateStaffAccountCommand command) {
        String fullName = normalizeRequired(command.fullName(), "Ho ten nhan vien khong duoc de trong");
        String email = normalizeEmail(command.email());
        String initialPassword = normalizeInitialPassword(command.initialPassword());
        String phone = normalizeOptional(command.phone());

        if (staffAccountPort.existsAccountByEmail(email)) {
            throw new IllegalStateException("Email nay da co tai khoan");
        }
        if (staffAccountPort.existsStaffProfileByEmail(email)) {
            throw new IllegalStateException("Email nay da co ho so nhan vien");
        }

        User account = User.builder()
                .email(email)
                .password(staffPasswordPort.encodePassword(initialPassword))
                .role(Role.STAFF)
                .emailVerified(false)
                .build();
        String verificationToken = prepareEmailVerification(account);
        User savedAccount = staffAccountPort.saveAccount(account);

        Staff staff = Staff.builder()
                .account(savedAccount)
                .fullName(fullName)
                .phone(phone)
                .email(email)
                .dateOfBirth(command.dateOfBirth())
                .build();
        Staff savedStaff = staffAccountPort.saveStaff(staff);
        staffEmailVerificationNotificationPort.sendVerificationEmail(savedAccount.getEmail(), verificationToken);

        return toResult(savedAccount, savedStaff, initialPassword);
    }

    @Override
    public List<StaffAccountResult> listStaffAccounts() {
        return staffAccountPort.loadAllStaff().stream()
                .map(staff -> toResult(staff.getAccount(), staff, null))
                .toList();
    }

    @Override
    public StaffAccountResult getStaffAccountDetail(Integer staffId) {
        Staff staff = loadStaff(staffId);
        return toResult(staff.getAccount(), staff, null);
    }

    @Override
    @Transactional
    public StaffAccountResult disableStaffAccount(DisableStaffAccountCommand command) {
        Staff staff = loadStaff(command.staffId());
        User account = staff.getAccount();

        account.setEnabled(false);
        User savedAccount = staffAccountPort.saveAccount(account);

        return toResult(savedAccount, staff, null);
    }

    private String normalizeInitialPassword(String password) {
        if (password == null || password.trim().isBlank()) {
            return DEFAULT_INITIAL_PASSWORD;
        }
        return password.trim();
    }

    private String normalizeEmail(String email) {
        return normalizeRequired(email, "Email nhan vien khong duoc de trong").toLowerCase(Locale.ROOT);
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String prepareEmailVerification(User user) {
        String token = UUID.randomUUID().toString();
        user.setEmailVerificationTokenHash(hashToken(token));
        user.setEmailVerificationExpiresAt(LocalDateTime.now().plusHours(EMAIL_VERIFICATION_EXPIRATION_HOURS));
        user.setEmailVerificationSentAt(LocalDateTime.now());
        return token;
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashedBytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashedBytes);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Khong the tao ma xac thuc email", ex);
        }
    }

    private Staff loadStaff(Integer staffId) {
        Staff staff = staffAccountPort.loadStaffById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nhan vien"));
        User account = staff.getAccount();
        if (account == null || account.getRole() != Role.STAFF) {
            throw new IllegalStateException("Ho so nay khong phai tai khoan nhan vien");
        }
        return staff;
    }

    private StaffAccountResult toResult(User account, Staff staff, String initialPassword) {
        return new StaffAccountResult(
                account.getId(),
                staff.getId(),
                account.getEmail(),
                staff.getFullName(),
                staff.getPhone(),
                staff.getDateOfBirth(),
                account.getAvatarUrl(),
                account.getRole().name(),
                account.isEmailVerified(),
                account.isEnabled(),
                account.getCreatedAt(),
                initialPassword
        );
    }
}
