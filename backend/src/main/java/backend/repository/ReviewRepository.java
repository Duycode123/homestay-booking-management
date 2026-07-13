package backend.repository;

import backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer>, JpaSpecificationExecutor<Review> {

    boolean existsByBooking_Id(Integer bookingId);

    Optional<Review> findByBooking_Id(Integer bookingId);

    @Query("""
            select r.booking.room.id as roomId,
                   avg(r.rating) as averageRating,
                   count(r.id) as reviewCount
            from Review r
            where r.approved = true
            group by r.booking.room.id
            """)
    List<RoomReviewStatsProjection> findApprovedRoomReviewStats();

    interface RoomReviewStatsProjection {
        Integer getRoomId();

        Double getAverageRating();

        Long getReviewCount();
    }
}
