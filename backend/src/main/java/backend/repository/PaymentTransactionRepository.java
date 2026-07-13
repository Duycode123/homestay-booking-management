package backend.repository;

import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByTransactionReference(String transactionReference);

    Optional<PaymentTransaction> findByProviderTransactionId(String providerTransactionId);

    Optional<PaymentTransaction> findByTransactionReferenceAndBooking_Customer_Account_Email(
            String transactionReference,
            String email
    );

    List<PaymentTransaction> findByBooking_IdAndStatusIn(
            Integer bookingId,
            Collection<PaymentTransactionStatus> statuses
    );

    @Query("""
            SELECT t
            FROM PaymentTransaction t
            JOIN FETCH t.booking
            WHERE t.status IN :statuses
              AND t.createdAt IS NOT NULL
              AND t.createdAt < :cutoff
            """)
    List<PaymentTransaction> findStaleTransactions(
            @Param("statuses") Collection<PaymentTransactionStatus> statuses,
            @Param("cutoff") LocalDateTime cutoff
    );
}
