package backend.user.adapter.out.persistence;

import backend.entity.Customer;
import backend.entity.Staff;
import backend.entity.User;
import backend.entity.UserNotificationSettings;
import backend.repository.CustomerRepository;
import backend.repository.StaffRepository;
import backend.repository.UserRepository;
import backend.user.application.port.out.UserProfileAccountPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UserProfilePersistenceAdapter implements UserProfileAccountPort {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final StaffRepository staffRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public Optional<User> loadUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public boolean existsUserByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public Optional<Customer> loadCustomerByAccountEmail(String email) {
        return customerRepository.findByAccount_Email(email);
    }

    @Override
    public Customer saveCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    @Override
    public Optional<Staff> loadStaffByAccountEmail(String email) {
        return staffRepository.findByAccount_Email(email);
    }

    @Override
    public Staff saveStaff(Staff staff) {
        return staffRepository.save(staff);
    }

    @Override
    public Optional<UserNotificationSettings> loadNotificationSettingsByAccountEmail(String email) {
        return jdbcTemplate.query(
                """
                SELECT uns.id,
                       a.id AS account_id,
                       a.email AS account_email,
                       uns.new_booking,
                       uns.booking_reminder,
                       uns.shift_reminder,
                       uns.room_issue,
                       uns.equipment_issue
                FROM user_notification_settings uns
                JOIN account a ON a.id = uns.account_id
                WHERE a.email = ?
                """,
                resultSet -> {
                    if (!resultSet.next()) {
                        return Optional.empty();
                    }

                    User account = User.builder()
                            .id(resultSet.getInt("account_id"))
                            .email(resultSet.getString("account_email"))
                            .build();

                    return Optional.of(UserNotificationSettings.builder()
                            .id(resultSet.getInt("id"))
                            .account(account)
                            .newBooking(resultSet.getBoolean("new_booking"))
                            .bookingReminder(resultSet.getBoolean("booking_reminder"))
                            .shiftReminder(resultSet.getBoolean("shift_reminder"))
                            .roomIssue(resultSet.getBoolean("room_issue"))
                            .equipmentIssue(resultSet.getBoolean("equipment_issue"))
                            .build());
                },
                email
        );
    }

    @Override
    public UserNotificationSettings saveNotificationSettings(UserNotificationSettings settings) {
        return jdbcTemplate.query(
                """
                INSERT INTO user_notification_settings (
                    account_id,
                    new_booking,
                    booking_reminder,
                    shift_reminder,
                    room_issue,
                    equipment_issue
                )
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (account_id) DO UPDATE SET
                    new_booking = EXCLUDED.new_booking,
                    booking_reminder = EXCLUDED.booking_reminder,
                    shift_reminder = EXCLUDED.shift_reminder,
                    room_issue = EXCLUDED.room_issue,
                    equipment_issue = EXCLUDED.equipment_issue
                RETURNING id
                """,
                resultSet -> {
                    if (resultSet.next()) {
                        settings.setId(resultSet.getInt("id"));
                    }

                    return settings;
                },
                settings.getAccount().getId(),
                settings.isNewBooking(),
                settings.isBookingReminder(),
                settings.isShiftReminder(),
                settings.isRoomIssue(),
                settings.isEquipmentIssue()
        );
    }
}
