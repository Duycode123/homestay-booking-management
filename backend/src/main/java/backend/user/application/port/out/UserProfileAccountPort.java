package backend.user.application.port.out;

import backend.entity.Customer;
import backend.entity.Staff;
import backend.entity.User;
import backend.entity.UserNotificationSettings;

import java.util.Optional;

public interface UserProfileAccountPort {
    Optional<User> loadUserByEmail(String email);

    boolean existsUserByEmail(String email);

    User saveUser(User user);

    Optional<Customer> loadCustomerByAccountEmail(String email);

    Customer saveCustomer(Customer customer);

    Optional<Staff> loadStaffByAccountEmail(String email);

    Staff saveStaff(Staff staff);

    Optional<UserNotificationSettings> loadNotificationSettingsByAccountEmail(String email);

    UserNotificationSettings saveNotificationSettings(UserNotificationSettings settings);
}
