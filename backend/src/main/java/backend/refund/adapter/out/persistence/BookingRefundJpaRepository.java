package backend.refund.adapter.out.persistence;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

interface BookingRefundJpaRepository extends JpaRepository<BookingRefundEntity, Long> {

    @Query("""
            select r from BookingRefundEntity r
            join fetch r.booking b
            join fetch b.customer c
            join fetch c.account
            join fetch b.room
            left join fetch r.originalPaymentTransaction
            order by r.createdAt desc
            """)
    List<BookingRefundEntity> findAllDetailed();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select r from BookingRefundEntity r
            join fetch r.booking b
            join fetch b.customer c
            join fetch c.account
            join fetch b.room
            left join fetch r.originalPaymentTransaction
            where r.id = :id
            """)
    Optional<BookingRefundEntity> findDetailedByIdForUpdate(@Param("id") Long id);

    @Query("""
            select r from BookingRefundEntity r
            join fetch r.booking b
            join fetch b.customer c
            join fetch c.account a
            join fetch b.room
            left join fetch r.originalPaymentTransaction
            where b.id = :bookingId and lower(a.email) = lower(:email)
            """)
    Optional<BookingRefundEntity> findByBookingIdAndCustomerEmail(
            @Param("bookingId") Integer bookingId,
            @Param("email") String email
    );

    Optional<BookingRefundEntity> findByBooking_Id(Integer bookingId);
}
