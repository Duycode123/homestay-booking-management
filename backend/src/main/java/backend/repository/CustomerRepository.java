package backend.repository;

import backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.util.Optional;

@Repository
public interface CustomerRepository
        extends JpaRepository<Customer, Integer> {

    boolean existsByPhone(String phone);

    Optional<Customer> findByAccount_Email(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Customer c where lower(c.account.email) = lower(:email)")
    Optional<Customer> findByAccountEmailForUpdate(@Param("email") String email);
}
