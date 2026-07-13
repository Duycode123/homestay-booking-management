package backend.repository;

import backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository
        extends JpaRepository<Customer, Integer> {

    boolean existsByPhone(String phone);

    Optional<Customer> findByAccount_Email(String email);
}
