package backend.addon.adapter.out.persistence.repository;

import backend.addon.adapter.out.persistence.entity.BookingAddonEntity;
import backend.addon.domain.model.BookingAddonStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface BookingAddonJpaRepository extends JpaRepository<BookingAddonEntity, Long> {
    @EntityGraph(attributePaths = "service")
    List<BookingAddonEntity> findByBooking_IdOrderByCreatedAtAscIdAsc(Integer bookingId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "service")
    @Query("select item from BookingAddonEntity item where item.booking.id = :bookingId and item.id = :itemId")
    Optional<BookingAddonEntity> findForUpdate(@Param("bookingId") Integer bookingId, @Param("itemId") Long itemId);

    @Modifying
    @Query("update BookingAddonEntity item set item.status = :to where item.booking.id = :bookingId and item.status = :from")
    int updateStatus(@Param("bookingId") Integer bookingId, @Param("from") BookingAddonStatus from, @Param("to") BookingAddonStatus to);

    @Modifying
    @Query("update BookingAddonEntity item set item.status = 'CANCELLED' where item.booking.id = :bookingId and item.status not in ('DELIVERED', 'CANCELLED')")
    int cancelUndelivered(@Param("bookingId") Integer bookingId);

    @Query("select coalesce(sum(item.totalAmount), 0) from BookingAddonEntity item where item.booking.id = :bookingId and item.status <> 'CANCELLED'")
    BigDecimal sumIncludedAmount(@Param("bookingId") Integer bookingId);
}
