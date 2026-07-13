package backend.auth.adapter.out.persistence;

import backend.auth.application.port.out.AuthAccountPort;
import backend.entity.Customer;
import backend.entity.User;
import backend.repository.CustomerRepository;
import backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AuthPersistenceAdapter implements AuthAccountPort {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    @Override
    public boolean existsUserByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public Optional<User> loadUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<User> loadUserByResetToken(String resetToken) {
        return userRepository.findByResetToken(resetToken);
    }

    @Override
    public Optional<User> loadUserByEmailVerificationTokenHash(String emailVerificationTokenHash) {
        return userRepository.findByEmailVerificationTokenHash(emailVerificationTokenHash);
    }

    @Override
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public boolean existsCustomerByPhone(String phone) {
        return customerRepository.existsByPhone(phone);
    }

    @Override
    public Customer saveCustomer(Customer customer) {
        return customerRepository.save(customer);
    }
}
