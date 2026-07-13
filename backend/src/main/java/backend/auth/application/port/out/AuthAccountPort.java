package backend.auth.application.port.out;

import backend.entity.Customer;
import backend.entity.User;

import java.util.Optional;

public interface AuthAccountPort {
    boolean existsUserByEmail(String email);

    Optional<User> loadUserByEmail(String email);

    Optional<User> loadUserByResetToken(String resetToken);

    Optional<User> loadUserByEmailVerificationTokenHash(String emailVerificationTokenHash);

    User saveUser(User user);

    boolean existsCustomerByPhone(String phone);

    Customer saveCustomer(Customer customer);
}
