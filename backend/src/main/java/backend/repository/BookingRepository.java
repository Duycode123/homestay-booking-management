package backend.repository;

import backend.entity.Booking;
import backend.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

public interface BookingRepository extends JpaRepository<Booking, Integer>, JpaSpecificationExecutor<Booking> {

    List<Booking> findByCustomer_IdOrderByCreatedAtDesc(Integer customerId);

    boolean existsByRoom_Id(Integer roomId);

    boolean existsByRoom_IdAndStatusIn(Integer roomId, List<BookingStatus> statuses);

    boolean existsByDiscountCode_Id(Integer discountCodeId);

    Optional<Booking> findByIdAndCustomer_Account_Email(Integer bookingId, String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :bookingId")
    Optional<Booking> findByIdForUpdate(@Param("bookingId") Integer bookingId);

    @Query("""
            SELECT b AS booking,
                   MAX(COALESCE(t.paidAt, t.updatedAt, t.createdAt)) AS occurredAt
            FROM PaymentTransaction t
            JOIN t.booking b
            WHERE t.status = :paymentStatus
              AND b.status IN :bookingStatuses
            GROUP BY b
            ORDER BY MAX(COALESCE(t.paidAt, t.updatedAt, t.createdAt)) DESC
            """)
    List<RecentPaidBookingProjection> findRecentPaidHomepageBookings(
            @Param("paymentStatus") backend.entity.PaymentTransactionStatus paymentStatus,
            @Param("bookingStatuses") List<BookingStatus> bookingStatuses,
            Pageable pageable
    );

    @Query("""
            SELECT b
            FROM Booking b
            WHERE b.room.id = :roomId
              AND b.status IN :blockingStatuses
              AND b.startTime < :endTime
              AND b.endTime > :startTime
            ORDER BY b.startTime ASC, b.endTime ASC
            """)
    List<Booking> findBlockingBookings(
            @Param("roomId") Integer roomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("blockingStatuses") List<BookingStatus> blockingStatuses
    );

    @Query("""
            SELECT b
            FROM Booking b
            JOIN FETCH b.room
            JOIN FETCH b.customer
            WHERE b.status NOT IN :excludedStatuses
              AND b.startTime < :endTime
              AND b.endTime > :startTime
            ORDER BY b.startTime ASC, b.endTime ASC, b.room.roomName ASC
            """)
    List<Booking> findBookingsOverlappingWindow(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludedStatuses") List<BookingStatus> excludedStatuses
    );

    @Query("""
            SELECT b
            FROM Booking b
            WHERE b.status = :pendingStatus
              AND b.paymentMethod <> :excludedPaymentMethod
              AND b.createdAt IS NOT NULL
              AND b.createdAt < :cutoff
            """)
    List<Booking> findStalePendingBookings(
            @Param("pendingStatus") BookingStatus pendingStatus,
            @Param("excludedPaymentMethod") backend.entity.PaymentMethod excludedPaymentMethod,
            @Param("cutoff") LocalDateTime cutoff
    );

    @Query("""
            select b.room.id as roomId,
                   count(b.id) as upcomingBookingCount,
                   min(b.startTime) as nextStartTime
            from Booking b
            where b.status in :blockingStatuses
              and b.endTime > :fromTime
              and b.startTime < :toTime
            group by b.room.id
            """)
    List<RoomUpcomingBookingStatsProjection> findUpcomingRoomBookingStats(
            @Param("fromTime") LocalDateTime fromTime,
            @Param("toTime") LocalDateTime toTime,
            @Param("blockingStatuses") List<BookingStatus> blockingStatuses
    );

    interface RoomUpcomingBookingStatsProjection {
        Integer getRoomId();

        Long getUpcomingBookingCount();

        LocalDateTime getNextStartTime();
    }

    interface RecentPaidBookingProjection {
        Booking getBooking();

        LocalDateTime getOccurredAt();
    }
}
